from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.authentication.permissions import IsAdmin, IsAnalystOrAdmin
from .models import (
    DemandHistoryDaily, ForecastRun, DemandForecast, ReorderRecommendation,ModelMetric,
)
from .serializers import (
    DemandHistorySerializer, ForecastRunSerializer,
    DemandForecastSerializer, ReorderRecommendationSerializer,
    StartForecastSerializer,ModelMetricSerializer,
)
from .services import rebuild_demand_history, generate_reorder_recommendations
from ml_engine.pipelines.forecast_runner import run_forecast_for_pairs


class DemandHistoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = DemandHistoryDaily.objects.select_related('product', 'warehouse').all()
    serializer_class = DemandHistorySerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['product', 'warehouse', 'demand_date']
    ordering_fields = ['demand_date', 'net_demand']
    ordering = ['-demand_date']
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['post'], url_path='rebuild')
    def rebuild(self, request):
        if request.user.role not in ('admin', 'analyst'):
            return Response({'detail': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)
        result = rebuild_demand_history()
        return Response(result, status=status.HTTP_200_OK)


class ForecastRunViewSet(viewsets.ModelViewSet):
    queryset = ForecastRun.objects.select_related('created_by').all()
    serializer_class = ForecastRunSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['status', 'model_name']
    ordering_fields = ['created_at']
    ordering = ['-created_at']

    def get_permissions(self):
        if self.action in ('create', 'start'):
            return [IsAnalystOrAdmin()]
        return [IsAuthenticated()]

    @action(detail=False, methods=['post'], url_path='start')
    def start(self, request):
        ser = StartForecastSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        data = ser.validated_data

        run = ForecastRun.objects.create(
            run_name=data['run_name'],
            model_name=data['model_name'],
            forecast_horizon_days=data['forecast_horizon_days'],
            training_start_date=data.get('training_start_date'),
            training_end_date=data.get('training_end_date'),
            created_by=request.user,
        )

        pairs = list(set(
            DemandHistoryDaily.objects
            .values_list('product_id', 'warehouse_id')
            .distinct()
        ))
        if not pairs:
            return Response(
                {'detail': 'No demand history. Rebuild demand history first.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        run = run_forecast_for_pairs(
            run=run, model_key=data['model_name'],
            pairs=pairs, horizon_days=data['forecast_horizon_days'],
        )

        try:
            generate_reorder_recommendations(forecast_run=run)
        except Exception:
            pass

        return Response(ForecastRunSerializer(run).data, status=status.HTTP_201_CREATED)


class DemandForecastViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = DemandForecast.objects.select_related('product', 'warehouse').all()
    serializer_class = DemandForecastSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['forecast_run', 'product', 'warehouse']
    ordering_fields = ['forecast_date', 'predicted_demand']
    ordering = ['forecast_date']
    permission_classes = [IsAuthenticated]


class ReorderRecommendationViewSet(viewsets.ModelViewSet):
    queryset = ReorderRecommendation.objects.select_related('product', 'warehouse').all()
    serializer_class = ReorderRecommendationSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['urgency', 'status', 'product', 'warehouse', 'forecast_run']
    ordering_fields = ['created_at', 'urgency', 'suggested_order_quantity']
    ordering = ['-created_at']

    def get_permissions(self):
        if self.action in ('update', 'partial_update', 'destroy'):
            return [IsAdmin()]
        return [IsAuthenticated()]

    @action(detail=True, methods=['post'])
    def dismiss(self, request, pk=None):
        rec = self.get_object()
        rec.status = ReorderRecommendation.Status.DISMISSED
        rec.save(update_fields=['status'])
        return Response(self.get_serializer(rec).data)

    @action(detail=True, methods=['post'])
    def review(self, request, pk=None):
        rec = self.get_object()
        rec.status = ReorderRecommendation.Status.REVIEWED
        rec.save(update_fields=['status'])
        return Response(self.get_serializer(rec).data)
class ModelMetricViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = ModelMetric.objects.all()
    serializer_class = ModelMetricSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['forecast_run', 'metric_name', 'product']
    permission_classes = [IsAuthenticated]