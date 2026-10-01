from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    DemandHistoryViewSet, ForecastRunViewSet,
    DemandForecastViewSet, ReorderRecommendationViewSet,
    ModelMetricViewSet,
)

router = DefaultRouter()
router.register(r'demand-history', DemandHistoryViewSet, basename='demand-history')
router.register(r'forecast-runs', ForecastRunViewSet, basename='forecast-run')
router.register(r'forecasts', DemandForecastViewSet, basename='forecast')
router.register(r'reorder-recommendations', ReorderRecommendationViewSet, basename='reorder-recommendation')
router.register(r'model-metrics', ModelMetricViewSet, basename='model-metric')

urlpatterns = [path('', include(router.urls))]