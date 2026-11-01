import { useEffect, useState } from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { RefreshCw, DollarSign, TrendingUp, TrendingDown, PiggyBank } from 'lucide-react';
import { analyticsApi, expensesApi } from '../api/endpoints';
import { useToast } from '../context/ToastContext';

const COLORS = ['#14b8a6', '#8b5cf6', '#f59e0b', '#3b82f6'];

export default function ProfitLossPage() {
  const toast = useToast();
  const [data, setData] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [plRes, expRes] = await Promise.all([
        analyticsApi.profitLoss(),
        expensesApi.list()
      ]);
      setData(plRes.data);
      setExpenses(expRes.data.results ?? expRes.data);
    } catch (err) {
      toast.error('Failed to load P&L data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  if (loading || !data) {
    return <div className="p-10 text-center text-slate-500">Loading financials...</div>;
  }

  const formatMoney = (val) => `₹${Number(val).toLocaleString('en-IN')}`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Profit & Loss</h1>
        <button onClick={loadData} className="btn-secondary flex items-center gap-2">
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card bg-white dark:bg-slate-900 border-l-4 border-teal-500">
          <div className="text-xs text-slate-500 uppercase">Revenue</div>
          <div className="text-2xl font-bold text-slate-800 dark:text-white mt-1">{formatMoney(data.revenue)}</div>
        </div>
        <div className="card bg-white dark:bg-slate-900 border-l-4 border-orange-500">
          <div className="text-xs text-slate-500 uppercase">COGS (Cost)</div>
          <div className="text-2xl font-bold text-slate-800 dark:text-white mt-1">{formatMoney(data.cogs)}</div>
        </div>
        <div className="card bg-white dark:bg-slate-900 border-l-4 border-emerald-500">
          <div className="text-xs text-slate-500 uppercase">Gross Profit</div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{formatMoney(data.gross_profit)}</div>
        </div>
        <div className="card bg-white dark:bg-slate-900 border-l-4 border-blue-500">
          <div className="text-xs text-slate-500 uppercase">Net Profit</div>
          <div className={`text-2xl font-bold mt-1 ${data.net_profit >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
            {formatMoney(data.net_profit)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Product Profit Chart */}
        <div className="card bg-white dark:bg-slate-900">
          <h2 className="font-semibold text-slate-800 dark:text-white mb-4">Top Profitable Products</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.product_profits} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis type="number" tickFormatter={(v) => `₹${v/1000}k`} />
              <YAxis type="category" dataKey="sku" width={100} />
              <Tooltip formatter={(v) => formatMoney(v)} />
              <Bar dataKey="profit" fill="#14b8a6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Expense Breakdown */}
        <div className="card bg-white dark:bg-slate-900">
          <h2 className="font-semibold text-slate-800 dark:text-white mb-4">Total Expenses: {formatMoney(data.total_expenses)}</h2>
          {expenses.length === 0 ? (
            <div className="text-slate-500 text-sm text-center py-10">No expenses recorded yet.</div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={expenses} dataKey="amount" nameKey="category" innerRadius={60} outerRadius={100}>
                  {expenses.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => formatMoney(v)} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}