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


from .models import Message
from .serializers import MessageSerializer, MessageListSerializer


class MessageViewSet(viewsets.ModelViewSet):
    """
    Inbox messages for the authenticated user.
    """
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Message.objects.filter(recipient=self.request.user).select_related('sender')

    def get_serializer_class(self):
        if self.action == 'list':
            return MessageListSerializer
        return MessageSerializer

    @action(detail=False, methods=['get'], url_path='unread-count')
    def unread_count(self, request):
        count = self.get_queryset().filter(is_read=False).count()
        return Response({'count': count})

    @action(detail=True, methods=['post'], url_path='mark-read')
    def mark_read(self, request, pk=None):
        msg = self.get_object()
        if not msg.is_read:
            msg.is_read = True
            msg.read_at = timezone.now()
            msg.save(update_fields=['is_read', 'read_at'])
        return Response(self.get_serializer(msg).data)

    @action(detail=True, methods=['post'], url_path='toggle-star')
    def toggle_star(self, request, pk=None):
        msg = self.get_object()
        msg.is_starred = not msg.is_starred
        msg.save(update_fields=['is_starred'])
        return Response({'is_starred': msg.is_starred})

    @action(detail=False, methods=['post'], url_path='mark-all-read')
    def mark_all_read(self, request):
        updated = self.get_queryset().filter(is_read=False).update(
            is_read=True, read_at=timezone.now(),
        )
        return Response({'marked_read': updated})

    @action(detail=False, methods=['post'], url_path='broadcast')
    def broadcast(self, request):
        """Admin-only: send a message to all users (or role-scoped)."""
        if request.user.role != 'admin':
            return Response({'detail': 'Admin access required.'}, status=status.HTTP_403_FORBIDDEN)

        subject = request.data.get('subject', '').strip()
        body = request.data.get('body', '').strip()
        roles = request.data.get('roles') or None  # optional list

        if not subject or not body:
            return Response(
                {'detail': 'Subject and body are required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        from apps.authentication.models import User
        recipients = User.objects.filter(is_active=True)
        if roles:
            recipients = recipients.filter(role__in=roles)

        messages = [
            Message(
                recipient=u,
                sender=request.user,
                subject=subject,
                body=body,
                category='broadcast',
                priority=request.data.get('priority', 'normal'),
            )
            for u in recipients
        ]
        Message.objects.bulk_create(messages)
        return Response({'sent': len(messages)}, status=status.HTTP_201_CREATED)
    from django.http import HttpResponse
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.views import APIView

from .csv_import import import_csv
from .csv_handlers import TEMPLATES, TEMPLATE_SAMPLES


class CSVImportView(APIView):
    """POST /api/import/<type>/  with file upload"""
    permission_classes = [IsAdmin]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, import_type):
        if 'file' not in request.FILES:
            return Response({'detail': 'No file uploaded.'}, status=status.HTTP_400_BAD_REQUEST)

        file_obj = request.FILES['file']
        if not file_obj.name.lower().endswith('.csv'):
            return Response({'detail': 'Only .csv files allowed.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            result = import_csv(
                handler_name=import_type,
                file_obj=file_obj,
                user=request.user,
            )
        except Exception as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)

        return Response(result, status=status.HTTP_201_CREATED)


class CSVTemplateView(APIView):
    """GET /api/import/<type>/template/  → download a sample CSV"""
    permission_classes = [IsAdmin]

    def get(self, request, import_type):
        columns = TEMPLATES.get(import_type)
        if not columns:
            return Response({'detail': f'Unknown import type: {import_type}'}, status=status.HTTP_404_NOT_FOUND)

        sample = TEMPLATE_SAMPLES.get(import_type, [])

        import csv
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="{import_type}_template.csv"'

        writer = csv.writer(response)
        writer.writerow(columns)
        if sample:
            writer.writerow(sample)
        return response