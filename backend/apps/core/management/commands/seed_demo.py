"""
Full demo data seeder — generates realistic volumes for demos.

Usage:
    python manage.py seed_demo            # add to existing data
    python manage.py seed_demo --reset    # wipe demo data first
    python manage.py seed_demo --days 90  # default 90 days of history
"""
import random
from datetime import date, timedelta
from decimal import Decimal

from django.core.management.base import BaseCommand
from django.db import transaction

from apps.authentication.models import User
from apps.suppliers.models import Supplier
from apps.products.models import Category, Brand, Unit, Product
from apps.warehouses.models import Warehouse
from apps.sales.models import Customer, SalesOrder, SalesOrderItem
from apps.sales.services import confirm_sales_order, complete_sales_order
from apps.purchases.models import PurchaseOrder, PurchaseOrderItem
from apps.purchases.services import submit_po, approve_po, receive_goods
from apps.inventory.services import stock_in
from apps.inventory.models import (
    StockMovement, StockTransfer, StockTransferItem,
)
from apps.inventory.services import dispatch_transfer, receive_transfer
from apps.forecasting.models import DemandHistoryDaily
from apps.forecasting.services import rebuild_demand_history


CATEGORIES = [
    ('Electronics', 'Phones, laptops, accessories'),
    ('Grocery', 'Daily essentials'),
    ('Fashion', 'Clothing and apparel'),
    ('Home Appliances', 'Fans, mixers, appliances'),
    ('Stationery', 'Notebooks, pens, supplies'),
    ('Sports', 'Equipment and gear'),
]

BRANDS = ['Samsung', 'Sony', 'Nestle', 'Adidas', 'Philips', 'Classmate', 'Apple', 'Nike', 'LG']

UNITS = [
    ('Piece', 'PCS'),
    ('Kilogram', 'KG'),
    ('Pack', 'PK'),
    ('Liter', 'L'),
    ('Box', 'BOX'),
]

SUPPLIERS = [
    ('SUP-001', 'Acme Traders', 'Rahul Sharma', 'Mumbai'),
    ('SUP-002', 'Global Supplies', 'Priya Nair', 'Delhi'),
    ('SUP-003', 'Nova Distributors', 'Amit Patel', 'Bangalore'),
    ('SUP-004', 'Sunrise Wholesale', 'Kiran Reddy', 'Hyderabad'),
    ('SUP-005', 'Metro Traders', 'Sanjay Gupta', 'Pune'),
]

WAREHOUSES = [
    ('WH-MUM-01', 'Mumbai Main Warehouse', 'Mumbai', 'Rahul Sharma'),
    ('WH-DEL-01', 'Delhi Distribution Center', 'Delhi', 'Priya Nair'),
    ('WH-BLR-01', 'Bangalore Fulfillment Hub', 'Bangalore', 'Amit Patel'),
    ('WH-HYD-01', 'Hyderabad Regional Depot', 'Hyderabad', 'Kiran Reddy'),
]

PRODUCTS = [
    # (sku, name, cat_idx, brand_idx, unit_idx, cost, sell, reorder, lead_days)
    ('ELEC-MOB-001', 'Smartphone A1', 0, 0, 0, 15000, 19999, 20, 7),
    ('ELEC-MOB-002', 'Smartphone A2', 0, 0, 0, 18000, 22999, 15, 7),
    ('ELEC-LAP-001', 'Laptop Pro 15"', 0, 1, 0, 55000, 69999, 10, 14),
    ('ELEC-LAP-002', 'Laptop Air 13"', 0, 6, 0, 65000, 79999, 8, 14),
    ('ELEC-TAB-001', 'Tablet 10"', 0, 0, 0, 22000, 28999, 12, 10),
    ('ELEC-HDP-001', 'Wireless Headphones', 0, 1, 0, 3500, 4999, 25, 5),
    ('GROC-RICE-001', 'Basmati Rice 5 KG', 1, 2, 2, 250, 350, 50, 3),
    ('GROC-OIL-001', 'Sunflower Oil 1L', 1, 2, 3, 120, 160, 80, 3),
    ('GROC-SNK-001', 'Snacks Pack', 1, 2, 2, 40, 60, 150, 2),
    ('GROC-TEA-001', 'Tea Powder 500g', 1, 2, 2, 180, 240, 60, 3),
    ('FASH-SHT-001', 'Formal Shirt', 2, 3, 0, 800, 1299, 30, 5),
    ('FASH-JNS-001', 'Denim Jeans', 2, 3, 0, 1400, 2199, 25, 5),
    ('FASH-SHO-001', 'Running Shoes', 2, 7, 0, 2200, 3499, 20, 7),
    ('FASH-TSH-001', 'Cotton T-Shirt', 2, 3, 0, 400, 799, 40, 4),
    ('HOME-FAN-001', 'Ceiling Fan 1200mm', 3, 4, 0, 2000, 2800, 15, 10),
    ('HOME-MIX-001', 'Mixer Grinder 750W', 3, 4, 0, 3200, 4499, 10, 10),
    ('HOME-IRO-001', 'Steam Iron 1200W', 3, 4, 0, 900, 1499, 20, 7),
    ('HOME-AC-001', 'Split AC 1.5 Ton', 3, 8, 0, 28000, 35999, 5, 14),
    ('STAT-NBK-001', 'A4 Notebook 200pg', 4, 5, 0, 45, 75, 100, 2),
    ('STAT-PEN-001', 'Ball Pen Pack of 10', 4, 5, 2, 60, 100, 80, 2),
    ('STAT-PNT-001', 'Printer Paper A4 500s', 4, 5, 2, 240, 320, 40, 3),
    ('SPRT-BAL-001', 'Football Size 5', 5, 7, 0, 700, 1200, 20, 5),
    ('SPRT-BAT-001', 'Cricket Bat', 5, 7, 0, 1800, 2800, 10, 7),
    ('SPRT-GLV-001', 'Batting Gloves', 5, 7, 0, 500, 899, 25, 4),
    ('SPRT-YOG-001', 'Yoga Mat', 5, 7, 0, 400, 799, 30, 4),
]

CUSTOMERS = [
    ('CUST-001', 'Walk-in Customer', 'Mumbai', '9999999999'),
    ('CUST-002', 'Retail Mart Pvt Ltd', 'Delhi', '9888888888'),
    ('CUST-003', 'ShopEasy Retail', 'Bangalore', '9777777777'),
    ('CUST-004', 'Mega Bazaar', 'Hyderabad', '9666666666'),
    ('CUST-005', 'Quick Cart', 'Pune', '9555555555'),
    ('CUST-006', 'Daily Needs Store', 'Chennai', '9444444444'),
    ('CUST-007', 'Super Saver', 'Kolkata', '9333333333'),
    ('CUST-008', 'Fresh Mart', 'Ahmedabad', '9222222222'),
]


class Command(BaseCommand):
    help = 'Seed demo data with realistic volumes for demos'

    def add_arguments(self, parser):
        parser.add_argument('--reset', action='store_true', help='Clear data first')
        parser.add_argument('--days', type=int, default=90, help='Days of history')

    @transaction.atomic
    def handle(self, *args, **options):
        reset = options['reset']
        days = options['days']
        rng = random.Random(42)  # reproducible

        if reset:
            self.stdout.write(self.style.WARNING('Clearing existing data...'))
            # Imports for reset-only cleanup
            from apps.purchases.models import GoodsReceiptItem, GoodsReceipt
            from apps.inventory.models import StockMovement
            from apps.alerts.models import InventoryAlert
            from apps.forecasting.models import (
                ReorderRecommendation, ModelMetric, DemandForecast, ForecastRun,
            )

            # Delete in dependency order (children first)
            SalesOrderItem.objects.all().delete()
            SalesOrder.objects.all().delete()
            GoodsReceiptItem.objects.all().delete()
            GoodsReceipt.objects.all().delete()
            PurchaseOrderItem.objects.all().delete()
            PurchaseOrder.objects.all().delete()
            StockTransferItem.objects.all().delete()
            StockTransfer.objects.all().delete()
            StockMovement.objects.all().delete()
            InventoryAlert.objects.all().delete()
            ReorderRecommendation.objects.all().delete()
            ModelMetric.objects.all().delete()
            DemandForecast.objects.all().delete()
            ForecastRun.objects.all().delete()
            DemandHistoryDaily.objects.all().delete()
            Customer.objects.all().delete()

        self.stdout.write(self.style.SUCCESS('Seeding demo data...'))

        # ---------- Users ----------
        admin, created = User.objects.get_or_create(
            email='admin@example.com',
            defaults={
                'name': 'Admin', 'role': 'admin',
                'is_staff': True, 'is_superuser': True, 'is_active': True,
            }
        )
        if created:
            admin.set_password('Admin@123')
            admin.save()

        # ---------- Categories / Brands / Units ----------
        cat_objs = [Category.objects.get_or_create(
            category_name=name, defaults={'description': desc}
        )[0] for name, desc in CATEGORIES]

        brand_objs = [Brand.objects.get_or_create(brand_name=b)[0] for b in BRANDS]

        unit_objs = [Unit.objects.get_or_create(
            short_code=code, defaults={'unit_name': name}
        )[0] for name, code in UNITS]

        self.stdout.write(f'  ✓ {len(cat_objs)} categories, {len(brand_objs)} brands, {len(unit_objs)} units')

        # ---------- Suppliers ----------
        sup_objs = []
        for code, name, contact, city in SUPPLIERS:
            s, _ = Supplier.objects.get_or_create(
                supplier_code=code,
                defaults={
                    'supplier_name': name, 'contact_person': contact,
                    'phone': '9999999999', 'city': city, 'status': 'active',
                }
            )
            sup_objs.append(s)
        self.stdout.write(f'  ✓ {len(sup_objs)} suppliers')

        # ---------- Warehouses ----------
        wh_objs = []
        for code, name, city, mgr in WAREHOUSES:
            w, _ = Warehouse.objects.get_or_create(
                warehouse_code=code,
                defaults={
                    'warehouse_name': name, 'city': city,
                    'manager_name': mgr, 'is_active': True,
                }
            )
            wh_objs.append(w)
        self.stdout.write(f'  ✓ {len(wh_objs)} warehouses')

        # ---------- Products ----------
        prod_objs = []
        for sku, name, ci, bi, ui, cost, sell, reorder, lead in PRODUCTS:
            p, _ = Product.objects.get_or_create(
                sku=sku,
                defaults={
                    'product_name': name,
                    'category': cat_objs[ci],
                    'brand': brand_objs[bi],
                    'unit': unit_objs[ui],
                    'cost_price': Decimal(cost),
                    'selling_price': Decimal(sell),
                    'reorder_level': Decimal(reorder),
                    'reorder_quantity': Decimal(reorder * 3),
                    'lead_time_days': lead,
                    'safety_stock': Decimal(reorder // 2),
                }
            )
            prod_objs.append(p)
        self.stdout.write(f'  ✓ {len(prod_objs)} products')

        # ---------- Customers ----------
        cust_objs = []
        for code, name, city, phone in CUSTOMERS:
            c, _ = Customer.objects.get_or_create(
                customer_code=code,
                defaults={
                    'customer_name': name, 'city': city,
                    'phone': phone, 'is_active': True,
                }
            )
            cust_objs.append(c)
        self.stdout.write(f'  ✓ {len(cust_objs)} customers')

        # ---------- Opening Stock (so sales can go through) ----------
        self.stdout.write('  → Seeding opening stock...')
        opening_created = 0
        for prod in prod_objs:
            for wh in wh_objs[:2]:  # only first 2 warehouses
                inv = prod.inventory_records.filter(warehouse=wh).first()
                if inv and inv.quantity_on_hand > 0:
                    continue
                stock_in(
                    warehouse=wh, product=prod,
                    quantity=rng.randint(150, 400),
                    user=admin,
                    movement_type=StockMovement.MovementType.OPENING,
                    notes='Opening stock (seed)',
                )
                opening_created += 1
        self.stdout.write(f'  ✓ {opening_created} opening stock records')

        # ---------- Purchase Orders (30 POs) ----------
        self.stdout.write('  → Generating purchase orders...')
        po_count = 0
        for _ in range(30):
            try:
                po = PurchaseOrder.objects.create(
                    po_number=f'PO-SEED-{rng.randint(10000, 99999)}',
                    supplier=rng.choice(sup_objs),
                    warehouse=rng.choice(wh_objs),
                    order_date=date.today() - timedelta(days=rng.randint(1, days)),
                    created_by=admin,
                    status='draft',
                )
                for prod in rng.sample(prod_objs, k=rng.randint(2, 5)):
                    PurchaseOrderItem.objects.create(
                        purchase_order=po,
                        product=prod,
                        ordered_quantity=Decimal(rng.randint(20, 100)),
                        unit_cost=prod.cost_price,
                        tax_rate=Decimal('18'),
                    )
                po.recalculate_totals()
                submit_po(po=po)
                approve_po(po=po)

                # 70% of POs get received
                if rng.random() < 0.7:
                    items_data = [
                        {
                            'product_id': it.product_id,
                            'received_quantity': str(it.ordered_quantity),
                            'accepted_quantity': str(it.ordered_quantity),
                            'rejected_quantity': '0',
                        }
                        for it in po.items.all()
                    ]
                    receive_goods(po=po, received_by=admin, items_data=items_data)
                po_count += 1
            except Exception:
                pass
        self.stdout.write(f'  ✓ {po_count} purchase orders')

        # ---------- Sales Orders (~120, spread across days) ----------
        self.stdout.write(f'  → Generating sales orders over {days} days...')
        so_count = 0
        so_items_total = 0
        for day_offset in range(days):
            order_date = date.today() - timedelta(days=days - day_offset)
            # 1-3 orders per day
            for _ in range(rng.randint(1, 3)):
                try:
                    wh = rng.choice(wh_objs[:2])
                    cust = rng.choice(cust_objs)
                    so = SalesOrder.objects.create(
                        order_number=f'SO-SEED-{rng.randint(100000, 999999)}',
                        customer=cust,
                        warehouse=wh,
                        order_date=order_date,
                        created_by=admin,
                        status='draft',
                    )
                    for prod in rng.sample(prod_objs, k=rng.randint(1, 3)):
                        SalesOrderItem.objects.create(
                            sales_order=so,
                            product=prod,
                            quantity=Decimal(rng.randint(1, 10)),
                            unit_price=prod.selling_price,
                            discount_amount=Decimal('0'),
                            tax_rate=Decimal('18'),
                        )
                    so.recalculate_totals()
                    confirm_sales_order(so=so)
                    complete_sales_order(so=so, user=admin)
                    so_count += 1
                    so_items_total += so.items.count()
                except Exception:
                    pass
        self.stdout.write(f'  ✓ {so_count} sales orders ({so_items_total} line items)')

        # ---------- Stock Transfers (30) ----------
        self.stdout.write('  → Generating stock transfers...')
        trf_count = 0
        for i in range(30):
            try:
                src, dst = rng.sample(wh_objs, 2)
                trf = StockTransfer.objects.create(
                    transfer_number=f'TRF-SEED-{rng.randint(1000, 9999)}',
                    from_warehouse=src,
                    to_warehouse=dst,
                    requested_by=admin,
                    status='draft',
                    notes='Seed transfer',
                )
                for prod in rng.sample(prod_objs, k=rng.randint(1, 3)):
                    StockTransferItem.objects.create(
                        transfer=trf, product=prod,
                        quantity=Decimal(rng.randint(5, 30)),
                    )
                # Dispatch most, receive some
                if rng.random() < 0.85:
                    dispatch_transfer(transfer=trf, user=admin)
                    if rng.random() < 0.7:
                        receive_transfer(transfer=trf, user=admin)
                trf_count += 1
            except Exception:
                pass
        self.stdout.write(f'  ✓ {trf_count} stock transfers')

        # ---------- Demand History Rebuild ----------
        self.stdout.write('  → Rebuilding demand history from sales...')
        result = rebuild_demand_history()
        self.stdout.write(
            f'  ✓ Demand history: {result["created"]} created, {result["updated"]} updated'
        )

        # If demand history is sparse, generate synthetic backup
        if DemandHistoryDaily.objects.count() < 30:
            self.stdout.write('  → Demand history sparse, generating synthetic data...')
            rng2 = random.Random(42)
            start = date.today() - timedelta(days=days)
            count = 0
            for prod in prod_objs[:8]:
                for wh in wh_objs[:2]:
                    base = rng2.randint(15, 40)
                    for i in range(days):
                        d = start + timedelta(days=i)
                        trend = i * 0.03
                        weekly = 5 if d.weekday() >= 5 else 0
                        noise = rng2.uniform(-3, 3)
                        units = max(0, base + trend + weekly + noise)
                        DemandHistoryDaily.objects.update_or_create(
                            product=prod, warehouse=wh, demand_date=d,
                            defaults={
                                'units_sold': Decimal(str(round(units, 3))),
                                'units_returned': Decimal('0'),
                                'net_demand': Decimal(str(round(units, 3))),
                                'revenue': Decimal(str(round(units * float(prod.selling_price), 2))),
                            }
                        )
                        count += 1
            self.stdout.write(f'  ✓ {count} synthetic demand rows')

        # ---------- Summary ----------
        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS('═' * 60))
        self.stdout.write(self.style.SUCCESS('✅ DEMO DATA SEEDED'))
        self.stdout.write(self.style.SUCCESS('═' * 60))
        self.stdout.write(f'   Users:        {User.objects.count()}')
        self.stdout.write(f'   Categories:   {Category.objects.count()}')
        self.stdout.write(f'   Brands:       {Brand.objects.count()}')
        self.stdout.write(f'   Products:     {Product.objects.count()}')
        self.stdout.write(f'   Suppliers:    {Supplier.objects.count()}')
        self.stdout.write(f'   Warehouses:   {Warehouse.objects.count()}')
        self.stdout.write(f'   Customers:    {Customer.objects.count()}')
        self.stdout.write(f'   Purchases:    {PurchaseOrder.objects.count()}')
        self.stdout.write(f'   Sales:        {SalesOrder.objects.count()}')
        self.stdout.write(f'   Transfers:    {StockTransfer.objects.count()}')
        self.stdout.write(f'   Movements:    {StockMovement.objects.count()}')
        self.stdout.write(f'   Demand rows:  {DemandHistoryDaily.objects.count()}')
        self.stdout.write(self.style.SUCCESS('═' * 60))
        self.stdout.write('')
        self.stdout.write('   Login: admin@example.com / Admin@123')
        self.stdout.write('   Run a forecast from the Forecasts page to see ML in action.')
        self.stdout.write('')