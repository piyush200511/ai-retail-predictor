from django.conf import settings
from django.db import models


class DemandHistoryDaily(models.Model):
    """One row per (product, warehouse, date) — daily demand aggregation."""
    demand_id = models.BigAutoField(primary_key=True)
    product = models.ForeignKey(
        'products.Product', on_delete=models.CASCADE,
        related_name='demand_history',
    )
    warehouse = models.ForeignKey(
        'warehouses.Warehouse', on_delete=models.CASCADE,
        related_name='demand_history',
    )
    demand_date = models.DateField(db_index=True)
    units_sold = models.DecimalField(max_digits=14, decimal_places=3, default=0)
    units_returned = models.DecimalField(max_digits=14, decimal_places=3, default=0)
    net_demand = models.DecimalField(max_digits=14, decimal_places=3, default=0)
    revenue = models.DecimalField(max_digits=14, decimal_places=2, default=0)

    class Meta:
        db_table = 'demand_history_daily'
        unique_together = ('product', 'warehouse', 'demand_date')
        ordering = ['-demand_date']
        indexes = [
            models.Index(fields=['product', 'warehouse', 'demand_date']),
            models.Index(fields=['demand_date']),
        ]

    def __str__(self):
        return f'{self.product.sku} @ {self.warehouse.warehouse_code} on {self.demand_date}: {self.net_demand}'


class ForecastRun(models.Model):
    class Status(models.TextChoices):
        QUEUED = 'queued', 'Queued'
        RUNNING = 'running', 'Running'
        COMPLETED = 'completed', 'Completed'
        FAILED = 'failed', 'Failed'

    forecast_run_id = models.BigAutoField(primary_key=True)
    run_name = models.CharField(max_length=150)
    model_name = models.CharField(max_length=100)
    model_version = models.CharField(max_length=50, blank=True, null=True)
    forecast_horizon_days = models.PositiveIntegerField()
    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.QUEUED, db_index=True,
    )
    training_start_date = models.DateField(null=True, blank=True)
    training_end_date = models.DateField(null=True, blank=True)
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    error_message = models.TextField(blank=True, null=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.PROTECT,
        related_name='forecast_runs',
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'forecast_runs'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.run_name} [{self.status}]'


class DemandForecast(models.Model):
    forecast_id = models.BigAutoField(primary_key=True)
    forecast_run = models.ForeignKey(
        ForecastRun, on_delete=models.CASCADE, related_name='forecasts',
    )
    product = models.ForeignKey(
        'products.Product', on_delete=models.CASCADE, related_name='forecasts',
    )
    warehouse = models.ForeignKey(
        'warehouses.Warehouse', on_delete=models.CASCADE, related_name='forecasts',
    )
    forecast_date = models.DateField()
    predicted_demand = models.DecimalField(max_digits=14, decimal_places=3)
    lower_bound = models.DecimalField(max_digits=14, decimal_places=3, null=True, blank=True)
    upper_bound = models.DecimalField(max_digits=14, decimal_places=3, null=True, blank=True)
    confidence_score = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)

    class Meta:
        db_table = 'demand_forecasts'
        indexes = [
            models.Index(fields=['forecast_run', 'product', 'warehouse']),
            models.Index(fields=['forecast_date']),
        ]

    def __str__(self):
        return f'{self.product.sku} on {self.forecast_date}: {self.predicted_demand}'


class ReorderRecommendation(models.Model):
    class Urgency(models.TextChoices):
        LOW = 'low', 'Low'
        MEDIUM = 'medium', 'Medium'
        HIGH = 'high', 'High'
        CRITICAL = 'critical', 'Critical'

    class Status(models.TextChoices):
        NEW = 'new', 'New'
        REVIEWED = 'reviewed', 'Reviewed'
        CONVERTED = 'converted', 'Converted'
        DISMISSED = 'dismissed', 'Dismissed'

    recommendation_id = models.BigAutoField(primary_key=True)
    product = models.ForeignKey(
        'products.Product', on_delete=models.CASCADE, related_name='reorder_recommendations',
    )
    warehouse = models.ForeignKey(
        'warehouses.Warehouse', on_delete=models.CASCADE, related_name='reorder_recommendations',
    )
    forecast_run = models.ForeignKey(
        ForecastRun, on_delete=models.SET_NULL, null=True, blank=True,
    )
    current_stock = models.DecimalField(max_digits=14, decimal_places=3)
    average_daily_demand = models.DecimalField(max_digits=14, decimal_places=3, default=0)
    lead_time_days = models.PositiveIntegerField(default=0)
    safety_stock = models.DecimalField(max_digits=14, decimal_places=3, default=0)
    reorder_point = models.DecimalField(max_digits=14, decimal_places=3, default=0)
    suggested_order_quantity = models.DecimalField(max_digits=14, decimal_places=3, default=0)
    urgency = models.CharField(
        max_length=20, choices=Urgency.choices, default=Urgency.LOW, db_index=True,
    )
    reason = models.TextField(blank=True, null=True)
    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.NEW, db_index=True,
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'reorder_recommendations'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.product.sku} @ {self.warehouse.warehouse_code}: {self.suggested_order_quantity}'


class ModelMetric(models.Model):
    metric_id = models.BigAutoField(primary_key=True)
    forecast_run = models.ForeignKey(
        ForecastRun, on_delete=models.CASCADE, related_name='metrics',
    )
    product = models.ForeignKey(
        'products.Product', on_delete=models.CASCADE, null=True, blank=True,
    )
    metric_name = models.CharField(max_length=50)
    metric_value = models.DecimalField(max_digits=14, decimal_places=6)
    evaluation_start = models.DateField(null=True, blank=True)
    evaluation_end = models.DateField(null=True, blank=True)

    class Meta:
        db_table = 'model_metrics'
        indexes = [models.Index(fields=['forecast_run', 'metric_name'])]

    def __str__(self):
        return f'{self.metric_name}={self.metric_value}'