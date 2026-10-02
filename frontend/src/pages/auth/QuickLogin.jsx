import { useState } from 'react';
import { ChevronDown, Zap } from 'lucide-react';

const DEMO_USERS = [
  { role: 'admin',             email: 'admin@example.com',     label: 'Admin',      sublabel: 'Full access',        emoji: '👑' },
  { role: 'analyst',           email: 'analyst@example.com',   label: 'Analyst',    sublabel: 'Insights & AI',      emoji: '📊' },
  { role: 'inventory_manager', email: 'inventory@example.com', label: 'Inventory',  sublabel: 'Stock & Purchase',   emoji: '📦' },
  { role: 'purchase_manager',  email: 'purchase@example.com',  label: 'Purchase',   sublabel: 'Suppliers & POs',    emoji: '🛒' },
  { role: 'sales_manager',     email: 'sales@example.com',     label: 'Sales',      sublabel: 'Orders & Customers', emoji: '💰' },
];

const PASSWORD = 'Demo@123';

export default function QuickLogin({ onFill }) {
  const [open, setOpen] = useState(false);

  const handleClick = (user) => {
    onFill(user.email, PASSWORD);
    setOpen(false);
  };

  return (
    <div className="mt-6 relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 hover:border-teal-500/40 px-4 py-3 transition-all duration-150 backdrop-blur"
      >
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-md bg-gradient-to-br from-teal-500/30 to-cyan-500/30 border border-teal-400/30 flex items-center justify-center">
            <Zap size={13} className="text-teal-300" />
          </div>
          <span className="text-sm font-medium text-slate-200">Quick demo sign-in</span>
        </div>
        <ChevronDown
          size={16}
          className={`text-slate-500 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown opens DOWNWARD */}
      {open && (
        <div className="absolute top-full left-0 right-0 mt-2 z-30 rounded-lg border border-white/10 bg-slate-900/95 backdrop-blur-xl shadow-2xl overflow-hidden animate-slide-up">
          <div className="py-1.5 max-h-[260px] overflow-y-auto">
            {DEMO_USERS.map((u) => (
              <button
                key={u.role}
                onClick={() => handleClick(u)}
                className="group w-full flex items-center gap-3 px-4 py-2.5 hover:bg-teal-500/10 transition-colors"
              >
                <span className="text-lg flex-shrink-0 w-6 text-center">{u.emoji}</span>
                <div className="flex-1 min-w-0 text-left">
                  <div className="text-sm font-medium text-white truncate">
                    {u.label}
                  </div>
                  <div className="text-[11px] text-slate-400 truncate">
                    {u.sublabel}
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div className="px-4 py-2 border-t border-white/5 bg-black/30">
            <p className="text-[10px] text-slate-500 text-center">
              Tap a role to auto-fill · then press Sign in
            </p>
          </div>
        </div>
      )}
    </div>
  );
}