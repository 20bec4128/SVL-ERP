import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import PageLoader from "../components/common/PageLoader";

export default function ProtectedRoute({ children, role }) {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <PageLoader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (role) {
    const required = String(role).toUpperCase().replace(/^ROLE_/, "");
    const current = String(user?.role || "").toUpperCase().replace(/^ROLE_/, "");
    const adminEquivalent = ["ADMIN", "SUPER_ADMIN", "MANAGER", "TEAM_LEAD", "EMPLOYEE"];
    if (required === "ADMIN") {
      if (!adminEquivalent.includes(current)) {
        return <Navigate to="/unauthorized" replace />;
      }
    } else if (current !== required) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return children;
}
