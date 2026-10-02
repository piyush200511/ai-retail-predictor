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


from .models import Message


class MessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.CharField(source='sender.name', read_only=True)
    sender_email = serializers.CharField(source='sender.email', read_only=True)

    class Meta:
        model = Message
        fields = [
            'message_id', 'subject', 'body', 'category', 'priority',
            'is_read', 'is_starred', 'link', 'metadata',
            'sender', 'sender_name', 'sender_email',
            'created_at', 'read_at',
        ]
        read_only_fields = [
            'message_id', 'sender', 'sender_name', 'sender_email',
            'created_at', 'read_at',
        ]


class MessageListSerializer(serializers.ModelSerializer):
    sender_name = serializers.CharField(source='sender.name', read_only=True)

    class Meta:
        model = Message
        fields = [
            'message_id', 'subject', 'category', 'priority',
            'is_read', 'is_starred', 'sender_name', 'created_at',
        ]
        read_only_fields = fields