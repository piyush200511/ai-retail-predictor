import { useEffect, useState, useMemo } from 'react';
import { Plus, Search, CheckCircle, Truck, XCircle, Undo2 } from 'lucide-react';
import { salesApi } from '../api/endpoints';
import DataTable from '../components/DataTable';
import { useAuth } from '../context/AuthContext';
import SalesOrderFormModal from './sales/SalesOrderFormModal';

export default function SalesPage() {
  const { hasRole } = useAuth();
  const canEdit = hasRole('admin', 'sales_manager');

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const loadOrders = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await salesApi.list();
      const data = res.data.results ?? res.data;
      setOrders(data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load sales orders.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  const handleCreate = () => setModalOpen(true);

  const handleSaved = () => {
    setToast({ type: 'success', message: 'Sales order created!' });
    loadOrders();
  };

  const doAction = async (id, fn, successMsg) => {
    setBusyId(id);
    try {
      await fn(id);
      setToast({ type: 'success', message: successMsg });
      await loadOrders();
    } catch (err) {
      const data = err.response?.data;
      const msg =
        typeof data === 'object'
          ? Object.entries(data).map(([k, v]) => `${k}: ${v}`).join(' | ')
          : 'Action failed.';
      setToast({ type: 'error', message: msg });
    } finally {
      setBusyId(null);
    }
  };

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      const matchesSearch =
        !search ||
        o.order_number?.toLowerCase().includes(search.toLowerCase()) ||
        o.customer_name?.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = !statusFilter || o.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [orders, search, statusFilter]);

  const statusBadge = (status) => {
    const colors = {
      draft: 'bg-slate-100 text-slate-700',
      confirmed: 'bg-blue-100 text-blue-700',
      completed: 'bg-green-100 text-green-700',
      cancelled: 'bg-red-100 text-red-700',
      returned: 'bg-amber-100 text-amber-800',
    };
    return (
      <span className={`text-xs px-2 py-0.5 rounded font-medium ${colors[status] || colors.draft}`}>
        {status}
      </span>
    );
  };

  const columns = [
    {
      key: 'order_number',
      label: 'Order #',
      render: (row) => (
        <span className="font-mono text-xs text-slate-700">{row.order_number}</span>
      ),
    },
    { key: 'order_date', label: 'Date' },
    {
      key: 'customer_name',
      label: 'Customer',
      render: (row) => row.customer_name || 'Walk-in',
    },
    { key: 'warehouse_code', label: 'Warehouse' },
    {
      key: 'total_amount',
      label: 'Total',
      render: (row) => `Rs. ${Number(row.total_amount).toFixed(2)}`,
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => statusBadge(row.status),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => {
        if (!canEdit) return null;
        const busy = busyId === row.sales_order_id;
        const btn = 'text-xs px-2 py-1 rounded border font-medium disabled:opacity-50';
        return (
          <div className="flex gap-1">
            {row.status === 'draft' && (
              <>
                <button
                  disabled={busy}
                  onClick={() => doAction(row.sales_order_id, salesApi.confirm, 'Order confirmed (stock reserved)')}
                  className={`${btn} bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100`}
                >
                  <CheckCircle size={12} className="inline" /> Confirm
                </button>
                <button
                  disabled={busy}
                  onClick={() => doAction(row.sales_order_id, salesApi.cancel, 'Order cancelled')}
                  className={`${btn} bg-red-50 border-red-200 text-red-700 hover:bg-red-100`}
                >
                  <XCircle size={12} className="inline" /> Cancel
                </button>
              </>
            )}
            {row.status === 'confirmed' && (
              <>
                <button
                  disabled={busy}
                  onClick={() => doAction(row.sales_order_id, salesApi.complete, 'Order completed (stock deducted)')}
                  className={`${btn} bg-green-50 border-green-200 text-green-700 hover:bg-green-100`}
                >
                  <Truck size={12} className="inline" /> Complete
                </button>
                <button
                  disabled={busy}
                  onClick={() => doAction(row.sales_order_id, salesApi.cancel, 'Order cancelled')}
                  className={`${btn} bg-red-50 border-red-200 text-red-700 hover:bg-red-100`}
                >
                  <XCircle size={12} className="inline" /> Cancel
                </button>
              </>
            )}
            {row.status === 'completed' && (
              <button
                disabled={busy}
                onClick={() => doAction(row.sales_order_id, salesApi.returnOrder, 'Order returned (stock restored)')}
                className={`${btn} bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100`}
              >
                <Undo2 size={12} className="inline" /> Return
              </button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Sales Orders</h1>
          <p className="text-sm text-slate-500 mt-1">
            {filtered.length} order{filtered.length !== 1 ? 's' : ''}
          </p>
        </div>
        {canEdit && (
          <button className="btn-primary flex items-center gap-2" onClick={handleCreate}>
            <Plus size={16} /> New Sales Order
          </button>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="md:col-span-2">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by order # or customer..."
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
            <option value="draft">Draft</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="returned">Returned</option>
          </select>
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
        emptyMessage="No sales orders yet. Click 'New Sales Order' to create one."
      />

      <SalesOrderFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={handleSaved}
      />

      {toast && (
        <div
          className={`fixed top-6 right-6 z-50 rounded-md border px-4 py-3 shadow-lg ${
            toast.type === 'error'
              ? 'bg-red-50 border-red-300 text-red-800'
              : 'bg-green-50 border-green-300 text-green-800'
          }`}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}