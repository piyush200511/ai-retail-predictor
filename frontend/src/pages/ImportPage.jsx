import { useState } from 'react';
import { Upload, Package, Users, Warehouse, ShoppingBag } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ImportModal from '../components/ImportModal';

const IMPORT_TYPES = [
  { type: 'products', label: 'Products', icon: Package, color: 'teal', description: 'Bulk add products with SKU, price, category' },
  { type: 'suppliers', label: 'Suppliers', icon: Users, color: 'violet', description: 'Onboard multiple suppliers at once' },
  { type: 'warehouses', label: 'Warehouses', icon: Warehouse, color: 'blue', description: 'Add warehouse locations in bulk' },
  { type: 'customers', label: 'Customers', icon: ShoppingBag, color: 'emerald', description: 'Import customer lists from CSV' },
];

export default function ImportPage() {
  const { isAdmin } = useAuth();
  const [active, setActive] = useState(null);

  if (!isAdmin) {
    return (
      <div className="text-center py-12 text-slate-500 dark:text-slate-400">
        Admin access required.
      </div>
    );
  }

  const activeType = IMPORT_TYPES.find((t) => t.type === active);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Upload size={24} className="text-teal-600 dark:text-teal-400" />
          Import Center
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Bulk-import master data from CSV files
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {IMPORT_TYPES.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.type}
              onClick={() => setActive(item.type)}
              className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-card p-5 text-left hover:border-teal-500 dark:hover:border-teal-500 hover:shadow-card-hover transition-all group"
            >
              <div className={`inline-flex h-11 w-11 rounded-lg bg-${item.color}-50 dark:bg-${item.color}-950/50 items-center justify-center mb-3`}>
                <Icon size={22} className={`text-${item.color}-600 dark:text-${item.color}-400`} />
              </div>
              <h3 className="font-semibold text-slate-900 dark:text-white">
                Import {item.label}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {item.description}
              </p>
              <div className="mt-3 text-xs text-teal-600 dark:text-teal-400 font-medium flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                Click to import →
              </div>
            </button>
          );
        })}
      </div>

      {/* Info card */}
      <div className="mt-6 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-card p-5">
        <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-2">ℹ️ How it works</h3>
        <ol className="text-sm text-slate-600 dark:text-slate-400 space-y-1 list-decimal list-inside">
          <li>Download the CSV template (has all required columns)</li>
          <li>Fill in your data — one row per item</li>
          <li>Upload the CSV — we preview the first 5 rows</li>
          <li>Click Import — data is validated row by row</li>
          <li>See the summary — imported count + row-level errors</li>
        </ol>
      </div>

      {activeType && (
        <ImportModal
          open={!!active}
          onClose={() => setActive(null)}
          type={activeType.type}
          typeLabel={activeType.label}
          onImported={() => {}}
        />
      )}
    </div>
  );
}