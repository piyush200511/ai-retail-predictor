from django.conf import settings
from django.db import models


class PurchaseOrder(models.Model):
    class Status(models.TextChoices):
        DRAFT = 'draft', 'Draft'
        SUBMITTED = 'submitted', 'Submitted'
        APPROVED = 'approved', 'Approved'
        PARTIALLY_RECEIVED = 'partially_received', 'Partially Received'
        RECEIVED = 'received', 'Received'
        CANCELLED = 'cancelled', 'Cancelled'

    purchase_order_id = models.BigAutoField(primary_key=True)
    po_number = models.CharField(max_length=60, unique=True)
    supplier = models.ForeignKey(
        'suppliers.Supplier', on_delete=models.PROTECT, related_name='purchase_orders',
    )
    warehouse = models.ForeignKey(
        'warehouses.Warehouse', on_delete=models.PROTECT, related_name='purchase_orders',
    )
    order_date = models.DateField()
    expected_date = models.DateField(null=True, blank=True)
    status = models.CharField(
        max_length=25, choices=Status.choices, default=Status.DRAFT, db_index=True,
    )
    subtotal = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    tax_amount = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    total_amount = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    notes = models.TextField(blank=True, null=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name='purchase_orders',
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'purchase_orders'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['supplier']),
            models.Index(fields=['warehouse']),
        ]

    def __str__(self):
        return f'{self.po_number} [{self.status}] → {self.supplier.supplier_code}'

    def recalculate_totals(self):
        subtotal = sum((it.line_total for it in self.items.all()), start=0)
        from decimal import Decimal
        subtotal = Decimal(subtotal)
        self.subtotal = subtotal
        self.total_amount = subtotal + self.tax_amount
        self.save(update_fields=['subtotal', 'total_amount'])


class PurchaseOrderItem(models.Model):
    po_item_id = models.BigAutoField(primary_key=True)
    purchase_order = models.ForeignKey(
        PurchaseOrder, on_delete=models.CASCADE, related_name='items',
    )
    product = models.ForeignKey(
        'products.Product', on_delete=models.PROTECT, related_name='po_items',
    )
    ordered_quantity = models.DecimalField(max_digits=14, decimal_places=3)
    received_quantity = models.DecimalField(max_digits=14, decimal_places=3, default=0)
    unit_cost = models.DecimalField(max_digits=12, decimal_places=2)
    tax_rate = models.DecimalField(max_digits=6, decimal_places=2, default=0)
    line_total = models.DecimalField(max_digits=14, decimal_places=2, default=0)

    class Meta:
        db_table = 'purchase_order_items'
        unique_together = ('purchase_order', 'product')

    def save(self, *args, **kwargs):
        from decimal import Decimal
        base = Decimal(self.ordered_quantity) * Decimal(self.unit_cost)
        self.line_total = base * (Decimal('1') + Decimal(self.tax_rate) / Decimal('100'))
        super().save(*args, **kwargs)

    def __str__(self):
        return f'{self.product.sku} x {self.ordered_quantity}'


class GoodsReceipt(models.Model):
    receipt_id = models.BigAutoField(primary_key=True)
    receipt_number = models.CharField(max_length=60, unique=True)
    purchase_order = models.ForeignKey(
        PurchaseOrder, on_delete=models.PROTECT, related_name='receipts',
    )
    received_date = models.DateField()
    received_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name='goods_receipts',
    )
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'goods_receipts'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.receipt_number} (PO: {self.purchase_order.po_number})'


class GoodsReceiptItem(models.Model):
    receipt_item_id = models.BigAutoField(primary_key=True)
    receipt = models.ForeignKey(
        GoodsReceipt, on_delete=models.CASCADE, related_name='items',
    )
    product = models.ForeignKey(
        'products.Product', on_delete=models.PROTECT, related_name='gr_items',
    )
    received_quantity = models.DecimalField(max_digits=14, decimal_places=3)
    accepted_quantity = models.DecimalField(max_digits=14, decimal_places=3, default=0)
    rejected_quantity = models.DecimalField(max_digits=14, decimal_places=3, default=0)

    class Meta:
        db_table = 'goods_receipt_items'
        unique_together = ('receipt', 'product')

    def __str__(self):
        return f'{self.product.sku} recv={self.received_quantity} acc={self.accepted_quantity}'