from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    CategoryViewSet, BrandViewSet, UnitViewSet,
    ProductViewSet, ProductSupplierViewSet,
)
from .qr_views import ProductQRCodeView

router = DefaultRouter()
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'brands', BrandViewSet, basename='brand')
router.register(r'units', UnitViewSet, basename='unit')
router.register(r'products', ProductViewSet, basename='product')
router.register(r'product-suppliers', ProductSupplierViewSet, basename='product-supplier')

urlpatterns = [
    path('products/<str:sku>/qrcode/', ProductQRCodeView.as_view(), name='product-qrcode'),
    path('', include(router.urls)),
]