from django.contrib import admin
from .models import Supplier


@admin.register(Supplier)
class SupplierAdmin(admin.ModelAdmin):
    list_display = (
        'supplier_id', 'supplier_code', 'supplier_name',
        'contact_person', 'phone', 'city', 'status',
    )
    list_filter = ('status', 'city')
    search_fields = ('supplier_code', 'supplier_name', 'contact_person', 'email', 'phone')
    ordering = ('supplier_name',)