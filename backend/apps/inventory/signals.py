from django.db.models.signals import post_save
from django.dispatch import receiver

from apps.products.models import Product
from apps.warehouses.models import Warehouse
from .models import Inventory


def _get_default_warehouse():
    """Return the first active warehouse, or create a fallback 'MAIN' one."""
    warehouse = Warehouse.objects.filter(is_active=True).order_by('warehouse_id').first()
    if warehouse:
        return warehouse

    return Warehouse.objects.create(
        warehouse_code='MAIN',
        warehouse_name='Main Warehouse',
        is_active=True,
    )


@receiver(post_save, sender=Product)
def ensure_inventory_row(sender, instance, created, **kwargs):
    """
    Whenever a product is saved (created OR updated),
    ensure it has an inventory row in the default warehouse.
    Idempotent — won't duplicate thanks to unique_together.
    """
    warehouse = _get_default_warehouse()
    Inventory.objects.get_or_create(
        warehouse=warehouse,
        product=instance,
        defaults={
            'quantity_on_hand': 0,
            'quantity_reserved': 0,
            'quantity_available': 0,
        },
    )