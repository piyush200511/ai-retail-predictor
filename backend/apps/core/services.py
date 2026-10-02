"""
Notification service — the ONLY place that creates notifications.

Usage:
    from apps.core.services import notify_roles
    notify_roles(
        roles=['inventory_manager', 'admin'],
        notification_type='low_stock',
        severity='warning',
        title='Low stock: Smartphone A',
        message='Only 5 units left at WH-DEL-01.',
        link='/alerts',
        metadata={'product_id': 1, 'warehouse_id': 2},
    )
"""
from .models import Notification
from apps.authentication.models import User


def notify_roles(
    *,
    roles,
    notification_type,
    title,
    message,
    severity='info',
    link=None,
    metadata=None,
):
    """Create a notification for every active user with one of the given roles."""
    users = User.objects.filter(role__in=roles, is_active=True)

    notifications = [
        Notification(
            user=user,
            notification_type=notification_type,
            severity=severity,
            title=title,
            message=message,
            link=link,
            metadata=metadata or {},
        )
        for user in users
    ]
    if notifications:
        Notification.objects.bulk_create(notifications)
    return len(notifications)


def notify_user(*, user, notification_type, title, message, severity='info', link=None, metadata=None):
    """Create a notification for a specific user."""
    return Notification.objects.create(
        user=user,
        notification_type=notification_type,
        severity=severity,
        title=title,
        message=message,
        link=link,
        metadata=metadata or {},
    )