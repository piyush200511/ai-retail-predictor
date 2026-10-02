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


from rest_framework import status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone

from .models import Notification
from .serializers import NotificationSerializer


class NotificationViewSet(viewsets.ModelViewSet):
    """
    Notifications scoped to the authenticated user.
    - list: only my notifications
    - mark-read: mark one as read
    - mark-all-read: mark all as read
    - unread-count: lightweight endpoint for badge
    """
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user)

    @action(detail=False, methods=['get'], url_path='unread-count')
    def unread_count(self, request):
        count = self.get_queryset().filter(is_read=False).count()
        return Response({'count': count})

    @action(detail=True, methods=['post'], url_path='mark-read')
    def mark_read(self, request, pk=None):
        notif = self.get_object()
        if not notif.is_read:
            notif.is_read = True
            notif.read_at = timezone.now()
            notif.save(update_fields=['is_read', 'read_at'])
        return Response(NotificationSerializer(notif).data)

    @action(detail=False, methods=['post'], url_path='mark-all-read')
    def mark_all_read(self, request):
        updated = self.get_queryset().filter(is_read=False).update(
            is_read=True, read_at=timezone.now(),
        )
        return Response({'marked_read': updated})

    @action(detail=False, methods=['post'], url_path='clear-all')
    def clear_all(self, request):
        deleted, _ = self.get_queryset().delete()
        return Response({'deleted': deleted})