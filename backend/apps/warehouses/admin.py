from django.contrib import admin
from .models import Warehouse, UserWarehouse


@admin.register(Warehouse)
class WarehouseAdmin(admin.ModelAdmin):
    list_display = ('warehouse_id', 'warehouse_code', 'warehouse_name', 'city', 'manager_name', 'is_active')
    list_filter = ('is_active', 'city')
    search_fields = ('warehouse_code', 'warehouse_name', 'city', 'manager_name')


@admin.register(UserWarehouse)
class UserWarehouseAdmin(admin.ModelAdmin):
    list_display = ('user_warehouse_id', 'user', 'warehouse', 'is_primary', 'created_at')
    list_filter = ('is_primary', 'warehouse')
    search_fields = ('user__email', 'user__name', 'warehouse__warehouse_code')
    autocomplete_fields = ('user', 'warehouse')