"""
Forecast runner — ties everything together.
"""
from datetime import timedelta
from decimal import Decimal
from django.db import transaction
from django.utils import timezone

from apps.forecasting.models import ForecastRun, DemandForecast, ModelMetric
from .demand_pipeline import build_demand_dataframe, create_features, chronological_split
from ..models.forecasters import (
    MovingAverageForecaster, ExponentialSmoothingForecaster,
    RandomForestForecaster, GradientBoostingForecaster,
    evaluate_model,
)


MODELS = {
    'moving_average': MovingAverageForecaster,
    'exponential_smoothing': ExponentialSmoothingForecaster,
    'random_forest': RandomForestForecaster,
    'gradient_boosting': GradientBoostingForecaster,
}


@transaction.atomic
def run_forecast_for_pairs(*, run: ForecastRun, model_key: str, pairs: list, horizon_days: int):
    run.status = ForecastRun.Status.RUNNING
    run.started_at = timezone.now()
    run.save(update_fields=['status', 'started_at'])

    ForecasterCls = MODELS.get(model_key)
    if not ForecasterCls:
        run.status = ForecastRun.Status.FAILED
        run.error_message = f'Unknown model: {model_key}'
        run.completed_at = timezone.now()
        run.save(update_fields=['status', 'error_message', 'completed_at'])
        return run

    failures = []

    for product_id, warehouse_id in pairs:
        try:
            df = build_demand_dataframe(product_id, warehouse_id, lookback_days=365)
            if df.empty or len(df) < 40:
                failures.append((product_id, warehouse_id, f'Insufficient history ({len(df)} rows)'))
                continue

            feat = create_features(df)
            test_days = min(30, max(7, len(feat) // 5))
            train, test = chronological_split(feat, test_days=test_days)

            metrics = evaluate_model(ForecasterCls(), train, test)
            for name, value in metrics.items():
                if value is None:
                    continue
                ModelMetric.objects.create(
                    forecast_run=run,
                    product_id=product_id,
                    metric_name=name,
                    metric_value=Decimal(str(value)),
                    evaluation_start=test['demand_date'].min().date(),
                    evaluation_end=test['demand_date'].max().date(),
                )

            model = ForecasterCls().fit(feat)
            preds = model.predict(horizon_days)

            last_date = df['demand_date'].max().date()
            for i, pred in enumerate(preds):
                forecast_date = last_date + timedelta(days=i + 1)
                DemandForecast.objects.create(
                    forecast_run=run,
                    product_id=product_id,
                    warehouse_id=warehouse_id,
                    forecast_date=forecast_date,
                    predicted_demand=Decimal(str(round(max(float(pred), 0.0), 3))),
                    lower_bound=Decimal(str(round(max(float(pred) * 0.8, 0.0), 3))),
                    upper_bound=Decimal(str(round(float(pred) * 1.2, 3))),
                    confidence_score=Decimal('80.00'),
                )
        except Exception as e:
            failures.append((product_id, warehouse_id, str(e)))

    run.status = ForecastRun.Status.COMPLETED
    run.completed_at = timezone.now()
    run.model_version = getattr(ForecasterCls, 'version', '1.0')
    if failures:
        run.error_message = f'{len(failures)} pairs failed: {failures[:3]}'
    run.save(update_fields=['status', 'completed_at', 'model_version', 'error_message'])

    return run