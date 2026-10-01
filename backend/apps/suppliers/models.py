from django.db import models


class Supplier(models.Model):
    class Status(models.TextChoices):
        ACTIVE = 'active', 'Active'
        INACTIVE = 'inactive', 'Inactive'

    supplier_id = models.BigAutoField(primary_key=True)
    supplier_code = models.CharField(max_length=50, unique=True)
    supplier_name = models.CharField(max_length=200)
    contact_person = models.CharField(max_length=120, blank=True, null=True)
    email = models.EmailField(max_length=150, blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    city = models.CharField(max_length=100, blank=True, null=True)
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.ACTIVE,
        db_index=True,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'suppliers'
        ordering = ['supplier_name']
        indexes = [
            models.Index(fields=['supplier_code']),
            models.Index(fields=['status']),
        ]

    def __str__(self):
        return f'{self.supplier_code} — {self.supplier_name}'