import { Navigate, useLocation } from "react-router-dom";
import { getVendorSession } from "../utils/vendorSession";

export default function VendorProtectedRoute({ children }) {
  const location = useLocation();
  const session = getVendorSession();

  if (!session?.vendorId) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return children;
}
