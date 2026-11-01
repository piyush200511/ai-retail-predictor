from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    SalesAnalyticsView, InventoryAnalyticsView,
    PurchasingAnalyticsView, ExecutiveDashboardView,
    ExpenseViewSet, ProfitLossView
)

router = DefaultRouter()
router.register(r'expenses', ExpenseViewSet, basename='expense')

urlpatterns = [
    path('', include(router.urls)),
    path('analytics/sales/', SalesAnalyticsView.as_view(), name='analytics-sales'),
    path('analytics/inventory/', InventoryAnalyticsView.as_view(), name='analytics-inventory'),
    path('analytics/purchasing/', PurchasingAnalyticsView.as_view(), name='analytics-purchasing'),
    path('analytics/dashboard/', ExecutiveDashboardView.as_view(), name='analytics-dashboard'),
    path('analytics/profit-loss/', ProfitLossView.as_view(), name='analytics-pl'), # NEW
]