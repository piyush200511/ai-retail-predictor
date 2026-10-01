import { useEffect, useState } from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, Cell,
} from 'recharts';
import { RefreshCw, TrendingUp, DollarSign, Package, ShoppingCart } from 'lucide-react';
import { analyticsApi } from '../api/endpoints';

const COLORS = ['#14b8a6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#ef4444'];

export default function AnalyticsPage() {
  const [exec, setExec] = useState(null);
  const [sales, setSales] = useState(null);
  const [inv, setInv] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadAll = async () => {
    setLoading(true);
    setError('');
    try {
      const [e, s, i] = await Promise.all([
        analyticsApi.dashboard(),
        analyticsApi.sales(),
        analyticsApi.inventory(),
      ]);
      setExec(e.data);
      setSales(s.data);
      setInv(i.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load analytics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAll(); }, []);

  if (loading) {
    return <div className="text-slate-500 dark:text-slate-400 py-12 text-center">Loading analytics...</div>;
  }

  const trend = sales?.trend ?? [];
  const topProducts = sales?.top_products ?? [];
  const byWarehouse = inv?.by_warehouse ?? [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Analytics</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Business intelligence & KPIs
          </p>
        </div>
        <button onClick={loadAll} className="btn-secondary flex items-center gap-2">
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 p-3 text-sm text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      {/* Executive KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <KPI
          icon={<DollarSign size={20} />}
          label="Revenue (30d)"
          value={`Rs. ${(exec?.sales?.revenue ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
          accent="green"
        />
        <KPI
          icon={<ShoppingCart size={20} />}
          label="Orders (30d)"
          value={exec?.sales?.orders ?? 0}
          accent="blue"
        />
        <KPI
          icon={<Package size={20} />}
          label="Units Sold (30d)"
          value={(exec?.sales?.units_sold ?? 0).toFixed(0)}
          accent="purple"
        />
        <KPI
          icon={<TrendingUp size={20} />}
          label="Inventory Value"
          value={`Rs. ${(exec?.inventory?.total_inventory_value ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
          accent="amber"
        />
      </div>

      {/* Low stock / stock-out stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <MiniStat label="Low Stock Items" value={exec?.inventory?.low_stock_count ?? 0} color="amber" />
        <MiniStat label="Stock-Out Items" value={exec?.inventory?.stock_out_count ?? 0} color="red" />
        <MiniStat label="Purchase Value (30d)" value={`Rs. ${(exec?.purchasing?.total_purchase_value ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`} color="blue" />
      </div>

      {/* Sales trend chart */}
      <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-card mb-6 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800">
          <h2 className="font-semibold text-slate-800 dark:text-slate-100">Sales Trend (Last 30 Days)</h2>
        </div>
        <div className="p-5">
          {trend.length === 0 ? (
            <div className="text-slate-500 dark:text-slate-400 py-8 text-center text-sm">
              No sales data yet. Complete some sales orders to see the trend.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trend} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={(d) => d.slice(5)} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <Tooltip
                  formatter={(v) => `Rs. ${Number(v).toLocaleString('en-IN')}`}
                  contentStyle={{ borderRadius: 8, border: '1px solid #334155', background: '#0f172a', color: '#e2e8f0', fontSize: 12 }}
                />
                <Legend />
                <Line type="monotone" dataKey="revenue" stroke="#14b8a6" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Two charts side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-card overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800">
            <h2 className="font-semibold text-slate-800 dark:text-slate-100">Top Products by Revenue</h2>
          </div>
          <div className="p-5">
            {topProducts.length === 0 ? (
              <div className="text-slate-500 dark:text-slate-400 py-8 text-center text-sm">No product sales yet.</div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topProducts.slice(0, 6)} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <YAxis type="category" dataKey="sku" tick={{ fontSize: 11, fill: '#94a3b8' }} width={100} />
                  <Tooltip
                    formatter={(v) => `Rs. ${Number(v).toLocaleString('en-IN')}`}
                    contentStyle={{ borderRadius: 8, border: '1px solid #334155', background: '#0f172a', color: '#e2e8f0', fontSize: 12 }}
                  />
                  <Bar dataKey="revenue" radius={[0, 4, 4, 0]}>
                    {topProducts.slice(0, 6).map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-card overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800">
            <h2 className="font-semibold text-slate-800 dark:text-slate-100">Inventory by Warehouse</h2>
          </div>
          <div className="p-5">
            {byWarehouse.length === 0 ? (
              <div className="text-slate-500 dark:text-slate-400 py-8 text-center text-sm">No inventory records.</div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={byWarehouse} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
                  <XAxis dataKey="code" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #334155', background: '#0f172a', color: '#e2e8f0', fontSize: 12 }} />
                  <Legend />
                  <Bar dataKey="total_quantity" fill="#14b8a6" radius={[4, 4, 0, 0]} name="Units on Hand" />
                  <Bar dataKey="unique_skus" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Unique SKUs" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function KPI({ icon, label, value, accent }) {
  const accents = {
    green:  'bg-green-50 dark:bg-green-950/50 text-green-700 dark:text-green-300 border-green-200 dark:border-green-900',
    blue:   'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-900',
    purple: 'bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-900',
    amber:  'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900',
  };
  return (
    <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
      <div className={`inline-flex p-2 rounded border ${accents[accent] || 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'} mb-2`}>
        {icon}
      </div>
      <div className="text-xs text-slate-500 dark:text-slate-400 uppercase">{label}</div>
      <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">{value}</div>
    </div>
  );
}

function MiniStat({ label, value, color }) {
  const colors = {
    red:   'border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/50 text-red-800 dark:text-red-300',
    amber: 'border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300',
    blue:  'border-blue-300 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/50 text-blue-800 dark:text-blue-300',
  };
  return (
    <div className={`rounded-lg border p-4 ${colors[color] || 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200'}`}>
      <div className="text-xs uppercase tracking-wide opacity-90">{label}</div>
      <div className="text-xl font-bold mt-1">{value}</div>
    </div>
  );
}