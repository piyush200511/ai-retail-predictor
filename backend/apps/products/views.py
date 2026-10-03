from rest_framework import viewsets, filters
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend

from apps.authentication.permissions import IsAdminOrInventoryManager
from apps.core.services import notify_activity
from .models import Category, Brand, Unit, Product, ProductSupplier
from .serializers import (
    CategorySerializer, BrandSerializer, UnitSerializer,
    ProductSerializer, ProductListSerializer,
    ProductSupplierReadSerializer, ProductSupplierWriteSerializer,
)


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['is_active']
    search_fields = ['category_name']
    ordering_fields = ['category_name', 'created_at']

    def get_permissions(self):
        if self.action in ('create', 'update', 'partial_update', 'destroy'):
            return [IsAdminOrInventoryManager()]
        return [IsAuthenticated()]


class BrandViewSet(viewsets.ModelViewSet):
    queryset = Brand.objects.all()
    serializer_class = BrandSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['is_active']
    search_fields = ['brand_name']
    ordering_fields = ['brand_name', 'created_at']

    def get_permissions(self):
        if self.action in ('create', 'update', 'partial_update', 'destroy'):
            return [IsAdminOrInventoryManager()]
        return [IsAuthenticated()]


class UnitViewSet(viewsets.ModelViewSet):
    queryset = Unit.objects.all()
    serializer_class = UnitSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['unit_name', 'short_code']
    ordering_fields = ['unit_name']

    def get_permissions(self):
        if self.action in ('create', 'update', 'partial_update', 'destroy'):
            return [IsAdminOrInventoryManager()]
        return [IsAuthenticated()]


class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.select_related('category', 'brand', 'unit').all()
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category', 'brand', 'unit', 'is_active']
    search_fields = ['sku', 'product_name']
    ordering_fields = ['product_name', 'sku', 'selling_price', 'created_at']
    ordering = ['product_name']

    def get_serializer_class(self):
        if self.action == 'list':
            return ProductListSerializer
        return ProductSerializer

    def get_permissions(self):
        if self.action in ('create', 'update', 'partial_update', 'destroy'):
            return [IsAdminOrInventoryManager()]
        return [IsAuthenticated()]

    def perform_create(self, serializer):
        product = serializer.save()
        try:
            notify_activity(
                entity='product',
                action='create',
                actor=self.request.user,
                title=f'New product: {product.sku}',
                message=f'{product.product_name} was added by {self.request.user.name}.',
                metadata={'product_id': product.product_id},
            )
        except Exception:
            pass

    def perform_destroy(self, instance):
        sku, name = instance.sku, instance.product_name
        try:
            notify_activity(
                entity='product',
                action='delete',
                actor=self.request.user,
                title=f'Product deleted: {sku}',
                message=f'{name} was removed by {self.request.user.name}.',
                severity='warning',
            )
        except Exception:
            pass
        instance.delete()


class ProductSupplierViewSet(viewsets.ModelViewSet):
    queryset = ProductSupplier.objects.select_related('product', 'supplier').all()
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['product', 'supplier']

    def get_serializer_class(self):
        if self.action in ('create', 'update', 'partial_update'):
            return ProductSupplierWriteSerializer
        return ProductSupplierReadSerializer

    def get_permissions(self):
        if self.action in ('create', 'update', 'partial_update', 'destroy'):
            return [IsAdminOrInventoryManager()]
        return [IsAuthenticated()]