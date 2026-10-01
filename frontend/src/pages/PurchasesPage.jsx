import { useEffect, useState, useMemo } from 'react';
import { Plus, Search, CheckCircle, ThumbsUp, PackageCheck, XCircle } from 'lucide-react';
import { purchasesApi } from '../api/endpoints';
import DataTable from '../components/DataTable';
import { useAuth } from '../context/AuthContext';
import PurchaseOrderFormModal from './purchases/PurchaseOrderFormModal';
import ReceiveGoodsModal from './purchases/ReceiveGoodsModal';

export default function PurchasesPage() {
  const { hasRole } = useAuth();
  const canEdit = hasRole('admin', 'purchase_manager');

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [createOpen, setCreateOpen] = useState(false);
  const [receiveOpen, setReceiveOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [toast, setToast] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const loadOrders = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await purchasesApi.list();
      setOrders(res.data.results ?? res.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load purchase orders.');
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

  const handleSaved = () => {
    setToast({ type: 'success', message: 'Purchase order created!' });
    loadOrders();
  };

  const handleReceived = () => {
    setToast({ type: 'success', message: 'Goods received — stock updated!' });
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

  const openReceive = (order) => {
    setSelectedOrder(order);
    setReceiveOpen(true);
  };

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      const matchesSearch =
        !search ||
        o.po_number?.toLowerCase().includes(search.toLowerCase()) ||
        o.supplier_name?.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = !statusFilter || o.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [orders, search, statusFilter]);

  const statusBadge = (status) => {
    const colors = {
      draft: 'bg-slate-100 text-slate-700',
      submitted: 'bg-blue-100 text-blue-700',
      approved: 'bg-indigo-100 text-indigo-700',
      partially_received: 'bg-amber-100 text-amber-800',
      received: 'bg-green-100 text-green-700',
      cancelled: 'bg-red-100 text-red-700',
    };
    return (
      <span className={`text-xs px-2 py-0.5 rounded font-medium ${colors[status] || colors.draft}`}>
        {status}
      </span>
    );
  };

  const columns = [
    {
      key: 'po_number',
      label: 'PO #',
      render: (row) => (
        <span className="font-mono text-xs text-slate-700">{row.po_number}</span>
      ),
    },
    { key: 'order_date', label: 'Date' },
    { key: 'supplier_name', label: 'Supplier' },
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
        const busy = busyId === row.purchase_order_id;
        const btn = 'text-xs px-2 py-1 rounded border font-medium disabled:opacity-50';
        return (
          <div className="flex gap-1 flex-wrap">
            {row.status === 'draft' && (
              <>
                <button
                  disabled={busy}
                  onClick={() => doAction(row.purchase_order_id, purchasesApi.submit, 'PO submitted')}
                  className={`${btn} bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100`}
                >
                  Submit
                </button>
                <button
                  disabled={busy}
                  onClick={() => doAction(row.purchase_order_id, purchasesApi.cancel, 'PO cancelled')}
                  className={`${btn} bg-red-50 border-red-200 text-red-700 hover:bg-red-100`}
                >
                  Cancel
                </button>
              </>
            )}
            {row.status === 'submitted' && (
              <>
                <button
                  disabled={busy}
                  onClick={() => doAction(row.purchase_order_id, purchasesApi.approve, 'PO approved')}
                  className={`${btn} bg-green-50 border-green-200 text-green-700 hover:bg-green-100`}
                >
                  <ThumbsUp size={12} className="inline" /> Approve
                </button>
                <button
                  disabled={busy}
                  onClick={() => doAction(row.purchase_order_id, purchasesApi.cancel, 'PO cancelled')}
                  className={`${btn} bg-red-50 border-red-200 text-red-700 hover:bg-red-100`}
                >
                  Cancel
                </button>
              </>
            )}
            {(row.status === 'approved' || row.status === 'partially_received') && (
              <button
                disabled={busy}
                onClick={() => openReceive(row)}
                className={`${btn} bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100`}
              >
                <PackageCheck size={12} className="inline" /> Receive
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
          <h1 className="text-2xl font-bold text-slate-900">Purchase Orders</h1>
          <p className="text-sm text-slate-500 mt-1">
            {filtered.length} order{filtered.length !== 1 ? 's' : ''}
          </p>
        </div>
        {canEdit && (
          <button className="btn-primary flex items-center gap-2" onClick={() => setCreateOpen(true)}>
            <Plus size={16} /> New Purchase Order
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
                placeholder="Search by PO # or supplier..."
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
            <option value="submitted">Submitted</option>
            <option value="approved">Approved</option>
            <option value="partially_received">Partially Received</option>
            <option value="received">Received</option>
            <option value="cancelled">Cancelled</option>
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
        emptyMessage="No purchase orders yet. Click 'New Purchase Order' to create one."
      />

      <PurchaseOrderFormModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSaved={handleSaved}
      />

      <ReceiveGoodsModal
        open={receiveOpen}
        onClose={() => setReceiveOpen(false)}
        onSaved={handleReceived}
        order={selectedOrder}
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