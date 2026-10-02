from django.contrib import admin
from django.urls import path, include
from drf_spectacular.views import (
    SpectacularAPIView, SpectacularSwaggerView, SpectacularRedocView
)

urlpatterns = [
    path('admin/', admin.site.urls),

    # Auth
    path('api/auth/', include('apps.authentication.urls')),

    # Master Data
    path('api/', include('apps.suppliers.urls')),
    path('api/', include('apps.products.urls')), 
    path('api/', include('apps.warehouses.urls')),
    # Inventory
    path('api/', include('apps.inventory.urls')), 
    # Purchases
    path('api/', include('apps.purchases.urls')), 
    # Sales
    path('api/', include('apps.sales.urls')),
    # Alerts
    path('api/', include('apps.alerts.urls')),
    # Forecasting
    path('api/', include('apps.forecasting.urls')),
    # Analytics
    path('api/', include('apps.analytics.urls')),      # ← ADD

    # Reports
    path('api/', include('apps.reports.urls')),        # ← ADD

    # API Schema / Docs
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
        # Core (settings)
    path('api/', include('apps.core.urls')),
]