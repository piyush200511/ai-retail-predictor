import { useEffect, useState, useMemo } from 'react';
import { Plus, Search, Upload } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { warehousesApi } from '../api/endpoints';
import DataTable from '../components/DataTable';
import { useAuth } from '../context/AuthContext';
import WarehouseFormModal from './warehouses/WarehouseFormModal';

export default function WarehousesPage() {
  const { hasRole } = useAuth();
  const navigate = useNavigate();
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

  useEffect(() => { loadWarehouses(); }, []);

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
        <span className="font-mono text-xs text-slate-600 dark:text-slate-400">
          {row.warehouse_code}
        </span>
      ),
    },
    {
      key: 'warehouse_name',
      label: 'Name',
      render: (row) => (
        <span className="font-medium text-slate-800 dark:text-slate-100">{row.warehouse_name}</span>
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
              ? 'bg-green-100 dark:bg-green-950/50 text-green-700 dark:text-green-300'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
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
            className="text-xs px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
          >
            Edit
          </button>
        ) : null,
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Warehouses</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {filtered.length} warehouse{filtered.length !== 1 ? 's' : ''}
          </p>
        </div>
        {canEdit && (
          <div className="flex gap-2">
            <button
              className="btn-secondary flex items-center gap-2"
              onClick={() => navigate('/import')}
            >
              <Upload size={16} /> Import CSV
            </button>
            <button className="btn-primary flex items-center gap-2" onClick={handleAdd}>
              <Plus size={16} /> Add Warehouse
            </button>
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-lg shadow-card border border-slate-200 dark:border-slate-800 p-4 mb-4">
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
        <div className="mb-4 rounded-md bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 p-3 text-sm text-red-700 dark:text-red-300">
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
        <div className="fixed top-6 right-6 z-50 rounded-md border bg-green-50 dark:bg-green-950/60 border-green-300 dark:border-green-800 text-green-800 dark:text-green-200 px-4 py-3 shadow-lg">
          {toast.message}
        </div>
      )}
    </div>
  );
}