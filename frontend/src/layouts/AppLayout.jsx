import { useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Package, Users, Warehouse, ShoppingCart,
  ShoppingBag, ArrowLeftRight, Bell, TrendingUp, BarChart3,
  FileText, LogOut, Boxes, Search, Mail, ChevronDown,
  Menu, X, Settings, User as UserIcon, Moon, Sun,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import Avatar from '../components/Avatar';

const MENU_SECTIONS = [
  {
    label: 'Main',
    items: [
      { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'inventory_manager', 'sales_manager', 'purchase_manager', 'analyst'] },
      { to: '/analytics', label: 'Analytics', icon: BarChart3, roles: ['admin', 'analyst', 'sales_manager'] },
      { to: '/reports', label: 'Reports', icon: FileText, roles: ['admin', 'analyst'] },
    ],
  },
  {
    label: 'Catalog',
    items: [
      { to: '/products', label: 'Products', icon: Package, roles: ['admin', 'inventory_manager', 'sales_manager', 'purchase_manager', 'analyst'] },
      { to: '/suppliers', label: 'Suppliers', icon: Users, roles: ['admin', 'purchase_manager'] },
      { to: '/warehouses', label: 'Warehouses', icon: Warehouse, roles: ['admin', 'inventory_manager'] },
    ],
  },
  {
    label: 'Operations',
    items: [
      { to: '/inventory', label: 'Inventory', icon: Boxes, roles: ['admin', 'inventory_manager', 'analyst'] },
      { to: '/transfers', label: 'Transfers', icon: ArrowLeftRight, roles: ['admin', 'inventory_manager'] },
      { to: '/purchases', label: 'Purchases', icon: ShoppingCart, roles: ['admin', 'purchase_manager'] },
      { to: '/sales', label: 'Sales', icon: ShoppingBag, roles: ['admin', 'sales_manager'] },
    ],
  },
  {
    label: 'Intelligence',
    items: [
      { to: '/forecasts', label: 'Forecasts', icon: TrendingUp, roles: ['admin', 'analyst', 'inventory_manager'] },
      { to: '/alerts', label: 'Alerts', icon: Bell, roles: ['admin', 'inventory_manager', 'sales_manager', 'purchase_manager', 'analyst'] },
    ],
  },
];

export default function AppLayout() {
  const { user, logout } = useAuth();
  const { isDark, toggle: toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const visibleSections = MENU_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter((i) => i.roles.includes(user?.role)),
  })).filter((s) => s.items.length > 0);

  const currentItem = MENU_SECTIONS.flatMap((s) => s.items).find(
    (i) => i.to === location.pathname
  );
  const pageName = currentItem?.label || 'Dashboard';

  return (
    <div className="min-h-screen flex bg-slate-100 dark:bg-slate-950">

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen w-64 bg-gradient-to-b from-sidebar to-sidebar-dark text-slate-300 flex flex-col z-40 transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand */}
        <div className="flex items-center gap-3 px-5 h-16 border-b border-white/5 flex-shrink-0">
          <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center shadow-lg shadow-teal-500/30">
            <Boxes size={20} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold text-white tracking-tight leading-tight">
              AI Retail
            </div>
            <div className="text-[10px] text-slate-400 tracking-wide uppercase">
              Demand · Inventory
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1 text-slate-400 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        {/* User card */}
        <div className="mx-3 mt-4 p-3 rounded-lg bg-white/5 border border-white/5 flex items-center gap-3">
          <Avatar
            name={user?.name}
            email={user?.email}
            role={user?.role}
            size="md"
          />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-white truncate">
              {user?.name}
            </div>
            <div className="text-[11px] text-slate-400 truncate capitalize">
              {user?.role?.replace('_', ' ')}
            </div>
          </div>
        </div>

        {/* Menu */}
        <nav className="flex-1 overflow-y-auto py-4">
          {visibleSections.map((section) => (
            <div key={section.label} className="mb-4">
              <div className="px-5 mb-1.5 text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
                {section.label}
              </div>
              {section.items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setSidebarOpen(false)}
                    className={({ isActive }) =>
                      `relative flex items-center gap-3 mx-2 px-3 py-2 rounded-md text-sm transition-all duration-150 ${
                        isActive
                          ? 'bg-gradient-to-r from-teal-500/20 to-cyan-500/10 text-white font-medium'
                          : 'text-slate-400 hover:text-white hover:bg-white/5'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        {isActive && (
                          <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r-full bg-gradient-to-b from-teal-400 to-cyan-500" />
                        )}
                        <Icon size={17} className={isActive ? 'text-teal-400' : ''} />
                        <span className="flex-1">{item.label}</span>
                      </>
                    )}
                  </NavLink>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-white/5">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm text-slate-400 hover:text-white hover:bg-red-500/10 transition group"
          >
            <LogOut size={17} className="group-hover:text-red-400 transition" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* TOPBAR */}
        <header className="sticky top-0 z-20 h-16 bg-gradient-to-r from-sidebar to-sidebar-light text-white shadow-lg">
          <div className="h-full flex items-center gap-3 px-4 lg:px-6">

            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-1.5 rounded hover:bg-white/10"
            >
              <Menu size={20} />
            </button>

            <div className="flex-1 min-w-0">
              <div className="hidden sm:block">
                <div className="text-[10px] uppercase tracking-widest text-slate-400">
                  Home / {pageName}
                </div>
                <div className="text-sm font-semibold tracking-tight">
                  {pageName}
                </div>
              </div>
            </div>

            {/* Search */}
            <div className="hidden md:block relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search..."
                className="w-56 rounded-md bg-white/5 border border-white/10 pl-9 pr-3 py-1.5 text-sm text-white placeholder-slate-400 outline-none transition focus:bg-white/10 focus:border-teal-500/50"
              />
            </div>

            {/* Mail */}
            <button className="hidden sm:flex relative p-2 rounded-md hover:bg-white/10 transition">
              <Mail size={18} />
              <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-teal-400" />
            </button>

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="flex relative p-2 rounded-md hover:bg-white/10 transition"
              title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => { setNotifOpen(!notifOpen); setUserMenuOpen(false); }}
                className="flex relative p-2 rounded-md hover:bg-white/10 transition"
              >
                <Bell size={18} />
                <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-sidebar-light" />
              </button>
              {notifOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 rounded-lg shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-slide-up">
                  <div className="px-4 py-3 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <div className="font-semibold text-sm">Notifications</div>
                    <span className="text-xs text-teal-600 font-medium">3 new</span>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {[
                      { title: 'Low stock: Smartphone A', time: '2m ago', color: 'bg-amber-500' },
                      { title: 'New sales order SO-20261001-0001', time: '15m ago', color: 'bg-teal-500' },
                      { title: 'Forecast run completed', time: '1h ago', color: 'bg-blue-500' },
                    ].map((n, i) => (
                      <div key={i} className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 flex gap-3">
                        <div className={`h-2 w-2 rounded-full ${n.color} mt-1.5 flex-shrink-0`} />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm">{n.title}</div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{n.time}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="px-4 py-2 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 text-center">
                    <button className="text-xs text-teal-600 hover:text-teal-700 font-medium">
                      View all
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* User dropdown */}
            <div className="relative">
              <button
                onClick={() => { setUserMenuOpen(!userMenuOpen); setNotifOpen(false); }}
                className="flex items-center gap-2 p-1 pr-2 rounded-md hover:bg-white/10 transition"
              >
                <Avatar
                  name={user?.name}
                  email={user?.email}
                  role={user?.role}
                  size="sm"
                />
                <span className="hidden sm:block text-sm font-medium">{user?.name}</span>
                <ChevronDown size={14} className="text-slate-400" />
              </button>
              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 rounded-lg shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-slide-up">
                  <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800">
                    <div className="text-sm font-semibold truncate">{user?.name}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 truncate">{user?.email}</div>
                  </div>
                  <button className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800">
                    <UserIcon size={15} /> Profile
                  </button>
                  <button className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800">
                    <Settings size={15} /> Settings
                  </button>
                  <div className="border-t border-slate-100 dark:border-slate-800">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <LogOut size={15} /> Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main
          className="flex-1 overflow-y-auto p-4 lg:p-6 animate-fade-in bg-slate-100 dark:bg-slate-950"
          onClick={() => { setUserMenuOpen(false); setNotifOpen(false); }}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}