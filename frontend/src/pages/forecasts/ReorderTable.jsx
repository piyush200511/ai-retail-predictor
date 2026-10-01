import { useAuth } from '../../context/AuthContext';
import { forecastingApi } from '../../api/endpoints';

export default function ReorderTable({ rows, loading, onAction }) {
  const { hasRole } = useAuth();
  const canAct = hasRole('admin', 'inventory_manager', 'purchase_manager');

  if (loading) return <div className="text-slate-500 py-8 text-center">Loading...</div>;
  if (!rows?.length)
    return (
      <div className="text-slate-500 py-8 text-center card">
        No reorder recommendations yet. Run a forecast first.
      </div>
    );

  const urgencyBadge = (u) => {
    const colors = {
      low: 'bg-slate-100 text-slate-700',
      medium: 'bg-blue-100 text-blue-700',
      high: 'bg-amber-100 text-amber-800',
      critical: 'bg-red-100 text-red-700',
    };
    return (
      <span className={`text-xs px-2 py-0.5 rounded font-medium ${colors[u]}`}>
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
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              {['Product', 'Warehouse', 'Current', 'Avg Demand', 'ROP', 'Suggested', 'Urgency', 'Status', ''].map((h) => (
                <th key={h} className="px-3 py-2 text-left text-xs uppercase font-medium text-slate-600">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((r) => (
              <tr key={r.recommendation_id} className="hover:bg-slate-50">
                <td className="px-3 py-2">
                  <div className="font-medium text-slate-800">{r.product_sku}</div>
                  <div className="text-xs text-slate-500">{r.product_name}</div>
                </td>
                <td className="px-3 py-2 text-slate-600">{r.warehouse_code}</td>
                <td className="px-3 py-2">{Number(r.current_stock).toFixed(0)}</td>
                <td className="px-3 py-2">{Number(r.average_daily_demand).toFixed(2)}</td>
                <td className="px-3 py-2">{Number(r.reorder_point).toFixed(2)}</td>
                <td className="px-3 py-2 font-semibold text-slate-900">
                  {Number(r.suggested_order_quantity).toFixed(0)}
                </td>
                <td className="px-3 py-2">{urgencyBadge(r.urgency)}</td>
                <td className="px-3 py-2">
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    r.status === 'new' ? 'bg-blue-100 text-blue-700' :
                    r.status === 'reviewed' ? 'bg-amber-100 text-amber-800' :
                    r.status === 'converted' ? 'bg-green-100 text-green-700' :
                    'bg-slate-100 text-slate-500'
                  }`}>
                    {r.status}
                  </span>
                </td>
                <td className="px-3 py-2">
                  {canAct && r.status === 'new' && (
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleReview(r.recommendation_id)}
                        className="text-xs px-2 py-0.5 rounded border bg-amber-50 border-amber-200 text-amber-800"
                      >
                        Review
                      </button>
                      <button
                        onClick={() => handleDismiss(r.recommendation_id)}
                        className="text-xs px-2 py-0.5 rounded border bg-slate-50 border-slate-200 text-slate-700"
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