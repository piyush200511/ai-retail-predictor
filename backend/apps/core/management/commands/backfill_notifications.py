"""
Backfill notifications from existing open alerts.

Usage:
    python manage.py backfill_notifications
"""
from django.core.management.base import BaseCommand
from django.db.models import Count

from apps.alerts.models import InventoryAlert
from apps.core.models import Notification
from apps.core.services import notify_roles


class Command(BaseCommand):
    help = 'Create notifications for all currently open alerts'

    def handle(self, *args, **options):
        self.stdout.write('Backfilling notifications from open alerts...')

        open_alerts = InventoryAlert.objects.filter(status='open').order_by('-created_at')
        self.stdout.write(f'  Found {open_alerts.count()} open alerts')

        # Limit to most recent 20 to avoid spam
        alerts_to_process = list(open_alerts[:20])

        created = 0
        for alert in alerts_to_process:
            if alert.alert_type in ('stock_out', 'low_stock'):
                roles = ['inventory_manager', 'admin']
            elif alert.alert_type == 'overstock':
                roles = ['inventory_manager']
            else:
                roles = ['inventory_manager', 'analyst', 'admin']

            notif_type = {
                'low_stock': 'low_stock',
                'stock_out': 'stock_out_predicted',
                'overstock': 'low_stock',
                'unusual_demand': 'low_stock',
            }.get(alert.alert_type, 'low_stock')

            count = notify_roles(
                roles=roles,
                notification_type=notif_type,
                severity=alert.severity,
                title=f'{alert.alert_type.replace("_", " ").title()}: {alert.product.sku}',
                message=alert.message,
                link='/alerts',
                metadata={
                    'alert_id': alert.alert_id,
                    'product_id': alert.product_id,
                    'warehouse_id': alert.warehouse_id,
                },
            )
            created += count

        self.stdout.write(self.style.SUCCESS(f'✅ Created {created} notifications'))

        # Summary
        self.stdout.write('')
        self.stdout.write('Notifications by user:')
        rows = (
            Notification.objects
            .values('user__email', 'user__role')
            .annotate(c=Count('notification_id'))
            .order_by('-c')
        )
        for row in rows:
            self.stdout.write(
                f"  {row['user__email']:30s} ({row['user__role']}): {row['c']}"
            )

        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS('Done. Refresh the browser and click the bell.'))