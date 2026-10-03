import { useEffect, useState } from 'react';
import Modal from '../../components/Modal';
import FormField from '../../components/FormField';
import { salesApi } from '../../api/endpoints';

const emptyForm = {
  customer_code: '',
  customer_name: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  is_active: true,
};

export default function CustomerFormModal({ open, onClose, onSaved, customer }) {
  const isEdit = !!customer;
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (customer) {
      setForm({ ...emptyForm, ...customer });
    } else {
      setForm(emptyForm);
    }
    setError('');
  }, [customer, open]);

  const update = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      if (isEdit) {
        await salesApi.updateCustomer(customer.customer_id, form);
      } else {
        await salesApi.createCustomer(form);
      }
      onSaved?.();
      onClose();
    } catch (err) {
      const data = err.response?.data;
      setError(
        typeof data === 'object'
          ? Object.entries(data).map(([k, v]) => `${k}: ${v}`).join(' | ')
          : 'Failed to save customer.'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? `Edit Customer — ${customer.customer_code}` : 'Add Customer'}
      size="md"
      footer={
        <>
          <button onClick={onClose} className="btn-secondary" type="button">Cancel</button>
          <button onClick={handleSubmit} disabled={saving} className="btn-primary">
            {saving ? 'Saving...' : isEdit ? 'Update' : 'Create'}
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-md bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 p-3 text-sm text-red-700 dark:text-red-300">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Customer Code *">
            <input className="input" value={form.customer_code} onChange={(e) => update('customer_code', e.target.value)} required />
          </FormField>
          <FormField label="Customer Name *">
            <input className="input" value={form.customer_name} onChange={(e) => update('customer_name', e.target.value)} required />
          </FormField>
          <FormField label="Phone">
            <input className="input" value={form.phone} onChange={(e) => update('phone', e.target.value)} />
          </FormField>
          <FormField label="Email">
            <input type="email" className="input" value={form.email} onChange={(e) => update('email', e.target.value)} />
          </FormField>
          <FormField label="City">
            <input className="input" value={form.city} onChange={(e) => update('city', e.target.value)} />
          </FormField>
          <FormField label="Active">
            <label className="flex items-center gap-2 mt-2">
              <input type="checkbox" checked={form.is_active} onChange={(e) => update('is_active', e.target.checked)} />
              <span className="text-sm text-slate-600 dark:text-slate-400">Customer is active</span>
            </label>
          </FormField>
          <div className="md:col-span-2">
            <FormField label="Address">
              <textarea className="input" rows={2} value={form.address} onChange={(e) => update('address', e.target.value)} />
            </FormField>
          </div>
        </div>
      </form>
    </Modal>
  );
}