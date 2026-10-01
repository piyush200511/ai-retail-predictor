import { useEffect, useState } from 'react';
import Modal from '../../components/Modal';
import FormField from '../../components/FormField';
import { suppliersApi } from '../../api/endpoints';

const emptyForm = {
  supplier_code: '',
  supplier_name: '',
  contact_person: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  status: 'active',
};

export default function SupplierFormModal({ open, onClose, onSaved, supplier }) {
  const isEdit = !!supplier;
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (supplier) {
      setForm({ ...emptyForm, ...supplier });
    } else {
      setForm(emptyForm);
    }
    setError('');
  }, [supplier, open]);

  const update = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      if (isEdit) {
        await suppliersApi.update(supplier.supplier_id, form);
      } else {
        await suppliersApi.create(form);
      }
      onSaved?.();
      onClose();
    } catch (err) {
      const data = err.response?.data;
      setError(
        typeof data === 'object'
          ? Object.entries(data).map(([k, v]) => `${k}: ${v}`).join(' | ')
          : 'Failed to save supplier.'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? `Edit Supplier — ${supplier.supplier_code}` : 'Add Supplier'}
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
          <FormField label="Supplier Code *">
            <input
              className="input"
              value={form.supplier_code}
              onChange={(e) => update('supplier_code', e.target.value)}
              required
            />
          </FormField>

          <FormField label="Supplier Name *">
            <input
              className="input"
              value={form.supplier_name}
              onChange={(e) => update('supplier_name', e.target.value)}
              required
            />
          </FormField>

          <FormField label="Contact Person">
            <input
              className="input"
              value={form.contact_person}
              onChange={(e) => update('contact_person', e.target.value)}
            />
          </FormField>

          <FormField label="Phone">
            <input
              className="input"
              value={form.phone}
              onChange={(e) => update('phone', e.target.value)}
            />
          </FormField>

          <FormField label="Email">
            <input
              type="email"
              className="input"
              value={form.email}
              onChange={(e) => update('email', e.target.value)}
            />
          </FormField>

          <FormField label="City">
            <input
              className="input"
              value={form.city}
              onChange={(e) => update('city', e.target.value)}
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

          <FormField label="Status">
            <select
              className="input"
              value={form.status}
              onChange={(e) => update('status', e.target.value)}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </FormField>
        </div>
      </form>
    </Modal>
  );
}