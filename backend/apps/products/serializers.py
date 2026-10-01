from rest_framework import serializers

from .models import Category, Brand, Unit, Product, ProductSupplier


# ---------------- Category ----------------
class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['category_id', 'category_name', 'description', 'is_active', 'created_at']
        read_only_fields = ['category_id', 'created_at']


# ---------------- Brand ----------------
class BrandSerializer(serializers.ModelSerializer):
    class Meta:
        model = Brand
        fields = ['brand_id', 'brand_name', 'description', 'is_active', 'created_at']
        read_only_fields = ['brand_id', 'created_at']


# ---------------- Unit ----------------
class UnitSerializer(serializers.ModelSerializer):
    class Meta:
        model = Unit
        fields = ['unit_id', 'unit_name', 'short_code']
        read_only_fields = ['unit_id']


# ---------------- ProductSupplier (read) ----------------
class ProductSupplierReadSerializer(serializers.ModelSerializer):
    supplier_code = serializers.CharField(source='supplier.supplier_code', read_only=True)
    supplier_name = serializers.CharField(source='supplier.supplier_name', read_only=True)

    class Meta:
        model = ProductSupplier
        fields = [
            'product_supplier_id', 'supplier', 'supplier_code', 'supplier_name',
            'supplier_sku', 'is_primary',
        ]


# ---------------- Product (list) ----------------
class ProductListSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.category_name', read_only=True)
    brand_name = serializers.CharField(source='brand.brand_name', read_only=True)
    unit_code = serializers.CharField(source='unit.short_code', read_only=True)

    class Meta:
        model = Product
        fields = [
            'product_id', 'sku', 'product_name',
            'category_name', 'brand_name', 'unit_code',
            'cost_price', 'selling_price',
            'reorder_level', 'is_active',
        ]


# ---------------- Product (detail / write) ----------------
class ProductSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.category_name', read_only=True)
    brand_name = serializers.CharField(source='brand.brand_name', read_only=True)
    unit_name = serializers.CharField(source='unit.unit_name', read_only=True)
    supplier_links = ProductSupplierReadSerializer(
        source='product_suppliers', many=True, read_only=True
    )

    class Meta:
        model = Product
        fields = [
            'product_id', 'sku', 'product_name',
            'category', 'category_name',
            'brand', 'brand_name',
            'unit', 'unit_name',
            'cost_price', 'selling_price',
            'reorder_level', 'reorder_quantity',
            'lead_time_days', 'safety_stock',
            'is_active', 'supplier_links',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['product_id', 'created_at', 'updated_at']


# ---------------- Product ↔ Supplier link (write) ----------------
class ProductSupplierWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductSupplier
        fields = ['product_supplier_id', 'product', 'supplier', 'supplier_sku', 'is_primary']
        read_only_fields = ['product_supplier_id']