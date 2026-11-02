"""
Stock-out risk: how many days until current stock runs out?
Based on latest ReorderRecommendation per (product, warehouse).
"""
from decimal import Decimal
from .models import ReorderRecommendation


def get_stockout_risks(limit=None):
    """
    Return stock-out risk for the latest reorder recommendation of each product+warehouse.
    """
    qs = (ReorderRecommendation.objects
          .select_related('product', 'warehouse')
          .order_by('product_id', 'warehouse_id', '-created_at'))

    seen = set()
    latest = []
    for rec in qs:
        key = (rec.product_id, rec.warehouse_id)
        if key in seen:
            continue
        seen.add(key)
        latest.append(rec)

    results = []
    for rec in latest:
        avg = Decimal(str(rec.average_daily_demand or 0))
        current = Decimal(str(rec.current_stock or 0))

        if avg > 0:
            days = float(current / avg)
        else:
            days = 999.0

        if days <= 3:
            risk = 'HIGH'
        elif days <= 7:
            risk = 'MEDIUM'
        else:
            risk = 'LOW'

        results.append({
            'product_id': rec.product_id,
            'sku': rec.product.sku,
            'product_name': rec.product.product_name,
            'warehouse_code': rec.warehouse.warehouse_code,
            'current_stock': float(current),
            'avg_daily_demand': float(avg),
            'days_until_stockout': round(days, 2) if days < 999 else None,
            'risk_level': risk,
            'reorder_point': float(rec.reorder_point or 0),
            'urgency': rec.urgency,
        })

    results.sort(key=lambda x: x['days_until_stockout'] if x['days_until_stockout'] is not None else 99999)
    if limit:
        results = results[:limit]
    return results