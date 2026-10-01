import { useEffect, useState, useMemo } from 'react';
import { Search, RefreshCw, AlertTriangle } from 'lucide-react';
import { alertsApi } from '../api/endpoints';
import DataTable from '../components/DataTable';
import { useAuth } from '../context/AuthContext';

export default function AlertsPage() {
  const { hasRole } = useAuth();
  const canManage = hasRole('admin', 'inventory_manager');

  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('open');
  const [severityFilter, setSeverityFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [toast, setToast] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const loadAlerts = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await alertsApi.list();
      setAlerts(res.data.results ?? res.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load alerts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAlerts(); }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  const doAction = async (id, fn, successMsg) => {
    setBusyId(id);
    try {
      await fn(id);
      setToast({ type: 'success', message: successMsg });
      await loadAlerts();
    } catch (err) {
      const data = err.response?.data;
      const msg = typeof data === 'object'
        ? Object.entries(data).map(([k, v]) => `${k}: ${v}`).join(' | ')
        : 'Action failed.';
      setToast({ type: 'error', message: msg });
    } finally {
      setBusyId(null);
    }
  };

  const filtered = useMemo(() => {
    return alerts.filter((a) => {
      const matchesSearch = !search ||
        a.product_sku?.toLowerCase().includes(search.toLowerCase()) ||
        a.message?.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = !statusFilter || a.status === statusFilter;
      const matchesSeverity = !severityFilter || a.severity === severityFilter;
      const matchesType = !typeFilter || a.alert_type === typeFilter;
      return matchesSearch && matchesStatus && matchesSeverity && matchesType;
    });
  }, [alerts, search, statusFilter, severityFilter, typeFilter]);

  const counts = useMemo(() => {
    return alerts.reduce((acc, a) => {
      acc.total++;
      if (a.status === 'open') acc.open++;
      else if (a.status === 'acknowledged') acc.acknowledged++;
      else if (a.status === 'resolved') acc.resolved++;
      if (a.severity === 'critical' && a.status === 'open') acc.critical++;
      return acc;
    }, { total: 0, open: 0, acknowledged: 0, resolved: 0, critical: 0 });
  }, [alerts]);

  const severityBadge = (s) => {
    const colors = {
      info:     'bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900',
      warning:  'bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900',
      critical: 'bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900',
    };
    return (
      <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${colors[s] || colors.warning}`}>
        {s}
      </span>
    );
  };

  const typeBadge = (t) => {
    const labels = {
      low_stock: 'Low Stock',
      stock_out: 'Stock Out',
      overstock: 'Overstock',
      unusual_demand: 'Unusual Demand',
    };
    const colors = {
      low_stock:      'bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900',
      stock_out:      'bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900',
      overstock:      'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700',
      unusual_demand: 'bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-900',
    };
    return (
      <span className={`text-xs px-2 py-0.5 rounded-md ${colors[t] || colors.overstock}`}>
        {labels[t] || t}
      </span>
    );
  };

  const statusBadge = (s) => {
    const colors = {
      open:         'bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-300',
      acknowledged: 'bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300',
      resolved:     'bg-green-100 dark:bg-green-950/50 text-green-700 dark:text-green-300',
    };
    return (
      <span className={`text-xs px-2 py-0.5 rounded font-medium ${colors[s] || colors.open}`}>
        {s}
      </span>
    );
  };

  const columns = [
    {
      key: 'created_at',
      label: 'When',
      render: (r) => <span className="text-slate-700 dark:text-slate-300">{new Date(r.created_at).toLocaleString()}</span>,
    },
    { key: 'alert_type', label: 'Type', render: (r) => typeBadge(r.alert_type) },
    { key: 'severity', label: 'Severity', render: (r) => severityBadge(r.severity) },
    {
      key: 'product_sku',
      label: 'Product',
      render: (r) => (
        <div>
          <div className="font-mono text-xs text-slate-600 dark:text-slate-400">{r.product_sku}</div>
          <div className="text-sm text-slate-800 dark:text-slate-200">{r.product_name}</div>
        </div>
      ),
    },
    { key: 'warehouse_code', label: 'Warehouse', render: (r) => <span className="text-slate-700 dark:text-slate-300">{r.warehouse_code}</span> },
    {
      key: 'message',
      label: 'Message',
      render: (r) => <span className="text-xs text-slate-600 dark:text-slate-400">{r.message}</span>,
    },
    { key: 'status', label: 'Status', render: (r) => statusBadge(r.status) },
    {
      key: 'actions',
      label: 'Actions',
      render: (r) => {
        if (!canManage) return null;
        const busy = busyId === r.alert_id;
        const btn = 'text-xs px-2 py-1 rounded border font-medium disabled:opacity-50 transition';
        return (
          <div className="flex gap-1 flex-wrap">
            {r.status === 'open' && (
              <button
                disabled={busy}
                onClick={() => doAction(r.alert_id, alertsApi.acknowledge, 'Alert acknowledged')}
                className={`${btn} bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/60`}
              >
                Acknowledge
              </button>
            )}
            {(r.status === 'open' || r.status === 'acknowledged') && (
              <button
                disabled={busy}
                onClick={() => doAction(r.alert_id, alertsApi.resolve, 'Alert resolved')}
                className={`${btn} bg-green-50 dark:bg-green-950/50 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900/60`}
              >
                Resolve
              </button>
            )}
            {r.status === 'resolved' && (
              <button
                disabled={busy}
                onClick={() => doAction(r.alert_id, alertsApi.reopen, 'Alert reopened')}
                className={`${btn} bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700`}
              >
                Reopen
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
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <AlertTriangle size={24} className="text-amber-500" />
            Inventory Alerts
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {filtered.length} alert{filtered.length !== 1 ? 's' : ''} shown
          </p>
        </div>
        <button onClick={loadAlerts} className="btn-secondary flex items-center gap-2" disabled={loading}>
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
        <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
          <div className="text-xs text-slate-500 dark:text-slate-400 uppercase">Total</div>
          <div className="text-2xl font-semibold mt-1 text-slate-900 dark:text-white">{counts.total}</div>
        </div>
        <div className="rounded-lg border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/50 p-4">
          <div className="text-xs text-red-700 dark:text-red-300 uppercase">Open</div>
          <div className="text-2xl font-semibold text-red-800 dark:text-red-200 mt-1">{counts.open}</div>
        </div>
        <div className="rounded-lg border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/50 p-4">
          <div className="text-xs text-amber-700 dark:text-amber-300 uppercase">Acknowledged</div>
          <div className="text-2xl font-semibold text-amber-800 dark:text-amber-200 mt-1">{counts.acknowledged}</div>
        </div>
        <div className="rounded-lg border border-green-300 dark:border-green-800 bg-green-50 dark:bg-green-950/50 p-4">
          <div className="text-xs text-green-700 dark:text-green-300 uppercase">Resolved</div>
          <div className="text-2xl font-semibold text-green-800 dark:text-green-200 mt-1">{counts.resolved}</div>
        </div>
        <div className="rounded-lg border border-red-400 dark:border-red-800 bg-red-100 dark:bg-red-950/70 p-4">
          <div className="text-xs text-red-800 dark:text-red-200 uppercase">Critical Open</div>
          <div className="text-2xl font-semibold text-red-900 dark:text-red-100 mt-1">{counts.critical}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-900 rounded-lg shadow-card border border-slate-200 dark:border-slate-800 p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search alerts..."
              className="input pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select className="input" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All statuses</option>
            <option value="open">Open</option>
            <option value="acknowledged">Acknowledged</option>
            <option value="resolved">Resolved</option>
          </select>
          <select className="input" value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value)}>
            <option value="">All severities</option>
            <option value="info">Info</option>
            <option value="warning">Warning</option>
            <option value="critical">Critical</option>
          </select>
          <select className="input" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="">All types</option>
            <option value="low_stock">Low Stock</option>
            <option value="stock_out">Stock Out</option>
            <option value="overstock">Overstock</option>
            <option value="unusual_demand">Unusual Demand</option>
          </select>
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
        emptyMessage="No alerts match your filters. Alerts are generated automatically when stock drops below reorder levels."
      />

      {toast && (
        <div className={`fixed top-6 right-6 z-50 rounded-md border px-4 py-3 shadow-lg ${
          toast.type === 'error'
            ? 'bg-red-50 dark:bg-red-950/60 border-red-300 dark:border-red-800 text-red-800 dark:text-red-200'
            : 'bg-green-50 dark:bg-green-950/60 border-green-300 dark:border-green-800 text-green-800 dark:text-green-200'
        }`}>
          {toast.message}
        </div>
      )}
    </div>
  );
}