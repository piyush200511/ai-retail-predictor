from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SystemSettingViewSet, NotificationViewSet, MessageViewSet

router = DefaultRouter()
router.register(r'settings', SystemSettingViewSet, basename='system-setting')
router.register(r'notifications', NotificationViewSet, basename='notification')
router.register(r'messages', MessageViewSet, basename='message')

urlpatterns = [path('', include(router.urls))]