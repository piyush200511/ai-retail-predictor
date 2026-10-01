from django.urls import path
from .views import (
    SalesAnalyticsView, InventoryAnalyticsView,
    PurchasingAnalyticsView, ExecutiveDashboardView,
)

urlpatterns = [
    path('analytics/sales/', SalesAnalyticsView.as_view(), name='analytics-sales'),
    path('analytics/inventory/', InventoryAnalyticsView.as_view(), name='analytics-inventory'),
    path('analytics/purchasing/', PurchasingAnalyticsView.as_view(), name='analytics-purchasing'),
    path('analytics/dashboard/', ExecutiveDashboardView.as_view(), name='analytics-dashboard'),
]