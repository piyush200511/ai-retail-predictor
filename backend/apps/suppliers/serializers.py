from rest_framework import serializers

from .models import Supplier


class SupplierSerializer(serializers.ModelSerializer):
    class Meta:
        model = Supplier
        fields = [
            'supplier_id', 'supplier_code', 'supplier_name',
            'contact_person', 'email', 'phone', 'address', 'city',
            'status', 'created_at', 'updated_at',
        ]
        read_only_fields = ['supplier_id', 'created_at', 'updated_at']


class SupplierListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for list views."""
    class Meta:
        model = Supplier
        fields = [
            'supplier_id', 'supplier_code', 'supplier_name',
            'contact_person', 'phone', 'city', 'status',
        ]