"""
Seed demo data — one-command population for demos.

Usage:
    python manage.py seed_demo
    python manage.py seed_demo --reset  (clears existing data first)
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
from apps.forecasting.models import DemandHistoryDaily
from apps.forecasting.services import rebuild_demand_history


class Command(BaseCommand):
    help = 'Seed demo data for the AI Retail Predictor'

    def add_arguments(self, parser):
        parser.add_argument('--reset', action='store_true', help='Clear data first')

    @transaction.atomic
    def handle(self, *args, **options):
        reset = options['reset']

        if reset:
            self.stdout.write(self.style.WARNING('Clearing existing demo data...'))
            SalesOrderItem.objects.all().delete()
            SalesOrder.objects.all().delete()
            Customer.objects.all().delete()
            DemandHistoryDaily.objects.all().delete()
            Product.objects.all().delete()
            Category.objects.all().delete()
            Brand.objects.all().delete()
            Unit.objects.all().delete()
            Supplier.objects.all().delete()
            Warehouse.objects.all().delete()

        self.stdout.write(self.style.SUCCESS('Seeding demo data...'))

        # Admin user
        admin, created = User.objects.get_or_create(
            email='admin@example.com',
            defaults={
                'name': 'Admin',
                'role': 'admin',
                'is_staff': True,
                'is_superuser': True,
                'is_active': True,
            }
        )
        if created:
            admin.set_password('Admin@123')
            admin.save()
            self.stdout.write(f'  ✓ Admin user created (admin@example.com / Admin@123)')

        # Categories
        cats = ['Electronics', 'Grocery', 'Fashion', 'Home Appliances', 'Stationery']
        cat_objs = []
        for name in cats:
            c, _ = Category.objects.get_or_create(category_name=name, defaults={'description': f'{name} items'})
            cat_objs.append(c)
        self.stdout.write(f'  ✓ {len(cat_objs)} categories')

        # Brands
        brands = ['Samsung', 'Sony', 'Nestle', 'Adidas', 'Philips', 'Classmate']
        brand_objs = []
        for name in brands:
            b, _ = Brand.objects.get_or_create(brand_name=name)
            brand_objs.append(b)
        self.stdout.write(f'  ✓ {len(brand_objs)} brands')

        # Units
        units_data = [('Piece', 'PCS'), ('Kilogram', 'KG'), ('Pack', 'PK'), ('Liter', 'L')]
        unit_objs = []
        for name, code in units_data:
            u, _ = Unit.objects.get_or_create(short_code=code, defaults={'unit_name': name})
            unit_objs.append(u)
        self.stdout.write(f'  ✓ {len(unit_objs)} units')

        # Suppliers
        suppliers_data = [
            ('SUP-001', 'Acme Traders', 'Rahul Sharma', 'Mumbai'),
            ('SUP-002', 'Global Supplies', 'Priya Nair', 'Delhi'),
            ('SUP-003', 'Nova Distributors', 'Amit Patel', 'Bangalore'),
        ]
        sup_objs = []
        for code, name, contact, city in suppliers_data:
            s, _ = Supplier.objects.get_or_create(
                supplier_code=code,
                defaults={
                    'supplier_name': name,
                    'contact_person': contact,
                    'phone': '9999999999',
                    'city': city,
                    'status': 'active',
                }
            )
            sup_objs.append(s)
        self.stdout.write(f'  ✓ {len(sup_objs)} suppliers')

        # Warehouses
        wh_data = [
            ('WH-MUM-01', 'Mumbai Main Warehouse', 'Mumbai'),
            ('WH-DEL-01', 'Delhi Distribution Center', 'Delhi'),
        ]
        wh_objs = []
        for code, name, city in wh_data:
            w, _ = Warehouse.objects.get_or_create(
                warehouse_code=code,
                defaults={'warehouse_name': name, 'city': city, 'manager_name': 'Manager', 'is_active': True}
            )
            wh_objs.append(w)
        self.stdout.write(f'  ✓ {len(wh_objs)} warehouses')

        # Products
        products_data = [
            ('ELEC-MOB-001', 'Smartphone A', 0, 0, 0, 15000, 19999, 20),
            ('ELEC-LAP-001', 'Laptop Pro 15"', 0, 1, 0, 55000, 69999, 10),
            ('GROC-RICE-001', 'Rice 5 KG', 1, 2, 2, 250, 350, 50),
            ('FASH-SHT-001', 'Formal Shirt', 2, 3, 0, 800, 1299, 30),
            ('HOME-FAN-001', 'Ceiling Fan', 3, 4, 0, 2000, 2800, 15),
            ('STAT-NBK-001', 'A4 Notebook', 4, 5, 0, 45, 75, 100),
        ]
        prod_objs = []
        for sku, name, cat_idx, brand_idx, unit_idx, cost, sell, reorder in products_data:
            p, _ = Product.objects.get_or_create(
                sku=sku,
                defaults={
                    'product_name': name,
                    'category': cat_objs[cat_idx],
                    'brand': brand_objs[brand_idx],
                    'unit': unit_objs[unit_idx],
                    'cost_price': Decimal(cost),
                    'selling_price': Decimal(sell),
                    'reorder_level': Decimal(reorder),
                    'reorder_quantity': Decimal(reorder * 3),
                    'lead_time_days': 7,
                    'safety_stock': Decimal(reorder // 2),
                }
            )
            prod_objs.append(p)
        self.stdout.write(f'  ✓ {len(prod_objs)} products')

        # Customers
        cust_data = [
            ('CUST-001', 'Walk-in Customer', 'Mumbai'),
            ('CUST-002', 'Retail Mart', 'Delhi'),
            ('CUST-003', 'ShopEasy Retail', 'Bangalore'),
        ]
        for code, name, city in cust_data:
            Customer.objects.get_or_create(
                customer_code=code,
                defaults={'customer_name': name, 'phone': '8888888888', 'city': city, 'is_active': True}
            )
        self.stdout.write(f'  ✓ {len(cust_data)} customers')

        # Generate synthetic demand history for ML
        self.stdout.write('  Generating 180 days of synthetic demand history...')
        random.seed(42)
        DemandHistoryDaily.objects.all().delete()
        start = date.today() - timedelta(days=180)
        count = 0
        for prod in prod_objs:
            for wh in wh_objs:
                base = random.randint(15, 40)
                for i in range(180):
                    d = start + timedelta(days=i)
                    trend = i * 0.03
                    weekly = 5 if d.weekday() >= 5 else 0
                    noise = random.uniform(-3, 3)
                    units = max(0, base + trend + weekly + noise)
                    DemandHistoryDaily.objects.create(
                        product=prod,
                        warehouse=wh,
                        demand_date=d,
                        units_sold=Decimal(str(round(units, 3))),
                        units_returned=Decimal('0'),
                        net_demand=Decimal(str(round(units, 3))),
                        revenue=Decimal(str(round(units * float(prod.selling_price), 2))),
                    )
                    count += 1
        self.stdout.write(f'  ✓ {count} demand history rows created')

        self.stdout.write(self.style.SUCCESS('\n✅ Demo data seeded successfully!'))
        self.stdout.write(self.style.SUCCESS('   Login: admin@example.com / Admin@123'))
        self.stdout.write(self.style.SUCCESS('   Run a forecast from the Forecasts page to see the AI in action.'))