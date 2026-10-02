from rest_framework import serializers
from .models import SystemSetting


class SystemSettingSerializer(serializers.ModelSerializer):
    updated_by_email = serializers.CharField(source='updated_by.email', read_only=True)

    class Meta:
        model = SystemSetting
        fields = [
            'setting_id', 'setting_key', 'setting_value', 'data_type',
            'description', 'updated_by', 'updated_by_email', 'updated_at',
        ]
        read_only_fields = ['setting_id', 'updated_by', 'updated_at']


from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = [
            'notification_id', 'notification_type', 'severity',
            'title', 'message', 'link', 'is_read',
            'metadata', 'created_at', 'read_at',
        ]
        read_only_fields = fields