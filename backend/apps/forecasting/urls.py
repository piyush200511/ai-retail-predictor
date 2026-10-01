from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    DemandHistoryViewSet, ForecastRunViewSet,
    DemandForecastViewSet, ReorderRecommendationViewSet,
)

router = DefaultRouter()
router.register(r'demand-history', DemandHistoryViewSet, basename='demand-history')
router.register(r'forecast-runs', ForecastRunViewSet, basename='forecast-run')
router.register(r'forecasts', DemandForecastViewSet, basename='forecast')
router.register(r'reorder-recommendations', ReorderRecommendationViewSet, basename='reorder-recommendation')

urlpatterns = [path('', include(router.urls))]