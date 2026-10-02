"""
Seed welcome + role-specific tip messages for all users.

Usage:
    python manage.py seed_messages
    python manage.py seed_messages --reset
"""
from django.core.management.base import BaseCommand
from apps.authentication.models import User
from apps.core.models import Message


ROLE_DESCRIPTIONS = {
    'admin': 'an Administrator with full system access',
    'analyst': 'an Analyst focused on data & AI insights',
    'inventory_manager': 'an Inventory Manager handling stock & purchases',
    'purchase_manager': 'a Purchase Manager handling suppliers & POs',
    'sales_manager': 'a Sales Manager handling orders & customers',
}


# ---------- Tips per role ----------
COMMON_TIPS = [
    {
        'subject': '⚡ Tip: Quick Demo Sign-in',
        'body': (
            "Want to switch roles instantly?\n\n"
            "Logout and use the 'Quick demo sign-in' dropdown on the login page "
            "to jump into any role without typing passwords.\n\n"
            "Perfect for testing permissions and comparing dashboards."
        ),
        'category': 'tip',
    },
    {
        'subject': '🌗 Tip: Dark Mode',
        'body': (
            "Click the sun/moon icon in the topbar to toggle between light and dark mode.\n\n"
            "Your preference is saved automatically. Try it out!"
        ),
        'category': 'tip',
    },
]


ROLE_TIPS = {
    'admin': [
        {
            'subject': '👥 Tip: Manage Demo Users',
            'body': (
                "You have 5 demo users, one for each role:\n\n"
                "• admin@example.com — full access\n"
                "• analyst@example.com — insights & AI\n"
                "• inventory@example.com — stock & purchases\n"
                "• purchase@example.com — suppliers & POs\n"
                "• sales@example.com — orders & customers\n\n"
                "Password for all: Demo@123\n\n"
                "Use them to test role-based access control."
            ),
            'category': 'tip',
            'link': '/settings',
        },
        {
            'subject': '📢 Tip: Broadcast Messages',
            'body': (
                "As an admin, you can send messages to all users or specific roles.\n\n"
                "Use the API endpoint POST /api/messages/broadcast/ with:\n"
                "  • subject\n"
                "  • body\n"
                "  • roles (optional list)\n\n"
                "Great for announcements, reminders, or policy updates."
            ),
            'category': 'tip',
        },
    ],
    'analyst': [
        {
            'subject': '📊 Tip: Compare Forecast Models',
            'body': (
                "Did you know we support 4 forecasting models?\n\n"
                "• Moving Average — baseline\n"
                "• Exponential Smoothing — trend + seasonality\n"
                "• Random Forest — most accurate\n"
                "• Gradient Boosting — advanced\n\n"
                "Run each one and compare MAE, RMSE, and MAPE in the Runs tab."
            ),
            'category': 'tip',
            'link': '/forecasts',
        },
        {
            'subject': '📈 Tip: Export Analytics',
            'body': (
                "All data is exportable to CSV from the Reports page.\n\n"
                "You can export:\n"
                "• Sales reports\n"
                "• Inventory snapshots\n"
                "• Stock movements\n"
                "• Forecast predictions\n\n"
                "Open in Excel or Sheets for deeper analysis."
            ),
            'category': 'tip',
            'link': '/reports',
        },
    ],
    'inventory_manager': [
        {
            'subject': '📦 Tip: Monitor Stock Movements',
            'body': (
                "Every stock change is logged — sales, purchases, adjustments, transfers.\n\n"
                "Go to Inventory → check the movements list to see:\n"
                "• What changed\n"
                "• When\n"
                "• By whom\n"
                "• Reference (order, PO, transfer)\n\n"
                "Use this for audits and troubleshooting."
            ),
            'category': 'tip',
            'link': '/inventory',
        },
        {
            'subject': '⚠️ Tip: Trust the Alerts',
            'body': (
                "Alerts fire automatically when:\n\n"
                "🔴 Stock hits 0 — critical\n"
                "🟡 Stock ≤ reorder level — warning\n"
                "🟠 Stock > 3× reorder level — overstock\n\n"
                "Acknowledge alerts once you've handled them.\n"
                "Resolved alerts disappear from the dashboard feed."
            ),
            'category': 'tip',
            'link': '/alerts',
        },
    ],
    'purchase_manager': [
        {
            'subject': '🛒 Tip: Purchase Order Workflow',
            'body': (
                "Every PO follows this flow:\n\n"
                "1. Draft — create with items\n"
                "2. Submit — for approval\n"
                "3. Approve — ready to receive\n"
                "4. Receive — goods arrive, stock increases\n\n"
                "Partial receipts are supported. If some items arrive later, "
                "the PO stays in 'partially_received' state."
            ),
            'category': 'tip',
            'link': '/purchases',
        },
        {
            'subject': '🏢 Tip: Supplier Performance',
            'body': (
                "Track supplier reliability by watching:\n\n"
                "• On-time delivery (compare expected_date vs received_date)\n"
                "• Quality (accepted vs rejected quantities)\n"
                "• Pricing consistency\n\n"
                "Good suppliers = fewer stock-outs = happier customers."
            ),
            'category': 'tip',
        },
    ],
    'sales_manager': [
        {
            'subject': '💰 Tip: Sales Order Workflow',
            'body': (
                "Every sale goes through 3 stages:\n\n"
                "1. Draft — create with items\n"
                "2. Confirm — reserves stock (no deduction yet)\n"
                "3. Complete — deducts stock + records sale\n\n"
                "Reserved stock prevents overselling.\n"
                "If a customer cancels, release the reservation via Cancel."
            ),
            'category': 'tip',
            'link': '/sales',
        },
        {
            'subject': '📈 Tip: Track Top Products',
            'body': (
                "Your Analytics dashboard shows:\n\n"
                "• Top products by revenue\n"
                "• Sales trend over 30 days\n"
                "• Category contribution (donut chart)\n\n"
                "Use this to identify best-sellers and stock accordingly.\n"
                "Share with purchase team for smarter ordering."
            ),
            'category': 'tip',
            'link': '/analytics',
        },
    ],
}


WELCOME_TEMPLATE = {
    'subject': 'Welcome to AI Retail Predictor 🎉',
    'body': (
        "Hi {name},\n\n"
        "Welcome to AI Retail Predictor! You're signed in as {role}.\n\n"
        "Here's what you can do at a glance:\n"
        "{role_features}\n\n"
        "We've sent you {tip_count} tips based on your role to help you get started.\n\n"
        "Pro tip: Press the sun/moon icon in the topbar to try dark mode.\n\n"
        "— The AI Retail Team"
    ),
    'category': 'welcome',
    'priority': 'high',
    'link': '/dashboard',
}

ROLE_FEATURES = {
    'admin': '• Manage all modules\n• Configure settings\n• Monitor alerts\n• Broadcast messages',
    'analyst': '• Run AI forecasts\n• Analyze sales trends\n• Export reports\n• Compare models',
    'inventory_manager': '• Adjust stock\n• Receive purchases\n• Track movements\n• Respond to alerts',
    'purchase_manager': '• Create POs\n• Manage suppliers\n• Receive goods\n• Track performance',
    'sales_manager': '• Create sales orders\n• Manage customers\n• View sales analytics\n• Track top products',
}


class Command(BaseCommand):
    help = 'Seed welcome + role-specific tips for all users'

    def add_arguments(self, parser):
        parser.add_argument('--reset', action='store_true', help='Clear existing messages first')

    def handle(self, *args, **options):
        if options['reset']:
            count = Message.objects.all().delete()
            self.stdout.write(self.style.WARNING(f'Cleared {count} existing messages'))

        users = User.objects.filter(is_active=True)
        self.stdout.write(f'Seeding role-specific messages for {users.count()} users...')

        total = 0
        for user in users:
            role_desc = ROLE_DESCRIPTIONS.get(user.role, user.role)
            role_features = ROLE_FEATURES.get(user.role, '• Explore your dashboard')
            role_specific_tips = ROLE_TIPS.get(user.role, [])

            # Welcome (personalized)
            Message.objects.create(
                recipient=user,
                subject=WELCOME_TEMPLATE['subject'],
                body=WELCOME_TEMPLATE['body'].format(
                    name=user.name,
                    role=role_desc,
                    role_features=role_features,
                    tip_count=len(COMMON_TIPS) + len(role_specific_tips),
                ),
                category=WELCOME_TEMPLATE['category'],
                priority=WELCOME_TEMPLATE['priority'],
                link=WELCOME_TEMPLATE.get('link'),
            )
            total += 1

            # Role-specific tips (2)
            for tip in role_specific_tips:
                Message.objects.create(
                    recipient=user,
                    subject=tip['subject'],
                    body=tip['body'],
                    category=tip['category'],
                    priority=tip.get('priority', 'normal'),
                    link=tip.get('link'),
                )
                total += 1

            # Common tips (2)
            for tip in COMMON_TIPS:
                Message.objects.create(
                    recipient=user,
                    subject=tip['subject'],
                    body=tip['body'],
                    category=tip['category'],
                    priority=tip.get('priority', 'normal'),
                    link=tip.get('link'),
                )
                total += 1

        self.stdout.write(self.style.SUCCESS(f'✅ Created {total} messages'))
        self.stdout.write('')
        self.stdout.write('Summary:')
        for user in users:
            user_count = Message.objects.filter(recipient=user).count()
            self.stdout.write(
                f"  {user.email:30s} ({user.role:20s}) → {user_count} messages"
            )
        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS('Refresh the browser and open the Inbox!'))