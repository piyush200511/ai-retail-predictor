from django.contrib import admin
from .models import PurchaseOrder, PurchaseOrderItem, GoodsReceipt, GoodsReceiptItem


class PurchaseOrderItemInline(admin.TabularInline):
    model = PurchaseOrderItem
    extra = 1
    autocomplete_fields = ('product',)


@admin.register(PurchaseOrder)
class PurchaseOrderAdmin(admin.ModelAdmin):
    list_display = (
        'purchase_order_id', 'po_number', 'supplier', 'warehouse',
        'order_date', 'status', 'total_amount', 'created_by',
    )
    list_filter = ('status', 'supplier', 'warehouse')
    search_fields = ('po_number', 'supplier__supplier_name')
    autocomplete_fields = ('supplier', 'warehouse', 'created_by')
    readonly_fields = ('subtotal', 'tax_amount', 'total_amount', 'created_at', 'updated_at')
    inlines = [PurchaseOrderItemInline]


class GoodsReceiptItemInline(admin.TabularInline):
    model = GoodsReceiptItem
    extra = 0
    autocomplete_fields = ('product',)
    readonly_fields = ('received_quantity', 'accepted_quantity', 'rejected_quantity')


@admin.register(GoodsReceipt)
class GoodsReceiptAdmin(admin.ModelAdmin):
    list_display = (
        'receipt_id', 'receipt_number', 'purchase_order',
        'received_date', 'received_by', 'created_at',
    )
    search_fields = ('receipt_number', 'purchase_order__po_number')
    autocomplete_fields = ('purchase_order', 'received_by')
    readonly_fields = ('created_at',)
    inlines = [GoodsReceiptItemInline]