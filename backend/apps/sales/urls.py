from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import CustomerViewSet, SalesOrderViewSet

router = DefaultRouter()
router.register(r'customers', CustomerViewSet, basename='customer')
router.register(r'sales-orders', SalesOrderViewSet, basename='sales-order')

urlpatterns = [
    path('', include(router.urls)),
]