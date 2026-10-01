import { useEffect, useState } from 'react';
import Modal from '../../components/Modal';
import FormField from '../../components/FormField';
import { purchasesApi } from '../../api/endpoints';

const today = new Date().toISOString().split('T')[0];

export default function ReceiveGoodsModal({ open, onClose, onSaved, order }) {
  const [receivedDate, setReceivedDate] = useState(today);
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open || !order) return;
    // Build form from PO items — default received = remaining, accepted = remaining, rejected = 0
    const built = (order.items || []).map((it) => {
      const remaining = Number(it.ordered_quantity) - Number(it.received_quantity || 0);
      return {
        product: it.product,
        product_sku: it.product_sku,
        product_name: it.product_name,
        remaining,
        received_quantity: String(Math.max(remaining, 0)),
        accepted_quantity: String(Math.max(remaining, 0)),
        rejected_quantity: '0',
      };
    });
    setItems(built);
    setReceivedDate(today);
    setNotes('');
    setError('');
  }, [open, order]);

  if (!order) return null;

  const updateItem = (idx, key, value) => {
    setItems((arr) =>
      arr.map((it, i) => {
        if (i !== idx) return it;
        const next = { ...it, [key]: value };
        // Auto: accepted = received - rejected
        if (key === 'received_quantity' || key === 'rejected_quantity') {
          const r = Number(next.received_quantity) || 0;
          const rj = Number(next.rejected_quantity) || 0;
          next.accepted_quantity = String(Math.max(r - rj, 0));
        }
        return next;
      })
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const payload = {
        received_date: receivedDate,
        notes,
        items: items
          .filter((it) => Number(it.received_quantity) > 0)
          .map((it) => ({
            product_id: it.product,
            received_quantity: String(it.received_quantity),
            accepted_quantity: String(it.accepted_quantity),
            rejected_quantity: String(it.rejected_quantity || 0),
          })),
      };
      if (!payload.items.length) throw new Error('Enter at least one received quantity.');

      await purchasesApi.receive(order.purchase_order_id, payload);
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
        setError(err.message || 'Failed to receive goods.');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Receive Goods — ${order.po_number}`}
      size="lg"
      footer={
        <>
          <button onClick={onClose} className="btn-secondary" type="button">Cancel</button>
          <button onClick={handleSubmit} disabled={saving} className="btn-primary">
            {saving ? 'Receiving...' : 'Receive & Update Stock'}
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
          <FormField label="Received Date *">
            <input
              type="date"
              className="input"
              value={receivedDate}
              onChange={(e) => setReceivedDate(e.target.value)}
              required
            />
          </FormField>

          <FormField label="Notes">
            <input
              className="input"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </FormField>
        </div>

        <div>
          <h3 className="font-medium text-slate-800 mb-2">Received Quantities</h3>
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-3 py-2 text-left">Product</th>
                  <th className="px-3 py-2 w-20 text-right">Remaining</th>
                  <th className="px-3 py-2 w-24">Received</th>
                  <th className="px-3 py-2 w-24">Accepted</th>
                  <th className="px-3 py-2 w-24">Rejected</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((it, idx) => (
                  <tr key={idx}>
                    <td className="px-3 py-2">
                      <div className="font-mono text-xs text-slate-600">{it.product_sku}</div>
                      <div className="text-xs text-slate-500">{it.product_name}</div>
                    </td>
                    <td className="px-3 py-2 text-right text-slate-600">{it.remaining}</td>
                    <td className="px-3 py-1">
                      <input
                        type="number"
                        step="0.001"
                        min="0"
                        className="input text-xs"
                        value={it.received_quantity}
                        onChange={(e) => updateItem(idx, 'received_quantity', e.target.value)}
                      />
                    </td>
                    <td className="px-3 py-1">
                      <input
                        type="number"
                        step="0.001"
                        min="0"
                        className="input text-xs"
                        value={it.accepted_quantity}
                        onChange={(e) => updateItem(idx, 'accepted_quantity', e.target.value)}
                      />
                    </td>
                    <td className="px-3 py-1">
                      <input
                        type="number"
                        step="0.001"
                        min="0"
                        className="input text-xs"
                        value={it.rejected_quantity}
                        onChange={(e) => updateItem(idx, 'rejected_quantity', e.target.value)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Only accepted quantities increment inventory. Accepted + rejected must equal received.
          </p>
        </div>
      </form>
    </Modal>
  );
}