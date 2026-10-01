from rest_framework import serializers
from django.contrib.auth import get_user_model

from .models import Warehouse, UserWarehouse

User = get_user_model()


class WarehouseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Warehouse
        fields = [
            'warehouse_id', 'warehouse_code', 'warehouse_name',
            'address', 'city', 'manager_name',
            'is_active', 'created_at', 'updated_at',
        ]
        read_only_fields = ['warehouse_id', 'created_at', 'updated_at']


class WarehouseListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Warehouse
        fields = ['warehouse_id', 'warehouse_code', 'warehouse_name', 'city', 'is_active']


class UserWarehouseSerializer(serializers.ModelSerializer):
    user_email = serializers.CharField(source='user.email', read_only=True)
    user_name = serializers.CharField(source='user.name', read_only=True)
    warehouse_code = serializers.CharField(source='warehouse.warehouse_code', read_only=True)
    warehouse_name = serializers.CharField(source='warehouse.warehouse_name', read_only=True)

    class Meta:
        model = UserWarehouse
        fields = [
            'user_warehouse_id',
            'user', 'user_email', 'user_name',
            'warehouse', 'warehouse_code', 'warehouse_name',
            'is_primary', 'created_at',
        ]
        read_only_fields = ['user_warehouse_id', 'created_at']


class UserWarehouseWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserWarehouse
        fields = ['user_warehouse_id', 'user', 'warehouse', 'is_primary']
        read_only_fields = ['user_warehouse_id']