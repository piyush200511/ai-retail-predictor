from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import WarehouseViewSet, UserWarehouseViewSet

router = DefaultRouter()
router.register(r'warehouses', WarehouseViewSet, basename='warehouse')
router.register(r'user-warehouses', UserWarehouseViewSet, basename='user-warehouse')

urlpatterns = [
    path('', include(router.urls)),
]