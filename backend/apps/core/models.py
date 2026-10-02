from django.conf import settings
from django.db import models



class Notification(models.Model):
    class NotificationType(models.TextChoices):
        LOW_STOCK = 'low_stock', 'Low Stock'
        STOCK_OUT_PREDICTED = 'stock_out_predicted', 'Predicted Stock-Out'
        STOCK_RECEIVED = 'stock_received', 'Stock Received'
        PRICE_CHANGE = 'price_change', 'Price Change'
        REORDER_RECOMMENDATION = 'reorder_recommendation', 'AI Reorder Recommendation'
        FORECAST_READY = 'forecast_ready', 'Forecast Ready'
        SYSTEM = 'system', 'System Message'

    class Severity(models.TextChoices):
        INFO = 'info', 'Info'
        WARNING = 'warning', 'Warning'
        CRITICAL = 'critical', 'Critical'

    notification_id = models.BigAutoField(primary_key=True)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name='notifications',
    )
    notification_type = models.CharField(
        max_length=40, choices=NotificationType.choices, db_index=True,
    )
    severity = models.CharField(
        max_length=20, choices=Severity.choices,
        default=Severity.INFO, db_index=True,
    )
    title = models.CharField(max_length=200)
    message = models.TextField()
    link = models.CharField(max_length=200, blank=True, null=True)  # e.g. '/alerts'
    is_read = models.BooleanField(default=False, db_index=True)
    metadata = models.JSONField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    read_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'notifications'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'is_read', '-created_at']),
        ]

    def __str__(self):
        return f'[{self.notification_type}] → {self.user.email}'

class SystemSetting(models.Model):
    class DataType(models.TextChoices):
        STRING = 'string', 'String'
        INTEGER = 'integer', 'Integer'
        DECIMAL = 'decimal', 'Decimal'
        BOOLEAN = 'boolean', 'Boolean'
        JSON = 'json', 'JSON'

    setting_id = models.BigAutoField(primary_key=True)
    setting_key = models.CharField(max_length=120, unique=True)
    setting_value = models.TextField(blank=True, null=True)
    data_type = models.CharField(
        max_length=20, choices=DataType.choices, default=DataType.STRING
    )
    description = models.TextField(blank=True, null=True)
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='settings_updated',
    )
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'system_settings'
        ordering = ['setting_key']

    def __str__(self):
        return f'{self.setting_key} = {self.setting_value}'