import { useEffect, useState } from 'react';
import Modal from '../../components/Modal';
import FormField from '../../components/FormField';
import {
  productsApi, categoriesApi, brandsApi, unitsApi,
} from '../../api/endpoints';

const emptyForm = {
  sku: '',
  product_name: '',
  category: '',
  brand: '',
  unit: '',
  cost_price: '0',
  selling_price: '0',
  reorder_level: '0',
  reorder_quantity: '0',
  lead_time_days: '0',
  safety_stock: '0',
  is_active: true,
};

export default function ProductFormModal({ open, onClose, onSaved, product }) {
  const isEdit = !!product;
  const [form, setForm] = useState(emptyForm);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [units, setUnits] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Load reference data once
  useEffect(() => {
    if (!open) return;
    categoriesApi.list().then((r) => setCategories(r.data.results ?? r.data)).catch(() => {});
    brandsApi.list().then((r) => setBrands(r.data.results ?? r.data)).catch(() => {});
    unitsApi.list().then((r) => setUnits(r.data.results ?? r.data)).catch(() => {});
  }, [open]);

  // Populate form when editing
  useEffect(() => {
    if (product) {
      setForm({
        ...emptyForm,
        ...product,
        category: product.category ?? '',
        brand: product.brand ?? '',
        unit: product.unit ?? '',
        cost_price: String(product.cost_price ?? '0'),
        selling_price: String(product.selling_price ?? '0'),
        reorder_level: String(product.reorder_level ?? '0'),
        reorder_quantity: String(product.reorder_quantity ?? '0'),
        lead_time_days: String(product.lead_time_days ?? '0'),
        safety_stock: String(product.safety_stock ?? '0'),
      });
    } else {
      setForm(emptyForm);
    }
    setError('');
  }, [product, open]);

  const update = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const payload = {
        ...form,
        category: form.category || null,
        brand: form.brand || null,
        unit: form.unit || null,
      };
      if (isEdit) {
        await productsApi.update(product.product_id, payload);
      } else {
        await productsApi.create(payload);
      }
      onSaved?.();
      onClose();
    } catch (err) {
      const data = err.response?.data;
      setError(
        typeof data === 'object'
          ? Object.entries(data).map(([k, v]) => `${k}: ${v}`).join(' | ')
          : 'Failed to save product.'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? `Edit Product — ${product.sku}` : 'Add Product'}
      size="lg"
      footer={
        <>
          <button onClick={onClose} className="btn-secondary" type="button">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="btn-primary"
          >
            {saving ? 'Saving...' : isEdit ? 'Update' : 'Create'}
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
          <FormField label="SKU *">
            <input
              className="input"
              value={form.sku}
              onChange={(e) => update('sku', e.target.value)}
              required
            />
          </FormField>

          <FormField label="Product Name *">
            <input
              className="input"
              value={form.product_name}
              onChange={(e) => update('product_name', e.target.value)}
              required
            />
          </FormField>

          <FormField label="Category">
            <select
              className="input"
              value={form.category}
              onChange={(e) => update('category', e.target.value)}
            >
              <option value="">— None —</option>
              {categories.map((c) => (
                <option key={c.category_id} value={c.category_id}>
                  {c.category_name}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Brand">
            <select
              className="input"
              value={form.brand}
              onChange={(e) => update('brand', e.target.value)}
            >
              <option value="">— None —</option>
              {brands.map((b) => (
                <option key={b.brand_id} value={b.brand_id}>
                  {b.brand_name}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Unit">
            <select
              className="input"
              value={form.unit}
              onChange={(e) => update('unit', e.target.value)}
            >
              <option value="">— None —</option>
              {units.map((u) => (
                <option key={u.unit_id} value={u.unit_id}>
                  {u.unit_name} ({u.short_code})
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Cost Price">
            <input
              type="number"
              step="0.01"
              className="input"
              value={form.cost_price}
              onChange={(e) => update('cost_price', e.target.value)}
            />
          </FormField>

          <FormField label="Selling Price">
            <input
              type="number"
              step="0.01"
              className="input"
              value={form.selling_price}
              onChange={(e) => update('selling_price', e.target.value)}
            />
          </FormField>

          <FormField label="Reorder Level">
            <input
              type="number"
              step="0.001"
              className="input"
              value={form.reorder_level}
              onChange={(e) => update('reorder_level', e.target.value)}
            />
          </FormField>

          <FormField label="Reorder Quantity">
            <input
              type="number"
              step="0.001"
              className="input"
              value={form.reorder_quantity}
              onChange={(e) => update('reorder_quantity', e.target.value)}
            />
          </FormField>

          <FormField label="Lead Time (days)">
            <input
              type="number"
              className="input"
              value={form.lead_time_days}
              onChange={(e) => update('lead_time_days', e.target.value)}
            />
          </FormField>

          <FormField label="Safety Stock">
            <input
              type="number"
              step="0.001"
              className="input"
              value={form.safety_stock}
              onChange={(e) => update('safety_stock', e.target.value)}
            />
          </FormField>

          <FormField label="Active">
            <label className="flex items-center gap-2 mt-2">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => update('is_active', e.target.checked)}
              />
              <span className="text-sm text-slate-600">Product is active</span>
            </label>
          </FormField>
        </div>
      </form>
    </Modal>
  );
}