import { createContext, useContext, useEffect, useState } from 'react';
import { authApi } from '../api/endpoints';

const AuthContext = createContext(null);

// We attach the toast function externally (because AuthProvider must be
// inside ToastProvider, but toast is only available from a hook).
let toastRef = null;
export function _setToastRef(fn) {
  toastRef = fn;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      setLoading(false);
      return;
    }
    authApi
      .profile()
      .then((res) => {
        setUser(res.data);
        localStorage.setItem('user', JSON.stringify(res.data));
      })
      .catch(() => {
        logout(true);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const res = await authApi.login(email, password);
    const { user, tokens } = res.data;
    localStorage.setItem('access_token', tokens.access);
    localStorage.setItem('refresh_token', tokens.refresh);
    localStorage.setItem('user', JSON.stringify(user));
    setUser(user);
    toastRef?.(`Welcome back, ${user.name}!`, 'success');
    return user;
  };

  const logout = (silent = false) => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    setUser(null);
    if (!silent) {
      toastRef?.("You've been logged out.", 'info');
    } else {
      toastRef?.('Session expired. Please log in again.', 'warning');
    }
  };

  const hasRole = (...roles) => user && roles.includes(user.role);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        hasRole,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
        isInventoryManager: user?.role === 'inventory_manager',
        isSalesManager: user?.role === 'sales_manager',
        isPurchaseManager: user?.role === 'purchase_manager',
        isAnalyst: user?.role === 'analyst',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}