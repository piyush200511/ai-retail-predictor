"""
Inventory Service — the ONLY place stock changes happen.

Every operation:
1. Validates the request
2. Locks the inventory row (select_for_update) inside a transaction
3. Updates quantity_on_hand / quantity_reserved
4. Writes an immutable StockMovement record
5. Returns the updated Inventory row

Never modify Inventory directly outside this module.
"""
from decimal import Decimal
from django.db import transaction
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from .models import Inventory, StockMovement
from apps.products.models import Product
from apps.warehouses.models import Warehouse


INBOUND_TYPES = {
    StockMovement.MovementType.PURCHASE,
    StockMovement.MovementType.RETURN_IN,
    StockMovement.MovementType.ADJUSTMENT_IN,
    StockMovement.MovementType.TRANSFER_IN,
    StockMovement.MovementType.OPENING,
}


def _get_or_create_inventory(warehouse, product, lock=False):
    qs = Inventory.objects.filter(warehouse=warehouse, product=product)
    if lock:
        qs = qs.select_for_update()
    inv = qs.first()
    if inv is None:
        inv = Inventory.objects.create(
            warehouse=warehouse,
            product=product,
            quantity_on_hand=Decimal('0'),
            quantity_reserved=Decimal('0'),
            quantity_available=Decimal('0'),
        )
        if lock:
            inv = Inventory.objects.select_for_update().get(pk=inv.pk)
    return inv


def _validate_positive(quantity):
    if quantity is None or Decimal(str(quantity)) <= 0:
        raise ValidationError({'quantity': 'Quantity must be greater than 0.'})


@transaction.atomic
def record_movement(
    *,
    warehouse: Warehouse,
    product: Product,
    movement_type: str,
    quantity,
    user=None,
    reference_type: str = None,
    reference_id: int = None,
    unit_cost=None,
    notes: str = None,
    allow_negative: bool = False,
):
    """
    Unified entry point for all stock changes.

    `quantity` is ALWAYS positive; direction is derived from movement_type.
    """
    _validate_positive(quantity)
    qty = Decimal(str(quantity))

    if movement_type not in StockMovement.MovementType.values:
        raise ValidationError({'movement_type': f'Invalid type: {movement_type}'})

    is_inbound = movement_type in INBOUND_TYPES
    signed_qty = qty if is_inbound else -qty

    inv = _get_or_create_inventory(warehouse, product, lock=True)
    new_on_hand = inv.quantity_on_hand + signed_qty

    if new_on_hand < 0 and not allow_negative:
        raise ValidationError({
            'quantity': (
                f'Insufficient stock for {product.sku} at {warehouse.warehouse_code}. '
                f'Available: {inv.quantity_available}, Requested: {qty}.'
            )
        })

    inv.quantity_on_hand = new_on_hand

    now = timezone.now()
    if is_inbound:
        inv.last_stocked_at = now
    else:
        inv.last_sold_at = now

    inv.save()

    movement = StockMovement.objects.create(
        warehouse=warehouse,
        product=product,
        movement_type=movement_type,
        quantity=signed_qty,
        balance_after=inv.quantity_on_hand,
        reference_type=reference_type,
        reference_id=reference_id,
        unit_cost=unit_cost,
        notes=notes,
        created_by=user,
    )
    # Evaluate alerts after every stock change
    try:
        from apps.alerts.services import evaluate_inventory_alerts
        evaluate_inventory_alerts(inventory=inv)
    except Exception:
        pass
    
    return inv, movement


# ---------------- Convenience wrappers ----------------

@transaction.atomic
def stock_in(*, warehouse, product, quantity, user=None, movement_type=StockMovement.MovementType.ADJUSTMENT_IN,
             reference_type=None, reference_id=None, unit_cost=None, notes=None):
    return record_movement(
        warehouse=warehouse, product=product, movement_type=movement_type,
        quantity=quantity, user=user,
        reference_type=reference_type, reference_id=reference_id,
        unit_cost=unit_cost, notes=notes,
    )


@transaction.atomic
def stock_out(*, warehouse, product, quantity, user=None, movement_type=StockMovement.MovementType.ADJUSTMENT_OUT,
              reference_type=None, reference_id=None, notes=None):
    return record_movement(
        warehouse=warehouse, product=product, movement_type=movement_type,
        quantity=quantity, user=user,
        reference_type=reference_type, reference_id=reference_id,
        notes=notes,
    )


@transaction.atomic
def reserve_stock(*, warehouse, product, quantity):
    """Increase reserved quantity (used when a sale order is confirmed but not shipped)."""
    _validate_positive(quantity)
    qty = Decimal(str(quantity))
    inv = _get_or_create_inventory(warehouse, product, lock=True)
    if inv.quantity_available < qty:
        raise ValidationError({'quantity': f'Cannot reserve {qty}; only {inv.quantity_available} available.'})
    inv.quantity_reserved += qty
    inv.save()
    return inv


@transaction.atomic
def release_reserved(*, warehouse, product, quantity):
    """Decrease reserved quantity (used when reservation is cancelled)."""
    _validate_positive(quantity)
    qty = Decimal(str(quantity))
    inv = _get_or_create_inventory(warehouse, product, lock=True)
    inv.quantity_reserved = max(Decimal('0'), inv.quantity_reserved - qty)
    inv.save()
    return inv


def get_available(warehouse, product) -> Decimal:
    inv = Inventory.objects.filter(warehouse=warehouse, product=product).first()
    return inv.quantity_available if inv else Decimal('0')


# ---------------- Stock Transfers ----------------

from django.db import transaction
from django.utils import timezone
from .models import StockTransfer, StockTransferItem
from rest_framework.exceptions import ValidationError as DRFValidationError


@transaction.atomic
def dispatch_transfer(*, transfer: StockTransfer, user=None):
    """Move transfer from draft → in_transit. Decrements source warehouse."""
    if transfer.status != StockTransfer.Status.DRAFT:
        raise DRFValidationError({'status': f'Cannot dispatch a transfer in status "{transfer.status}".'})

    if transfer.from_warehouse_id == transfer.to_warehouse_id:
        raise DRFValidationError({'to_warehouse': 'Source and destination must differ.'})

    for item in transfer.items.all():
        record_movement(
            warehouse=transfer.from_warehouse,
            product=item.product,
            movement_type=StockMovement.MovementType.TRANSFER_OUT,
            quantity=item.quantity,
            user=user,
            reference_type='stock_transfer',
            reference_id=transfer.transfer_id,
            notes=f'Transfer {transfer.transfer_number} dispatched',
        )

    transfer.status = StockTransfer.Status.IN_TRANSIT
    transfer.dispatched_at = timezone.now()
    transfer.save(update_fields=['status', 'dispatched_at'])
    return transfer


@transaction.atomic
def receive_transfer(*, transfer: StockTransfer, user=None):
    """Move transfer from in_transit → received. Increments destination warehouse."""
    if transfer.status != StockTransfer.Status.IN_TRANSIT:
        raise DRFValidationError({'status': f'Cannot receive a transfer in status "{transfer.status}".'})

    for item in transfer.items.all():
        record_movement(
            warehouse=transfer.to_warehouse,
            product=item.product,
            movement_type=StockMovement.MovementType.TRANSFER_IN,
            quantity=item.quantity,
            user=user,
            reference_type='stock_transfer',
            reference_id=transfer.transfer_id,
            notes=f'Transfer {transfer.transfer_number} received',
        )
        item.received_quantity = item.quantity
        item.save(update_fields=['received_quantity'])

    transfer.status = StockTransfer.Status.RECEIVED
    transfer.received_at = timezone.now()
    transfer.save(update_fields=['status', 'received_at'])
    return transfer


@transaction.atomic
def cancel_transfer(*, transfer: StockTransfer, user=None):
    """Cancel a draft transfer. Cannot cancel once dispatched."""
    if transfer.status != StockTransfer.Status.DRAFT:
        raise DRFValidationError({'status': 'Only draft transfers can be cancelled.'})

    transfer.status = StockTransfer.Status.CANCELLED
    transfer.cancelled_at = timezone.now()
    transfer.save(update_fields=['status', 'cancelled_at'])
    return transfer