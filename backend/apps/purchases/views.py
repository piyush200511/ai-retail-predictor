from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.authentication.permissions import IsAdminOrPurchaseManager
from .models import PurchaseOrder, GoodsReceipt
from .serializers import (
    PurchaseOrderSerializer, PurchaseOrderListSerializer,
    GoodsReceiptSerializer, ReceiveGoodsSerializer,
)
from .services import submit_po, approve_po, cancel_po, receive_goods


class PurchaseOrderViewSet(viewsets.ModelViewSet):
    queryset = PurchaseOrder.objects.select_related(
        'supplier', 'warehouse', 'created_by'
    ).prefetch_related('items__product').all()
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'supplier', 'warehouse']
    search_fields = ['po_number', 'supplier__supplier_name']
    ordering_fields = ['order_date', 'created_at', 'total_amount']
    ordering = ['-created_at']

    def get_serializer_class(self):
        if self.action == 'list':
            return PurchaseOrderListSerializer
        return PurchaseOrderSerializer

    def get_permissions(self):
        # View: any authenticated user; Write/actions: Purchase Manager or Admin
        if self.action in ('create', 'update', 'partial_update', 'destroy',
                           'submit', 'approve', 'cancel', 'receive'):
            return [IsAdminOrPurchaseManager()]
        return [IsAuthenticated()]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=['post'])
    def submit(self, request, pk=None):
        po = submit_po(po=self.get_object())
        return Response(self.get_serializer(po).data)

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        po = approve_po(po=self.get_object())
        return Response(self.get_serializer(po).data)

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        po = cancel_po(po=self.get_object())
        return Response(self.get_serializer(po).data)

    @action(detail=True, methods=['post'])
    def receive(self, request, pk=None):
        ser = ReceiveGoodsSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        data = ser.validated_data

        po = self.get_object()
        receipt, po = receive_goods(
            po=po,
            received_by=request.user,
            items_data=data['items'],
            received_date=data.get('received_date'),
            notes=data.get('notes'),
        )
        return Response({
            'receipt': GoodsReceiptSerializer(receipt).data,
            'purchase_order': PurchaseOrderSerializer(po).data,
        }, status=status.HTTP_201_CREATED)


class GoodsReceiptViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = GoodsReceipt.objects.select_related(
        'purchase_order', 'received_by'
    ).prefetch_related('items__product').all()
    serializer_class = GoodsReceiptSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['purchase_order']
    search_fields = ['receipt_number', 'purchase_order__po_number']
    permission_classes = [IsAuthenticated]