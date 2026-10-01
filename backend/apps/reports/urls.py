from django.urls import path
from .views import (
    SalesReportCSV, InventoryReportCSV,
    StockMovementsReportCSV, ForecastReportCSV,
)

urlpatterns = [
    path('reports/sales.csv', SalesReportCSV.as_view(), name='report-sales'),
    path('reports/inventory.csv', InventoryReportCSV.as_view(), name='report-inventory'),
    path('reports/stock-movements.csv', StockMovementsReportCSV.as_view(), name='report-movements'),
    path('reports/forecasts.csv', ForecastReportCSV.as_view(), name='report-forecasts'),
]