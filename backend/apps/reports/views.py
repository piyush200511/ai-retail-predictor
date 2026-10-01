import csv
from datetime import date, timedelta
from django.http import HttpResponse
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated

from apps.sales.models import SalesOrder, SalesOrderItem
from apps.inventory.models import Inventory, StockMovement
from apps.forecasting.models import DemandForecast, ReorderRecommendation


def _csv_response(filename):
    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = f'attachment; filename="{filename}"'
    return response


class SalesReportCSV(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        start = request.query_params.get('start_date')
        end = request.query_params.get('end_date')
        wh = request.query_params.get('warehouse')

        qs = SalesOrder.objects.select_related('customer', 'warehouse').all()
        if start: qs = qs.filter(order_date__gte=start)
        if end: qs = qs.filter(order_date__lte=end)
        if wh: qs = qs.filter(warehouse_id=wh)

        response = _csv_response(f'sales_report_{date.today()}.csv')
        writer = csv.writer(response)
        writer.writerow(['Order #', 'Date', 'Customer', 'Warehouse', 'Status', 'Total Amount'])
        for so in qs.order_by('-order_date'):
            writer.writerow([
                so.order_number, so.order_date, so.customer.customer_name if so.customer else '',
                so.warehouse.warehouse_code, so.status, so.total_amount,
            ])
        return response


class InventoryReportCSV(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        qs = Inventory.objects.select_related('product', 'warehouse').all()
        wh = request.query_params.get('warehouse')
        if wh: qs = qs.filter(warehouse_id=wh)

        response = _csv_response(f'inventory_report_{date.today()}.csv')
        writer = csv.writer(response)
        writer.writerow(['Warehouse', 'SKU', 'Product', 'On Hand', 'Reserved', 'Available', 'Reorder Level'])
        for inv in qs.order_by('warehouse__warehouse_code', 'product__sku'):
            writer.writerow([
                inv.warehouse.warehouse_code, inv.product.sku, inv.product.product_name,
                inv.quantity_on_hand, inv.quantity_reserved, inv.quantity_available,
                inv.product.reorder_level,
            ])
        return response


class StockMovementsReportCSV(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        start = request.query_params.get('start_date')
        end = request.query_params.get('end_date')
        qs = StockMovement.objects.select_related('product', 'warehouse', 'created_by')
        if start: qs = qs.filter(created_at__date__gte=start)
        if end: qs = qs.filter(created_at__date__lte=end)

        response = _csv_response(f'stock_movements_{date.today()}.csv')
        writer = csv.writer(response)
        writer.writerow(['Date', 'Warehouse', 'SKU', 'Type', 'Quantity', 'Balance After', 'Reference', 'User'])
        for m in qs.order_by('-created_at')[:5000]:
            writer.writerow([
                m.created_at.strftime('%Y-%m-%d %H:%M'), m.warehouse.warehouse_code,
                m.product.sku, m.movement_type, m.quantity, m.balance_after,
                f'{m.reference_type or ""}#{m.reference_id or ""}',
                m.created_by.email if m.created_by else '',
            ])
        return response


class ForecastReportCSV(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        run_id = request.query_params.get('forecast_run')
        qs = DemandForecast.objects.select_related('product', 'warehouse')
        if run_id: qs = qs.filter(forecast_run_id=run_id)

        response = _csv_response(f'forecast_report_{date.today()}.csv')
        writer = csv.writer(response)
        writer.writerow(['Run', 'Date', 'SKU', 'Warehouse', 'Predicted', 'Lower', 'Upper'])
        for f in qs.order_by('forecast_date')[:10000]:
            writer.writerow([
                f.forecast_run_id, f.forecast_date, f.product.sku,
                f.warehouse.warehouse_code, f.predicted_demand,
                f.lower_bound, f.upper_bound,
            ])
        return response