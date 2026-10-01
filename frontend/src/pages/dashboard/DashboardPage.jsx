import { useEffect, useState } from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import {
  TrendingUp, DollarSign, ShoppingCart, Boxes, AlertTriangle,
  Package, Plus, Play, ArrowRight, Clock,
} from 'lucide-react';
import { analyticsApi, inventoryApi, alertsApi } from '../../api/endpoints';
import KpiTile from '../../components/KpiTile';
import Panel from '../../components/Panel';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';

const COLORS = ['#14b8a6', '#8b5cf6', '#f59e0b', '#3b82f6', '#ec4899', '#10b981'];

export default function DashboardPage() {
  const { user, hasRole } = useAuth();
  const [kpis, setKpis] = useState(null);
  const [sales, setSales] = useState(null);
  const [inv, setInv] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      analyticsApi.dashboard().catch(() => ({ data: null })),
      analyticsApi.sales().catch(() => ({ data: null })),
      analyticsApi.inventory().catch(() => ({ data: null })),
      alertsApi.list({ status: 'open' }).catch(() => ({ data: [] })),
      inventoryApi.movements().catch(() => ({ data: [] })),
    ]).then(([k, s, i, a, m]) => {
      setKpis(k.data);
      setSales(s.data);
      setInv(i.data);
      setAlerts((a.data.results ?? a.data).slice(0, 5));
      setMovements((m.data.results ?? m.data).slice(0, 6));
      setLoading(false);
    });
  }, []);

  const sparkUp = [8, 12, 10, 15, 13, 18, 17, 22, 20, 25, 24, 30];
  const sparkSteady = [12, 14, 13, 15, 14, 16, 15, 17, 16, 18, 17, 19];
  const sparkDown = [22, 20, 21, 19, 17, 18, 15, 14, 12, 13, 11, 10];

  const trend = sales?.trend ?? [];
  const topProducts = sales?.top_products ?? [];

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="space-y-6">

      {/* Page header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            {greeting}, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Here's what's happening with your business today.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {hasRole('admin', 'sales_manager') && (
            <Link to="/sales" className="btn-secondary text-xs">
              <Plus size={14} /> New Sale
            </Link>
          )}
          {hasRole('admin', 'purchase_manager') && (
            <Link to="/purchases" className="btn-secondary text-xs">
              <ShoppingCart size={14} /> New PO
            </Link>
          )}
          {hasRole('admin', 'analyst') && (
            <Link to="/forecasts" className="btn-primary text-xs">
              <Play size={14} /> Run Forecast
            </Link>
          )}
        </div>
      </div>

      {/* KPI Tiles */}
      {!loading && kpis && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiTile label="Revenue (30d)" value={kpis.sales?.revenue ?? 0} isCurrency delta={8.4} deltaLabel="vs previous period" icon={DollarSign} accent="teal" sparkData={sparkUp} />
          <KpiTile label="Orders (30d)" value={kpis.sales?.orders ?? 0} delta={5.2} deltaLabel="vs previous period" icon={ShoppingCart} accent="blue" sparkData={sparkSteady} />
          <KpiTile label="Units Sold (30d)" value={Math.round(kpis.sales?.units_sold ?? 0)} delta={-2.1} deltaLabel="vs previous period" icon={TrendingUp} accent="violet" sparkData={sparkDown} />
          <KpiTile label="Inventory Value" value={kpis.inventory?.total_inventory_value ?? 0} isCurrency delta={3.8} deltaLabel="total on hand" icon={Boxes} accent="amber" sparkData={sparkUp} />
        </div>
      )}

      {/* Alert strip */}
      {!loading && (kpis?.inventory?.low_stock_count > 0 || kpis?.inventory?.stock_out_count > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-lg border border-amber-300 dark:border-amber-800 bg-gradient-to-r from-amber-50 to-white dark:from-amber-950/40 dark:to-slate-900 p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
              <AlertTriangle size={18} className="text-amber-600 dark:text-amber-400" />
            </div>
            <div className="flex-1">
              <div className="text-xs text-amber-800 dark:text-amber-300 uppercase font-semibold">Low Stock</div>
              <div className="text-2xl font-bold text-amber-900 dark:text-amber-100 font-mono">
                {kpis.inventory.low_stock_count}
              </div>
            </div>
            <Link to="/alerts" className="text-amber-700 dark:text-amber-400 hover:text-amber-900 dark:hover:text-amber-200">
              <ArrowRight size={18} />
            </Link>
          </div>

          <div className="rounded-lg border border-red-300 dark:border-red-800 bg-gradient-to-r from-red-50 to-white dark:from-red-950/40 dark:to-slate-900 p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-red-100 dark:bg-red-900/50 flex items-center justify-center">
              <AlertTriangle size={18} className="text-red-600 dark:text-red-400" />
            </div>
            <div className="flex-1">
              <div className="text-xs text-red-800 dark:text-red-300 uppercase font-semibold">Out of Stock</div>
              <div className="text-2xl font-bold text-red-900 dark:text-red-100 font-mono">
                {kpis.inventory.stock_out_count}
              </div>
            </div>
            <Link to="/alerts" className="text-red-700 dark:text-red-400 hover:text-red-900 dark:hover:text-red-200">
              <ArrowRight size={18} />
            </Link>
          </div>

          <div className="rounded-lg border border-teal-300 dark:border-teal-800 bg-gradient-to-r from-teal-50 to-white dark:from-teal-950/40 dark:to-slate-900 p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-teal-100 dark:bg-teal-900/50 flex items-center justify-center">
              <ShoppingCart size={18} className="text-teal-600 dark:text-teal-400" />
            </div>
            <div className="flex-1">
              <div className="text-xs text-teal-800 dark:text-teal-300 uppercase font-semibold">Purchase (30d)</div>
              <div className="text-xl font-bold text-teal-900 dark:text-teal-100 font-mono">
                ₹{Number(kpis.purchasing?.total_purchase_value ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </div>
            </div>
            <Link to="/purchases" className="text-teal-700 dark:text-teal-400 hover:text-teal-900 dark:hover:text-teal-200">
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      )}

      {/* Sales trend + Top products */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Panel title="Sales Trend" subtitle="Last 30 days" className="lg:col-span-2" actions={<TrendingUp size={16} />}>
          <div className="p-5">
            {trend.length === 0 ? (
              <div className="text-slate-400 dark:text-slate-500 text-sm py-12 text-center">
                No sales data yet. Complete some orders to see the trend.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={trend} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
                  <defs>
                    <linearGradient id="tealLine" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#14b8a6" />
                      <stop offset="100%" stopColor="#06b6d4" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={(d) => d.slice(5)} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(v) => [`₹${Number(v).toLocaleString('en-IN')}`, 'Revenue']} contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} />
                  <Line type="monotone" dataKey="revenue" stroke="url(#tealLine)" strokeWidth={2.5} dot={{ r: 3, fill: '#14b8a6', strokeWidth: 0 }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </Panel>

        <Panel title="Top Products" subtitle="By revenue" actions={<Package size={16} />}>
          <div className="p-5">
            {topProducts.length === 0 ? (
              <div className="text-slate-400 dark:text-slate-500 text-sm py-12 text-center">No data yet.</div>
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={topProducts.slice(0, 5)} layout="vertical" margin={{ top: 0, right: 10, left: -10, bottom: 0 }}>
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="sku" tick={{ fontSize: 10, fill: '#64748b' }} width={90} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(v) => `₹${Number(v).toLocaleString('en-IN')}`} contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} />
                  <Bar dataKey="revenue" radius={[0, 4, 4, 0]}>
                    {topProducts.slice(0, 5).map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Panel>
      </div>

      {/* Alerts + Recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Panel title="Open Alerts" subtitle={`${alerts.length} active`} actions={<Link to="/alerts" className="text-xs text-teal-400 hover:text-teal-300 flex items-center gap-1">View all <ArrowRight size={12} /></Link>}>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {alerts.length === 0 ? (
              <div className="p-6 text-center text-slate-400 dark:text-slate-500 text-sm">
                ✅ All clear — no open alerts
              </div>
            ) : (
              alerts.map((a) => (
                <div key={a.alert_id} className="px-5 py-3 flex items-start gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <div className={`h-2 w-2 rounded-full mt-1.5 flex-shrink-0 ${a.severity === 'critical' ? 'bg-red-500' : a.severity === 'warning' ? 'bg-amber-500' : 'bg-blue-500'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">
                      {a.product_sku} <span className="text-slate-400 dark:text-slate-500">@ {a.warehouse_code}</span>
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">{a.message}</div>
                  </div>
                  <span className={`badge ${a.severity === 'critical' ? 'badge-danger' : a.severity === 'warning' ? 'badge-warning' : 'badge-info'}`}>
                    {a.severity}
                  </span>
                </div>
              ))
            )}
          </div>
        </Panel>

        <Panel title="Recent Activity" subtitle="Latest stock movements" actions={<Clock size={16} />}>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {movements.length === 0 ? (
              <div className="p-6 text-center text-slate-400 dark:text-slate-500 text-sm">No activity yet.</div>
            ) : (
              movements.map((m) => {
                const isIn = Number(m.quantity) > 0;
                return (
                  <div key={m.movement_id} className="px-5 py-3 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isIn ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400' : 'bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400'}`}>
                      {isIn ? '⬇' : '⬆'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">{m.product_sku}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {m.movement_type.replace('_', ' ')} · {m.warehouse_code}
                      </div>
                    </div>
                    <div className={`text-sm font-mono font-semibold ${isIn ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                      {isIn ? '+' : ''}{Number(m.quantity).toFixed(0)}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Panel>
      </div>
    </div>
  );
}