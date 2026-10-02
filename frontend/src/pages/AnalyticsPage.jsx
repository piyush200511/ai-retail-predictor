import { useEffect, useState } from 'react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, Cell, PieChart, Pie,
} from 'recharts';
import { RefreshCw, TrendingUp, DollarSign, Package, ShoppingCart } from 'lucide-react';
import { analyticsApi } from '../api/endpoints';

const COLORS = ['#14b8a6', '#8b5cf6', '#f59e0b', '#3b82f6', '#ec4899', '#10b981'];

function formatCurrency(v) {
  const n = Number(v);
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${n}`;
}

function CustomTooltip({ active, payload, label, isCurrency = false }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl px-3 py-2 text-xs">
      {label && <div className="font-medium text-slate-500 dark:text-slate-400 mb-1">{label}</div>}
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2 text-slate-800 dark:text-slate-200">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: p.color || p.fill }} />
          <span className="capitalize">{p.name}:</span>
          <span className="font-mono font-semibold">
            {isCurrency ? formatCurrency(p.value) : Number(p.value).toLocaleString('en-IN')}
          </span>
        </div>
      ))}
    </div>
  );
}

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
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Analytics</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Business intelligence & KPIs</p>
        </div>
        <button onClick={loadAll} className="btn-secondary flex items-center gap-2">
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 p-3 text-sm text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      {/* Executive KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KPI icon={<DollarSign size={20} />} label="Revenue (30d)" value={formatCurrency(exec?.sales?.revenue ?? 0)} accent="green" />
        <KPI icon={<ShoppingCart size={20} />} label="Orders (30d)" value={exec?.sales?.orders ?? 0} accent="blue" />
        <KPI icon={<Package size={20} />} label="Units Sold (30d)" value={(exec?.sales?.units_sold ?? 0).toFixed(0)} accent="purple" />
        <KPI icon={<TrendingUp size={20} />} label="Inventory Value" value={formatCurrency(exec?.inventory?.total_inventory_value ?? 0)} accent="amber" />
      </div>

      {/* Mini stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MiniStat label="Low Stock Items" value={exec?.inventory?.low_stock_count ?? 0} color="amber" />
        <MiniStat label="Stock-Out Items" value={exec?.inventory?.stock_out_count ?? 0} color="red" />
        <MiniStat label="Purchase Value (30d)" value={formatCurrency(exec?.purchasing?.total_purchase_value ?? 0)} color="blue" />
      </div>

      {/* Sales Trend — Area chart */}
      <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-slate-800 to-slate-700 dark:from-slate-950 dark:to-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="h-1 w-6 rounded-full bg-gradient-to-r from-teal-400 to-cyan-500" />
            <div>
              <h2 className="font-semibold text-sm tracking-tight">Sales Trend</h2>
              <p className="text-[11px] text-slate-400">Revenue over the last 30 days</p>
            </div>
          </div>
          <TrendingUp size={16} />
        </div>
        <div className="p-5">
          {trend.length === 0 ? (
            <div className="text-slate-500 dark:text-slate-400 py-8 text-center text-sm">No sales data yet.</div>
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={trend} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="analyticsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#14b8a6" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#14b8a6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.4} vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={(d) => d.slice(5)} axisLine={{ stroke: '#cbd5e1' }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={formatCurrency} />
                <Tooltip content={<CustomTooltip isCurrency />} cursor={{ stroke: '#14b8a6', strokeWidth: 1, strokeDasharray: '3 3' }} />
                <Area type="monotone" dataKey="revenue" stroke="#14b8a6" strokeWidth={2.5} fill="url(#analyticsGradient)" activeDot={{ r: 6, fill: '#14b8a6', stroke: '#fff', strokeWidth: 2 }} animationDuration={1200} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Top Products + Category Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products — enhanced bars */}
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-slate-800 to-slate-700 dark:from-slate-950 dark:to-slate-900 text-white">
            <div className="flex items-center gap-3">
              <div className="h-1 w-6 rounded-full bg-gradient-to-r from-violet-400 to-fuchsia-500" />
              <div>
                <h2 className="font-semibold text-sm tracking-tight">Top Products</h2>
                <p className="text-[11px] text-slate-400">Best sellers by revenue</p>
              </div>
            </div>
            <Package size={16} />
          </div>
          <div className="p-5">
            {topProducts.length === 0 ? (
              <div className="text-slate-500 dark:text-slate-400 py-8 text-center text-sm">No product sales yet.</div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topProducts.slice(0, 6)} layout="vertical" margin={{ top: 5, right: 25, left: 5, bottom: 5 }}>
                  <defs>
                    {COLORS.map((c, i) => (
                      <linearGradient key={i} id={`analyticsBar${i}`} x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor={c} stopOpacity={0.9} />
                        <stop offset="100%" stopColor={c} stopOpacity={0.6} />
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.3} horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={formatCurrency} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="sku" tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 500 }} width={110} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip isCurrency />} cursor={{ fill: 'rgba(20, 184, 166, 0.05)' }} />
                  <Bar dataKey="revenue" radius={[0, 6, 6, 0]} animationDuration={1000}>
                    {topProducts.slice(0, 6).map((_, i) => (
                      <Cell key={i} fill={`url(#analyticsBar${i % COLORS.length})`} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Category Donut */}
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-slate-800 to-slate-700 dark:from-slate-950 dark:to-slate-900 text-white">
            <div className="flex items-center gap-3">
              <div className="h-1 w-6 rounded-full bg-gradient-to-r from-amber-400 to-orange-500" />
              <div>
                <h2 className="font-semibold text-sm tracking-tight">Revenue by Product</h2>
                <p className="text-[11px] text-slate-400">Contribution of top products</p>
              </div>
            </div>
            <Package size={16} />
          </div>
          <div className="p-5">
            {topProducts.length === 0 ? (
              <div className="text-slate-500 dark:text-slate-400 py-8 text-center text-sm">No data yet.</div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <defs>
                    {COLORS.map((c, i) => (
                      <linearGradient key={i} id={`pieGrad${i}`} x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor={c} stopOpacity={1} />
                        <stop offset="100%" stopColor={c} stopOpacity={0.7} />
                      </linearGradient>
                    ))}
                  </defs>
                  <Pie
                    data={topProducts.slice(0, 5)}
                    dataKey="revenue"
                    nameKey="sku"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={3}
                    animationDuration={1000}
                  >
                    {topProducts.slice(0, 5).map((_, i) => (
                      <Cell key={i} fill={`url(#pieGrad${i % COLORS.length})`} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip isCurrency />} />
                  <Legend
                    wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
                    formatter={(v) => <span className="text-slate-600 dark:text-slate-400">{v}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Inventory by Warehouse */}
      <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-slate-800 to-slate-700 dark:from-slate-950 dark:to-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="h-1 w-6 rounded-full bg-gradient-to-r from-blue-400 to-cyan-500" />
            <div>
              <h2 className="font-semibold text-sm tracking-tight">Inventory by Warehouse</h2>
              <p className="text-[11px] text-slate-400">Units on hand vs unique SKUs</p>
            </div>
          </div>
          <Package size={16} />
        </div>
        <div className="p-5">
          {byWarehouse.length === 0 ? (
            <div className="text-slate-500 dark:text-slate-400 py-8 text-center text-sm">No inventory records.</div>
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={byWarehouse} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.3} vertical={false} />
                <XAxis dataKey="code" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(20, 184, 166, 0.05)' }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="total_quantity" fill="#14b8a6" radius={[6, 6, 0, 0]} name="Units on Hand" animationDuration={1000} />
                <Bar dataKey="unique_skus" fill="#8b5cf6" radius={[6, 6, 0, 0]} name="Unique SKUs" animationDuration={1200} />
              </BarChart>
            </ResponsiveContainer>
          )}
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