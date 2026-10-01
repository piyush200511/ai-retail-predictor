from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.authentication.permissions import IsAdminOrInventoryManager
from .models import InventoryAlert
from .serializers import InventoryAlertSerializer, AlertStatusUpdateSerializer


class InventoryAlertViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Read-only alert list.
    Actions: acknowledge, resolve, reopen (all admin/inventory_manager).
    """
    queryset = InventoryAlert.objects.select_related(
        'product', 'warehouse', 'acknowledged_by'
    ).all()
    serializer_class = InventoryAlertSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'severity', 'alert_type', 'product', 'warehouse']
    search_fields = ['product__sku', 'product__product_name', 'warehouse__warehouse_code']
    ordering_fields = ['created_at', 'severity', 'alert_type']
    ordering = ['-created_at']

    def get_permissions(self):
        if self.action in ('acknowledge', 'resolve', 'reopen'):
            return [IsAdminOrInventoryManager()]
        return [IsAuthenticated()]

    @action(detail=True, methods=['post'])
    def acknowledge(self, request, pk=None):
        alert = self.get_object()
        alert.status = InventoryAlert.Status.ACKNOWLEDGED
        alert.acknowledged_by = request.user
        alert.save(update_fields=['status', 'acknowledged_by', 'updated_at'])
        return Response(self.get_serializer(alert).data)

    @action(detail=True, methods=['post'])
    def resolve(self, request, pk=None):
        alert = self.get_object()
        alert.status = InventoryAlert.Status.RESOLVED
        alert.resolved_at = timezone.now()
        alert.save(update_fields=['status', 'resolved_at', 'updated_at'])
        return Response(self.get_serializer(alert).data)

    @action(detail=True, methods=['post'])
    def reopen(self, request, pk=None):
        alert = self.get_object()
        alert.status = InventoryAlert.Status.OPEN
        alert.resolved_at = None
        alert.save(update_fields=['status', 'resolved_at', 'updated_at'])
        return Response(self.get_serializer(alert).data)