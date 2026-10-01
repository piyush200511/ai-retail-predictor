from rest_framework import viewsets, filters
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend

from apps.authentication.permissions import IsAdminOrPurchaseManager, IsAdmin
from .models import Supplier
from .serializers import SupplierSerializer, SupplierListSerializer


class SupplierViewSet(viewsets.ModelViewSet):
    """
    CRUD for suppliers.
    - Read: any authenticated user
    - Write: admin or purchase_manager only
    """
    queryset = Supplier.objects.all()
    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]
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