from rest_framework import viewsets, filters
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend

from apps.authentication.permissions import IsAdminOrInventoryManager
from .models import Category, Brand, Unit, Product, ProductSupplier
from .serializers import (
    CategorySerializer, BrandSerializer, UnitSerializer,
    ProductSerializer, ProductListSerializer,
    ProductSupplierReadSerializer, ProductSupplierWriteSerializer,
)


# ---------------- Category ----------------
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


# ---------------- Brand ----------------
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


# ---------------- Unit ----------------
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


# ---------------- Product ----------------
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


# ---------------- Product ↔ Supplier link ----------------
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