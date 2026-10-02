"""
Demand aggregation + reorder calculations.
"""
from decimal import Decimal
from datetime import timedelta
from django.db import transaction
from django.db.models import Sum, Q
from django.utils import timezone

from .models import DemandHistoryDaily, ReorderRecommendation, DemandForecast
from apps.sales.models import SalesOrder, SalesOrderItem


@transaction.atomic
def rebuild_demand_history(*, start_date=None, end_date=None):
    """
    Recompute DemandHistoryDaily from completed/returned sales orders.
    Idempotent — safe to run repeatedly.
    """
    qs = SalesOrder.objects.filter(
        status__in=[SalesOrder.Status.COMPLETED, SalesOrder.Status.RETURNED]
    )
    if start_date:
        qs = qs.filter(order_date__gte=start_date)
    if end_date:
        qs = qs.filter(order_date__lte=end_date)

    agg = (
        SalesOrderItem.objects
        .filter(sales_order__in=qs)
        .values('sales_order__warehouse_id', 'product_id', 'sales_order__order_date')
        .annotate(sold=Sum('quantity'), revenue=Sum('line_total'))
    )

    returned_so = qs.filter(status=SalesOrder.Status.RETURNED).values_list('sales_order_id', flat=True)
    returned_qty = (
        SalesOrderItem.objects
        .filter(sales_order_id__in=list(returned_so))
        .values('sales_order__warehouse_id', 'product_id', 'sales_order__order_date')
        .annotate(returned=Sum('quantity'))
    )
    returned_map = {
        (r['sales_order__warehouse_id'], r['product_id'], r['sales_order__order_date']): r['returned']
        for r in returned_qty
    }

    created_count = 0
    updated_count = 0

    for row in agg:
        wid = row['sales_order__warehouse_id']
        pid = row['product_id']
        date = row['sales_order__order_date']
        sold = row['sold'] or Decimal('0')
        revenue = row['revenue'] or Decimal('0')
        returned = returned_map.get((wid, pid, date), Decimal('0'))
        net = sold - returned

        obj, created = DemandHistoryDaily.objects.update_or_create(
            product_id=pid, warehouse_id=wid, demand_date=date,
            defaults={
                'units_sold': sold,
                'units_returned': returned,
                'net_demand': net,
                'revenue': revenue,
            },
        )
        if created:
            created_count += 1
        else:
            updated_count += 1

    return {
        'created': created_count,
        'updated': updated_count,
        'dates_processed': len(agg),
    }


# ---------------- Reorder math ----------------

def compute_reorder_recommendation(
    *, product, warehouse, avg_daily_demand, current_stock,
    lead_time_days=None, safety_stock=None, forecast_run=None, moq=0,
):
    """
    ROP = avg_daily_demand * lead_time_days + safety_stock
    SOQ = avg_daily_demand * lead_time_days + safety_stock - current_stock
    """
    lead_time_days = lead_time_days if lead_time_days is not None else product.lead_time_days
    safety_stock = safety_stock if safety_stock is not None else product.safety_stock
    avg_daily_demand = Decimal(str(avg_daily_demand))
    current_stock = Decimal(str(current_stock))
    lead_time = Decimal(str(lead_time_days or 0))
    safety = Decimal(str(safety_stock or 0))

    reorder_point = avg_daily_demand * lead_time + safety
    suggested_qty = max(
        avg_daily_demand * lead_time + safety - current_stock,
        Decimal(str(moq)),
        Decimal('0'),
    )

    if reorder_point <= 0:
        urgency = 'low'
    elif current_stock <= 0:
        urgency = 'critical'
    elif current_stock < reorder_point * Decimal('0.5'):
        urgency = 'high'
    elif current_stock < reorder_point:
        urgency = 'medium'
    else:
        urgency = 'low'

    reason = (
        f'Avg daily demand {avg_daily_demand:.3f}, lead time {lead_time_days}d, '
        f'safety {safety:.3f}. ROP={reorder_point:.3f}, current={current_stock:.3f}.'
    )

    rec = ReorderRecommendation.objects.create(
        product=product,
        warehouse=warehouse,
        forecast_run=forecast_run,
        current_stock=current_stock,
        average_daily_demand=avg_daily_demand,
        lead_time_days=int(lead_time_days or 0),
        safety_stock=safety,
        reorder_point=reorder_point,
        suggested_order_quantity=suggested_qty,
        urgency=urgency,
        reason=reason,
    )
    return rec


@transaction.atomic
def generate_reorder_recommendations(*, forecast_run):
    """Create ReorderRecommendation rows from a completed forecast run."""
    from django.db.models import Avg
    from apps.inventory.models import Inventory
    from apps.products.models import Product
    from apps.warehouses.models import Warehouse

    created = []

    grouped = (
        DemandForecast.objects
        .filter(forecast_run=forecast_run)
        .values('product_id', 'warehouse_id')
        .annotate(avg_predicted=Avg('predicted_demand'))
    )

    for row in grouped:
        product = Product.objects.get(pk=row['product_id'])
        warehouse = Warehouse.objects.get(pk=row['warehouse_id'])

        inv = Inventory.objects.filter(product=product, warehouse=warehouse).first()
        current_stock = inv.quantity_available if inv else Decimal('0')

        rec = compute_reorder_recommendation(
            product=product,
            warehouse=warehouse,
            avg_daily_demand=Decimal(str(row['avg_predicted'] or 0)),
            current_stock=current_stock,
            forecast_run=forecast_run,
        )
        created.append(rec)
        # ---------- Notify on AI reorder recommendations ----------
    try:
        from apps.core.services import notify_roles
        # Only notify for high/critical urgency
        urgent = [r for r in created if r.urgency in ('high', 'critical')]
        if urgent:
            top = urgent[0]
            notify_roles(
                roles=['inventory_manager', 'purchase_manager', 'admin'],
                notification_type='reorder_recommendation',
                severity='warning' if top.urgency == 'high' else 'critical',
                title=f'AI suggests reorder: {top.product.sku}',
                message=(
                    f'{len(urgent)} product(s) need reorder. '
                    f'Top: {top.product.sku} @ {top.warehouse.warehouse_code} — '
                    f'Suggest {top.suggested_order_quantity:.0f} units.'
                ),
                link='/forecasts',
                metadata={
                    'recommendation_id': top.recommendation_id,
                    'count': len(urgent),
                },
            )
    except Exception:
        pass
    return created