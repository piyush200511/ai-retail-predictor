from django.db import models


class Category(models.Model):
    category_id = models.BigAutoField(primary_key=True)
    category_name = models.CharField(max_length=120, unique=True)
    description = models.TextField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'categories'
        ordering = ['category_name']
        verbose_name_plural = 'Categories'

    def __str__(self):
        return self.category_name


class Brand(models.Model):
    brand_id = models.BigAutoField(primary_key=True)
    brand_name = models.CharField(max_length=120, unique=True)
    description = models.TextField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'brands'
        ordering = ['brand_name']

    def __str__(self):
        return self.brand_name


class Unit(models.Model):
    unit_id = models.BigAutoField(primary_key=True)
    unit_name = models.CharField(max_length=80, unique=True)
    short_code = models.CharField(max_length=20, unique=True)

    class Meta:
        db_table = 'units'
        ordering = ['unit_name']

    def __str__(self):
        return f'{self.unit_name} ({self.short_code})'


class Product(models.Model):
    product_id = models.BigAutoField(primary_key=True)
    sku = models.CharField(max_length=80, unique=True)
    product_name = models.CharField(max_length=200)

    category = models.ForeignKey(
        Category, on_delete=models.PROTECT,
        null=True, blank=True, related_name='products',
    )
    brand = models.ForeignKey(
        Brand, on_delete=models.PROTECT,
        null=True, blank=True, related_name='products',
    )
    unit = models.ForeignKey(
        Unit, on_delete=models.PROTECT,
        null=True, blank=True, related_name='products',
    )

    cost_price = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    selling_price = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    reorder_level = models.DecimalField(max_digits=12, decimal_places=3, default=0)
    reorder_quantity = models.DecimalField(max_digits=12, decimal_places=3, default=0)
    lead_time_days = models.PositiveIntegerField(default=0)
    safety_stock = models.DecimalField(max_digits=12, decimal_places=3, default=0)

    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    suppliers = models.ManyToManyField(
        'suppliers.Supplier',
        through='ProductSupplier',
        related_name='products',
        blank=True,
    )

    class Meta:
        db_table = 'products'
        ordering = ['product_name']
        indexes = [
            models.Index(fields=['sku']),
            models.Index(fields=['is_active']),
        ]

    def __str__(self):
        return f'{self.sku} — {self.product_name}'


class ProductSupplier(models.Model):
    product_supplier_id = models.BigAutoField(primary_key=True)
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='product_suppliers')
    supplier = models.ForeignKey('suppliers.Supplier', on_delete=models.CASCADE, related_name='product_suppliers')
    supplier_sku = models.CharField(max_length=80, blank=True, null=True)
    is_primary = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'product_suppliers'
        unique_together = ('product', 'supplier')

    def __str__(self):
        return f'{self.product.sku} ↔ {self.supplier.supplier_code}'