import { useEffect, useState, useMemo } from 'react';
import { Plus, Search } from 'lucide-react';
import { productsApi, categoriesApi } from '../api/endpoints';
import DataTable from '../components/DataTable';
import { useAuth } from '../context/AuthContext';
import ProductFormModal from './products/ProductFormModal';

export default function ProductsPage() {
  const { hasRole } = useAuth();
  const canEdit = hasRole('admin', 'inventory_manager');

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [toast, setToast] = useState(null);

  const loadProducts = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await productsApi.list();
      const data = res.data.results ?? res.data;
      setProducts(data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load products.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
    categoriesApi
      .list()
      .then((res) => setCategories(res.data.results ?? res.data))
      .catch(() => setCategories([]));
  }, []);

  // Auto-clear toast
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  const handleAdd = () => {
    setEditingProduct(null);
    setModalOpen(true);
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setModalOpen(true);
  };

  const handleSaved = () => {
    setToast({ type: 'success', message: 'Product saved!' });
    loadProducts();
  };

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        !search ||
        p.sku?.toLowerCase().includes(search.toLowerCase()) ||
        p.product_name?.toLowerCase().includes(search.toLowerCase());
      const matchesCategory =
        !categoryFilter || p.category_name === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [products, search, categoryFilter]);

  const columns = [
    {
      key: 'sku',
      label: 'SKU',
      render: (row) => (
        <span className="font-mono text-xs text-slate-600">{row.sku}</span>
      ),
    },
    {
      key: 'product_name',
      label: 'Product',
      render: (row) => (
        <div>
          <div className="font-medium text-slate-800">{row.product_name}</div>
          <div className="text-xs text-slate-500">{row.brand_name || '—'}</div>
        </div>
      ),
    },
    {
      key: 'category_name',
      label: 'Category',
      render: (row) => row.category_name || '—',
    },
    {
      key: 'cost_price',
      label: 'Cost',
      render: (row) => `Rs. ${Number(row.cost_price).toFixed(2)}`,
    },
    {
      key: 'selling_price',
      label: 'Selling',
      render: (row) => `Rs. ${Number(row.selling_price).toFixed(2)}`,
    },
    {
      key: 'reorder_level',
      label: 'Reorder Lvl',
      render: (row) => Number(row.reorder_level).toFixed(0),
    },
    {
      key: 'is_active',
      label: 'Status',
      render: (row) => (
        <span
          className={`text-xs px-2 py-0.5 rounded ${
            row.is_active
              ? 'bg-green-100 text-green-700'
              : 'bg-slate-100 text-slate-500'
          }`}
        >
          {row.is_active ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) =>
        canEdit ? (
          <button
            onClick={() => handleEdit(row)}
            className="text-xs px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700"
          >
            Edit
          </button>
        ) : null,
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Products</h1>
          <p className="text-sm text-slate-500 mt-1">
            {filtered.length} product{filtered.length !== 1 ? 's' : ''}
          </p>
        </div>
        {canEdit && (
          <button
            className="btn-primary flex items-center gap-2"
            onClick={handleAdd}
          >
            <Plus size={16} /> Add Product
          </button>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="md:col-span-2">
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                placeholder="Search by SKU or product name..."
                className="input pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div>
            <select
              className="input"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c.category_id} value={c.category_name}>
                  {c.category_name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <DataTable
        columns={columns}
        rows={filtered}
        loading={loading}
        emptyMessage={
          products.length === 0
            ? 'No products yet. Click "Add Product" to create one.'
            : 'No products match your filters.'
        }
      />

      <ProductFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={handleSaved}
        product={editingProduct}
      />

      {toast && (
        <div className="fixed top-6 right-6 z-50 rounded-md border bg-green-50 border-green-300 text-green-800 px-4 py-3 shadow-lg">
          {toast.message}
        </div>
      )}
    </div>
  );
}