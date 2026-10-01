import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Package, Users, Warehouse, ShoppingCart,
  ShoppingBag, ArrowLeftRight, Bell, TrendingUp, BarChart3,
  FileText, LogOut, Boxes,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const MENU = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'inventory_manager', 'sales_manager', 'purchase_manager', 'analyst'] },
  { to: '/products', label: 'Products', icon: Package, roles: ['admin', 'inventory_manager', 'sales_manager', 'purchase_manager', 'analyst'] },
  { to: '/suppliers', label: 'Suppliers', icon: Users, roles: ['admin', 'purchase_manager'] },
  { to: '/warehouses', label: 'Warehouses', icon: Warehouse, roles: ['admin', 'inventory_manager'] },
  { to: '/inventory', label: 'Inventory', icon: Boxes, roles: ['admin', 'inventory_manager', 'analyst'] },
  { to: '/purchases', label: 'Purchases', icon: ShoppingCart, roles: ['admin', 'purchase_manager'] },
  { to: '/sales', label: 'Sales', icon: ShoppingBag, roles: ['admin', 'sales_manager'] },
  { to: '/transfers', label: 'Transfers', icon: ArrowLeftRight, roles: ['admin', 'inventory_manager'] },
  { to: '/forecasts', label: 'Forecasts', icon: TrendingUp, roles: ['admin', 'analyst', 'inventory_manager'] },
  { to: '/alerts', label: 'Alerts', icon: Bell, roles: ['admin', 'inventory_manager', 'sales_manager', 'purchase_manager', 'analyst'] },
  { to: '/analytics', label: 'Analytics', icon: BarChart3, roles: ['admin', 'analyst', 'sales_manager'] },
  { to: '/reports', label: 'Reports', icon: FileText, roles: ['admin', 'analyst'] },
];

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const visibleMenu = MENU.filter((item) => item.roles.includes(user?.role));

  return (
    <div className="min-h-screen flex bg-slate-100">
      <aside className="w-64 bg-slate-900 text-slate-100 flex flex-col">
        <div className="px-5 py-5 border-b border-slate-800">
          <h1 className="text-lg font-bold">AI Retail</h1>
          <p className="text-xs text-slate-400 mt-0.5">Demand & Inventory</p>
        </div>

        <nav className="flex-1 overflow-y-auto py-4">
          {visibleMenu.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-5 py-2.5 text-sm transition ${
                    isActive
                      ? 'bg-slate-800 text-white border-l-4 border-brand-500'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white border-l-4 border-transparent'
                  }`
                }
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="border-t border-slate-800 p-4">
          <div className="text-xs text-slate-400 uppercase mb-1">Signed in</div>
          <div className="text-sm font-medium truncate">{user?.name}</div>
          <div className="text-xs text-slate-500 truncate">{user?.email}</div>
          <div className="mt-1">
            <span className="inline-block text-xs bg-slate-800 text-slate-300 rounded px-2 py-0.5">
              {user?.role}
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="mt-3 w-full flex items-center justify-center gap-2 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 py-2 text-sm transition"
          >
            <LogOut size={16} /> Logout
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col">
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <div className="text-sm text-slate-500">
            Welcome back, <span className="font-medium text-slate-800">{user?.name}</span>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}