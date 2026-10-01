export default function Panel({ title, subtitle, actions, children, className = '' }) {
  return (
    <div className={`bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-card overflow-hidden ${className}`}>
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-slate-800 to-slate-700 text-white">
        <div className="flex items-center gap-3">
          <div className="h-1 w-6 rounded-full bg-gradient-to-r from-teal-400 to-cyan-500" />
          <div>
            <h3 className="text-sm font-semibold tracking-tight">{title}</h3>
            {subtitle && <p className="text-[11px] text-slate-400 mt-0.5">{subtitle}</p>}
          </div>
        </div>
        {actions && <div className="flex items-center gap-2 text-slate-300">{actions}</div>}
      </div>
      <div>{children}</div>
    </div>
  );
}