import { useEffect, useState, useMemo } from 'react';
import {
  Inbox, Mail, MailOpen, Star, StarOff, Search, Trash2,
  ArrowLeft, ExternalLink, Loader2, RefreshCw, Check,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { messagesApi } from '../api/endpoints';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

const CATEGORY_STYLES = {
  welcome:        { label: 'Welcome',    bg: 'bg-teal-50 dark:bg-teal-950/50',     text: 'text-teal-700 dark:text-teal-300',   border: 'border-teal-200 dark:border-teal-900' },
  system:         { label: 'System',     bg: 'bg-blue-50 dark:bg-blue-950/50',     text: 'text-blue-700 dark:text-blue-300',   border: 'border-blue-200 dark:border-blue-900' },
  tip:            { label: 'Tip',        bg: 'bg-amber-50 dark:bg-amber-950/50',   text: 'text-amber-700 dark:text-amber-300', border: 'border-amber-200 dark:border-amber-900' },
  broadcast:      { label: 'Broadcast',  bg: 'bg-violet-50 dark:bg-violet-950/50', text: 'text-violet-700 dark:text-violet-300', border: 'border-violet-200 dark:border-violet-900' },
  daily_summary:  { label: 'Summary',    bg: 'bg-emerald-50 dark:bg-emerald-950/50', text: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-200 dark:border-emerald-900' },
};

export default function InboxPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [selectedMsg, setSelectedMsg] = useState(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all'); // all | unread | starred

  const loadMessages = async () => {
    setLoading(true);
    try {
      const res = await messagesApi.list();
      setMessages(res.data.results ?? res.data);
    } catch {
      toast.error('Failed to load messages.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadMessages(); }, []);

  const openMessage = async (msg) => {
    setSelectedId(msg.message_id);
    // Fetch full message
    try {
      const res = await messagesApi.get(msg.message_id);
      setSelectedMsg(res.data);
      if (!res.data.is_read) {
        await messagesApi.markRead(msg.message_id);
        setMessages((prev) =>
          prev.map((m) => m.message_id === msg.message_id ? { ...m, is_read: true } : m)
        );
        setSelectedMsg((prev) => ({ ...prev, is_read: true }));
      }
    } catch {
      toast.error('Failed to open message.');
    }
  };

  const toggleStar = async (e, id) => {
    e.stopPropagation();
    try {
      await messagesApi.toggleStar(id);
      setMessages((prev) =>
        prev.map((m) => m.message_id === id ? { ...m, is_starred: !m.is_starred } : m)
      );
      if (selectedMsg?.message_id === id) {
        setSelectedMsg((prev) => ({ ...prev, is_starred: !prev.is_starred }));
      }
    } catch {}
  };

  const markAllRead = async () => {
    try {
      await messagesApi.markAllRead();
      setMessages((prev) => prev.map((m) => ({ ...m, is_read: true })));
      setSelectedMsg((prev) => prev ? { ...prev, is_read: true } : prev);
      toast.success('All messages marked as read.');
    } catch {
      toast.error('Failed.');
    }
  };

  const filtered = useMemo(() => {
    return messages.filter((m) => {
      if (filter === 'unread' && m.is_read) return false;
      if (filter === 'starred' && !m.is_starred) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          m.subject?.toLowerCase().includes(q) ||
          m.sender_name?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [messages, filter, search]);

  const unreadCount = messages.filter((m) => !m.is_read).length;

  const formatDate = (iso) => {
    const d = new Date(iso);
    const now = new Date();
    const diffDays = Math.floor((now - d) / 86400000);
    if (diffDays === 0) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (diffDays < 7) return d.toLocaleDateString([], { weekday: 'short' });
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <div>
      {/* Page header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Inbox size={24} className="text-teal-600 dark:text-teal-400" />
            Inbox
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {messages.length} message{messages.length !== 1 ? 's' : ''}
            {unreadCount > 0 && (
              <span className="ml-2 text-xs bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-300 px-2 py-0.5 rounded font-medium">
                {unreadCount} unread
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={loadMessages} className="btn-secondary flex items-center gap-2" disabled={loading}>
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="btn-secondary flex items-center gap-2">
              <Check size={16} /> Mark all read
            </button>
          )}
        </div>
      </div>

      {/* Main layout */}
      <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-card overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-5 min-h-[600px]">

          {/* List panel */}
          <div className="lg:col-span-2 border-r border-slate-200 dark:border-slate-800 flex flex-col">
            {/* Filters */}
            <div className="p-3 border-b border-slate-200 dark:border-slate-800 space-y-2">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search messages..."
                  className="input pl-9 text-sm"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="flex gap-1">
                {['all', 'unread', 'starred'].map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`flex-1 text-xs py-1.5 rounded-md font-medium capitalize transition ${
                      filter === f
                        ? 'bg-teal-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto max-h-[500px]">
              {loading ? (
                <div className="py-12 text-center text-slate-500 dark:text-slate-400 text-sm">
                  <Loader2 size={18} className="animate-spin inline-block mr-2" />
                  Loading...
                </div>
              ) : filtered.length === 0 ? (
                <div className="py-16 text-center">
                  <div className="inline-flex h-14 w-14 rounded-full bg-slate-100 dark:bg-slate-800 items-center justify-center mb-3">
                    <Mail size={22} className="text-slate-400" />
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {search ? 'No matches' : 'No messages'}
                  </p>
                </div>
              ) : (
                filtered.map((m) => {
                  const cat = CATEGORY_STYLES[m.category] || CATEGORY_STYLES.system;
                  const isActive = selectedId === m.message_id;
                  return (
                    <div
                      key={m.message_id}
                      onClick={() => openMessage(m)}
                      className={`flex items-start gap-3 px-4 py-3 border-b border-slate-100 dark:border-slate-800 cursor-pointer transition ${
                        isActive
                          ? 'bg-teal-50 dark:bg-teal-950/30'
                          : !m.is_read
                          ? 'bg-blue-50/30 dark:bg-blue-950/10 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      <div className={`flex-shrink-0 mt-1 ${!m.is_read ? 'text-teal-600 dark:text-teal-400' : 'text-slate-400'}`}>
                        {m.is_read ? <MailOpen size={16} /> : <Mail size={16} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className={`text-sm truncate ${!m.is_read ? 'font-semibold text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>
                            {m.subject}
                          </div>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 flex-shrink-0">
                            {formatDate(m.created_at)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded border ${cat.bg} ${cat.text} ${cat.border}`}>
                            {cat.label}
                          </span>
                          {m.sender_name && (
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                              from {m.sender_name}
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={(e) => toggleStar(e, m.message_id)}
                        className="flex-shrink-0 p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-amber-500 transition"
                      >
                        {m.is_starred ? (
                          <Star size={14} className="text-amber-500 fill-amber-500" />
                        ) : (
                          <Star size={14} />
                        )}
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Detail panel */}
          <div className="lg:col-span-3 flex flex-col">
            {!selectedMsg ? (
              <div className="flex-1 flex items-center justify-center text-center p-8">
                <div>
                  <div className="inline-flex h-16 w-16 rounded-full bg-slate-100 dark:bg-slate-800 items-center justify-center mb-3">
                    <Mail size={26} className="text-slate-400" />
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Select a message to read
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* Detail header */}
                <div className="p-5 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                      {selectedMsg.subject}
                    </h2>
                    <button
                      onClick={(e) => toggleStar(e, selectedMsg.message_id)}
                      className="flex-shrink-0 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-amber-500 transition"
                    >
                      {selectedMsg.is_starred ? (
                        <Star size={18} className="text-amber-500 fill-amber-500" />
                      ) : (
                        <Star size={18} />
                      )}
                    </button>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center text-white text-[10px] font-bold">
                        {(selectedMsg.sender_name || 'S')[0]}
                      </div>
                      <span className="text-slate-700 dark:text-slate-300 font-medium">
                        {selectedMsg.sender_name || 'System'}
                      </span>
                    </div>
                    <span>·</span>
                    <span>{new Date(selectedMsg.created_at).toLocaleString()}</span>
                    {(() => {
                      const cat = CATEGORY_STYLES[selectedMsg.category] || CATEGORY_STYLES.system;
                      return (
                        <span className={`text-[10px] px-2 py-0.5 rounded border ${cat.bg} ${cat.text} ${cat.border}`}>
                          {cat.label}
                        </span>
                      );
                    })()}
                  </div>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6">
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                      {selectedMsg.body}
                    </p>
                  </div>

                  {selectedMsg.link && (
                    <button
                      onClick={() => navigate(selectedMsg.link)}
                      className="mt-6 inline-flex items-center gap-2 rounded-md bg-gradient-to-r from-teal-600 to-cyan-600 text-white px-4 py-2 text-sm font-medium hover:from-teal-700 hover:to-cyan-700 transition"
                    >
                      <ExternalLink size={14} />
                      Open related page
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}