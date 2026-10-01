from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import InventoryAlertViewSet

router = DefaultRouter()
router.register(r'alerts', InventoryAlertViewSet, basename='alert')

urlpatterns = [path('', include(router.urls))]