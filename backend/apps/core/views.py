from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.authentication.permissions import IsAdmin
from .models import SystemSetting
from .serializers import SystemSettingSerializer


class SystemSettingViewSet(viewsets.ModelViewSet):
    queryset = SystemSetting.objects.all()
    serializer_class = SystemSettingSerializer
    permission_classes = [IsAdmin]
    lookup_field = 'setting_key'

    @action(detail=False, methods=['post'], url_path='bulk-update')
    def bulk_update(self, request):
        data = request.data
        updated = []
        for key, value in data.items():
            setting, _ = SystemSetting.objects.update_or_create(
                setting_key=key,
                defaults={
                    'setting_value': str(value),
                    'updated_by': request.user,
                }
            )
            updated.append(SystemSettingSerializer(setting).data)
        return Response({'updated': updated}, status=status.HTTP_200_OK)