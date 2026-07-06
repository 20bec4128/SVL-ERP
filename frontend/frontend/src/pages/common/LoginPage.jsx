import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "../../assets/css/LoginAuth.css";
import { getMyPageKeys } from "../../api/pageAccessApi";
import { getDefaultLandingPath } from "../../constants/pageAccess";
import { loginVendor } from "../../api/vendorAuthApi";
import { getVendorSession, setVendorSession } from "../../utils/vendorSession";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, isAuthenticated, user, loading: authLoading } = useAuth();

  const [loginMode, setLoginMode] = useState("staff"); // "staff" | "vendor"
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (authLoading) {
    return null;
  }

  // Stay on login page even if an existing session is present.

  const handleModeSwitch = (mode) => {
    if (mode === loginMode) return;
    setLoginMode(mode);
    setIdentifier("");
    setPassword("");
    setError("");
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (loginMode === "vendor") {
        const vendor = await loginVendor(identifier, password);
        // Keep refresh token only in httpOnly cookie; persist vendor access token for API calls.
        setVendorSession({
          vendorId: vendor?.vendorId || null,
          vendorName: vendor?.vendorName || "",
          username: vendor?.username || "",
          officialEmail: vendor?.officialEmail || "",
          status: vendor?.status || "",
          accessToken: vendor?.accessToken || null,
        });
        navigate("/vendor", { replace: true });
      } else {
        sessionStorage.setItem("lastLoginIdentifier", identifier.trim());
        const data = await login(identifier, password);
        if (data?.forcePasswordChange) {
          navigate("/force-change-password", { replace: true });
          return;
        }
        if (data?.isProfileIncomplete) {
          navigate("/complete-profile", { replace: true });
          return;
        }
        const role = String(data?.user?.role || "").toUpperCase();
        const visiblePageKeys = await getMyPageKeys().catch(() => []);
        const landingPath = getDefaultLandingPath(role, visiblePageKeys);
        sessionStorage.setItem("showWelcomeToast", "1");
        navigate(landingPath, { replace: true });
      }
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Invalid username or password";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-container">
        <div className="auth-forms">
          <div className="auth-signin">
            <form className="auth-form" onSubmit={onSubmit}>
              <h2 className="auth-title">Sign in</h2>
              <div className="auth-login-switch">
                <button
                  type="button"
                  className={`auth-login-pill${loginMode === "staff" ? " active" : ""}`}
                  onClick={() => handleModeSwitch("staff")}
                >
                  Staff Login
                </button>
                <button
                  type="button"
                  className={`auth-login-pill${loginMode === "vendor" ? " active" : ""}`}
                  onClick={() => handleModeSwitch("vendor")}
                >
                  Vendor Login
                </button>
              </div>
              <div className="auth-input">
                <i className="ti ti-user" />
                <input
                  type="text"
                  placeholder={loginMode === "vendor" ? "Vendor Username or Email" : "Username or Email"}
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  autoComplete="username"
                  required
                />
              </div>
              <div className="auth-input">
                <i className="ti ti-lock" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="auth-toggle"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a21.88 21.88 0 0 1 5.06-6.94" />
                      <path d="M1 1l22 22" />
                      <path d="M9.53 9.53A3.5 3.5 0 0 0 12 15.5" />
                      <path d="M14.47 14.47A3.5 3.5 0 0 0 12 8.5" />
                      <path d="M21 12s-1.2 2.5-3.5 4.5" />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
              {error && (
                <div className="alert alert-danger py-2 mt-2">{error}</div>
              )}
              <button className="auth-btn" type="submit" disabled={loading}>
                {loading ? "Signing in..." : "Login"}
              </button>
            </form>
          </div>
        </div>

        <div className="auth-panels">
          <div className="auth-panel auth-panel-left">
            <div className="auth-panel-content">
              <h3>Welcome Back</h3>
              <p>
                Manage your CRM access and user administration from one place.
              </p>
            </div>
            <img
              src="https://i.ibb.co/6HXL6q1/Privacy-policy-rafiki.png"
              className="auth-image"
              alt="Welcome"
            />
          </div>
          <div className="auth-panel auth-panel-right">
            <div className="auth-panel-content">
              <h3>Secure Access</h3>
              <p>
                Sign in using your username or email to continue.
              </p>
            </div>
            <img
              src="https://i.ibb.co/nP8H853/Mobile-login-rafiki.png"
              className="auth-image"
              alt="Login"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
