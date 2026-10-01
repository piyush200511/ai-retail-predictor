import { useState, useEffect } from 'react';
import Modal from '../../components/Modal';
import FormField from '../../components/FormField';
import { forecastingApi } from '../../api/endpoints';

export default function StartForecastModal({ open, onClose, onSaved }) {
  const [runName, setRunName] = useState('');
  const [modelName, setModelName] = useState('random_forest');
  const [horizon, setHorizon] = useState('14');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setRunName(`Run ${new Date().toLocaleString()}`);
      setModelName('random_forest');
      setHorizon('14');
      setError('');
    }
  }, [open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await forecastingApi.startRun({
        run_name: runName,
        model_name: modelName,
        forecast_horizon_days: Number(horizon),
      });
      onSaved?.();
      onClose();
    } catch (err) {
      const data = err.response?.data;
      setError(
        typeof data === 'object'
          ? Object.entries(data).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join(' | ')
          : 'Failed to start forecast.'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Start New Forecast"
      size="md"
      footer={
        <>
          <button onClick={onClose} className="btn-secondary" type="button">Cancel</button>
          <button onClick={handleSubmit} disabled={saving} className="btn-primary">
            {saving ? 'Running ML...' : 'Run Forecast'}
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

        <FormField label="Run Name *">
          <input
            className="input"
            value={runName}
            onChange={(e) => setRunName(e.target.value)}
            required
          />
        </FormField>

        <FormField label="Model">
          <select
            className="input"
            value={modelName}
            onChange={(e) => setModelName(e.target.value)}
          >
            <option value="moving_average">Moving Average (baseline)</option>
            <option value="exponential_smoothing">Exponential Smoothing</option>
            <option value="random_forest">Random Forest (recommended)</option>
            <option value="gradient_boosting">Gradient Boosting</option>
          </select>
        </FormField>

        <FormField label="Forecast Horizon (days) *">
          <input
            type="number"
            min="1"
            max="180"
            className="input"
            value={horizon}
            onChange={(e) => setHorizon(e.target.value)}
            required
          />
        </FormField>

        <div className="text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded p-3">
          💡 <strong>Tip:</strong> This trains the model on your daily demand history and generates forecasts + reorder recommendations. Takes a few seconds.
        </div>
      </form>
    </Modal>
  );
}