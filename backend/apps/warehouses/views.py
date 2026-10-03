from rest_framework import viewsets, filters
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend

from apps.authentication.permissions import IsAdmin
from apps.core.services import notify_activity
from .models import Warehouse, UserWarehouse
from .serializers import (
    WarehouseSerializer, WarehouseListSerializer,
    UserWarehouseSerializer, UserWarehouseWriteSerializer,
)


class WarehouseViewSet(viewsets.ModelViewSet):
    queryset = Warehouse.objects.all()
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['is_active', 'city']
    search_fields = ['warehouse_code', 'warehouse_name', 'city', 'manager_name']
    ordering_fields = ['warehouse_name', 'warehouse_code', 'created_at']
    ordering = ['warehouse_name']

    def get_serializer_class(self):
        if self.action == 'list':
            return WarehouseListSerializer
        return WarehouseSerializer

    def get_permissions(self):
        if self.action in ('create', 'update', 'partial_update', 'destroy'):
            return [IsAdmin()]
        return [IsAuthenticated()]

    def perform_create(self, serializer):
        w = serializer.save()
        try:
            notify_activity(
                entity='warehouse',
                action='create',
                actor=self.request.user,
                title=f'New warehouse: {w.warehouse_code}',
                message=f'{w.warehouse_name} was added by {self.request.user.name}.',
                metadata={'warehouse_id': w.warehouse_id},
            )
        except Exception:
            pass

    def perform_destroy(self, instance):
        code, name = instance.warehouse_code, instance.warehouse_name
        try:
            notify_activity(
                entity='warehouse',
                action='delete',
                actor=self.request.user,
                title=f'Warehouse deleted: {code}',
                message=f'{name} was removed by {self.request.user.name}.',
                severity='warning',
            )
        except Exception:
            pass
        instance.delete()


class UserWarehouseViewSet(viewsets.ModelViewSet):
    queryset = UserWarehouse.objects.select_related('user', 'warehouse').all()
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['user', 'warehouse', 'is_primary']
    ordering_fields = ['warehouse__warehouse_name']

    def get_serializer_class(self):
        if self.action in ('create', 'update', 'partial_update'):
            return UserWarehouseWriteSerializer
        return UserWarehouseSerializer

    def get_permissions(self):
        if self.action in ('create', 'update', 'partial_update', 'destroy'):
            return [IsAdmin()]
        return [IsAuthenticated()]

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        if user.role == 'admin':
            return qs
        return qs.filter(user=user)