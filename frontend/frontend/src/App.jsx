import { Suspense, lazy, useEffect } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import AdminLayout from "./layouts/AdminLayout";
import VendorLayout from "./layouts/VendorLayout";
import { adminPhpRoutes } from "./adminPhpRoutes";
import PageLoader from "./components/common/PageLoader";
import ProtectedRoute from "./routes/ProtectedRoute";
import VendorProtectedRoute from "./routes/VendorProtectedRoute";
import LoginPage from "./pages/common/LoginPage";
import VendorLoginPage from "./pages/common/VendorLoginPage";
import UnauthorizedPage from "./pages/common/UnauthorizedPage";
import PublicEmployeeFormPage from "./pages/public/PublicEmployeeFormPage";
import RouteProgress, {
  beginRouteProgress,
  endRouteProgress,
} from "./components/system/RouteProgress";
import BootstrapInitializer from "./components/system/BootstrapInitializer";
import { useAuth } from "./context/AuthContext";
import { usePageAccess } from "./context/PageAccessContext";
import { getDefaultLandingPath } from "./constants/pageAccess";
import CustomerLayout from "./layouts/CustomerLayout";
import CustomerInvoicePage from "./pages/customer/CustomerInvoicePage";
import CustomerPaymentPage from "./pages/customer/CustomerPaymentPage";
import CustomerPaymentHistoryPage from "./pages/customer/CustomerPaymentHistoryPage";
import CustomerChatPage from "./pages/customer/CustomerChatPage";
import CustomerStatusPage from "./pages/customer/CustomerStatusPage";

const adminPageModules = import.meta.glob("./pages/admin/*Page.jsx");

const AdminDashboardPage = lazy(
  () => import("./pages/admin/AdminDashboardPage"),
);
const AttendanceAdminPage = lazy(
  () => import("./pages/admin/AttendanceAdminPage"),
);
const AttendanceEmployeePage = lazy(
  () => import("./pages/admin/AttendanceEmployeePage"),
);
const DesignWorkPage = lazy(
  () => import("./pages/admin/DesignWorkPage"),
);
const VendorOrdersDashboardPage = lazy(
  () => import("./pages/vendor/VendorOrdersDashboardPage"),
);
const VendorOrderDetailPage = lazy(
  () => import("./pages/vendor/VendorOrderDetailPage"),
);
const AdminSalesOrderDashboard = lazy(
  () => import("./pages/admin/AdminSalesOrderDashboard"),
);

const explicitLazyComponents = {
  AdminDashboardPage,
  AttendanceAdminPage,
  AttendanceEmployeePage,
  DesignWorkPage,
  VendorOrdersDashboardPage,
  VendorOrderDetailPage,
  AdminSalesOrderDashboard,
};

const lazyComponentCache = { ...explicitLazyComponents };

const publicRoutePaths = new Set([
  "login.php",
  "login-2.php",
  "login-3.php",
  "register.php",
  "register-2.php",
  "register-3.php",
  "forgot-password.php",
  "forgot-password-2.php",
  "forgot-password-3.php",
  "reset-password.php",
  "reset-password-2.php",
  "reset-password-3.php",
  "error-404.php",
  "error-500.php",
]);

const adminOnlyPaths = new Set([
  "useradmin",
  "useradmin/create",
  "user-edit/:id",
  "page-access",
  "group-access",
  "usergroups",
  "usergroups/edit/:id",
  "department-permissions",
  "designation-permissions",
  "registration",
  "security",
  "security-settings",
  "session-settings",
  "user-settings",
  "flow",
]);

function RouteFallback() {
  useEffect(() => {
    beginRouteProgress();
    return () => endRouteProgress();
  }, []);
  return <PageLoader />;
}

function RoleRedirect() {
  const { isAuthenticated, user, loading } = useAuth();
  const { allowedPages, loading: pageAccessLoading } = usePageAccess();
  if (loading) return <PageLoader />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (pageAccessLoading) return <PageLoader />;
  const role = String(user?.role || "").toUpperCase();
  return <Navigate to={getDefaultLandingPath(role, allowedPages)} replace />;
}

function resolveLazyComponent(componentName) {
  if (lazyComponentCache[componentName]) {
    return lazyComponentCache[componentName];
  }
  const moduleImporter = adminPageModules[`./pages/admin/${componentName}.jsx`];
  if (!moduleImporter) return null;
  const LazyComponent = lazy(moduleImporter);
  lazyComponentCache[componentName] = LazyComponent;
  return LazyComponent;
}

function getRouteElement(routePath, componentName) {
  const LazyComponent = resolveLazyComponent(componentName);

  if (!LazyComponent) {
    return (
      <div className="card">
        <div className="card-body">
          <h4 className="mb-2">Route Component Missing</h4>
          <p className="mb-0">No component found for: {componentName}</p>
        </div>
      </div>
    );
  }

  return (
    <Suspense fallback={<RouteFallback />}>
      {publicRoutePaths.has(routePath) ? (
        <LazyComponent />
      ) : (
        <ProtectedRoute role={adminOnlyPaths.has(routePath) ? "admin" : null}>
          <PageVisibleRoute routePath={routePath}>
            <LazyComponent />
          </PageVisibleRoute>
        </ProtectedRoute>
      )}
    </Suspense>
  );
}

function PageVisibleRoute({ children, routePath }) {
  const { canAccessRoute, loading } = usePageAccess();
  const location = useLocation();
  if (loading) return <PageLoader />;
  const pathToCheck = location?.pathname || routePath;
  return canAccessRoute(pathToCheck) ? children : <Navigate to="/unauthorized" replace />;
}

export default function App() {
  return (
    <>
      <BootstrapInitializer />
      <RouteProgress />
      <Routes>
        <Route path="/employee-form/:token" element={<PublicEmployeeFormPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/vendor-login" element={<VendorLoginPage />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
        <Route
          path="/vendor"
          element={(
            <VendorProtectedRoute>
              <VendorLayout />
            </VendorProtectedRoute>
          )}
        >
          <Route
            index
            element={(
              <Suspense fallback={<RouteFallback />}>
                <VendorOrdersDashboardPage />
              </Suspense>
            )}
          />
          <Route
            path="new-orders"
            element={(
              <Suspense fallback={<RouteFallback />}>
                <VendorOrdersDashboardPage />
              </Suspense>
            )}
          />
          <Route
            path="pending-orders"
            element={(
              <Suspense fallback={<RouteFallback />}>
                <VendorOrdersDashboardPage />
              </Suspense>
            )}
          />
          <Route
            path="delivered-orders"
            element={(
              <Suspense fallback={<RouteFallback />}>
                <VendorOrdersDashboardPage />
              </Suspense>
            )}
          />
          <Route
            path="payment-pending"
            element={(
              <Suspense fallback={<RouteFallback />}>
                <VendorOrdersDashboardPage />
              </Suspense>
            )}
          />
          <Route
            path="order/:id"
            element={(
              <Suspense fallback={<RouteFallback />}>
                <VendorOrderDetailPage />
              </Suspense>
            )}
          />
        </Route>
        <Route
          path="/portal"
          element={<CustomerLayout />}
        >
          <Route path="invoice" element={<CustomerInvoicePage />} />
          <Route path="payment" element={<CustomerPaymentPage />} />
          <Route path="payment-history" element={<CustomerPaymentHistoryPage />} />
          <Route path="chat" element={<CustomerChatPage />} />
          <Route path="status" element={<CustomerStatusPage />} />
        </Route>
        <Route path="/" element={<AdminLayout />}>
          <Route index element={<RoleRedirect />} />
          {adminPhpRoutes.map((route) => (
            <Route
              key={route.path}
              path={route.path}
              element={getRouteElement(route.path, route.component)}
            />
          ))}
          <Route
            path="*"
            element={<RoleRedirect />}
          />
        </Route>
      </Routes>
    </>
  );
}
