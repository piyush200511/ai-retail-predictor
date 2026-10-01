from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.db import models

from .managers import UserManager


class User(AbstractBaseUser, PermissionsMixin):
    class Role(models.TextChoices):
        ADMIN = 'admin', 'Admin'
        INVENTORY_MANAGER = 'inventory_manager', 'Inventory Manager'
        SALES_MANAGER = 'sales_manager', 'Sales Manager'
        PURCHASE_MANAGER = 'purchase_manager', 'Purchase Manager'
        ANALYST = 'analyst', 'Analyst'

    user_id = models.BigAutoField(primary_key=True)
    name = models.CharField(max_length=100)
    email = models.EmailField(max_length=150, unique=True)
    role = models.CharField(
        max_length=30,
        choices=Role.choices,
        default=Role.ANALYST,
        db_index=True,
    )
    phone = models.CharField(max_length=20, blank=True, null=True)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['name']

    class Meta:
        db_table = 'users'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.name} <{self.email}> [{self.role}]'

    # ---- Convenience role helpers ----
    @property
    def is_admin(self):
        return self.role == self.Role.ADMIN

    @property
    def is_inventory_manager(self):
        return self.role == self.Role.INVENTORY_MANAGER

    @property
    def is_sales_manager(self):
        return self.role == self.Role.SALES_MANAGER

    @property
    def is_purchase_manager(self):
        return self.role == self.Role.PURCHASE_MANAGER

    @property
    def is_analyst(self):
        return self.role == self.Role.ANALYST