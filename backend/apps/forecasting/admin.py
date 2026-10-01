from django.contrib import admin
from .models import (
    DemandHistoryDaily, ForecastRun, DemandForecast,
    ReorderRecommendation, ModelMetric,
)


@admin.register(DemandHistoryDaily)
class DemandHistoryAdmin(admin.ModelAdmin):
    list_display = (
        'demand_id', 'demand_date', 'product', 'warehouse',
        'units_sold', 'units_returned', 'net_demand', 'revenue',
    )
    list_filter = ('warehouse', 'demand_date')
    search_fields = ('product__sku',)
    date_hierarchy = 'demand_date'


@admin.register(ForecastRun)
class ForecastRunAdmin(admin.ModelAdmin):
    list_display = (
        'forecast_run_id', 'run_name', 'model_name', 'status',
        'forecast_horizon_days', 'created_by', 'created_at',
    )
    list_filter = ('status', 'model_name')
    search_fields = ('run_name',)


@admin.register(DemandForecast)
class DemandForecastAdmin(admin.ModelAdmin):
    list_display = (
        'forecast_id', 'forecast_run', 'product', 'warehouse',
        'forecast_date', 'predicted_demand',
    )
    list_filter = ('forecast_run', 'warehouse')
    search_fields = ('product__sku',)
    date_hierarchy = 'forecast_date'


@admin.register(ReorderRecommendation)
class ReorderRecommendationAdmin(admin.ModelAdmin):
    list_display = (
        'recommendation_id', 'product', 'warehouse',
        'current_stock', 'reorder_point', 'suggested_order_quantity',
        'urgency', 'status',
    )
    list_filter = ('urgency', 'status', 'warehouse')
    search_fields = ('product__sku',)


@admin.register(ModelMetric)
class ModelMetricAdmin(admin.ModelAdmin):
    list_display = ('metric_id', 'forecast_run', 'metric_name', 'metric_value')
    list_filter = ('metric_name',)