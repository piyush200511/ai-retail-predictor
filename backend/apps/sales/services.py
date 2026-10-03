"""
Sales workflows:
- Confirm → reserve stock
- Complete → deduct stock, release reservation, write SALE movement
- Cancel → release reservation
- Return → reverse the sale (RETURN_IN movement)
"""
from decimal import Decimal
from django.db import transaction
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from .models import SalesOrder
from apps.inventory.services import (
    record_movement, reserve_stock, release_reserved,
)
from apps.inventory.models import StockMovement


@transaction.atomic
def confirm_sales_order(*, so: SalesOrder):
    """Reserve stock for every line."""
    if so.status != SalesOrder.Status.DRAFT:
        raise ValidationError({'status': 'Only draft orders can be confirmed.'})
    if not so.items.exists():
        raise ValidationError({'items': 'Cannot confirm an order with no items.'})

    # Reserve each line
    for item in so.items.all():
        reserve_stock(
            warehouse=so.warehouse,
            product=item.product,
            quantity=item.quantity,
        )

    so.status = SalesOrder.Status.CONFIRMED
    so.confirmed_at = timezone.now()
    so.save(update_fields=['status', 'confirmed_at'])
    return so


@transaction.atomic
def complete_sales_order(*, so: SalesOrder, user=None):
    """Deduct stock, release reservation, write SALE movements."""
    if so.status != SalesOrder.Status.CONFIRMED:
        raise ValidationError({'status': 'Only confirmed orders can be completed.'})

    for item in so.items.all():
        # Release the reservation (since we're about to physically remove stock)
        release_reserved(
            warehouse=so.warehouse,
            product=item.product,
            quantity=item.quantity,
        )
        # Write SALE movement (decrements quantity_on_hand)
        record_movement(
            warehouse=so.warehouse,
            product=item.product,
            movement_type=StockMovement.MovementType.SALE,
            quantity=item.quantity,
            user=user,
            reference_type='sales_order',
            reference_id=so.sales_order_id,
            notes=f'Sale via {so.order_number}',
        )

    so.status = SalesOrder.Status.COMPLETED
    so.completed_at = timezone.now()
    so.save(update_fields=['status', 'completed_at'])

    # Update demand history for this date
    try:
        from apps.forecasting.services import rebuild_demand_history
        rebuild_demand_history(start_date=so.order_date, end_date=so.order_date)
    except Exception:
        pass

    # Notify on order completion
    try:
        from apps.core.services import notify_activity
        notify_activity(
            entity='sale',
            action='complete',
            actor=user,
            title=f'Order completed: {so.order_number}',
            message=f'{so.order_number} — ₹{so.total_amount} completed by {user.name if user else "system"}.',
            metadata={'sales_order_id': so.sales_order_id},
        )
    except Exception:
        pass

    return so


@transaction.atomic
def cancel_sales_order(*, so: SalesOrder):
    """Release reservation if confirmed; cancel either way (unless already completed)."""
    if so.status in (SalesOrder.Status.COMPLETED, SalesOrder.Status.CANCELLED):
        raise ValidationError({'status': f'Cannot cancel a {so.status} order.'})

    if so.status == SalesOrder.Status.CONFIRMED:
        for item in so.items.all():
            release_reserved(
                warehouse=so.warehouse,
                product=item.product,
                quantity=item.quantity,
            )

    so.status = SalesOrder.Status.CANCELLED
    so.cancelled_at = timezone.now()
    so.save(update_fields=['status', 'cancelled_at'])
    return so


@transaction.atomic
def return_sales_order(*, so: SalesOrder, user=None):
    """Return a completed order: add stock back via RETURN_IN movement."""
    if so.status != SalesOrder.Status.COMPLETED:
        raise ValidationError({'status': 'Only completed orders can be returned.'})

    for item in so.items.all():
        record_movement(
            warehouse=so.warehouse,
            product=item.product,
            movement_type=StockMovement.MovementType.RETURN_IN,
            quantity=item.quantity,
            user=user,
            reference_type='sales_order',
            reference_id=so.sales_order_id,
            notes=f'Return of {so.order_number}',
        )

    so.status = SalesOrder.Status.RETURNED
    so.returned_at = timezone.now()
    so.save(update_fields=['status', 'returned_at'])
    return so