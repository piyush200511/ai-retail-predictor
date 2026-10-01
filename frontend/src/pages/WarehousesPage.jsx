import { useEffect, useState, useMemo } from 'react';
import { Plus, Search } from 'lucide-react';
import { warehousesApi } from '../api/endpoints';
import DataTable from '../components/DataTable';
import { useAuth } from '../context/AuthContext';
import WarehouseFormModal from './warehouses/WarehouseFormModal';

export default function WarehousesPage() {
  const { hasRole } = useAuth();
  const canEdit = hasRole('admin');

  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState(null);
  const [toast, setToast] = useState(null);

  const loadWarehouses = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await warehousesApi.list();
      const data = res.data.results ?? res.data;
      setWarehouses(data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load warehouses.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWarehouses();
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  const handleAdd = () => {
    setEditingWarehouse(null);
    setModalOpen(true);
  };

  const handleEdit = (wh) => {
    setEditingWarehouse(wh);
    setModalOpen(true);
  };

  const handleSaved = () => {
    setToast({ type: 'success', message: 'Warehouse saved!' });
    loadWarehouses();
  };

  const filtered = useMemo(() => {
    return warehouses.filter((w) => {
      if (!search) return true;
      const s = search.toLowerCase();
      return (
        w.warehouse_code?.toLowerCase().includes(s) ||
        w.warehouse_name?.toLowerCase().includes(s) ||
        w.city?.toLowerCase().includes(s)
      );
    });
  }, [warehouses, search]);

  const columns = [
    {
      key: 'warehouse_code',
      label: 'Code',
      render: (row) => (
        <span className="font-mono text-xs text-slate-600">
          {row.warehouse_code}
        </span>
      ),
    },
    {
      key: 'warehouse_name',
      label: 'Name',
      render: (row) => (
        <span className="font-medium text-slate-800">{row.warehouse_name}</span>
      ),
    },
    { key: 'city', label: 'City', render: (row) => row.city || '—' },
    { key: 'manager_name', label: 'Manager', render: (row) => row.manager_name || '—' },
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
          <h1 className="text-2xl font-bold text-slate-900">Warehouses</h1>
          <p className="text-sm text-slate-500 mt-1">
            {filtered.length} warehouse{filtered.length !== 1 ? 's' : ''}
          </p>
        </div>
        {canEdit && (
          <button className="btn-primary flex items-center gap-2" onClick={handleAdd}>
            <Plus size={16} /> Add Warehouse
          </button>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 mb-4">
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            placeholder="Search by code, name, or city..."
            className="input pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
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
        emptyMessage="No warehouses found."
      />

      <WarehouseFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={handleSaved}
        warehouse={editingWarehouse}
      />

      {toast && (
        <div className="fixed top-6 right-6 z-50 rounded-md border bg-green-50 border-green-300 text-green-800 px-4 py-3 shadow-lg">
          {toast.message}
        </div>
      )}
    </div>
  );
}