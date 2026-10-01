import { Download, FileText, Package, ArrowLeftRight, TrendingUp } from 'lucide-react';
import { reportsApi } from '../api/endpoints';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';

const REPORTS = [
  {
    key: 'sales',
    title: 'Sales Report',
    description: 'All sales orders with dates, customers, warehouses, and totals.',
    icon: FileText,
    color: 'blue',
    urlFn: reportsApi.salesCsv,
    filename: 'sales_report.csv',
  },
  {
    key: 'inventory',
    title: 'Inventory Report',
    description: 'Current stock levels by warehouse and product with reorder thresholds.',
    icon: Package,
    color: 'green',
    urlFn: reportsApi.inventoryCsv,
    filename: 'inventory_report.csv',
  },
  {
    key: 'movements',
    title: 'Stock Movements Report',
    description: 'Complete audit ledger — every stock in/out with references.',
    icon: ArrowLeftRight,
    color: 'amber',
    urlFn: reportsApi.movementsCsv,
    filename: 'stock_movements.csv',
  },
  {
    key: 'forecasts',
    title: 'Forecasts Report',
    description: 'ML predicted demand per product, warehouse, and date.',
    icon: TrendingUp,
    color: 'purple',
    urlFn: reportsApi.forecastsCsv,
    filename: 'forecasts_report.csv',
  },
];

export default function ReportsPage() {
  const { user } = useAuth();
  const [downloading, setDownloading] = useState(null);
  const [toast, setToast] = useState(null);

  const handleDownload = async (report) => {
    setDownloading(report.key);
    try {
      // Fetch with auth header
      const token = localStorage.getItem('access_token');
      const res = await fetch(report.urlFn(), {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = report.filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      setToast({ type: 'success', message: `${report.title} downloaded` });
    } catch (err) {
      setToast({ type: 'error', message: `Failed to download: ${err.message}` });
    } finally {
      setDownloading(null);
      setTimeout(() => setToast(null), 3000);
    }
  };

  const colorClasses = {
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    green: 'bg-green-50 text-green-700 border-green-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Reports</h1>
        <p className="text-sm text-slate-500 mt-1">
          Download CSV exports for offline analysis in Excel / Sheets.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {REPORTS.map((r) => {
          const Icon = r.icon;
          const busy = downloading === r.key;
          return (
            <div
              key={r.key}
              className="bg-white rounded-lg border border-slate-200 p-5 flex flex-col"
            >
              <div className={`inline-flex p-3 rounded-lg w-fit mb-3 border ${colorClasses[r.color]}`}>
                <Icon size={22} />
              </div>
              <h2 className="font-semibold text-slate-900">{r.title}</h2>
              <p className="text-sm text-slate-500 mt-1 flex-1">{r.description}</p>
              <button
                onClick={() => handleDownload(r)}
                disabled={busy}
                className="mt-4 btn-primary flex items-center justify-center gap-2"
              >
                <Download size={16} />
                {busy ? 'Downloading...' : 'Download CSV'}
              </button>
            </div>
          );
        })}
      </div>

      <div className="mt-6 card bg-slate-50 border-slate-200">
        <h3 className="font-medium text-slate-700 mb-1">ℹ️ How to use these reports</h3>
        <ul className="text-sm text-slate-600 space-y-1 list-disc list-inside">
          <li>Click any <strong>Download CSV</strong> button — the file saves directly to your Downloads folder.</li>
          <li>Open the file in Excel, Google Sheets, or any spreadsheet tool for pivot tables and charts.</li>
          <li>Sales and Movements reports support date filtering via API params (advanced).</li>
          <li>Filenames are timestamped for easy tracking.</li>
        </ul>
      </div>

      {toast && (
        <div
          className={`fixed top-6 right-6 z-50 rounded-md border px-4 py-3 shadow-lg ${
            toast.type === 'error'
              ? 'bg-red-50 border-red-300 text-red-800'
              : 'bg-green-50 border-green-300 text-green-800'
          }`}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}