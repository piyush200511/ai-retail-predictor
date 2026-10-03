import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell, AlertTriangle, TrendingUp, Package, DollarSign, Sparkles,
  Info, Check, Trash2, Loader2, Inbox,
} from 'lucide-react';
import { notificationsApi } from '../api/endpoints';

const TYPE_ICONS = {
  low_stock: AlertTriangle,
  stock_out_predicted: AlertTriangle,
  stock_received: Package,
  price_change: DollarSign,
  reorder_recommendation: Sparkles,
  forecast_ready: TrendingUp,
  system: Info,
};

const SEVERITY_STYLES = {
  info:     { dot: 'bg-blue-500',   icon: 'text-blue-600 dark:text-blue-400',       bg: 'bg-blue-50 dark:bg-blue-950/40' },
  warning:  { dot: 'bg-amber-500',  icon: 'text-amber-600 dark:text-amber-400',     bg: 'bg-amber-50 dark:bg-amber-950/40' },
  critical: { dot: 'bg-red-500',    icon: 'text-red-600 dark:text-red-400',         bg: 'bg-red-50 dark:bg-red-950/40' },
};

export default function NotificationBell() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const [listRes, countRes] = await Promise.all([
        notificationsApi.list(),
        notificationsApi.unreadCount(),
      ]);
      setNotifications((listRes.data.results ?? listRes.data).slice(0, 20));
      setUnread(countRes.data.count);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  // Initial load + polling every 60 seconds
  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  // Click outside to close
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleOpenToggle = () => {
    setOpen(!open);
    if (!open) loadNotifications();
  };

  const handleClickNotification = async (n) => {
    if (!n.is_read) {
      try {
        await notificationsApi.markRead(n.notification_id);
        setNotifications((prev) =>
          prev.map((x) => (x.notification_id === n.notification_id ? { ...x, is_read: true } : x))
        );
        setUnread((c) => Math.max(0, c - 1));
      } catch {}
    }
    if (n.link) {
      setOpen(false);
      navigate(n.link);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationsApi.markAllRead();
      setNotifications((prev) => prev.map((x) => ({ ...x, is_read: true })));
      setUnread(0);
    } catch {}
  };

  const handleClearAll = async () => {
    if (!confirm('Clear all notifications?')) return;
    try {
      await notificationsApi.clearAll();
      setNotifications([]);
      setUnread(0);
    } catch {}
  };

  const formatTime = (iso) => {
    if (!iso) return '';
    // Ensure ISO is parsed as UTC if no timezone suffix
    const normalizedIso = iso.includes('Z') || iso.includes('+') ? iso : iso + 'Z';
    const d = new Date(normalizedIso);
    const now = new Date();
    const diffMs = now - d;
    const diff = Math.floor(diffMs / 1000);

    if (diff < 0) return 'just now'; // future date — clock skew, treat as now
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return d.toLocaleDateString();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell trigger */}
      <button
        onClick={handleOpenToggle}
        className="flex relative p-2 rounded-md hover:bg-white/10 transition"
        title="Notifications"
      >
        <Bell size={18} />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center px-1 ring-2 ring-sidebar-light">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 mt-2 w-[380px] bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 rounded-lg shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-slide-up z-50">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm">Notifications</span>
              {unread > 0 && (
                <span className="text-xs bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 px-2 py-0.5 rounded-md font-medium">
                  {unread} new
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unread > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-teal-600 dark:hover:text-teal-400 transition"
                  title="Mark all as read"
                >
                  <Check size={14} />
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={handleClearAll}
                  className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-red-600 dark:hover:text-red-400 transition"
                  title="Clear all"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          </div>

          {/* List */}
          <div className="max-h-[420px] overflow-y-auto">
            {loading && notifications.length === 0 ? (
              <div className="py-12 text-center text-slate-500 dark:text-slate-400 text-sm">
                <Loader2 size={20} className="animate-spin inline-block mr-2" />
                Loading...
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-12 text-center">
                <div className="inline-flex h-14 w-14 rounded-full bg-slate-100 dark:bg-slate-800 items-center justify-center mb-3">
                  <Inbox size={22} className="text-slate-400" />
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400">You're all caught up!</p>
              </div>
            ) : (
              notifications.map((n) => {
                const Icon = TYPE_ICONS[n.notification_type] || Info;
                const sev = SEVERITY_STYLES[n.severity] || SEVERITY_STYLES.info;
                return (
                  <button
                    key={n.notification_id}
                    onClick={() => handleClickNotification(n)}
                    className={`w-full flex items-start gap-3 px-4 py-3 text-left border-b border-slate-100 dark:border-slate-800 last:border-b-0 transition ${
                      !n.is_read
                        ? 'bg-teal-50/50 dark:bg-teal-950/20 hover:bg-teal-50 dark:hover:bg-teal-950/30'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <div className={`flex-shrink-0 h-8 w-8 rounded-lg ${sev.bg} flex items-center justify-center mt-0.5`}>
                      <Icon size={15} className={sev.icon} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2">
                        <div className={`text-sm flex-1 ${!n.is_read ? 'font-semibold text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>
                          {n.title}
                        </div>
                        {!n.is_read && (
                          <span className={`h-1.5 w-1.5 rounded-full ${sev.dot} mt-1.5 flex-shrink-0`} />
                        )}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                        {n.message}
                      </div>
                      <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                        {formatTime(n.created_at)}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-2 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 text-center">
              <button
                onClick={() => { setOpen(false); navigate('/alerts'); }}
                className="text-xs text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300 font-medium"
              >
                View all activity
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}