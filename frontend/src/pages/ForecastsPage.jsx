import { useEffect, useState, useMemo } from 'react';
import { Play, RefreshCw } from 'lucide-react';
import { forecastingApi } from '../api/endpoints';
import DataTable from '../components/DataTable';
import { useAuth } from '../context/AuthContext';
import StartForecastModal from './forecasts/StartForecastModal';
import ReorderTable from './forecasts/ReorderTable';

const TABS = [
  { key: 'reorder', label: 'Reorder Recommendations' },
  { key: 'runs', label: 'Forecast Runs' },
  { key: 'forecasts', label: 'Predictions' },
];

export default function ForecastsPage() {
  const { hasRole } = useAuth();
  const canRun = hasRole('admin', 'analyst');

  const [tab, setTab] = useState('reorder');
  const [toast, setToast] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Data
  const [reorder, setReorder] = useState([]);
  const [runs, setRuns] = useState([]);
  const [forecasts, setForecasts] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [r1, r2, r3] = await Promise.all([
        forecastingApi.reorder().catch(() => ({ data: [] })),
        forecastingApi.runs().catch(() => ({ data: [] })),
        forecastingApi.forecasts().catch(() => ({ data: [] })),
      ]);
      setReorder(r1.data.results ?? r1.data);
      setRuns(r2.data.results ?? r2.data);
      setForecasts(r3.data.results ?? r3.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  const handleSaved = () => {
    setToast({ type: 'success', message: 'Forecast run completed!' });
    loadAll();
  };

  const runColumns = [
    {
      key: 'run_name',
      label: 'Run',
      render: (row) => (
        <div>
          <div className="font-medium text-slate-800">{row.run_name}</div>
          <div className="text-xs text-slate-500">{row.model_name} v{row.model_version || '1.0'}</div>
        </div>
      ),
    },
    { key: 'forecast_horizon_days', label: 'Horizon', render: (r) => `${r.forecast_horizon_days}d` },
    {
      key: 'status',
      label: 'Status',
      render: (r) => (
        <span className={`text-xs px-2 py-0.5 rounded font-medium ${
          r.status === 'completed' ? 'bg-green-100 text-green-700' :
          r.status === 'running' ? 'bg-blue-100 text-blue-700' :
          r.status === 'failed' ? 'bg-red-100 text-red-700' :
          'bg-slate-100 text-slate-500'
        }`}>
          {r.status}
        </span>
      ),
    },
    {
      key: 'created_at',
      label: 'Created',
      render: (r) => new Date(r.created_at).toLocaleString(),
    },
    {
      key: 'completed_at',
      label: 'Completed',
      render: (r) => (r.completed_at ? new Date(r.completed_at).toLocaleString() : '—'),
    },
  ];

  const forecastColumns = [
    { key: 'forecast_date', label: 'Date' },
    { key: 'product_sku', label: 'Product' },
    { key: 'warehouse_code', label: 'Warehouse' },
    {
      key: 'predicted_demand',
      label: 'Predicted',
      render: (r) => Number(r.predicted_demand).toFixed(2),
    },
    {
      key: 'lower_bound',
      label: 'Lower',
      render: (r) => Number(r.lower_bound || 0).toFixed(2),
    },
    {
      key: 'upper_bound',
      label: 'Upper',
      render: (r) => Number(r.upper_bound || 0).toFixed(2),
    },
  ];

  const recentRuns = useMemo(
    () => [...runs].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5),
    [runs]
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Demand Forecasting</h1>
          <p className="text-sm text-slate-500 mt-1">
            ML-powered predictions and reorder recommendations
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={loadAll} className="btn-secondary flex items-center gap-2" disabled={loading}>
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
          {canRun && (
            <button onClick={() => setModalOpen(true)} className="btn-primary flex items-center gap-2">
              <Play size={16} /> Run Forecast
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 mb-4">
        <nav className="flex gap-2">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
                tab === t.key
                  ? 'border-brand-600 text-brand-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              {t.label}
              {t.key === 'reorder' && reorder.length > 0 && (
                <span className="ml-2 text-xs bg-slate-100 text-slate-700 rounded-full px-2 py-0.5">
                  {reorder.length}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {tab === 'reorder' && (
        <ReorderTable rows={reorder} loading={loading} onAction={loadAll} />
      )}

      {tab === 'runs' && (
        <>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="card">
              <div className="text-xs text-slate-500 uppercase">Total Runs</div>
              <div className="text-2xl font-bold mt-1">{runs.length}</div>
            </div>
            <div className="card">
              <div className="text-xs text-slate-500 uppercase">Completed</div>
              <div className="text-2xl font-bold mt-1 text-green-700">
                {runs.filter((r) => r.status === 'completed').length}
              </div>
            </div>
            <div className="card">
              <div className="text-xs text-slate-500 uppercase">Failed</div>
              <div className="text-2xl font-bold mt-1 text-red-700">
                {runs.filter((r) => r.status === 'failed').length}
              </div>
            </div>
          </div>
          <DataTable
            columns={runColumns}
            rows={recentRuns}
            loading={loading}
            emptyMessage="No forecast runs yet. Click 'Run Forecast' to start."
          />
        </>
      )}

      {tab === 'forecasts' && (
        <DataTable
          columns={forecastColumns}
          rows={forecasts.slice(0, 100)}
          loading={loading}
          emptyMessage="No predictions available. Run a forecast first."
        />
      )}

      <StartForecastModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={handleSaved}
      />

      {toast && (
        <div className="fixed top-6 right-6 z-50 rounded-md border bg-green-50 border-green-300 text-green-800 px-4 py-3 shadow-lg">
          {toast.message}
        </div>
      )}
    </div>
  );
}