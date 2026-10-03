from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    SystemSettingViewSet, NotificationViewSet, MessageViewSet,
    CSVImportView, CSVTemplateView,
)

router = DefaultRouter()
router.register(r'settings', SystemSettingViewSet, basename='system-setting')
router.register(r'notifications', NotificationViewSet, basename='notification')
router.register(r'messages', MessageViewSet, basename='message')

urlpatterns = [
    path('', include(router.urls)),
    path('import/<str:import_type>/', CSVImportView.as_view(), name='csv-import'),
    path('import/<str:import_type>/template/', CSVTemplateView.as_view(), name='csv-template'),
]