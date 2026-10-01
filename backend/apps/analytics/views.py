from datetime import date, timedelta
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .services import (
    sales_summary, inventory_summary, top_products,
    sales_trend, purchase_summary, inventory_by_warehouse,
)


def _parse_dates(request):
    start = request.query_params.get('start_date')
    end = request.query_params.get('end_date')
    return (
        date.fromisoformat(start) if start else None,
        date.fromisoformat(end) if end else None,
    )


def _parse_wh(request):
    wh = request.query_params.get('warehouse')
    return int(wh) if wh else None


class SalesAnalyticsView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        start, end = _parse_dates(request)
        wh = _parse_wh(request)
        return Response({
            'summary': sales_summary(start_date=start, end_date=end, warehouse_id=wh),
            'top_products': top_products(limit=10, start_date=start, end_date=end),
            'trend': sales_trend(days=30, warehouse_id=wh),
        })


class InventoryAnalyticsView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        wh = _parse_wh(request)
        return Response({
            'summary': inventory_summary(warehouse_id=wh),
            'by_warehouse': inventory_by_warehouse(),
        })


class PurchasingAnalyticsView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        start, end = _parse_dates(request)
        return Response(purchase_summary(start_date=start, end_date=end))


class ExecutiveDashboardView(APIView):
    """One-shot endpoint for the exec dashboard."""
    permission_classes = [IsAuthenticated]
    def get(self, request):
        return Response({
            'sales': sales_summary(start_date=date.today() - timedelta(days=30)),
            'inventory': inventory_summary(),
            'purchasing': purchase_summary(start_date=date.today() - timedelta(days=30)),
        })