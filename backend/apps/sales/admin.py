from django.contrib import admin
from .models import Customer, SalesOrder, SalesOrderItem


@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = ('customer_id', 'customer_code', 'customer_name', 'phone', 'city', 'is_active')
    list_filter = ('is_active', 'city')
    search_fields = ('customer_code', 'customer_name', 'email', 'phone')


class SalesOrderItemInline(admin.TabularInline):
    model = SalesOrderItem
    extra = 1
    autocomplete_fields = ('product',)


@admin.register(SalesOrder)
class SalesOrderAdmin(admin.ModelAdmin):
    list_display = (
        'sales_order_id', 'order_number', 'customer', 'warehouse',
        'order_date', 'status', 'total_amount', 'created_by',
    )
    list_filter = ('status', 'warehouse', 'customer')
    search_fields = ('order_number', 'customer__customer_name')
    autocomplete_fields = ('customer', 'warehouse', 'created_by')
    readonly_fields = (
        'subtotal', 'discount_amount', 'tax_amount', 'total_amount',
        'confirmed_at', 'completed_at', 'cancelled_at', 'returned_at',
        'created_at', 'updated_at',
    )
    inlines = [SalesOrderItemInline]