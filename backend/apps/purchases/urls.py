from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import PurchaseOrderViewSet, GoodsReceiptViewSet

router = DefaultRouter()
router.register(r'purchase-orders', PurchaseOrderViewSet, basename='purchase-order')
router.register(r'goods-receipts', GoodsReceiptViewSet, basename='goods-receipt')

urlpatterns = [
    path('', include(router.urls)),
]