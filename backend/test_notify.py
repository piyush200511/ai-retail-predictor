import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.core.models import Notification
from apps.authentication.models import User
from apps.core.services import notify_activity
from django.utils import timezone

print("=" * 60)
print("NOTIFICATION DIAGNOSTIC")
print("=" * 60)

print(f"\nNow: {timezone.now()}")
print(f"Total notifications in DB: {Notification.objects.count()}")

# Who has notifications
print("\nNotifications by user:")
for u in User.objects.all():
    count = Notification.objects.filter(user=u).count()
    print(f"  {u.email:35s} ({u.role:20s}): {count}")

# Latest 5
print("\nLatest 5 notifications (by id):")
for n in Notification.objects.order_by('-notification_id')[:5]:
    print(f"  id={n.notification_id} | {n.title} | user={n.user.email} | {n.created_at}")

# Test creating a notification
print("\n" + "=" * 60)
print("TESTING NOTIFICATION CREATION")
print("=" * 60)

admin = User.objects.filter(email='admin@example.com').first()
print(f"\nAdmin user: {admin}")

before_count = Notification.objects.filter(user=admin).count()
print(f"Admin notifications BEFORE: {before_count}")

# Direct call
try:
    count = notify_activity(
        entity='product',
        action='create',
        actor=admin,
        title='DIAGNOSTIC: Manual test notification',
        message='If you see this in the bell, the system works.',
    )
    print(f"notify_activity returned: {count}")
except Exception as e:
    import traceback
    print(f"ERROR: {e}")
    traceback.print_exc()

after_count = Notification.objects.filter(user=admin).count()
print(f"Admin notifications AFTER: {after_count}")

print("\n" + "=" * 60)
print("DONE. Now check the bell in the browser.")
print("=" * 60)