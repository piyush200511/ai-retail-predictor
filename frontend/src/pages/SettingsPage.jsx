import { useEffect, useState } from 'react';
import { Settings as SettingsIcon, Save, Loader2, AlertTriangle, RotateCcw } from 'lucide-react';
import { settingsApi } from '../api/endpoints';
import { useToast } from '../context/ToastContext';

export default function SettingsPage() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    low_stock_multiplier: '1.0',
    overstock_multiplier: '3.0',
    default_forecast_model: 'random_forest',
    default_forecast_horizon: '14',
    alert_email_enabled: 'false',
    alert_browser_enabled: 'true',
  });

  useEffect(() => {
    settingsApi.list()
      .then((res) => {
        const rows = res.data.results ?? res.data;
        const loaded = { ...form };
        rows.forEach((r) => {
          if (r.setting_key in loaded) loaded[r.setting_key] = r.setting_value;
        });
        setForm(loaded);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
    // eslint-disable-next-line
  }, []);

  const update = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await settingsApi.bulkUpdate(form);
      toast.success('Settings saved.');
    } catch (err) {
      toast.error('Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-slate-500 dark:text-slate-400 py-12 text-center">Loading settings...</div>;
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <SettingsIcon size={24} className="text-teal-600 dark:text-teal-400" />
          System Settings
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Configure system-wide preferences (Admin only)
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Stock Thresholds */}
        <div className="card">
          <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-4">
            Stock Thresholds
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Low Stock Multiplier</label>
              <input
                type="number" step="0.1" min="0.5" max="5"
                value={form.low_stock_multiplier}
                onChange={(e) => update('low_stock_multiplier', e.target.value)}
                className="input"
              />
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Alert when stock falls below this × reorder level
              </p>
            </div>
            <div>
              <label className="label">Overstock Multiplier</label>
              <input
                type="number" step="0.5" min="1" max="10"
                value={form.overstock_multiplier}
                onChange={(e) => update('overstock_multiplier', e.target.value)}
                className="input"
              />
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Flag as overstock when stock exceeds this × reorder level
              </p>
            </div>
          </div>
        </div>

        {/* Forecast Defaults */}
        <div className="card">
          <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-4">
            Forecast Defaults
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Default Model</label>
              <select
                value={form.default_forecast_model}
                onChange={(e) => update('default_forecast_model', e.target.value)}
                className="input"
              >
                <option value="moving_average">Moving Average</option>
                <option value="exponential_smoothing">Exponential Smoothing</option>
                <option value="random_forest">Random Forest</option>
                <option value="gradient_boosting">Gradient Boosting</option>
              </select>
            </div>
            <div>
              <label className="label">Default Horizon (days)</label>
              <input
                type="number" min="1" max="180"
                value={form.default_forecast_horizon}
                onChange={(e) => update('default_forecast_horizon', e.target.value)}
                className="input"
              />
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="card">
          <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-4">
            Notifications
          </h3>
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.alert_email_enabled === 'true'}
                onChange={(e) => update('alert_email_enabled', e.target.checked ? 'true' : 'false')}
                className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
              />
              <div>
                <div className="text-sm font-medium text-slate-800 dark:text-slate-200">
                  Email alerts on critical stock
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Send email when stock hits critical level
                </div>
              </div>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.alert_browser_enabled === 'true'}
                onChange={(e) => update('alert_browser_enabled', e.target.checked ? 'true' : 'false')}
                className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
              />
              <div>
                <div className="text-sm font-medium text-slate-800 dark:text-slate-200">
                  Browser notifications
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Show desktop notifications for new alerts
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* Save button */}
        <div className="flex justify-end">
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? (
              <><Loader2 size={14} className="animate-spin" /> Saving...</>
            ) : (
              <><Save size={14} /> Save Settings</>
            )}
          </button>
        </div>

        {/* Danger zone */}
        <div className="card border-red-300 dark:border-red-900 bg-red-50/50 dark:bg-red-950/20">
          <h3 className="font-semibold text-red-700 dark:text-red-300 flex items-center gap-2 mb-2">
            <AlertTriangle size={16} />
            Danger Zone
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">
            These actions cannot be undone. Proceed with caution.
          </p>
          <button
            type="button"
            onClick={() => toast.warning('Reset demo not implemented yet.')}
            className="btn-danger text-xs"
          >
            <RotateCcw size={14} /> Reset Demo Data
          </button>
        </div>
      </form>
    </div>
  );
}