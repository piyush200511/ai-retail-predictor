"""
Concrete CSV handlers for each import type.
Each handler takes a row dict and creates a model instance.
Raises ValidationError on invalid rows.

NOTE: Notifications are NOT fired here — the importer batches them.
"""
from decimal import Decimal
from rest_framework.exceptions import ValidationError

from apps.products.models import Product, Category, Brand, Unit
from apps.suppliers.models import Supplier
from apps.warehouses.models import Warehouse
from apps.sales.models import Customer
from .csv_import import to_decimal, to_bool


# ---------- Product ----------
def handle_product(row, user=None):
    sku = (row.get('sku') or '').strip()
    name = (row.get('product_name') or row.get('name') or '').strip()
    if not sku:
        raise ValidationError('Missing required field: sku')
    if not name:
        raise ValidationError('Missing required field: product_name')
    if Product.objects.filter(sku=sku).exists():
        raise ValidationError(f'Duplicate SKU: {sku}')

    cat = None
    cat_name = (row.get('category') or '').strip()
    if cat_name:
        cat, _ = Category.objects.get_or_create(
            category_name=cat_name,
            defaults={'description': ''},
        )

    brand = None
    brand_name = (row.get('brand') or '').strip()
    if brand_name:
        brand, _ = Brand.objects.get_or_create(brand_name=brand_name)

    unit = None
    unit_code = (row.get('unit') or row.get('unit_code') or '').strip()
    if unit_code:
        unit, _ = Unit.objects.get_or_create(
            short_code=unit_code,
            defaults={'unit_name': unit_code},
        )

    Product.objects.create(
        sku=sku,
        product_name=name,
        category=cat,
        brand=brand,
        unit=unit,
        cost_price=to_decimal(row.get('cost_price'), '0'),
        selling_price=to_decimal(row.get('selling_price'), '0'),
        reorder_level=to_decimal(row.get('reorder_level'), '0'),
        reorder_quantity=to_decimal(row.get('reorder_quantity'), '0'),
        lead_time_days=int(row.get('lead_time_days') or 0),
        safety_stock=to_decimal(row.get('safety_stock'), '0'),
        is_active=to_bool(row.get('is_active')) if row.get('is_active') else True,
    )


# ---------- Supplier ----------
def handle_supplier(row, user=None):
    code = (row.get('supplier_code') or row.get('code') or '').strip()
    name = (row.get('supplier_name') or row.get('name') or '').strip()
    if not code:
        raise ValidationError('Missing required field: supplier_code')
    if not name:
        raise ValidationError('Missing required field: supplier_name')
    if Supplier.objects.filter(supplier_code=code).exists():
        raise ValidationError(f'Duplicate code: {code}')

    Supplier.objects.create(
        supplier_code=code,
        supplier_name=name,
        contact_person=(row.get('contact_person') or '').strip() or None,
        email=(row.get('email') or '').strip() or None,
        phone=(row.get('phone') or '').strip() or None,
        address=(row.get('address') or '').strip() or None,
        city=(row.get('city') or '').strip() or None,
        status=(row.get('status') or 'active').strip().lower(),
    )


# ---------- Warehouse ----------
def handle_warehouse(row, user=None):
    code = (row.get('warehouse_code') or row.get('code') or '').strip()
    name = (row.get('warehouse_name') or row.get('name') or '').strip()
    if not code:
        raise ValidationError('Missing required field: warehouse_code')
    if not name:
        raise ValidationError('Missing required field: warehouse_name')
    if Warehouse.objects.filter(warehouse_code=code).exists():
        raise ValidationError(f'Duplicate code: {code}')

    Warehouse.objects.create(
        warehouse_code=code,
        warehouse_name=name,
        address=(row.get('address') or '').strip() or None,
        city=(row.get('city') or '').strip() or None,
        manager_name=(row.get('manager_name') or '').strip() or None,
        is_active=to_bool(row.get('is_active')) if row.get('is_active') else True,
    )


# ---------- Customer ----------
def handle_customer(row, user=None):
    code = (row.get('customer_code') or row.get('code') or '').strip()
    name = (row.get('customer_name') or row.get('name') or '').strip()
    if not code:
        raise ValidationError('Missing required field: customer_code')
    if not name:
        raise ValidationError('Missing required field: customer_name')
    if Customer.objects.filter(customer_code=code).exists():
        raise ValidationError(f'Duplicate code: {code}')

    Customer.objects.create(
        customer_code=code,
        customer_name=name,
        email=(row.get('email') or '').strip() or None,
        phone=(row.get('phone') or '').strip() or None,
        address=(row.get('address') or '').strip() or None,
        city=(row.get('city') or '').strip() or None,
        is_active=to_bool(row.get('is_active')) if row.get('is_active') else True,
    )


HANDLERS = {
    'products': handle_product,
    'suppliers': handle_supplier,
    'warehouses': handle_warehouse,
    'customers': handle_customer,
}


TEMPLATES = {
    'products': [
        'sku', 'product_name', 'category', 'brand', 'unit',
        'cost_price', 'selling_price', 'reorder_level',
        'reorder_quantity', 'lead_time_days', 'safety_stock', 'is_active',
    ],
    'suppliers': [
        'supplier_code', 'supplier_name', 'contact_person',
        'email', 'phone', 'address', 'city', 'status',
    ],
    'warehouses': [
        'warehouse_code', 'warehouse_name', 'address', 'city',
        'manager_name', 'is_active',
    ],
    'customers': [
        'customer_code', 'customer_name', 'email',
        'phone', 'address', 'city', 'is_active',
    ],
}


TEMPLATE_SAMPLES = {
    'products': [
        'TEST-SKU-001', 'Sample Product', 'Electronics', 'Samsung', 'PCS',
        '100', '199', '10', '30', '7', '5', 'true',
    ],
    'suppliers': [
        'SUP-NEW-001', 'New Supplier Inc', 'John Doe',
        'john@newsupplier.com', '9999999999', '123 Main St', 'Mumbai', 'active',
    ],
    'warehouses': [
        'WH-NEW-01', 'New Warehouse', '456 Industrial Area',
        'Pune', 'Manager Name', 'true',
    ],
    'customers': [
        'CUST-NEW-001', 'New Customer', 'customer@example.com',
        '9876543210', '789 High Street', 'Delhi', 'true',
    ],
}