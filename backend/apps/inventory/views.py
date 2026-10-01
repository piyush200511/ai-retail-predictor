from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404

from apps.authentication.permissions import IsAdminOrInventoryManager
from apps.products.models import Product
from apps.warehouses.models import Warehouse
from .models import Inventory, StockMovement, StockTransfer
from .serializers import (
    InventorySerializer, StockMovementSerializer, StockAdjustmentSerializer,
    StockTransferSerializer,
)
from .services import stock_in, stock_out, dispatch_transfer, receive_transfer, cancel_transfer
from .models import StockMovement as SM


class InventoryViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Read-only inventory views.
    - List current stock (with filters)
    - Retrieve single (warehouse, product) balance
    - Custom action: adjust stock (Inventory Manager / Admin only)
    """
    queryset = Inventory.objects.select_related('warehouse', 'product').all()
    serializer_class = InventorySerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['warehouse', 'product']
    search_fields = ['product__sku', 'product__product_name', 'warehouse__warehouse_code']
    ordering_fields = ['quantity_on_hand', 'quantity_available', 'updated_at']
    ordering = ['-updated_at']

    def get_permissions(self):
        if self.action == 'adjust':
            return [IsAdminOrInventoryManager()]
        return [IsAuthenticated()]

    @action(detail=False, methods=['post'], url_path='adjust')
    def adjust(self, request):
        """POST /api/inventory/adjust/ — manual stock adjustment."""
        ser = StockAdjustmentSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        data = ser.validated_data

        warehouse = get_object_or_404(Warehouse, pk=data['warehouse'])
        product = get_object_or_404(Product, pk=data['product'])

        common = dict(
            warehouse=warehouse,
            product=product,
            quantity=data['quantity'],
            user=request.user,
            reference_type='manual_adjustment',
            notes=data.get('reason') or '',
        )

        if data['direction'] == 'in':
            inv, movement = stock_in(
                movement_type=SM.MovementType.ADJUSTMENT_IN,
                unit_cost=data.get('unit_cost'),
                **common,
            )
        else:
            inv, movement = stock_out(
                movement_type=SM.MovementType.ADJUSTMENT_OUT,
                **common,
            )

        return Response({
            'inventory': InventorySerializer(inv).data,
            'movement': StockMovementSerializer(movement).data,
        }, status=status.HTTP_201_CREATED)


class StockMovementViewSet(viewsets.ReadOnlyModelViewSet):
    """Immutable ledger — read-only."""
    queryset = StockMovement.objects.select_related('warehouse', 'product', 'created_by').all()
    serializer_class = StockMovementSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['warehouse', 'product', 'movement_type', 'reference_type', 'reference_id']
    ordering_fields = ['created_at', 'quantity']
    ordering = ['-created_at']
    permission_classes = [IsAuthenticated]


class StockTransferViewSet(viewsets.ModelViewSet):
    """
    Warehouse-to-warehouse stock transfers.
    - Create in draft
    - /dispatch/ → in_transit (decrements source)
    - /receive/  → received (increments destination)
    - /cancel/   → cancelled (only drafts)
    """
    queryset = StockTransfer.objects.select_related(
        'from_warehouse', 'to_warehouse', 'requested_by'
    ).prefetch_related('items__product').all()
    serializer_class = StockTransferSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['status', 'from_warehouse', 'to_warehouse']
    ordering_fields = ['requested_at', 'dispatched_at', 'received_at']
    ordering = ['-requested_at']

    def get_permissions(self):
        if self.action in ('create', 'update', 'partial_update', 'destroy',
                           'dispatch', 'receive', 'cancel'):
            return [IsAdminOrInventoryManager()]
        return [IsAuthenticated()]

    def perform_create(self, serializer):
        serializer.save(requested_by=self.request.user)

    @action(detail=True, methods=['post'], url_path='dispatch')
    def dispatch(self, request, pk=None):
        transfer = self.get_object()
        transfer = dispatch_transfer(transfer=transfer, user=request.user)
        return Response(self.get_serializer(transfer).data)

    @action(detail=True, methods=['post'], url_path='receive')
    def receive(self, request, pk=None):
        transfer = self.get_object()
        transfer = receive_transfer(transfer=transfer, user=request.user)
        return Response(self.get_serializer(transfer).data)

    @action(detail=True, methods=['post'], url_path='cancel')
    def cancel(self, request, pk=None):
        transfer = self.get_object()
        transfer = cancel_transfer(transfer=transfer, user=request.user)
        return Response(self.get_serializer(transfer).data)