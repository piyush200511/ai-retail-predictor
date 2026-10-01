from django.contrib import admin
from .models import Category, Brand, Unit, Product, ProductSupplier


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('category_id', 'category_name', 'is_active')
    list_filter = ('is_active',)
    search_fields = ('category_name',)


@admin.register(Brand)
class BrandAdmin(admin.ModelAdmin):
    list_display = ('brand_id', 'brand_name', 'is_active')
    list_filter = ('is_active',)
    search_fields = ('brand_name',)


@admin.register(Unit)
class UnitAdmin(admin.ModelAdmin):
    list_display = ('unit_id', 'unit_name', 'short_code')
    search_fields = ('unit_name', 'short_code')


class ProductSupplierInline(admin.TabularInline):
    model = ProductSupplier
    extra = 1


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = (
        'product_id', 'sku', 'product_name',
        'category', 'brand', 'unit',
        'cost_price', 'selling_price',
        'reorder_level', 'is_active',
    )
    list_filter = ('is_active', 'category', 'brand')
    search_fields = ('sku', 'product_name')
    inlines = [ProductSupplierInline]


@admin.register(ProductSupplier)
class ProductSupplierAdmin(admin.ModelAdmin):
    list_display = ('product_supplier_id', 'product', 'supplier', 'is_primary')
    list_filter = ('is_primary',)