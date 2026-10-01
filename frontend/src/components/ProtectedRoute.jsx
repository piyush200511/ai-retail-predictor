import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-slate-500">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="card max-w-md text-center">
          <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
          <p className="text-slate-500">You don't have permission to view this page.</p>
        </div>
      </div>
    );
  }

  return children;
}