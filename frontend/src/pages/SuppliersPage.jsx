import { useEffect, useState, useMemo } from 'react';
import { Plus, Search } from 'lucide-react';
import { suppliersApi } from '../api/endpoints';
import DataTable from '../components/DataTable';
import { useAuth } from '../context/AuthContext';
import SupplierFormModal from './suppliers/SupplierFormModal';

export default function SuppliersPage() {
  const { hasRole } = useAuth();
  const canEdit = hasRole('admin', 'purchase_manager');

  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [toast, setToast] = useState(null);

  const loadSuppliers = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await suppliersApi.list();
      const data = res.data.results ?? res.data;
      setSuppliers(data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load suppliers.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSuppliers();
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  const handleAdd = () => {
    setEditingSupplier(null);
    setModalOpen(true);
  };

  const handleEdit = (supplier) => {
    setEditingSupplier(supplier);
    setModalOpen(true);
  };

  const handleSaved = () => {
    setToast({ type: 'success', message: 'Supplier saved!' });
    loadSuppliers();
  };

  const filtered = useMemo(() => {
    return suppliers.filter((s) => {
      const matchesSearch =
        !search ||
        s.supplier_code?.toLowerCase().includes(search.toLowerCase()) ||
        s.supplier_name?.toLowerCase().includes(search.toLowerCase()) ||
        s.contact_person?.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = !statusFilter || s.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [suppliers, search, statusFilter]);

  const columns = [
    {
      key: 'supplier_code',
      label: 'Code',
      render: (row) => (
        <span className="font-mono text-xs text-slate-600">{row.supplier_code}</span>
      ),
    },
    {
      key: 'supplier_name',
      label: 'Supplier',
      render: (row) => (
        <div>
          <div className="font-medium text-slate-800">{row.supplier_name}</div>
          <div className="text-xs text-slate-500">{row.contact_person || '—'}</div>
        </div>
      ),
    },
    { key: 'phone', label: 'Phone', render: (row) => row.phone || '—' },
    { key: 'email', label: 'Email', render: (row) => row.email || '—' },
    { key: 'city', label: 'City', render: (row) => row.city || '—' },
    {
      key: 'status',
      label: 'Status',
      render: (row) => (
        <span
          className={`text-xs px-2 py-0.5 rounded ${
            row.status === 'active'
              ? 'bg-green-100 text-green-700'
              : 'bg-slate-100 text-slate-500'
          }`}
        >
          {row.status}
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
          <h1 className="text-2xl font-bold text-slate-900">Suppliers</h1>
          <p className="text-sm text-slate-500 mt-1">
            {filtered.length} supplier{filtered.length !== 1 ? 's' : ''}
          </p>
        </div>
        {canEdit && (
          <button className="btn-primary flex items-center gap-2" onClick={handleAdd}>
            <Plus size={16} /> Add Supplier
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
                placeholder="Search by code, name, or contact..."
                className="input pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div>
            <select
              className="input"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
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
        emptyMessage="No suppliers found."
      />

      <SupplierFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={handleSaved}
        supplier={editingSupplier}
      />

      {toast && (
        <div className="fixed top-6 right-6 z-50 rounded-md border bg-green-50 border-green-300 text-green-800 px-4 py-3 shadow-lg">
          {toast.message}
        </div>
      )}
    </div>
  );
}