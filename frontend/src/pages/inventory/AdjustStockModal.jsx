import { useEffect, useState } from 'react';
import Modal from '../../components/Modal';
import FormField from '../../components/FormField';
import { inventoryApi } from '../../api/endpoints';

export default function AdjustStockModal({ open, onClose, onSaved, row }) {
  const [direction, setDirection] = useState('in');
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');
  const [unitCost, setUnitCost] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setDirection('in');
      setQuantity('');
      setReason('');
      setUnitCost('');
      setError('');
    }
  }, [open]);

  if (!row) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const payload = {
        warehouse: row.warehouse,
        product: row.product,
        quantity: String(quantity),
        direction,
        reason: reason || '',
      };
      if (direction === 'in' && unitCost) payload.unit_cost = String(unitCost);

      await inventoryApi.adjust(payload);
      onSaved?.();
      onClose();
    } catch (err) {
  const data = err.response?.data;
  const status = err.response?.status;
  let msg = 'Failed to adjust stock.';
  if (data) {
    if (typeof data === 'string') msg = data;
    else if (data.detail) msg = data.detail;
    else {
      msg = Object.entries(data)
        .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
        .join(' | ');
    }
  }
  setError(`[${status}] ${msg}`);
}
     finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Adjust Stock — ${row.product_sku}`}
      size="md"
      footer={
        <>
          <button onClick={onClose} className="btn-secondary" type="button">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={saving} className="btn-primary">
            {saving ? 'Applying...' : 'Apply Adjustment'}
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-slate-50 border border-slate-200 rounded p-3 text-sm">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-slate-500">Warehouse:</span>{' '}
              <span className="font-medium">{row.warehouse_code}</span>
            </div>
            <div>
              <span className="text-slate-500">Product:</span>{' '}
              <span className="font-medium">{row.product_name}</span>
            </div>
            <div>
              <span className="text-slate-500">Current stock:</span>{' '}
              <span className="font-medium">{row.quantity_on_hand}</span>
            </div>
            <div>
              <span className="text-slate-500">Available:</span>{' '}
              <span className="font-medium">{row.quantity_available}</span>
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <FormField label="Direction">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setDirection('in')}
              className={`flex-1 py-2 rounded border text-sm font-medium ${
                direction === 'in'
                  ? 'bg-green-100 border-green-300 text-green-800'
                  : 'bg-white border-slate-300 text-slate-600'
              }`}
            >
              ➕ Add Stock
            </button>
            <button
              type="button"
              onClick={() => setDirection('out')}
              className={`flex-1 py-2 rounded border text-sm font-medium ${
                direction === 'out'
                  ? 'bg-red-100 border-red-300 text-red-800'
                  : 'bg-white border-slate-300 text-slate-600'
              }`}
            >
              ➖ Remove Stock
            </button>
          </div>
        </FormField>

        <FormField label="Quantity *">
          <input
            type="number"
            step="0.001"
            min="0.001"
            className="input"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            required
          />
        </FormField>

        {direction === 'in' && (
          <FormField label="Unit Cost (optional)">
            <input
              type="number"
              step="0.01"
              className="input"
              value={unitCost}
              onChange={(e) => setUnitCost(e.target.value)}
            />
          </FormField>
        )}

        <FormField label="Reason">
          <textarea
            className="input"
            rows={2}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Found during audit, damaged goods..."
          />
        </FormField>
      </form>
    </Modal>
  );
}