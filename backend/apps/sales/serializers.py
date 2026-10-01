from rest_framework import serializers
from .models import Customer, SalesOrder, SalesOrderItem


class CustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = [
            'customer_id', 'customer_code', 'customer_name',
            'email', 'phone', 'address', 'city',
            'is_active', 'created_at', 'updated_at',
        ]
        read_only_fields = ['customer_id', 'created_at', 'updated_at']


class CustomerListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = ['customer_id', 'customer_code', 'customer_name', 'phone', 'city', 'is_active']


class SalesOrderItemSerializer(serializers.ModelSerializer):
    product_sku = serializers.CharField(source='product.sku', read_only=True)
    product_name = serializers.CharField(source='product.product_name', read_only=True)

    class Meta:
        model = SalesOrderItem
        fields = [
            'sales_item_id', 'product', 'product_sku', 'product_name',
            'quantity', 'unit_price', 'discount_amount',
            'tax_rate', 'line_total',
        ]
        read_only_fields = ['sales_item_id', 'line_total']


class SalesOrderSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.customer_name', read_only=True)
    warehouse_code = serializers.CharField(source='warehouse.warehouse_code', read_only=True)
    created_by_email = serializers.CharField(source='created_by.email', read_only=True)
    items = SalesOrderItemSerializer(many=True)

    class Meta:
        model = SalesOrder
        fields = [
            'sales_order_id', 'order_number',
            'customer', 'customer_name',
            'warehouse', 'warehouse_code',
            'order_date', 'status',
            'subtotal', 'discount_amount', 'tax_amount', 'total_amount',
            'notes', 'created_by', 'created_by_email',
            'confirmed_at', 'completed_at', 'cancelled_at', 'returned_at',
            'created_at', 'updated_at', 'items',
        ]
        read_only_fields = [
            'sales_order_id', 'order_number', 'status',
            'subtotal', 'discount_amount', 'tax_amount', 'total_amount',
            'created_by', 'confirmed_at', 'completed_at', 'cancelled_at',
            'returned_at', 'created_at', 'updated_at',
        ]

    def create(self, validated_data):
        from django.utils import timezone
        items_data = validated_data.pop('items', [])
        if not items_data:
            raise serializers.ValidationError({'items': 'At least one item required.'})

        today = timezone.now().strftime('%Y%m%d')
        count = SalesOrder.objects.filter(order_number__startswith=f'SO-{today}').count() + 1
        validated_data['order_number'] = f'SO-{today}-{count:04d}'

        so = SalesOrder.objects.create(**validated_data)
        for item in items_data:
            SalesOrderItem.objects.create(sales_order=so, **item)
        so.recalculate_totals()
        return so

    def update(self, instance, validated_data):
        if instance.status != SalesOrder.Status.DRAFT:
            raise serializers.ValidationError('Only draft orders can be edited.')
        items_data = validated_data.pop('items', None)
        for k, v in validated_data.items():
            setattr(instance, k, v)
        instance.save()
        if items_data is not None:
            instance.items.all().delete()
            for item in items_data:
                SalesOrderItem.objects.create(sales_order=instance, **item)
        instance.recalculate_totals()
        return instance


class SalesOrderListSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.customer_name', read_only=True)
    warehouse_code = serializers.CharField(source='warehouse.warehouse_code', read_only=True)

    class Meta:
        model = SalesOrder
        fields = [
            'sales_order_id', 'order_number',
            'customer', 'customer_name',
            'warehouse', 'warehouse_code',
            'order_date', 'status', 'total_amount', 'created_at',
        ]