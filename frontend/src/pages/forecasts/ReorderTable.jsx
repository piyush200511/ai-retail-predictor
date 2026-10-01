import { useAuth } from '../../context/AuthContext';
import { forecastingApi } from '../../api/endpoints';

export default function ReorderTable({ rows, loading, onAction }) {
  const { hasRole } = useAuth();
  const canAct = hasRole('admin', 'inventory_manager', 'purchase_manager');

  if (loading) return <div className="text-slate-500 dark:text-slate-400 py-8 text-center">Loading...</div>;
  if (!rows?.length)
    return (
      <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-card text-center py-12 text-slate-500 dark:text-slate-400">
        No reorder recommendations yet. Run a forecast first.
      </div>
    );

  const urgencyBadge = (u) => {
    const styles = {
      low:      'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700',
      medium:   'bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900',
      high:     'bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900',
      critical: 'bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900',
    };
    return (
      <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${styles[u] || styles.low}`}>
        {u?.toUpperCase()}
      </span>
    );
  };

  const handleReview = async (id) => {
    try {
      await forecastingApi.reviewReorder(id);
      onAction?.();
    } catch {}
  };

  const handleDismiss = async (id) => {
    try {
      await forecastingApi.dismissReorder(id);
      onAction?.();
    } catch {}
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg shadow-card border border-slate-200 dark:border-slate-800 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
            <tr>
              {['Product', 'Warehouse', 'Current', 'Avg Demand', 'ROP', 'Suggested', 'Urgency', 'Status', ''].map((h) => (
                <th key={h} className="px-3 py-2.5 text-left text-[11px] uppercase font-semibold text-slate-600 dark:text-slate-400 tracking-wide">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {rows.map((r) => (
              <tr key={r.recommendation_id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <td className="px-3 py-2.5">
                  <div className="font-medium text-slate-800 dark:text-slate-100">{r.product_sku}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">{r.product_name}</div>
                </td>
                <td className="px-3 py-2.5 text-slate-600 dark:text-slate-300">{r.warehouse_code}</td>
                <td className="px-3 py-2.5 text-slate-700 dark:text-slate-200 font-mono">{Number(r.current_stock).toFixed(0)}</td>
                <td className="px-3 py-2.5 text-slate-700 dark:text-slate-200 font-mono">{Number(r.average_daily_demand).toFixed(2)}</td>
                <td className="px-3 py-2.5 text-slate-700 dark:text-slate-200 font-mono">{Number(r.reorder_point).toFixed(2)}</td>
                <td className="px-3 py-2.5 font-semibold text-slate-900 dark:text-white font-mono">{Number(r.suggested_order_quantity).toFixed(0)}</td>
                <td className="px-3 py-2.5">{urgencyBadge(r.urgency)}</td>
                <td className="px-3 py-2.5">
                  <span className={`text-xs px-2 py-0.5 rounded-md border font-medium ${
                    r.status === 'new' ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-900' :
                    r.status === 'reviewed' ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-900' :
                    r.status === 'converted' ? 'bg-green-50 dark:bg-green-950/50 text-green-700 dark:text-green-300 border-green-200 dark:border-green-900' :
                    'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                  }`}>
                    {r.status}
                  </span>
                </td>
                <td className="px-3 py-2.5">
                  {canAct && r.status === 'new' && (
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleReview(r.recommendation_id)}
                        className="text-xs px-2 py-1 rounded border bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/60 transition"
                      >
                        Review
                      </button>
                      <button
                        onClick={() => handleDismiss(r.recommendation_id)}
                        className="text-xs px-2 py-1 rounded border bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                      >
                        Dismiss
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}