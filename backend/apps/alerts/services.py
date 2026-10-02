"""
Alert generator — runs after stock changes to detect issues.

Rule of thumb:
- Opens new alerts if none active for that (product, warehouse, alert_type)
- Auto-resolves open alerts if the situation is no longer true
- Never creates duplicates
"""
from decimal import Decimal
from django.db import transaction
from django.utils import timezone

from apps.inventory.models import Inventory
from .models import InventoryAlert


OVERSTOCK_MULTIPLIER = Decimal('3')  # available > 3 × reorder_level → overstock


def _get_open(product, warehouse, alert_type):
    return InventoryAlert.objects.filter(
        product=product, warehouse=warehouse,
        alert_type=alert_type, status=InventoryAlert.Status.OPEN,
    ).first()


def _open_alert(product, warehouse, alert_type, severity, current, threshold, message):
    """Create alert only if one isn't already open."""
    existing = _get_open(product, warehouse, alert_type)
    if existing:
        # Update current values but keep single open alert
        existing.current_value = current
        existing.severity = severity
        existing.message = message
        existing.save(update_fields=['current_value', 'severity', 'message', 'updated_at'])
        return existing, False

    return InventoryAlert.objects.create(
        product=product, warehouse=warehouse,
        alert_type=alert_type, severity=severity,
        current_value=current, threshold_value=threshold,
        message=message,
    ), True


def _resolve_open(product, warehouse, alert_type):
    """Auto-resolve any open alert of this type."""
    now = timezone.now()
    return InventoryAlert.objects.filter(
        product=product, warehouse=warehouse,
        alert_type=alert_type, status=InventoryAlert.Status.OPEN,
    ).update(status=InventoryAlert.Status.RESOLVED, resolved_at=now)


@transaction.atomic
def evaluate_inventory_alerts(*, inventory: Inventory):
    """
    Call after every stock change.
    Evaluates low_stock / stock_out / overstock and updates alerts accordingly.
    Returns a dict summarizing actions taken.
    """
    product = inventory.product
    warehouse = inventory.warehouse
    available = inventory.quantity_available
    reorder_level = product.reorder_level or Decimal('0')

    actions = {'opened': [], 'resolved': [], 'updated': []}

    # ---------- STOCK OUT ----------
    if available <= 0:
        alert, created = _open_alert(
            product, warehouse,
            InventoryAlert.AlertType.STOCK_OUT,
            InventoryAlert.Severity.CRITICAL,
            current=available, threshold=Decimal('0'),
            message=f'Out of stock: {product.sku} at {warehouse.warehouse_code}.',
        )
        (actions['opened'] if created else actions['updated']).append(alert.alert_id)
        # stock_out supersedes low_stock — resolve any open low_stock
        if _resolve_open(product, warehouse, InventoryAlert.AlertType.LOW_STOCK):
            actions['resolved'].append('low_stock')
    else:
        # stock exists → resolve any open stock_out alert
        if _resolve_open(product, warehouse, InventoryAlert.AlertType.STOCK_OUT):
            actions['resolved'].append('stock_out')

    # ---------- LOW STOCK ----------
    if reorder_level > 0 and Decimal('0') < available <= reorder_level:
        alert, created = _open_alert(
            product, warehouse,
            InventoryAlert.AlertType.LOW_STOCK,
            InventoryAlert.Severity.WARNING,
            current=available, threshold=reorder_level,
            message=(
                f'Low stock: {product.sku} at {warehouse.warehouse_code}. '
                f'Available {available} ≤ reorder level {reorder_level}.'
            ),
        )
        (actions['opened'] if created else actions['updated']).append(alert.alert_id)
    elif available > reorder_level:
        # above threshold → resolve
        if _resolve_open(product, warehouse, InventoryAlert.AlertType.LOW_STOCK):
            actions['resolved'].append('low_stock')

    # ---------- OVERSTOCK ----------
    overstock_threshold = reorder_level * OVERSTOCK_MULTIPLIER if reorder_level > 0 else None
    if overstock_threshold and available > overstock_threshold:
        alert, created = _open_alert(
            product, warehouse,
            InventoryAlert.AlertType.OVERSTOCK,
            InventoryAlert.Severity.INFO,
            current=available, threshold=overstock_threshold,
            message=(
                f'Overstock: {product.sku} at {warehouse.warehouse_code}. '
                f'Available {available} > {overstock_threshold}.'
            ),
        )
        (actions['opened'] if created else actions['updated']).append(alert.alert_id)
    else:
        if _resolve_open(product, warehouse, InventoryAlert.AlertType.OVERSTOCK):
            actions['resolved'].append('overstock')
        # ---------- Notify roles on new alerts ----------
    try:
        from apps.core.services import notify_roles
        if actions['opened']:
            # Fetch newly opened alerts for messages
            from .models import InventoryAlert
            for aid in actions['opened']:
                alert = InventoryAlert.objects.filter(pk=aid).first()
                if not alert:
                    continue
                # Determine roles based on alert type
                if alert.alert_type in ('stock_out', 'low_stock'):
                    roles = ['inventory_manager', 'admin']
                elif alert.alert_type == 'overstock':
                    roles = ['inventory_manager']
                else:
                    roles = ['inventory_manager', 'analyst', 'admin']

                # Map alert_type to notification_type
                notif_type = {
                    'low_stock': 'low_stock',
                    'stock_out': 'stock_out_predicted',
                    'overstock': 'low_stock',
                    'unusual_demand': 'low_stock',
                }.get(alert.alert_type, 'low_stock')

                notify_roles(
                    roles=roles,
                    notification_type=notif_type,
                    severity=alert.severity,
                    title=f'{alert.alert_type.replace("_", " ").title()}: {alert.product.sku}',
                    message=alert.message,
                    link='/alerts',
                    metadata={
                        'alert_id': alert.alert_id,
                        'product_id': alert.product_id,
                        'warehouse_id': alert.warehouse_id,
                    },
                )
    except Exception:
        # Never break alert creation due to notification failure
        pass
    return actions