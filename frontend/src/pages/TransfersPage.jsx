import { useEffect, useState, useMemo } from 'react';
import { Plus, Search, Truck, PackageCheck, XCircle, ArrowRight } from 'lucide-react';
import { transfersApi } from '../api/endpoints';
import DataTable from '../components/DataTable';
import { useAuth } from '../context/AuthContext';
import TransferFormModal from './transfers/TransferFormModal';

export default function TransfersPage() {
  const { hasRole } = useAuth();
  const canEdit = hasRole('admin', 'inventory_manager');

  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const loadTransfers = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await transfersApi.list();
      setTransfers(res.data.results ?? res.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load transfers.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransfers();
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  const handleSaved = () => {
    setToast({ type: 'success', message: 'Transfer created!' });
    loadTransfers();
  };

  const doAction = async (id, fn, successMsg) => {
    setBusyId(id);
    try {
      await fn(id);
      setToast({ type: 'success', message: successMsg });
      await loadTransfers();
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
    return transfers.filter((t) => {
      const matchesSearch =
        !search ||
        t.transfer_number?.toLowerCase().includes(search.toLowerCase()) ||
        t.from_warehouse_code?.toLowerCase().includes(search.toLowerCase()) ||
        t.to_warehouse_code?.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = !statusFilter || t.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [transfers, search, statusFilter]);

  const statusBadge = (status) => {
    const colors = {
      draft: 'bg-slate-100 text-slate-700',
      in_transit: 'bg-blue-100 text-blue-700',
      received: 'bg-green-100 text-green-700',
      cancelled: 'bg-red-100 text-red-700',
    };
    return (
      <span className={`text-xs px-2 py-0.5 rounded font-medium ${colors[status] || colors.draft}`}>
        {status?.replace('_', ' ')}
      </span>
    );
  };

  const columns = [
    {
      key: 'transfer_number',
      label: 'Transfer #',
      render: (row) => (
        <span className="font-mono text-xs text-slate-700">{row.transfer_number}</span>
      ),
    },
    {
      key: 'route',
      label: 'Route',
      render: (row) => (
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-600">{row.from_warehouse_code}</span>
          <ArrowRight size={12} className="text-slate-400" />
          <span className="text-slate-800 font-medium">{row.to_warehouse_code}</span>
        </div>
      ),
    },
    {
      key: 'items',
      label: 'Items',
      render: (row) => `${row.items?.length || 0} item${row.items?.length !== 1 ? 's' : ''}`,
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => statusBadge(row.status),
    },
    {
      key: 'requested_at',
      label: 'Created',
      render: (r) => new Date(r.requested_at).toLocaleString(),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => {
        if (!canEdit) return null;
        const busy = busyId === row.transfer_id;
        const btn = 'text-xs px-2 py-1 rounded border font-medium disabled:opacity-50';
        return (
          <div className="flex gap-1 flex-wrap">
            {row.status === 'draft' && (
              <>
                <button
                  disabled={busy}
                  onClick={() => doAction(row.transfer_id, transfersApi.dispatch, 'Dispatched — source stock decremented')}
                  className={`${btn} bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100`}
                >
                  <Truck size={12} className="inline" /> Dispatch
                </button>
                <button
                  disabled={busy}
                  onClick={() => doAction(row.transfer_id, transfersApi.cancel, 'Transfer cancelled')}
                  className={`${btn} bg-red-50 border-red-200 text-red-700 hover:bg-red-100`}
                >
                  <XCircle size={12} className="inline" /> Cancel
                </button>
              </>
            )}
            {row.status === 'in_transit' && (
              <button
                disabled={busy}
                onClick={() => doAction(row.transfer_id, transfersApi.receive, 'Received — destination stock incremented')}
                className={`${btn} bg-green-50 border-green-200 text-green-700 hover:bg-green-100`}
              >
                <PackageCheck size={12} className="inline" /> Receive
              </button>
            )}
            {row.status === 'received' && (
              <span className="text-xs text-slate-500 italic">Completed</span>
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
          <h1 className="text-2xl font-bold text-slate-900">Stock Transfers</h1>
          <p className="text-sm text-slate-500 mt-1">
            {filtered.length} transfer{filtered.length !== 1 ? 's' : ''}
          </p>
        </div>
        {canEdit && (
          <button className="btn-primary flex items-center gap-2" onClick={() => setModalOpen(true)}>
            <Plus size={16} /> New Transfer
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
                placeholder="Search by transfer # or warehouse..."
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
            <option value="in_transit">In Transit</option>
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
        emptyMessage="No transfers yet. Click 'New Transfer' to move stock between warehouses."
      />

      <TransferFormModal
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