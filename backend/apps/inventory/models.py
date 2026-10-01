from django.conf import settings
from django.db import models


class Inventory(models.Model):
    """Current stock snapshot per (warehouse, product)."""
    inventory_id = models.BigAutoField(primary_key=True)
    warehouse = models.ForeignKey(
        'warehouses.Warehouse', on_delete=models.PROTECT,
        related_name='inventory_records',
    )
    product = models.ForeignKey(
        'products.Product', on_delete=models.PROTECT,
        related_name='inventory_records',
    )
    quantity_on_hand = models.DecimalField(max_digits=14, decimal_places=3, default=0)
    quantity_reserved = models.DecimalField(max_digits=14, decimal_places=3, default=0)
    quantity_available = models.DecimalField(max_digits=14, decimal_places=3, default=0)
    last_stocked_at = models.DateTimeField(null=True, blank=True)
    last_sold_at = models.DateTimeField(null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'inventory'
        unique_together = ('warehouse', 'product')
        indexes = [
            models.Index(fields=['warehouse', 'product']),
            models.Index(fields=['product']),
        ]

    def __str__(self):
        return f'{self.warehouse.warehouse_code} / {self.product.sku} = {self.quantity_on_hand}'

    def save(self, *args, **kwargs):
        # quantity_available is derived
        self.quantity_available = self.quantity_on_hand - self.quantity_reserved
        super().save(*args, **kwargs)


class StockMovement(models.Model):
    """
    Immutable ledger of every stock change.
    NEVER update or delete rows here — always insert new ones.
    """
    class MovementType(models.TextChoices):
        PURCHASE = 'purchase', 'Purchase Receipt'
        SALE = 'sale', 'Sale'
        RETURN_IN = 'return_in', 'Customer Return In'
        RETURN_OUT = 'return_out', 'Return Out to Supplier'
        ADJUSTMENT_IN = 'adjustment_in', 'Manual Adjustment In'
        ADJUSTMENT_OUT = 'adjustment_out', 'Manual Adjustment Out'
        TRANSFER_IN = 'transfer_in', 'Transfer In'
        TRANSFER_OUT = 'transfer_out', 'Transfer Out'
        OPENING = 'opening', 'Opening Balance'

    movement_id = models.BigAutoField(primary_key=True)
    warehouse = models.ForeignKey(
        'warehouses.Warehouse', on_delete=models.PROTECT,
        related_name='stock_movements',
    )
    product = models.ForeignKey(
        'products.Product', on_delete=models.PROTECT,
        related_name='stock_movements',
    )
    movement_type = models.CharField(max_length=20, choices=MovementType.choices, db_index=True)

    # Signed quantity: + for inbound, - for outbound
    quantity = models.DecimalField(max_digits=14, decimal_places=3)

    # Balance after this movement (audit-friendly)
    balance_after = models.DecimalField(max_digits=14, decimal_places=3, default=0)

    reference_type = models.CharField(max_length=50, blank=True, null=True)
    reference_id = models.BigIntegerField(blank=True, null=True)
    unit_cost = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    notes = models.TextField(blank=True, null=True)

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.PROTECT,
        null=True, blank=True,
    )
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        db_table = 'stock_movements'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['warehouse', 'product', 'created_at']),
            models.Index(fields=['reference_type', 'reference_id']),
            models.Index(fields=['movement_type']),
        ]

    def __str__(self):
        sign = '+' if self.quantity >= 0 else ''
        return f'{self.movement_type}: {sign}{self.quantity} {self.product.sku} @ {self.warehouse.warehouse_code}'
    

class StockTransfer(models.Model):
    """Header for warehouse-to-warehouse transfers."""
    class Status(models.TextChoices):
        DRAFT = 'draft', 'Draft'
        IN_TRANSIT = 'in_transit', 'In Transit'
        RECEIVED = 'received', 'Received'
        CANCELLED = 'cancelled', 'Cancelled'

    transfer_id = models.BigAutoField(primary_key=True)
    transfer_number = models.CharField(max_length=60, unique=True)
    from_warehouse = models.ForeignKey(
        'warehouses.Warehouse', on_delete=models.PROTECT,
        related_name='transfers_out',
    )
    to_warehouse = models.ForeignKey(
        'warehouses.Warehouse', on_delete=models.PROTECT,
        related_name='transfers_in',
    )
    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.DRAFT, db_index=True,
    )
    requested_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.PROTECT,
        related_name='stock_transfers',
    )
    notes = models.TextField(blank=True, null=True)
    requested_at = models.DateTimeField(auto_now_add=True)
    dispatched_at = models.DateTimeField(null=True, blank=True)
    received_at = models.DateTimeField(null=True, blank=True)
    cancelled_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'stock_transfers'
        ordering = ['-requested_at']
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['from_warehouse']),
            models.Index(fields=['to_warehouse']),
        ]

    def __str__(self):
        return f'{self.transfer_number} [{self.status}] {self.from_warehouse.warehouse_code} → {self.to_warehouse.warehouse_code}'


class StockTransferItem(models.Model):
    transfer_item_id = models.BigAutoField(primary_key=True)
    transfer = models.ForeignKey(
        StockTransfer, on_delete=models.CASCADE, related_name='items',
    )
    product = models.ForeignKey(
        'products.Product', on_delete=models.PROTECT,
        related_name='transfer_items',
    )
    quantity = models.DecimalField(max_digits=14, decimal_places=3)
    received_quantity = models.DecimalField(max_digits=14, decimal_places=3, default=0)
    notes = models.CharField(max_length=255, blank=True, null=True)

    class Meta:
        db_table = 'stock_transfer_items'
        unique_together = ('transfer', 'product')

    def __str__(self):
        return f'{self.product.sku} x {self.quantity}'