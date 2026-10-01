from rest_framework import serializers
from .models import PurchaseOrder, PurchaseOrderItem, GoodsReceipt, GoodsReceiptItem


class PurchaseOrderItemSerializer(serializers.ModelSerializer):
    product_sku = serializers.CharField(source='product.sku', read_only=True)
    product_name = serializers.CharField(source='product.product_name', read_only=True)

    class Meta:
        model = PurchaseOrderItem
        fields = [
            'po_item_id', 'product', 'product_sku', 'product_name',
            'ordered_quantity', 'received_quantity',
            'unit_cost', 'tax_rate', 'line_total',
        ]
        read_only_fields = ['po_item_id', 'received_quantity', 'line_total']


class PurchaseOrderSerializer(serializers.ModelSerializer):
    supplier_name = serializers.CharField(source='supplier.supplier_name', read_only=True)
    supplier_code = serializers.CharField(source='supplier.supplier_code', read_only=True)
    warehouse_code = serializers.CharField(source='warehouse.warehouse_code', read_only=True)
    created_by_email = serializers.CharField(source='created_by.email', read_only=True)
    items = PurchaseOrderItemSerializer(many=True)

    class Meta:
        model = PurchaseOrder
        fields = [
            'purchase_order_id', 'po_number',
            'supplier', 'supplier_name', 'supplier_code',
            'warehouse', 'warehouse_code',
            'order_date', 'expected_date',
            'status', 'subtotal', 'tax_amount', 'total_amount',
            'notes', 'created_by', 'created_by_email',
            'created_at', 'updated_at', 'items',
        ]
        read_only_fields = [
            'purchase_order_id', 'po_number',
            'status', 'subtotal', 'tax_amount', 'total_amount',
            'created_by', 'created_at', 'updated_at',
        ]

    def create(self, validated_data):
        from django.utils import timezone
        items_data = validated_data.pop('items', [])
        if not items_data:
            raise serializers.ValidationError({'items': 'At least one item required.'})

        today = timezone.now().strftime('%Y%m%d')
        count = PurchaseOrder.objects.filter(po_number__startswith=f'PO-{today}').count() + 1
        validated_data['po_number'] = f'PO-{today}-{count:04d}'

        po = PurchaseOrder.objects.create(**validated_data)
        for item in items_data:
            PurchaseOrderItem.objects.create(purchase_order=po, **item)
        po.recalculate_totals()
        return po

    def update(self, instance, validated_data):
        if instance.status != PurchaseOrder.Status.DRAFT:
            raise serializers.ValidationError('Only draft POs can be edited.')
        items_data = validated_data.pop('items', None)
        for k, v in validated_data.items():
            setattr(instance, k, v)
        instance.save()
        if items_data is not None:
            instance.items.all().delete()
            for item in items_data:
                PurchaseOrderItem.objects.create(purchase_order=instance, **item)
        instance.recalculate_totals()
        return instance


class PurchaseOrderListSerializer(serializers.ModelSerializer):
    supplier_name = serializers.CharField(source='supplier.supplier_name', read_only=True)
    warehouse_code = serializers.CharField(source='warehouse.warehouse_code', read_only=True)

    class Meta:
        model = PurchaseOrder
        fields = [
            'purchase_order_id', 'po_number',
            'supplier', 'supplier_name',
            'warehouse', 'warehouse_code',
            'order_date', 'expected_date', 'status',
            'total_amount', 'created_at',
        ]


class GoodsReceiptItemSerializer(serializers.ModelSerializer):
    product_sku = serializers.CharField(source='product.sku', read_only=True)

    class Meta:
        model = GoodsReceiptItem
        fields = [
            'receipt_item_id', 'product', 'product_sku',
            'received_quantity', 'accepted_quantity', 'rejected_quantity',
        ]
        read_only_fields = ['receipt_item_id']


class GoodsReceiptSerializer(serializers.ModelSerializer):
    purchase_order_number = serializers.CharField(source='purchase_order.po_number', read_only=True)
    received_by_email = serializers.CharField(source='received_by.email', read_only=True)
    items = GoodsReceiptItemSerializer(many=True, read_only=True)

    class Meta:
        model = GoodsReceipt
        fields = [
            'receipt_id', 'receipt_number',
            'purchase_order', 'purchase_order_number',
            'received_date', 'received_by', 'received_by_email',
            'notes', 'created_at', 'items',
        ]
        read_only_fields = [
            'receipt_id', 'receipt_number', 'received_by', 'created_at',
        ]


class ReceiveGoodsSerializer(serializers.Serializer):
    """Request body for /api/purchase-orders/{id}/receive/"""
    received_date = serializers.DateField(required=False, allow_null=True)
    notes = serializers.CharField(required=False, allow_blank=True)
    items = serializers.ListField(child=serializers.DictField(), allow_empty=False)