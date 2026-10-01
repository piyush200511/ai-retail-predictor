import { useEffect, useState, useMemo } from 'react';
import { Play, RefreshCw, TrendingUp } from 'lucide-react';
import { forecastingApi } from '../api/endpoints';
import DataTable from '../components/DataTable';
import Panel from '../components/Panel';
import ForecastChart from '../components/ForecastChart';
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

  const [reorder, setReorder] = useState([]);
  const [runs, setRuns] = useState([]);
  const [forecasts, setForecasts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedPair, setSelectedPair] = useState(null);

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
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  const handleSaved = () => {
    setToast({ type: 'success', message: 'Forecast run completed!' });
    loadAll();
  };

  // Build unique product/warehouse pairs from forecasts
  const pairs = useMemo(() => {
    const map = new Map();
    forecasts.forEach((f) => {
      const key = `${f.product_sku}__${f.warehouse_code}`;
      if (!map.has(key)) {
        map.set(key, {
          key,
          product_sku: f.product_sku,
          product_name: f.product_sku,
          warehouse_code: f.warehouse_code,
          product_id: f.product,
          warehouse_id: f.warehouse,
        });
      }
    });
    return Array.from(map.values());
  }, [forecasts]);

  useEffect(() => {
    if (pairs.length > 0 && !selectedPair) {
      setSelectedPair(pairs[0]);
    }
  }, [pairs, selectedPair]);

  const runColumns = [
    {
      key: 'run_name',
      label: 'Run',
      render: (row) => (
        <div>
          <div className="font-medium text-slate-800">{row.run_name}</div>
          <div className="text-xs text-slate-500">
            {row.model_name} v{row.model_version || '1.0'}
          </div>
        </div>
      ),
    },
    {
      key: 'forecast_horizon_days',
      label: 'Horizon',
      render: (r) => `${r.forecast_horizon_days}d`,
    },
    {
      key: 'status',
      label: 'Status',
      render: (r) => (
        <span
          className={`text-xs px-2 py-0.5 rounded font-medium ${
            r.status === 'completed'
              ? 'bg-green-100 text-green-700'
              : r.status === 'running'
              ? 'bg-blue-100 text-blue-700'
              : r.status === 'failed'
              ? 'bg-red-100 text-red-700'
              : 'bg-slate-100 text-slate-500'
          }`}
        >
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
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Demand Forecasting
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            ML-powered predictions and reorder recommendations
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadAll}
            className="btn-secondary flex items-center gap-2"
            disabled={loading}
          >
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
                  ? 'border-teal-600 text-teal-700'
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

      {/* Tab: Reorder */}
      {tab === 'reorder' && (
        <ReorderTable rows={reorder} loading={loading} onAction={loadAll} />
      )}

      {/* Tab: Runs */}
      {tab === 'runs' && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <div className="stat-tile">
              <div className="stat-label">Total Runs</div>
              <div className="stat-value">{runs.length}</div>
            </div>
            <div className="stat-tile">
              <div className="stat-label">Completed</div>
              <div className="stat-value text-green-700">
                {runs.filter((r) => r.status === 'completed').length}
              </div>
            </div>
            <div className="stat-tile">
              <div className="stat-label">Failed</div>
              <div className="stat-value text-red-700">
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

      {/* Tab: Forecasts */}
      {tab === 'forecasts' && (
        <div className="space-y-6">
          {pairs.length === 0 ? (
            <div className="card text-center py-12 text-slate-400 text-sm">
              No predictions available. Run a forecast first.
            </div>
          ) : (
            <>
              {/* Selector */}
              <div className="flex flex-wrap items-center gap-3 bg-white rounded-lg border border-slate-200 shadow-card p-4">
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                  View forecast for:
                </label>
                <select
                  className="input max-w-md"
                  value={selectedPair?.key || ''}
                  onChange={(e) => {
                    const p = pairs.find((x) => x.key === e.target.value);
                    setSelectedPair(p);
                  }}
                >
                  {pairs.map((p) => (
                    <option key={p.key} value={p.key}>
                      {p.product_sku} — {p.product_name} @ {p.warehouse_code}
                    </option>
                  ))}
                </select>
              </div>

              {/* Chart panel */}
              {selectedPair && (
                <Panel
                  title="Demand Forecast"
                  subtitle={`${selectedPair.product_sku} · ${selectedPair.warehouse_code}`}
                  actions={<TrendingUp size={16} />}
                >
                  <div className="p-5">
                    <ForecastChart
                      forecasts={forecasts.filter(
                        (f) =>
                          String(f.product) === String(selectedPair.product_id) &&
                          String(f.warehouse) === String(selectedPair.warehouse_id)
                      )}
                      history={[]}
                    />
                  </div>
                </Panel>
              )}

              {/* Raw table */}
              <div>
                <h3 className="text-sm font-semibold text-slate-700 mb-3 px-1">
                  Forecast Rows
                </h3>
                <DataTable
                  columns={forecastColumns}
                  rows={forecasts.slice(0, 100)}
                  loading={loading}
                  emptyMessage="No predictions available."
                />
              </div>
            </>
          )}
        </div>
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