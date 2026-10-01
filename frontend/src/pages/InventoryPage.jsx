import { useEffect, useState, useMemo } from 'react';
import { Search, RefreshCw } from 'lucide-react';
import { inventoryApi, warehousesApi } from '../api/endpoints';
import DataTable from '../components/DataTable';
import { useAuth } from '../context/AuthContext';
import AdjustStockModal from './inventory/AdjustStockModal';

export default function InventoryPage() {
  const { hasRole } = useAuth();
  const canAdjust = hasRole('admin', 'inventory_manager');

  const [rows, setRows] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [toast, setToast] = useState(null);

  const loadInventory = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await inventoryApi.list();
      const data = res.data.results ?? res.data;
      setRows(data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load inventory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInventory();
    warehousesApi
      .list()
      .then((res) => setWarehouses(res.data.results ?? res.data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  const handleAdjust = (row) => {
    setSelectedRow(row);
    setModalOpen(true);
  };

  const handleSaved = () => {
    setToast({ type: 'success', message: 'Stock adjusted!' });
    loadInventory();
  };

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      const matchesSearch =
        !search ||
        r.product_sku?.toLowerCase().includes(search.toLowerCase()) ||
        r.product_name?.toLowerCase().includes(search.toLowerCase());
      const matchesWarehouse =
        !warehouseFilter || String(r.warehouse) === String(warehouseFilter);

      let matchesStatus = true;
      if (statusFilter === 'low') {
        matchesStatus = Number(r.quantity_available) > 0 &&
          Number(r.quantity_available) <= Number(r.reorder_level || 0);
      } else if (statusFilter === 'out') {
        matchesStatus = Number(r.quantity_available) <= 0;
      } else if (statusFilter === 'ok') {
        matchesStatus = Number(r.quantity_available) > Number(r.reorder_level || 0);
      }
      return matchesSearch && matchesWarehouse && matchesStatus;
    });
  }, [rows, search, warehouseFilter, statusFilter]);

  const stockBadge = (row) => {
    const avail = Number(row.quantity_available);
    const reorder = Number(row.reorder_level || 0);
    if (avail <= 0) {
      return <span className="text-xs px-2 py-0.5 rounded bg-red-100 text-red-700 font-medium">Out of Stock</span>;
    }
    if (reorder > 0 && avail <= reorder) {
      return <span className="text-xs px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-medium">Low Stock</span>;
    }
    return <span className="text-xs px-2 py-0.5 rounded bg-green-100 text-green-700 font-medium">OK</span>;
  };

  const columns = [
    {
      key: 'warehouse_code',
      label: 'Warehouse',
      render: (row) => (
        <div>
          <div className="font-medium text-slate-800">{row.warehouse_code}</div>
          <div className="text-xs text-slate-500">{row.warehouse_name}</div>
        </div>
      ),
    },
    {
      key: 'product_sku',
      label: 'Product',
      render: (row) => (
        <div>
          <div className="font-mono text-xs text-slate-600">{row.product_sku}</div>
          <div className="text-sm text-slate-800">{row.product_name}</div>
        </div>
      ),
    },
    {
      key: 'quantity_on_hand',
      label: 'On Hand',
      render: (row) => <span className="font-medium">{Number(row.quantity_on_hand).toFixed(0)}</span>,
    },
    {
      key: 'quantity_reserved',
      label: 'Reserved',
      render: (row) => Number(row.quantity_reserved).toFixed(0),
    },
    {
      key: 'quantity_available',
      label: 'Available',
      render: (row) => (
        <span className="font-medium">{Number(row.quantity_available).toFixed(0)}</span>
      ),
    },
    {
      key: 'reorder_level',
      label: 'Reorder Lvl',
      render: (row) => Number(row.reorder_level || 0).toFixed(0),
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => stockBadge(row),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) =>
        canAdjust ? (
          <button
            onClick={() => handleAdjust(row)}
            className="text-xs px-2 py-1 rounded bg-brand-50 hover:bg-brand-100 text-brand-700 border border-brand-200"
          >
            Adjust
          </button>
        ) : null,
    },
  ];

  const counts = useMemo(() => {
    let low = 0, out = 0;
    rows.forEach((r) => {
      const a = Number(r.quantity_available);
      const rl = Number(r.reorder_level || 0);
      if (a <= 0) out++;
      else if (rl > 0 && a <= rl) low++;
    });
    return { low, out, total: rows.length };
  }, [rows]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Inventory</h1>
          <p className="text-sm text-slate-500 mt-1">
            {filtered.length} rows • {counts.low} low • {counts.out} out of stock
          </p>
        </div>
        <button
          onClick={loadInventory}
          className="btn-secondary flex items-center gap-2"
          disabled={loading}
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="text-xs text-slate-500 uppercase">Total Records</div>
          <div className="text-2xl font-semibold mt-1">{counts.total}</div>
        </div>
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-4">
          <div className="text-xs text-amber-700 uppercase">Low Stock</div>
          <div className="text-2xl font-semibold text-amber-800 mt-1">{counts.low}</div>
        </div>
        <div className="rounded-lg border border-red-300 bg-red-50 p-4">
          <div className="text-xs text-red-700 uppercase">Out of Stock</div>
          <div className="text-2xl font-semibold text-red-800 mt-1">{counts.out}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                placeholder="Search by SKU or product..."
                className="input pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <select
            className="input"
            value={warehouseFilter}
            onChange={(e) => setWarehouseFilter(e.target.value)}
          >
            <option value="">All warehouses</option>
            {warehouses.map((w) => (
              <option key={w.warehouse_id} value={w.warehouse_id}>
                {w.warehouse_code} — {w.warehouse_name}
              </option>
            ))}
          </select>
          <select
            className="input"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All statuses</option>
            <option value="ok">OK</option>
            <option value="low">Low Stock</option>
            <option value="out">Out of Stock</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <DataTable
        columns={columns}
        rows={filtered}
        loading={loading}
        emptyMessage="No inventory records found. Create a purchase or adjust stock to populate."
      />

      <AdjustStockModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={handleSaved}
        row={selectedRow}
      />

      {toast && (
        <div className="fixed top-6 right-6 z-50 rounded-md border bg-green-50 border-green-300 text-green-800 px-4 py-3 shadow-lg">
          {toast.message}
        </div>
      )}
    </div>
  );
}