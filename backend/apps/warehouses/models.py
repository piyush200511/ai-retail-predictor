from django.conf import settings
from django.db import models


class Warehouse(models.Model):
    warehouse_id = models.BigAutoField(primary_key=True)
    warehouse_code = models.CharField(max_length=50, unique=True)
    warehouse_name = models.CharField(max_length=150)
    address = models.TextField(blank=True, null=True)
    city = models.CharField(max_length=100, blank=True, null=True)
    manager_name = models.CharField(max_length=120, blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'warehouses'
        ordering = ['warehouse_name']
        indexes = [models.Index(fields=['warehouse_code'])]

    def __str__(self):
        return f'{self.warehouse_code} — {self.warehouse_name}'


class UserWarehouse(models.Model):
    user_warehouse_id = models.BigAutoField(primary_key=True)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='warehouse_assignments',
    )
    warehouse = models.ForeignKey(
        Warehouse,
        on_delete=models.CASCADE,
        related_name='user_assignments',
    )
    is_primary = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'user_warehouses'
        unique_together = ('user', 'warehouse')
        ordering = ['-is_primary', 'warehouse__warehouse_name']

    def __str__(self):
        return f'{self.user.email} → {self.warehouse.warehouse_code}'