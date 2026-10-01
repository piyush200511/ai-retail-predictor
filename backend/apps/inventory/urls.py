from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import InventoryViewSet, StockMovementViewSet, StockTransferViewSet

router = DefaultRouter()
router.register(r'inventory', InventoryViewSet, basename='inventory')
router.register(r'stock-movements', StockMovementViewSet, basename='stock-movement')
router.register(r'stock-transfers', StockTransferViewSet, basename='stock-transfer')

urlpatterns = [
    path('', include(router.urls)),
]