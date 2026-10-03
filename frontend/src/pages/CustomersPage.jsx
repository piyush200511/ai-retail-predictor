import { useEffect, useState, useMemo } from 'react';
import { Plus, Search, Users, Upload } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { salesApi } from '../api/endpoints';
import DataTable from '../components/DataTable';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import CustomerFormModal from './sales/CustomerFormModal';

export default function CustomersPage() {
  const { hasRole } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const canEdit = hasRole('admin', 'sales_manager');

  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const res = await salesApi.customers();
      setCustomers(res.data.results ?? res.data);
    } catch {
      toast.error('Failed to load customers.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadCustomers(); }, []);

  const filtered = useMemo(() => {
    return customers.filter((c) => {
      const s = search.toLowerCase();
      const matchesSearch = !search ||
        c.customer_code?.toLowerCase().includes(s) ||
        c.customer_name?.toLowerCase().includes(s) ||
        c.email?.toLowerCase().includes(s) ||
        c.phone?.includes(search);
      const matchesStatus = !statusFilter || String(c.is_active) === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [customers, search, statusFilter]);

  const columns = [
    {
      key: 'customer_code',
      label: 'Code',
      render: (r) => <span className="font-mono text-xs text-slate-600 dark:text-slate-400">{r.customer_code}</span>,
    },
    {
      key: 'customer_name',
      label: 'Customer',
      render: (r) => (
        <div>
          <div className="font-medium text-slate-800 dark:text-slate-100">{r.customer_name}</div>
          <div className="text-xs text-slate-500 dark:text-slate-400">{r.email || '—'}</div>
        </div>
      ),
    },
    { key: 'phone', label: 'Phone', render: (r) => r.phone || '—' },
    { key: 'city', label: 'City', render: (r) => r.city || '—' },
    {
      key: 'is_active',
      label: 'Status',
      render: (r) => (
        <span className={`text-xs px-2 py-0.5 rounded ${
          r.is_active
            ? 'bg-green-100 dark:bg-green-950/50 text-green-700 dark:text-green-300'
            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
        }`}>
          {r.is_active ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) =>
        canEdit ? (
          <button
            onClick={() => { setEditing(row); setModalOpen(true); }}
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
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Users size={22} className="text-teal-600 dark:text-teal-400" />
            Customers
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {filtered.length} customer{filtered.length !== 1 ? 's' : ''}
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
            <button
              className="btn-primary flex items-center gap-2"
              onClick={() => { setEditing(null); setModalOpen(true); }}
            >
              <Plus size={16} /> Add Customer
            </button>
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-lg shadow-card border border-slate-200 dark:border-slate-800 p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="md:col-span-2">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by code, name, email, phone..."
                className="input pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <select
            className="input"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All statuses</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>
      </div>

      <DataTable
        columns={columns}
        rows={filtered}
        loading={loading}
        emptyMessage="No customers yet. Click 'Add Customer' to create one."
      />

      <CustomerFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={() => { toast.success('Customer saved!'); loadCustomers(); }}
        customer={editing}
      />
    </div>
  );
}