import { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'success', duration = 3500) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = {
    success: (msg, duration) => addToast(msg, 'success', duration),
    error: (msg, duration) => addToast(msg, 'error', duration),
    info: (msg, duration) => addToast(msg, 'info', duration),
    warning: (msg, duration) => addToast(msg, 'warning', duration),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}

      <div className="fixed top-6 right-6 z-[100] flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <Toast key={t.id} toast={t} onClose={() => removeToast(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
}

function Toast({ toast, onClose }) {
  const { type, message } = toast;

  // Auto-adapt: uses CSS theme tokens so the same toast looks native in light + dark
  const variants = {
    success: {
      wrapper: 'bg-white dark:bg-emerald-950/90 border-emerald-200 dark:border-emerald-800/60 text-emerald-900 dark:text-emerald-100',
      icon: <CheckCircle size={18} className="text-emerald-600 dark:text-emerald-400" />,
      bar: 'bg-emerald-500',
    },
    error: {
      wrapper: 'bg-white dark:bg-red-950/90 border-red-200 dark:border-red-800/60 text-red-900 dark:text-red-100',
      icon: <XCircle size={18} className="text-red-600 dark:text-red-400" />,
      bar: 'bg-red-500',
    },
    warning: {
      wrapper: 'bg-white dark:bg-amber-950/90 border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-100',
      icon: <AlertTriangle size={18} className="text-amber-600 dark:text-amber-400" />,
      bar: 'bg-amber-500',
    },
    info: {
      wrapper: 'bg-white dark:bg-slate-900/95 border-slate-200 dark:border-teal-800/60 text-slate-900 dark:text-teal-100',
      icon: <Info size={18} className="text-teal-600 dark:text-teal-400" />,
      bar: 'bg-teal-500',
    },
  };

  const v = variants[type] || variants.info;

  return (
    <div
      className={`pointer-events-auto relative flex items-start gap-3 rounded-lg border shadow-xl px-4 py-3 min-w-[280px] max-w-md animate-slide-in backdrop-blur ${v.wrapper}`}
      role="alert"
    >
      {/* Left colored bar */}
      <span className={`absolute left-0 top-2 bottom-2 w-1 rounded-r ${v.bar}`} />

      <div className="flex-shrink-0 mt-0.5 ml-1">{v.icon}</div>
      <div className="flex-1 text-sm font-medium pr-1">{message}</div>
      <button
        onClick={onClose}
        className="flex-shrink-0 p-0.5 rounded hover:bg-black/5 dark:hover:bg-white/10 transition"
        aria-label="Close"
      >
        <X size={14} />
      </button>
    </div>
  );
}