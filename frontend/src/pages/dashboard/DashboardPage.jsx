import { useAuth } from '../../context/AuthContext';
import { analyticsApi } from '../../api/endpoints';
import { useEffect, useState } from 'react';

export default function DashboardPage() {
  const { user } = useAuth();
  const [kpis, setKpis] = useState(null);

  useEffect(() => {
    analyticsApi
      .dashboard()
      .then((res) => setKpis(res.data))
      .catch(() => setKpis(null));
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Dashboard</h1>

      {!kpis ? (
        <div className="text-slate-500">Loading KPIs...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPI title="Revenue (30d)" value={`Rs. ${kpis.sales?.revenue?.toFixed(2) ?? 0}`} />
          <KPI title="Orders (30d)" value={kpis.sales?.orders ?? 0} />
          <KPI title="Units Sold (30d)" value={kpis.sales?.units_sold?.toFixed(0) ?? 0} />
          <KPI
            title="Inventory Value"
            value={`Rs. ${kpis.inventory?.total_inventory_value?.toFixed(2) ?? 0}`}
          />
          <KPI
            title="Low Stock Items"
            value={kpis.inventory?.low_stock_count ?? 0}
            accent="warning"
          />
          <KPI
            title="Stock-Out Items"
            value={kpis.inventory?.stock_out_count ?? 0}
            accent="critical"
          />
          <KPI
            title="Overstock"
            value={kpis.inventory?.overstock_count ?? 0}
          />
          <KPI
            title="Purchase Value (30d)"
            value={`Rs. ${kpis.purchasing?.total_purchase_value?.toFixed(2) ?? 0}`}
          />
        </div>
      )}
    </div>
  );
}

function KPI({ title, value, accent }) {
  const colors = {
    warning: 'border-amber-300 bg-amber-50',
    critical: 'border-red-300 bg-red-50',
    default: 'border-slate-200 bg-white',
  };
  return (
    <div className={`rounded-lg border p-4 ${colors[accent] || colors.default}`}>
      <div className="text-xs uppercase tracking-wide text-slate-500">{title}</div>
      <div className="mt-1 text-2xl font-semibold text-slate-900">{value}</div>
    </div>
  );
}