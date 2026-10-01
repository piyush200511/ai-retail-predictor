import Sparkline from './Sparkline';

export default function KpiTile({
  label,
  value,
  delta,
  deltaLabel,
  icon: Icon,
  accent = 'teal',
  sparkData,
  isCurrency = false,
}) {
  const accents = {
    teal:    { bg: 'bg-teal-50 dark:bg-teal-950/40',       text: 'text-teal-600 dark:text-teal-400',       border: 'border-teal-200 dark:border-teal-900/50',       line: '#14b8a6' },
    blue:    { bg: 'bg-blue-50 dark:bg-blue-950/40',       text: 'text-blue-600 dark:text-blue-400',       border: 'border-blue-200 dark:border-blue-900/50',       line: '#3b82f6' },
    amber:   { bg: 'bg-amber-50 dark:bg-amber-950/40',     text: 'text-amber-600 dark:text-amber-400',     border: 'border-amber-200 dark:border-amber-900/50',     line: '#f59e0b' },
    violet:  { bg: 'bg-violet-50 dark:bg-violet-950/40',   text: 'text-violet-600 dark:text-violet-400',   border: 'border-violet-200 dark:border-violet-900/50',   line: '#8b5cf6' },
    emerald: { bg: 'bg-emerald-50 dark:bg-emerald-950/40', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-900/50', line: '#10b981' },
    rose:    { bg: 'bg-rose-50 dark:bg-rose-950/40',       text: 'text-rose-600 dark:text-rose-400',       border: 'border-rose-200 dark:border-rose-900/50',       line: '#f43f5e' },
  };

  const a = accents[accent] || accents.teal;
  const isUp = delta > 0;
  const isDown = delta < 0;

  const displayValue = isCurrency
    ? `₹${Number(value).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
    : typeof value === 'number'
      ? value.toLocaleString('en-IN')
      : value;

  return (
    <div className="stat-tile group">
      <div className="flex items-start justify-between mb-2">
        <div className={`h-10 w-10 rounded-lg ${a.bg} ${a.border} border flex items-center justify-center`}>
          {Icon && <Icon size={18} className={a.text} />}
        </div>
        {delta !== undefined && delta !== null && (
          <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-md ${
            isUp ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400' :
            isDown ? 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400' :
            'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
          }`}>
            {isUp ? '▲' : isDown ? '▼' : '—'}
            {Math.abs(delta).toFixed(1)}%
          </span>
        )}
      </div>

      <div className="stat-label">{label}</div>
      <div className="stat-value">{displayValue}</div>
      {deltaLabel && (
        <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{deltaLabel}</div>
      )}

      {sparkData && (
        <div className="mt-3 -mb-2">
          <Sparkline data={sparkData} color={a.line} height={36} />
        </div>
      )}
    </div>
  );
}