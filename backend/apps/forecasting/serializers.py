from rest_framework import serializers
from .models import (
    DemandHistoryDaily, ForecastRun, DemandForecast, ReorderRecommendation,
)


class DemandHistorySerializer(serializers.ModelSerializer):
    product_sku = serializers.CharField(source='product.sku', read_only=True)
    product_name = serializers.CharField(source='product.product_name', read_only=True)
    warehouse_code = serializers.CharField(source='warehouse.warehouse_code', read_only=True)

    class Meta:
        model = DemandHistoryDaily
        fields = [
            'demand_id',
            'product', 'product_sku', 'product_name',
            'warehouse', 'warehouse_code',
            'demand_date',
            'units_sold', 'units_returned', 'net_demand', 'revenue',
        ]
        read_only_fields = fields


class ForecastRunSerializer(serializers.ModelSerializer):
    created_by_email = serializers.CharField(source='created_by.email', read_only=True)

    class Meta:
        model = ForecastRun
        fields = [
            'forecast_run_id', 'run_name', 'model_name', 'model_version',
            'forecast_horizon_days', 'status',
            'training_start_date', 'training_end_date',
            'started_at', 'completed_at', 'error_message',
            'created_by', 'created_by_email', 'created_at',
        ]
        read_only_fields = [
            'forecast_run_id', 'status', 'model_version',
            'started_at', 'completed_at', 'error_message',
            'created_by', 'created_at',
        ]


class DemandForecastSerializer(serializers.ModelSerializer):
    product_sku = serializers.CharField(source='product.sku', read_only=True)
    warehouse_code = serializers.CharField(source='warehouse.warehouse_code', read_only=True)

    class Meta:
        model = DemandForecast
        fields = [
            'forecast_id', 'forecast_run',
            'product', 'product_sku', 'warehouse', 'warehouse_code',
            'forecast_date', 'predicted_demand',
            'lower_bound', 'upper_bound', 'confidence_score',
        ]
        read_only_fields = fields


class ReorderRecommendationSerializer(serializers.ModelSerializer):
    product_sku = serializers.CharField(source='product.sku', read_only=True)
    product_name = serializers.CharField(source='product.product_name', read_only=True)
    warehouse_code = serializers.CharField(source='warehouse.warehouse_code', read_only=True)

    class Meta:
        model = ReorderRecommendation
        fields = [
            'recommendation_id',
            'product', 'product_sku', 'product_name',
            'warehouse', 'warehouse_code',
            'forecast_run',
            'current_stock', 'average_daily_demand',
            'lead_time_days', 'safety_stock',
            'reorder_point', 'suggested_order_quantity',
            'urgency', 'reason', 'status', 'created_at',
        ]
        read_only_fields = fields


class StartForecastSerializer(serializers.Serializer):
    run_name = serializers.CharField(max_length=150)
    model_name = serializers.ChoiceField(
        choices=['moving_average', 'exponential_smoothing', 'random_forest', 'gradient_boosting']
    )
    forecast_horizon_days = serializers.IntegerField(min_value=1, max_value=180, default=30)
    training_start_date = serializers.DateField(required=False, allow_null=True)
    training_end_date = serializers.DateField(required=False, allow_null=True)