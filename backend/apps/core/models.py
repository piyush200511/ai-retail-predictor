from django.conf import settings
from django.db import models


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