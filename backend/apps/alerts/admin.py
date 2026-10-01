from django.contrib import admin
from .models import InventoryAlert


@admin.register(InventoryAlert)
class InventoryAlertAdmin(admin.ModelAdmin):
    list_display = (
        'alert_id', 'created_at', 'alert_type', 'severity',
        'product', 'warehouse', 'current_value', 'status',
    )
    list_filter = ('alert_type', 'severity', 'status', 'warehouse')
    search_fields = ('product__sku', 'message')
    readonly_fields = ('created_at', 'updated_at')