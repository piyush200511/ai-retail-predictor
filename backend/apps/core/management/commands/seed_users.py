"""
Seed demo users — one per role, with same password for easy switching.

Usage:
    python manage.py seed_users
"""
from django.core.management.base import BaseCommand
from apps.authentication.models import User


DEMO_USERS = [
    {
        'email': 'admin@example.com',
        'name': 'Admin',
        'role': 'admin',
        'phone': '+91 90000 00001',
    },
    {
        'email': 'analyst@example.com',
        'name': 'Arjun Patel',
        'role': 'analyst',
        'phone': '+91 90000 00002',
    },
    {
        'email': 'inventory@example.com',
        'name': 'Priya Sharma',
        'role': 'inventory_manager',
        'phone': '+91 90000 00003',
    },
    {
        'email': 'purchase@example.com',
        'name': 'Rahul Verma',
        'role': 'purchase_manager',
        'phone': '+91 90000 00004',
    },
    {
        'email': 'sales@example.com',
        'name': 'Sneha Iyer',
        'role': 'sales_manager',
        'phone': '+91 90000 00005',
    },
]

PASSWORD = 'Demo@123'


class Command(BaseCommand):
    help = 'Create one demo user per role'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Creating demo users...'))

        for u in DEMO_USERS:
            user, created = User.objects.get_or_create(
                email=u['email'],
                defaults={
                    'name': u['name'],
                    'role': u['role'],
                    'phone': u.get('phone', ''),
                    'is_active': True,
                    'is_staff': u['role'] == 'admin',
                    'is_superuser': u['role'] == 'admin',
                },
            )

            # Always reset password so switching works
            user.set_password(PASSWORD)
            user.save()

            status = '✓ Created' if created else '↻ Updated'
            self.stdout.write(f'  {status}: {u["email"]:30s} ({u["role"]})')

        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS('═' * 60))
        self.stdout.write(self.style.SUCCESS('✅ DEMO USERS READY'))
        self.stdout.write(self.style.SUCCESS('═' * 60))
        self.stdout.write(f'   Password for ALL users: {PASSWORD}')
        self.stdout.write('')
        self.stdout.write('   Roles created:')
        for u in DEMO_USERS:
            self.stdout.write(f'   • {u["role"]:20s} → {u["email"]}')
        self.stdout.write(self.style.SUCCESS('═' * 60))