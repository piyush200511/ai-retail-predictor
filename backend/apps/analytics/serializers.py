from rest_framework import serializers
from .models import Expense

class ExpenseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Expense
        fields = ['expense_id', 'date', 'category', 'amount', 'description', 'created_at']
        read_only_fields = ['expense_id', 'created_at']