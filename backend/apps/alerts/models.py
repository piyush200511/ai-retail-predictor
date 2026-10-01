from django.conf import settings
from django.db import models


class InventoryAlert(models.Model):
    class AlertType(models.TextChoices):
        LOW_STOCK = 'low_stock', 'Low Stock'
        STOCK_OUT = 'stock_out', 'Stock Out'
        OVERSTOCK = 'overstock', 'Overstock'
        UNUSUAL_DEMAND = 'unusual_demand', 'Unusual Demand'

    class Severity(models.TextChoices):
        INFO = 'info', 'Info'
        WARNING = 'warning', 'Warning'
        CRITICAL = 'critical', 'Critical'

    class Status(models.TextChoices):
        OPEN = 'open', 'Open'
        ACKNOWLEDGED = 'acknowledged', 'Acknowledged'
        RESOLVED = 'resolved', 'Resolved'

    alert_id = models.BigAutoField(primary_key=True)
    product = models.ForeignKey(
        'products.Product', on_delete=models.CASCADE,
        related_name='alerts',
    )
    warehouse = models.ForeignKey(
        'warehouses.Warehouse', on_delete=models.CASCADE,
        related_name='alerts',
    )
    alert_type = models.CharField(max_length=20, choices=AlertType.choices, db_index=True)
    severity = models.CharField(
        max_length=20, choices=Severity.choices, default=Severity.WARNING, db_index=True,
    )
    threshold_value = models.DecimalField(max_digits=14, decimal_places=3, null=True, blank=True)
    current_value = models.DecimalField(max_digits=14, decimal_places=3, null=True, blank=True)
    message = models.TextField()
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.OPEN, db_index=True)
    acknowledged_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='acknowledged_alerts',
    )
    resolved_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'inventory_alerts'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status', 'severity']),
            models.Index(fields=['product', 'warehouse']),
        ]

    def __str__(self):
        return f'[{self.alert_type}] {self.product.sku} @ {self.warehouse.warehouse_code}'