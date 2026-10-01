import { useEffect, useState } from 'react';
import Modal from '../../components/Modal';
import FormField from '../../components/FormField';
import { warehousesApi } from '../../api/endpoints';

const emptyForm = {
  warehouse_code: '',
  warehouse_name: '',
  address: '',
  city: '',
  manager_name: '',
  is_active: true,
};

export default function WarehouseFormModal({ open, onClose, onSaved, warehouse }) {
  const isEdit = !!warehouse;
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (warehouse) {
      setForm({ ...emptyForm, ...warehouse });
    } else {
      setForm(emptyForm);
    }
    setError('');
  }, [warehouse, open]);

  const update = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      if (isEdit) {
        await warehousesApi.update(warehouse.warehouse_id, form);
      } else {
        await warehousesApi.create(form);
      }
      onSaved?.();
      onClose();
    } catch (err) {
      const data = err.response?.data;
      setError(
        typeof data === 'object'
          ? Object.entries(data).map(([k, v]) => `${k}: ${v}`).join(' | ')
          : 'Failed to save warehouse.'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? `Edit Warehouse — ${warehouse.warehouse_code}` : 'Add Warehouse'}
      size="md"
      footer={
        <>
          <button onClick={onClose} className="btn-secondary" type="button">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={saving} className="btn-primary">
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
          <FormField label="Warehouse Code *">
            <input
              className="input"
              value={form.warehouse_code}
              onChange={(e) => update('warehouse_code', e.target.value)}
              required
            />
          </FormField>

          <FormField label="Warehouse Name *">
            <input
              className="input"
              value={form.warehouse_name}
              onChange={(e) => update('warehouse_name', e.target.value)}
              required
            />
          </FormField>

          <FormField label="City">
            <input
              className="input"
              value={form.city}
              onChange={(e) => update('city', e.target.value)}
            />
          </FormField>

          <FormField label="Manager Name">
            <input
              className="input"
              value={form.manager_name}
              onChange={(e) => update('manager_name', e.target.value)}
            />
          </FormField>

          <div className="md:col-span-2">
            <FormField label="Address">
              <textarea
                className="input"
                rows={2}
                value={form.address}
                onChange={(e) => update('address', e.target.value)}
              />
            </FormField>
          </div>

          <FormField label="Active">
            <label className="flex items-center gap-2 mt-2">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => update('is_active', e.target.checked)}
              />
              <span className="text-sm text-slate-600">Warehouse is active</span>
            </label>
          </FormField>
        </div>
      </form>
    </Modal>
  );
}