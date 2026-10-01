from rest_framework import serializers

from .models import Inventory, StockMovement


class InventorySerializer(serializers.ModelSerializer):
    warehouse_code = serializers.CharField(source='warehouse.warehouse_code', read_only=True)
    warehouse_name = serializers.CharField(source='warehouse.warehouse_name', read_only=True)
    product_sku = serializers.CharField(source='product.sku', read_only=True)
    product_name = serializers.CharField(source='product.product_name', read_only=True)
    reorder_level = serializers.DecimalField(
        source='product.reorder_level', max_digits=12, decimal_places=3, read_only=True
    )
    is_low_stock = serializers.SerializerMethodField()

    class Meta:
        model = Inventory
        fields = [
            'inventory_id',
            'warehouse', 'warehouse_code', 'warehouse_name',
            'product', 'product_sku', 'product_name',
            'quantity_on_hand', 'quantity_reserved', 'quantity_available',
            'reorder_level', 'is_low_stock',
            'last_stocked_at', 'last_sold_at', 'updated_at',
        ]
        read_only_fields = fields  # read-only endpoint

    def get_is_low_stock(self, obj):
        return obj.quantity_available <= obj.product.reorder_level


class StockMovementSerializer(serializers.ModelSerializer):
    warehouse_code = serializers.CharField(source='warehouse.warehouse_code', read_only=True)
    product_sku = serializers.CharField(source='product.sku', read_only=True)
    product_name = serializers.CharField(source='product.product_name', read_only=True)
    created_by_email = serializers.CharField(source='created_by.email', read_only=True)

    class Meta:
        model = StockMovement
        fields = [
            'movement_id',
            'warehouse', 'warehouse_code',
            'product', 'product_sku', 'product_name',
            'movement_type', 'quantity', 'balance_after',
            'reference_type', 'reference_id',
            'unit_cost', 'notes',
            'created_by', 'created_by_email', 'created_at',
        ]
        read_only_fields = fields


class StockAdjustmentSerializer(serializers.Serializer):
    """Request body for /api/inventory/adjust/"""
    warehouse = serializers.IntegerField()
    product = serializers.IntegerField()
    quantity = serializers.DecimalField(max_digits=14, decimal_places=3)
    direction = serializers.ChoiceField(choices=['in', 'out'])
    reason = serializers.CharField(max_length=500, required=False, allow_blank=True)
    unit_cost = serializers.DecimalField(max_digits=12, decimal_places=2, required=False, allow_null=True)

    def validate_quantity(self, value):
        if value <= 0:
            raise serializers.ValidationError('Quantity must be greater than 0.')
        return value


# ---------------- Stock Transfers ----------------

from .models import StockTransfer, StockTransferItem


class StockTransferItemSerializer(serializers.ModelSerializer):
    product_sku = serializers.CharField(source='product.sku', read_only=True)
    product_name = serializers.CharField(source='product.product_name', read_only=True)

    class Meta:
        model = StockTransferItem
        fields = [
            'transfer_item_id', 'product', 'product_sku', 'product_name',
            'quantity', 'received_quantity', 'notes',
        ]
        read_only_fields = ['transfer_item_id', 'received_quantity']


class StockTransferSerializer(serializers.ModelSerializer):
    from_warehouse_code = serializers.CharField(source='from_warehouse.warehouse_code', read_only=True)
    from_warehouse_name = serializers.CharField(source='from_warehouse.warehouse_name', read_only=True)
    to_warehouse_code = serializers.CharField(source='to_warehouse.warehouse_code', read_only=True)
    to_warehouse_name = serializers.CharField(source='to_warehouse.warehouse_name', read_only=True)
    requested_by_email = serializers.CharField(source='requested_by.email', read_only=True)
    items = StockTransferItemSerializer(many=True)

    class Meta:
        model = StockTransfer
        fields = [
            'transfer_id', 'transfer_number',
            'from_warehouse', 'from_warehouse_code', 'from_warehouse_name',
            'to_warehouse', 'to_warehouse_code', 'to_warehouse_name',
            'status', 'notes',
            'requested_by', 'requested_by_email',
            'requested_at', 'dispatched_at', 'received_at', 'cancelled_at',
            'items',
        ]
        read_only_fields = [
            'transfer_id','transfer_number', 'status', 'requested_by',
            'requested_at', 'dispatched_at', 'received_at', 'cancelled_at',
        ]

    def create(self, validated_data):
        items_data = validated_data.pop('items', [])
        if not items_data:
            raise serializers.ValidationError({'items': 'At least one item is required.'})

        # Auto-generate transfer number
        from django.utils import timezone
        today = timezone.now().strftime('%Y%m%d')
        count = StockTransfer.objects.filter(transfer_number__startswith=f'TRF-{today}').count() + 1
        validated_data['transfer_number'] = f'TRF-{today}-{count:04d}'

        transfer = StockTransfer.objects.create(**validated_data)
        for item in items_data:
            StockTransferItem.objects.create(transfer=transfer, **item)
        return transfer

    def update(self, instance, validated_data):
        if instance.status != StockTransfer.Status.DRAFT:
            raise serializers.ValidationError('Only draft transfers can be edited.')
        items_data = validated_data.pop('items', None)

        for k, v in validated_data.items():
            setattr(instance, k, v)
        instance.save()

        if items_data is not None:
            instance.items.all().delete()
            for item in items_data:
                StockTransferItem.objects.create(transfer=instance, **item)
        return instance