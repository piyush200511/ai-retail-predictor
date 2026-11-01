"""
Analytics aggregation services — one-stop KPIs for dashboards.
"""
from decimal import Decimal
from datetime import date, timedelta
from django.db.models import Sum, Count, Avg, F, Q

from apps.sales.models import SalesOrder, SalesOrderItem, Customer
from apps.purchases.models import PurchaseOrder, GoodsReceipt
from apps.inventory.models import Inventory, StockMovement, StockTransfer
from apps.products.models import Product
from apps.warehouses.models import Warehouse
from apps.alerts.models import InventoryAlert


def sales_summary(*, start_date=None, end_date=None, warehouse_id=None):
    """Revenue, units sold, order count."""
    qs = SalesOrder.objects.filter(status__in=[SalesOrder.Status.COMPLETED, SalesOrder.Status.RETURNED])
    if start_date:
        qs = qs.filter(order_date__gte=start_date)
    if end_date:
        qs = qs.filter(order_date__lte=end_date)
    if warehouse_id:
        qs = qs.filter(warehouse_id=warehouse_id)

    agg = qs.aggregate(
        revenue=Sum('total_amount'),
        orders=Count('sales_order_id'),
    )
    units = SalesOrderItem.objects.filter(sales_order__in=qs).aggregate(units=Sum('quantity'))
    return {
        'revenue': float(agg['revenue'] or 0),
        'orders': agg['orders'] or 0,
        'units_sold': float(units['units'] or 0),
    }


def inventory_summary(*, warehouse_id=None):
    """Total stock value, low-stock count, stock-out count."""
    qs = Inventory.objects.select_related('product')
    if warehouse_id:
        qs = qs.filter(warehouse_id=warehouse_id)

    total_value = Decimal('0')
    for inv in qs:
        total_value += inv.quantity_on_hand * inv.product.cost_price

    low_stock_qs = InventoryAlert.objects.filter(
        alert_type=InventoryAlert.AlertType.LOW_STOCK,
        status=InventoryAlert.Status.OPEN,
    )
    stock_out_qs = InventoryAlert.objects.filter(
        alert_type=InventoryAlert.AlertType.STOCK_OUT,
        status=InventoryAlert.Status.OPEN,
    )
    overstock_qs = InventoryAlert.objects.filter(
        alert_type=InventoryAlert.AlertType.OVERSTOCK,
        status=InventoryAlert.Status.OPEN,
    )
    if warehouse_id:
        low_stock_qs = low_stock_qs.filter(warehouse_id=warehouse_id)
        stock_out_qs = stock_out_qs.filter(warehouse_id=warehouse_id)
        overstock_qs = overstock_qs.filter(warehouse_id=warehouse_id)

    return {
        'total_inventory_value': float(total_value),
        'low_stock_count': low_stock_qs.count(),
        'stock_out_count': stock_out_qs.count(),
        'overstock_count': overstock_qs.count(),
    }


def top_products(*, limit=10, start_date=None, end_date=None):
    """Top products by revenue."""
    qs = SalesOrderItem.objects.filter(
        sales_order__status__in=[SalesOrder.Status.COMPLETED, SalesOrder.Status.RETURNED]
    )
    if start_date:
        qs = qs.filter(sales_order__order_date__gte=start_date)
    if end_date:
        qs = qs.filter(sales_order__order_date__lte=end_date)

    rows = (
        qs.values('product_id', 'product__sku', 'product__product_name')
        .annotate(revenue=Sum('line_total'), units=Sum('quantity'))
        .order_by('-revenue')[:limit]
    )
    return [
        {
            'product_id': r['product_id'],
            'sku': r['product__sku'],
            'name': r['product__product_name'],
            'revenue': float(r['revenue'] or 0),
            'units': float(r['units'] or 0),
        }
        for r in rows
    ]


def sales_trend(*, days=30, warehouse_id=None):
    """Daily revenue trend for the last N days."""
    start = date.today() - timedelta(days=days)
    qs = SalesOrder.objects.filter(
        status__in=[SalesOrder.Status.COMPLETED, SalesOrder.Status.RETURNED],
        order_date__gte=start,
    )
    if warehouse_id:
        qs = qs.filter(warehouse_id=warehouse_id)

    rows = (
        qs.values('order_date')
        .annotate(revenue=Sum('total_amount'), orders=Count('sales_order_id'))
        .order_by('order_date')
    )
    return [
        {'date': r['order_date'].isoformat(), 'revenue': float(r['revenue'] or 0), 'orders': r['orders']}
        for r in rows
    ]


def purchase_summary(*, start_date=None, end_date=None):
    qs = PurchaseOrder.objects.exclude(status=PurchaseOrder.Status.CANCELLED)
    if start_date:
        qs = qs.filter(order_date__gte=start_date)
    if end_date:
        qs = qs.filter(order_date__lte=end_date)
    agg = qs.aggregate(total=Sum('total_amount'), count=Count('purchase_order_id'))
    return {
        'total_purchase_value': float(agg['total'] or 0),
        'purchase_order_count': agg['count'] or 0,
    }


def inventory_by_warehouse():
    rows = (
        Inventory.objects.values('warehouse_id', 'warehouse__warehouse_code', 'warehouse__warehouse_name')
        .annotate(total_qty=Sum('quantity_on_hand'), skus=Count('product_id'))
        .order_by('warehouse__warehouse_name')
    )
    return [
        {
            'warehouse_id': r['warehouse_id'],
            'code': r['warehouse__warehouse_code'],
            'name': r['warehouse__warehouse_name'],
            'total_quantity': float(r['total_qty'] or 0),
            'unique_skus': r['skus'],
        }
        for r in rows
    ]

from decimal import Decimal
from datetime import date
from django.db.models import Sum, F, ExpressionWrapper, DecimalField
from apps.sales.models import SalesOrderItem, SalesOrder
from apps.products.models import Product
from .models import Expense

def get_profit_and_loss(*, start_date=None, end_date=None):
    """Calculate Revenue, COGS, Gross Profit, Expenses, and Net Profit."""
    
    # 1. Filter Sales
    sales_qs = SalesOrderItem.objects.filter(
        sales_order__status__in=[SalesOrder.Status.COMPLETED, SalesOrder.Status.RETURNED]
    )
    if start_date:
        sales_qs = sales_qs.filter(sales_order__order_date__gte=start_date)
    if end_date:
        sales_qs = sales_qs.filter(sales_order__order_date__lte=end_date)

    # 2. Calculate Revenue & COGS
    revenue = Decimal('0')
    cogs = Decimal('0')
    
    for item in sales_qs.select_related('product'):
        # Revenue = quantity * unit_price
        revenue += item.quantity * item.unit_price
        # COGS = quantity * product.cost_price
        cogs += item.quantity * item.product.cost_price

    gross_profit = revenue - cogs

    # 3. Calculate Expenses
    expense_qs = Expense.objects.all()
    if start_date:
        expense_qs = expense_qs.filter(date__gte=start_date)
    if end_date:
        expense_qs = expense_qs.filter(date__lte=end_date)
    
    total_expenses = expense_qs.aggregate(total=Sum('amount'))['total'] or Decimal('0')

    # 4. Calculate Net Profit
    net_profit = gross_profit - total_expenses

    # 5. Product-wise Profit (Top 5)
    product_profits = []
    product_agg = sales_qs.values('product__sku', 'product__product_name').annotate(
        total_revenue=Sum(ExpressionWrapper(F('quantity') * F('unit_price'), output_field=DecimalField())),
        total_qty=Sum('quantity')
    ).order_by('-total_revenue')[:5]

    for p in product_agg:
        prod = Product.objects.get(sku=p['product__sku'])
        prod_cogs = (Decimal(str(p['total_qty'])) * prod.cost_price)
        prod_rev = p['total_revenue'] or Decimal('0')
        product_profits.append({
            'sku': p['product__sku'],
            'name': p['product__product_name'],
            'revenue': float(prod_rev),
            'cogs': float(prod_cogs),
            'profit': float(prod_rev - prod_cogs),
        })

    return {
        'revenue': float(revenue),
        'cogs': float(cogs),
        'gross_profit': float(gross_profit),
        'total_expenses': float(total_expenses),
        'net_profit': float(net_profit),
        'margin_percent': float((net_profit / revenue * 100) if revenue > 0 else 0),
        'product_profits': product_profits
    }