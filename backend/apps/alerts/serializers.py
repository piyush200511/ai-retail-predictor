from rest_framework import serializers
from .models import InventoryAlert


class InventoryAlertSerializer(serializers.ModelSerializer):
    product_sku = serializers.CharField(source='product.sku', read_only=True)
    product_name = serializers.CharField(source='product.product_name', read_only=True)
    warehouse_code = serializers.CharField(source='warehouse.warehouse_code', read_only=True)
    warehouse_name = serializers.CharField(source='warehouse.warehouse_name', read_only=True)
    acknowledged_by_email = serializers.CharField(source='acknowledged_by.email', read_only=True)

    class Meta:
        model = InventoryAlert
        fields = [
            'alert_id',
            'product', 'product_sku', 'product_name',
            'warehouse', 'warehouse_code', 'warehouse_name',
            'alert_type', 'severity',
            'threshold_value', 'current_value',
            'message', 'status',
            'acknowledged_by', 'acknowledged_by_email',
            'resolved_at', 'created_at', 'updated_at',
        ]
        read_only_fields = [
            'alert_id', 'created_at', 'updated_at', 'resolved_at',
        ]


class AlertStatusUpdateSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=['open', 'acknowledged', 'resolved'])