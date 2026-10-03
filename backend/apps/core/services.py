"""
Notification service — the ONLY place that creates notifications.

Two flavors:
1. Event notifications (low stock, PO received, etc.) — explicit notify_roles calls
2. Activity notifications (product added, customer deleted) — via notify_activity()
"""
from .models import Notification
from apps.authentication.models import User


def notify_roles(*, roles, notification_type, title, message, severity='info', link=None, metadata=None):
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


# ============================================================
# ACTIVITY NOTIFICATIONS
# ============================================================

# Which roles get notified for which entity
ACTIVITY_ROLES = {
    'product':   ['admin', 'analyst', 'inventory_manager'],
    'customer':  ['admin', 'analyst', 'sales_manager'],
    'supplier':  ['admin', 'analyst', 'purchase_manager', 'inventory_manager'],
    'warehouse': ['admin', 'analyst', 'inventory_manager'],
    'sale':      ['admin', 'analyst', 'sales_manager'],
    'purchase':  ['admin', 'analyst', 'purchase_manager', 'inventory_manager'],
    'transfer':  ['admin', 'analyst', 'inventory_manager'],
    'import':    ['admin', 'analyst'],
}

ENTITY_LINKS = {
    'product':   '/products',
    'customer':  '/customers',
    'supplier':  '/suppliers',
    'warehouse': '/warehouses',
    'sale':      '/sales',
    'purchase':  '/purchases',
    'transfer':  '/transfers',
    'import':    '/import',
}


def _activity_enabled():
    """Global toggle — reads SystemSetting 'notify_on_activity'. Default: True."""
    try:
        from .models import SystemSetting
        s = SystemSetting.objects.filter(setting_key='notify_on_activity').first()
        if not s:
            return True
        return str(s.setting_value).lower() in ('true', '1', 'yes')
    except Exception:
        return True


def notify_activity(
    *,
    entity,
    action,
    actor=None,
    title,
    message,
    severity='info',
    link=None,
    metadata=None,
):
    """
    Emit an activity notification.

    entity: 'product' | 'customer' | 'supplier' | 'warehouse' | 'sale' | 'purchase' | 'transfer' | 'import'
    action: 'create' | 'delete' | 'complete' | 'dispatch' | 'receive' | 'import'
    actor:  the user who performed the action (or None)
    """
    if not _activity_enabled():
        return 0

    roles = list(ACTIVITY_ROLES.get(entity, ['admin']))

    # Always include admin
    if 'admin' not in roles:
        roles.append('admin')

    # Always include actor's own role so they see their own actions
    if actor and actor.role and actor.role not in roles:
        roles.append(actor.role)

    notif_type = {
        'create':   'activity_create',
        'delete':   'activity_delete',
        'import':   'bulk_import',
        'complete': 'order_completed',
        'dispatch': 'transfer_update',
        'receive':  'transfer_update',
    }.get(action, 'system')

    return notify_roles(
        roles=roles,
        notification_type=notif_type,
        severity=severity,
        title=title,
        message=message,
        link=link or ENTITY_LINKS.get(entity),
        metadata=metadata or {'entity': entity, 'action': action},
    )