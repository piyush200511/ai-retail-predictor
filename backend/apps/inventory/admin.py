from django.contrib import admin
from .models import Inventory, StockMovement, StockTransfer, StockTransferItem


@admin.register(Inventory)
class InventoryAdmin(admin.ModelAdmin):
    list_display = (
        'inventory_id', 'warehouse', 'product',
        'quantity_on_hand', 'quantity_reserved', 'quantity_available',
        'updated_at',
    )
    list_filter = ('warehouse',)
    search_fields = ('product__sku', 'product__product_name', 'warehouse__warehouse_code')
    autocomplete_fields = ('warehouse', 'product')
    readonly_fields = ('updated_at',)


@admin.register(StockMovement)
class StockMovementAdmin(admin.ModelAdmin):
    list_display = (
        'movement_id', 'created_at', 'warehouse', 'product',
        'movement_type', 'quantity', 'balance_after', 'created_by',
    )
    list_filter = ('movement_type', 'warehouse')
    search_fields = ('product__sku', 'reference_type', 'reference_id')
    date_hierarchy = 'created_at'
    readonly_fields = [f.name for f in StockMovement._meta.fields]

    def has_change_permission(self, request, obj=None):
        return False
    def has_delete_permission(self, request, obj=None):
        return False


class StockTransferItemInline(admin.TabularInline):
    model = StockTransferItem
    extra = 1
    autocomplete_fields = ('product',)


@admin.register(StockTransfer)
class StockTransferAdmin(admin.ModelAdmin):
    list_display = (
        'transfer_id', 'transfer_number', 'from_warehouse', 'to_warehouse',
        'status', 'requested_by', 'requested_at',
    )
    list_filter = ('status', 'from_warehouse', 'to_warehouse')
    search_fields = ('transfer_number',)
    autocomplete_fields = ('from_warehouse', 'to_warehouse', 'requested_by')
    readonly_fields = ('requested_at', 'dispatched_at', 'received_at', 'cancelled_at')
    inlines = [StockTransferItemInline]