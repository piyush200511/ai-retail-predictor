from django.conf import settings
from django.db import models


class Customer(models.Model):
    customer_id = models.BigAutoField(primary_key=True)
    customer_code = models.CharField(max_length=50, unique=True)
    customer_name = models.CharField(max_length=200)
    email = models.EmailField(max_length=150, blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    city = models.CharField(max_length=100, blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'customers'
        ordering = ['customer_name']
        indexes = [models.Index(fields=['customer_code'])]

    def __str__(self):
        return f'{self.customer_code} — {self.customer_name}'


class SalesOrder(models.Model):
    class Status(models.TextChoices):
        DRAFT = 'draft', 'Draft'
        CONFIRMED = 'confirmed', 'Confirmed'
        COMPLETED = 'completed', 'Completed'
        CANCELLED = 'cancelled', 'Cancelled'
        RETURNED = 'returned', 'Returned'

    sales_order_id = models.BigAutoField(primary_key=True)
    order_number = models.CharField(max_length=60, unique=True)
    customer = models.ForeignKey(
        Customer, on_delete=models.PROTECT,
        null=True, blank=True, related_name='sales_orders',
    )
    warehouse = models.ForeignKey(
        'warehouses.Warehouse', on_delete=models.PROTECT,
        related_name='sales_orders',
    )
    order_date = models.DateField()
    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.DRAFT, db_index=True,
    )
    subtotal = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    discount_amount = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    tax_amount = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    total_amount = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    notes = models.TextField(blank=True, null=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.PROTECT,
        related_name='sales_orders',
    )
    confirmed_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    cancelled_at = models.DateTimeField(null=True, blank=True)
    returned_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'sales_orders'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['customer']),
            models.Index(fields=['warehouse']),
            models.Index(fields=['order_date']),
        ]

    def __str__(self):
        return f'{self.order_number} [{self.status}]'

    def recalculate_totals(self):
        from decimal import Decimal
        subtotal = Decimal('0')
        tax_total = Decimal('0')
        for it in self.items.all():
            subtotal += Decimal(it.unit_price) * Decimal(it.quantity) - Decimal(it.discount_amount)
            tax_total += (Decimal(it.unit_price) * Decimal(it.quantity) - Decimal(it.discount_amount)) \
                         * Decimal(it.tax_rate) / Decimal('100')
        self.subtotal = subtotal
        self.tax_amount = tax_total
        self.discount_amount = sum((it.discount_amount for it in self.items.all()), start=Decimal('0'))
        self.total_amount = subtotal + tax_total
        self.save(update_fields=['subtotal', 'tax_amount', 'discount_amount', 'total_amount'])


class SalesOrderItem(models.Model):
    sales_item_id = models.BigAutoField(primary_key=True)
    sales_order = models.ForeignKey(
        SalesOrder, on_delete=models.CASCADE, related_name='items',
    )
    product = models.ForeignKey(
        'products.Product', on_delete=models.PROTECT, related_name='sales_items',
    )
    quantity = models.DecimalField(max_digits=14, decimal_places=3)
    unit_price = models.DecimalField(max_digits=12, decimal_places=2)
    discount_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    tax_rate = models.DecimalField(max_digits=6, decimal_places=2, default=0)
    line_total = models.DecimalField(max_digits=14, decimal_places=2, default=0)

    class Meta:
        db_table = 'sales_order_items'
        unique_together = ('sales_order', 'product')

    def save(self, *args, **kwargs):
        from decimal import Decimal
        base = Decimal(self.unit_price) * Decimal(self.quantity) - Decimal(self.discount_amount)
        self.line_total = base * (Decimal('1') + Decimal(self.tax_rate) / Decimal('100'))
        super().save(*args, **kwargs)

    def __str__(self):
        return f'{self.product.sku} x {self.quantity}'