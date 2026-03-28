import { Navigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function ProtectedRoute({ children, allowRoles }) {
  const { loading, isAuthenticated, role } = useAuth();

  if (loading) {
    return <div className="flash">Checking session...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowRoles?.length && !allowRoles.includes(role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
