import { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import Modal from '../../components/Modal';
import FormField from '../../components/FormField';
import {
  salesApi, productsApi, warehousesApi,
} from '../../api/endpoints';

const today = new Date().toISOString().split('T')[0];

export default function SalesOrderFormModal({ open, onClose, onSaved }) {
  const [form, setForm] = useState({
    customer: '',
    warehouse: '',
    order_date: today,
    notes: '',
  });
  const [items, setItems] = useState([
    { product: '', quantity: '1', unit_price: '0', discount_amount: '0', tax_rate: '0' },
  ]);
  const [customers, setCustomers] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    salesApi.customers().then((r) => setCustomers(r.data.results ?? r.data)).catch(() => {});
    warehousesApi.list().then((r) => setWarehouses(r.data.results ?? r.data)).catch(() => {});
    productsApi.list().then((r) => setProducts(r.data.results ?? r.data)).catch(() => {});
    setForm({ customer: '', warehouse: '', order_date: today, notes: '' });
    setItems([{ product: '', quantity: '1', unit_price: '0', discount_amount: '0', tax_rate: '0' }]);
    setError('');
  }, [open]);

  const updateForm = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const updateItem = (idx, key, value) => {
    setItems((arr) =>
      arr.map((it, i) => {
        if (i !== idx) return it;
        const next = { ...it, [key]: value };
        // Auto-fill unit_price when product is selected
        if (key === 'product' && value) {
          const p = products.find((x) => String(x.product_id) === String(value));
          if (p) next.unit_price = String(p.selling_price ?? '0');
        }
        return next;
      })
    );
  };

  const addItem = () =>
    setItems((arr) => [
      ...arr,
      { product: '', quantity: '1', unit_price: '0', discount_amount: '0', tax_rate: '0' },
    ]);

  const removeItem = (idx) =>
    setItems((arr) => arr.filter((_, i) => i !== idx));

  const lineTotal = (it) => {
    const qty = Number(it.quantity) || 0;
    const price = Number(it.unit_price) || 0;
    const disc = Number(it.discount_amount) || 0;
    const tax = Number(it.tax_rate) || 0;
    const base = qty * price - disc;
    return (base * (1 + tax / 100)).toFixed(2);
  };

  const orderTotal = () =>
    items.reduce((s, it) => s + Number(lineTotal(it)), 0).toFixed(2);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const payload = {
        customer: form.customer || null,
        warehouse: form.warehouse,
        order_date: form.order_date,
        notes: form.notes || '',
        items: items
          .filter((it) => it.product && Number(it.quantity) > 0)
          .map((it) => ({
            product: it.product,
            quantity: String(it.quantity),
            unit_price: String(it.unit_price),
            discount_amount: String(it.discount_amount || '0'),
            tax_rate: String(it.tax_rate || '0'),
          })),
      };
      if (!payload.warehouse) throw new Error('Warehouse is required.');
      if (!payload.items.length) throw new Error('At least one item is required.');

      await salesApi.create(payload);
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
        setError(err.message || 'Failed to create sales order.');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New Sales Order"
      size="lg"
      footer={
        <>
          <button onClick={onClose} className="btn-secondary" type="button">Cancel</button>
          <button onClick={handleSubmit} disabled={saving} className="btn-primary">
            {saving ? 'Creating...' : 'Create Order'}
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
          <FormField label="Customer">
            <select
              className="input"
              value={form.customer}
              onChange={(e) => updateForm('customer', e.target.value)}
            >
              <option value="">— Walk-in —</option>
              {customers.map((c) => (
                <option key={c.customer_id} value={c.customer_id}>
                  {c.customer_name}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Warehouse *">
            <select
              className="input"
              value={form.warehouse}
              onChange={(e) => updateForm('warehouse', e.target.value)}
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

          <FormField label="Order Date *">
            <input
              type="date"
              className="input"
              value={form.order_date}
              onChange={(e) => updateForm('order_date', e.target.value)}
              required
            />
          </FormField>

          <FormField label="Notes">
            <input
              className="input"
              value={form.notes}
              onChange={(e) => updateForm('notes', e.target.value)}
            />
          </FormField>
        </div>

        {/* Line Items */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium text-slate-800">Order Items</h3>
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
                  <th className="px-2 py-2 w-20">Qty</th>
                  <th className="px-2 py-2 w-24">Price</th>
                  <th className="px-2 py-2 w-20">Disc</th>
                  <th className="px-2 py-2 w-16">Tax%</th>
                  <th className="px-2 py-2 w-24 text-right">Total</th>
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
                        className="input text-xs"
                        value={it.quantity}
                        onChange={(e) => updateItem(idx, 'quantity', e.target.value)}
                      />
                    </td>
                    <td className="px-2 py-1">
                      <input
                        type="number"
                        step="0.01"
                        className="input text-xs"
                        value={it.unit_price}
                        onChange={(e) => updateItem(idx, 'unit_price', e.target.value)}
                      />
                    </td>
                    <td className="px-2 py-1">
                      <input
                        type="number"
                        step="0.01"
                        className="input text-xs"
                        value={it.discount_amount}
                        onChange={(e) => updateItem(idx, 'discount_amount', e.target.value)}
                      />
                    </td>
                    <td className="px-2 py-1">
                      <input
                        type="number"
                        step="0.01"
                        className="input text-xs"
                        value={it.tax_rate}
                        onChange={(e) => updateItem(idx, 'tax_rate', e.target.value)}
                      />
                    </td>
                    <td className="px-2 py-1 text-right text-xs font-medium">
                      Rs. {lineTotal(it)}
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

          <div className="mt-2 text-right text-sm text-slate-600">
            Estimated total:{' '}
            <span className="font-semibold text-slate-900">Rs. {orderTotal()}</span>
          </div>
        </div>
      </form>
    </Modal>
  );
}