from rest_framework import viewsets, filters
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend

from apps.authentication.permissions import IsAdmin
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
        # Warehouse CRUD is Admin-only
        if self.action in ('create', 'update', 'partial_update', 'destroy'):
            return [IsAdmin()]
        return [IsAuthenticated()]


class UserWarehouseViewSet(viewsets.ModelViewSet):
    """
    Warehouse assignments.
    - Admin: full CRUD
    - Non-admin: read-only, only their own assignments
    """
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
        # Non-admins can only see their own assignments
        return qs.filter(user=user)