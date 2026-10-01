import { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import Modal from '../../components/Modal';
import FormField from '../../components/FormField';
import { transfersApi, productsApi, warehousesApi } from '../../api/endpoints';

export default function TransferFormModal({ open, onClose, onSaved }) {
  const [form, setForm] = useState({
    from_warehouse: '',
    to_warehouse: '',
    notes: '',
  });
  const [items, setItems] = useState([{ product: '', quantity: '1' }]);
  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    warehousesApi.list().then((r) => setWarehouses(r.data.results ?? r.data)).catch(() => {});
    productsApi.list().then((r) => setProducts(r.data.results ?? r.data)).catch(() => {});
    setForm({ from_warehouse: '', to_warehouse: '', notes: '' });
    setItems([{ product: '', quantity: '1' }]);
    setError('');
  }, [open]);

  const updateForm = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const updateItem = (idx, key, value) => {
    setItems((arr) => arr.map((it, i) => (i === idx ? { ...it, [key]: value } : it)));
  };

  const addItem = () =>
    setItems((arr) => [...arr, { product: '', quantity: '1' }]);

  const removeItem = (idx) =>
    setItems((arr) => arr.filter((_, i) => i !== idx));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const payload = {
        from_warehouse: form.from_warehouse,
        to_warehouse: form.to_warehouse,
        notes: form.notes || '',
        items: items
          .filter((it) => it.product && Number(it.quantity) > 0)
          .map((it) => ({
            product: it.product,
            quantity: String(it.quantity),
          })),
      };

      if (!payload.from_warehouse) throw new Error('Source warehouse is required.');
      if (!payload.to_warehouse) throw new Error('Destination warehouse is required.');
      if (payload.from_warehouse === payload.to_warehouse)
        throw new Error('Source and destination must be different.');
      if (!payload.items.length) throw new Error('At least one item is required.');

      await transfersApi.create(payload);
      onSaved?.();
      onClose();
    } catch (err) {
      const data = err.response?.data;
      if (data) {
        setError(
          typeof data === 'object'
            ? Object.entries(data)
                .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
                .join(' | ')
            : data
        );
      } else {
        setError(err.message || 'Failed to create transfer.');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New Stock Transfer"
      size="lg"
      footer={
        <>
          <button onClick={onClose} className="btn-secondary" type="button">Cancel</button>
          <button onClick={handleSubmit} disabled={saving} className="btn-primary">
            {saving ? 'Creating...' : 'Create Transfer'}
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="From Warehouse *">
            <select
              className="input"
              value={form.from_warehouse}
              onChange={(e) => updateForm('from_warehouse', e.target.value)}
              required
            >
              <option value="">— Select —</option>
              {warehouses.map((w) => (
                <option key={w.warehouse_id} value={w.warehouse_id}>
                  {w.warehouse_code} — {w.warehouse_name}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="To Warehouse *">
            <select
              className="input"
              value={form.to_warehouse}
              onChange={(e) => updateForm('to_warehouse', e.target.value)}
              required
            >
              <option value="">— Select —</option>
              {warehouses.map((w) => (
                <option key={w.warehouse_id} value={w.warehouse_id}>
                  {w.warehouse_code} — {w.warehouse_name}
                </option>
              ))}
            </select>
          </FormField>

          <div className="md:col-span-2">
            <FormField label="Notes">
              <input
                className="input"
                value={form.notes}
                onChange={(e) => updateForm('notes', e.target.value)}
              />
            </FormField>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium text-slate-800">Items</h3>
            <button
              type="button"
              onClick={addItem}
              className="text-sm flex items-center gap-1 text-brand-600 hover:text-brand-700"
            >
              <Plus size={14} /> Add line
            </button>
          </div>

          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-2 py-2 text-left">Product</th>
                  <th className="px-2 py-2 w-28">Quantity</th>
                  <th className="px-2 py-2 w-8"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((it, idx) => (
                  <tr key={idx}>
                    <td className="px-2 py-1">
                      <select
                        className="input text-xs"
                        value={it.product}
                        onChange={(e) => updateItem(idx, 'product', e.target.value)}
                      >
                        <option value="">— Select —</option>
                        {products.map((p) => (
                          <option key={p.product_id} value={p.product_id}>
                            {p.sku} — {p.product_name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-2 py-1">
                      <input
                        type="number"
                        step="0.001"
                        min="0.001"
                        className="input text-xs"
                        value={it.quantity}
                        onChange={(e) => updateItem(idx, 'quantity', e.target.value)}
                      />
                    </td>
                    <td className="px-2 py-1">
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeItem(idx)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="mt-2 text-xs text-slate-500">
            💡 Stock is deducted from the source warehouse when dispatched, and added to the destination when received.
          </p>
        </div>
      </form>
    </Modal>
  );
}