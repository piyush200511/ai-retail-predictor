from rest_framework import viewsets, filters
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend

from apps.authentication.permissions import IsAdminOrPurchaseManager
from apps.core.services import notify_activity
from .models import Supplier
from .serializers import SupplierSerializer, SupplierListSerializer


class SupplierViewSet(viewsets.ModelViewSet):
    queryset = Supplier.objects.all()
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'city']
    search_fields = ['supplier_code', 'supplier_name', 'contact_person', 'email', 'phone']
    ordering_fields = ['supplier_name', 'supplier_code', 'created_at']
    ordering = ['supplier_name']

    def get_serializer_class(self):
        if self.action == 'list':
            return SupplierListSerializer
        return SupplierSerializer

    def get_permissions(self):
        if self.action in ('create', 'update', 'partial_update', 'destroy'):
            return [IsAdminOrPurchaseManager()]
        return [IsAuthenticated()]

    def perform_create(self, serializer):
        s = serializer.save()
        try:
            notify_activity(
                entity='supplier',
                action='create',
                actor=self.request.user,
                title=f'New supplier: {s.supplier_code}',
                message=f'{s.supplier_name} was added by {self.request.user.name}.',
                metadata={'supplier_id': s.supplier_id},
            )
        except Exception:
            pass

    def perform_destroy(self, instance):
        code, name = instance.supplier_code, instance.supplier_name
        try:
            notify_activity(
                entity='supplier',
                action='delete',
                actor=self.request.user,
                title=f'Supplier deleted: {code}',
                message=f'{name} was removed by {self.request.user.name}.',
                severity='warning',
            )
        except Exception:
            pass
        instance.delete()