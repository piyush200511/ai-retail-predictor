"""
Purchase workflows:
- Submit, Approve PO
- Receive goods → increment stock via inventory service
- Auto-update PO status (partially_received / received)
"""
from decimal import Decimal
from django.db import transaction
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from .models import PurchaseOrder, PurchaseOrderItem, GoodsReceipt, GoodsReceiptItem
from apps.inventory.services import record_movement
from apps.inventory.models import StockMovement


@transaction.atomic
def submit_po(*, po: PurchaseOrder):
    if po.status != PurchaseOrder.Status.DRAFT:
        raise ValidationError({'status': 'Only draft POs can be submitted.'})
    if not po.items.exists():
        raise ValidationError({'items': 'Cannot submit a PO with no items.'})
    po.status = PurchaseOrder.Status.SUBMITTED
    po.save(update_fields=['status'])
    return po


@transaction.atomic
def approve_po(*, po: PurchaseOrder):
    if po.status != PurchaseOrder.Status.SUBMITTED:
        raise ValidationError({'status': 'Only submitted POs can be approved.'})
    po.status = PurchaseOrder.Status.APPROVED
    po.save(update_fields=['status'])
    return po


@transaction.atomic
def cancel_po(*, po: PurchaseOrder):
    if po.status in (PurchaseOrder.Status.RECEIVED, PurchaseOrder.Status.CANCELLED):
        raise ValidationError({'status': f'Cannot cancel a {po.status} PO.'})
    po.status = PurchaseOrder.Status.CANCELLED
    po.save(update_fields=['status'])
    return po


@transaction.atomic
def receive_goods(*, po: PurchaseOrder, received_by, items_data, received_date=None, notes=None):
    """
    items_data: list of dicts like
      [{"product_id": 1, "received_quantity": "10", "accepted_quantity": "10", "rejected_quantity": "0"}]
    """
    if po.status not in (PurchaseOrder.Status.APPROVED, PurchaseOrder.Status.PARTIALLY_RECEIVED):
        raise ValidationError({'status': 'PO must be approved before receiving goods.'})

    if not items_data:
        raise ValidationError({'items': 'At least one item is required.'})

    # Generate receipt number
    today = timezone.now().strftime('%Y%m%d')
    count = GoodsReceipt.objects.filter(receipt_number__startswith=f'GRN-{today}').count() + 1
    receipt = GoodsReceipt.objects.create(
        receipt_number=f'GRN-{today}-{count:04d}',
        purchase_order=po,
        received_date=received_date or timezone.now().date(),
        received_by=received_by,
        notes=notes or '',
    )

    for row in items_data:
        product_id = row['product_id']
        received_qty = Decimal(str(row['received_quantity']))
        accepted_qty = Decimal(str(row.get('accepted_quantity', received_qty)))
        rejected_qty = Decimal(str(row.get('rejected_quantity', '0')))

        if accepted_qty + rejected_qty != received_qty:
            raise ValidationError({
                'items': f'For product {product_id}: accepted + rejected must equal received.'
            })

        # Find the matching PO line
        po_item = po.items.filter(product_id=product_id).first()
        if not po_item:
            raise ValidationError({'items': f'Product {product_id} is not in this PO.'})

        remaining = po_item.ordered_quantity - po_item.received_quantity
        if accepted_qty > remaining:
            raise ValidationError({
                'items': f'For product {product_id}: accepted {accepted_qty} exceeds remaining {remaining}.'
            })

        # Insert receipt item
        GoodsReceiptItem.objects.create(
            receipt=receipt,
            product_id=product_id,
            received_quantity=received_qty,
            accepted_quantity=accepted_qty,
            rejected_quantity=rejected_qty,
        )

        # Stock in (only accepted quantity)
        if accepted_qty > 0:
            record_movement(
                warehouse=po.warehouse,
                product=po_item.product,
                movement_type=StockMovement.MovementType.PURCHASE,
                quantity=accepted_qty,
                user=received_by,
                reference_type='goods_receipt',
                reference_id=receipt.receipt_id,
                unit_cost=po_item.unit_cost,
                notes=f'Received via {receipt.receipt_number} (PO {po.po_number})',
            )

        # Update PO line received_quantity
        po_item.received_quantity += accepted_qty
        po_item.save(update_fields=['received_quantity'])

    # Update PO status based on lines
    all_received = all(
        it.received_quantity >= it.ordered_quantity for it in po.items.all()
    )
    any_received = any(it.received_quantity > 0 for it in po.items.all())
    if all_received:
        po.status = PurchaseOrder.Status.RECEIVED
    elif any_received:
        po.status = PurchaseOrder.Status.PARTIALLY_RECEIVED
    po.save(update_fields=['status'])
        # ---------- Notify on goods receipt ----------
    try:
        from apps.core.services import notify_roles
        total_units = sum(
            float(it.accepted_quantity) for it in receipt.items.all()
        )
        notify_roles(
            roles=['inventory_manager', 'purchase_manager'],
            notification_type='stock_received',
            severity='info',
            title=f'Goods received: {receipt.receipt_number}',
            message=(
                f'{len(receipt.items.all())} items · '
                f'{total_units:.0f} units received at {po.warehouse.warehouse_code}.'
            ),
            link='/purchases',
            metadata={
                'receipt_id': receipt.receipt_id,
                'po_id': po.purchase_order_id,
            },
        )
    except Exception:
        pass
    return receipt, po