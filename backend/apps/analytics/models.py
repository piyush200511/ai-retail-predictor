from django.db import models
from django.conf import settings


class Expense(models.Model):
    class Category(models.TextChoices):
        RENT = 'rent', 'Rent'
        SALARY = 'salary', 'Salary'
        UTILITIES = 'utilities', 'Utilities'
        MARKETING = 'marketing', 'Marketing'
        OTHER = 'other', 'Other'

    expense_id = models.BigAutoField(primary_key=True)
    date = models.DateField()
    category = models.CharField(max_length=20, choices=Category.choices, default=Category.OTHER)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    description = models.CharField(max_length=255, blank=True, null=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'expenses'
        ordering = ['-date']

    def __str__(self):
        return f"{self.category} - {self.amount} on {self.date}"