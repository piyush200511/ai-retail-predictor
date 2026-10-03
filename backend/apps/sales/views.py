from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets, filters
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.authentication.permissions import IsAdminOrSalesManager
from apps.core.services import notify_activity
from .models import Customer, SalesOrder
from .serializers import (
    CustomerSerializer, CustomerListSerializer,
    SalesOrderSerializer, SalesOrderListSerializer,
)
from .services import (
    confirm_sales_order, complete_sales_order,
    cancel_sales_order, return_sales_order,
)


class CustomerViewSet(viewsets.ModelViewSet):
    queryset = Customer.objects.all()
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['is_active', 'city']
    search_fields = ['customer_code', 'customer_name', 'email', 'phone']
    ordering_fields = ['customer_name', 'created_at']
    ordering = ['customer_name']

    def get_serializer_class(self):
        if self.action == 'list':
            return CustomerListSerializer
        return CustomerSerializer

    def get_permissions(self):
        if self.action in ('create', 'update', 'partial_update', 'destroy'):
            return [IsAdminOrSalesManager()]
        return [IsAuthenticated()]

    def perform_create(self, serializer):
        c = serializer.save()
        try:
            notify_activity(
                entity='customer',
                action='create',
                actor=self.request.user,
                title=f'New customer: {c.customer_code}',
                message=f'{c.customer_name} was added by {self.request.user.name}.',
                metadata={'customer_id': c.customer_id},
            )
        except Exception:
            pass

    def perform_destroy(self, instance):
        code, name = instance.customer_code, instance.customer_name
        try:
            notify_activity(
                entity='customer',
                action='delete',
                actor=self.request.user,
                title=f'Customer deleted: {code}',
                message=f'{name} was removed by {self.request.user.name}.',
                severity='warning',
            )
        except Exception:
            pass
        instance.delete()


class SalesOrderViewSet(viewsets.ModelViewSet):
    queryset = SalesOrder.objects.select_related(
        'customer', 'warehouse', 'created_by'
    ).prefetch_related('items__product').all()
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'customer', 'warehouse']
    search_fields = ['order_number', 'customer__customer_name']
    ordering_fields = ['order_date', 'created_at', 'total_amount']
    ordering = ['-created_at']

    def get_serializer_class(self):
        if self.action == 'list':
            return SalesOrderListSerializer
        return SalesOrderSerializer

    def get_permissions(self):
        if self.action in ('create', 'update', 'partial_update', 'destroy',
                           'confirm', 'complete', 'cancel', 'return_order'):
            return [IsAdminOrSalesManager()]
        return [IsAuthenticated()]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=['post'])
    def confirm(self, request, pk=None):
        so = confirm_sales_order(so=self.get_object())
        return Response(self.get_serializer(so).data)

    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        so = complete_sales_order(so=self.get_object(), user=request.user)
        return Response(self.get_serializer(so).data)

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        so = cancel_sales_order(so=self.get_object())
        return Response(self.get_serializer(so).data)

    @action(detail=True, methods=['post'], url_path='return')
    def return_order(self, request, pk=None):
        so = return_sales_order(so=self.get_object(), user=request.user)
        return Response(self.get_serializer(so).data)