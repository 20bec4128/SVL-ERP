import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import api from "../../utils/api";
import "../../assets/css/LoginAuth.css";

export default function CustomerActivationPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const query = new URLSearchParams(location.search);
  const token = query.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!token) {
      setError("Activation token is missing from the link.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!agreeTerms) {
      setError("You must agree to the Terms & Conditions.");
      return;
    }

    setLoading(true);
    try {
      await api.post(`/api/auth/activate?token=${encodeURIComponent(token)}`, { password });
      setSuccess(true);
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || "Failed to activate account. The link may have expired.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper d-flex align-items-center justify-content-center min-vh-100" style={{ backgroundColor: "#0f172a" }}>
      <div className="auth-card p-4 shadow-lg border-0" style={{ maxWidth: 420, width: "100%", borderRadius: 16, background: "rgba(30, 41, 59, 0.7)", backdropFilter: "blur(12px)" }}>
        <div className="text-center mb-4">
          <h3 className="fw-bold text-white mb-2">Activate Portal Account</h3>
          <p className="text-muted small">Choose your password to activate your customer portal account.</p>
        </div>

        {success ? (
          <div className="text-center py-3">
            <div className="alert alert-success border-0 text-success mb-4" style={{ borderRadius: 10 }}>
              <i className="ti ti-circle-check fs-1 d-block mb-2"></i>
              Account activated successfully! You can now log in to the customer portal.
            </div>
            <button
              onClick={() => navigate("/login")}
              className="btn btn-primary w-100 py-2 fw-semibold"
              style={{ borderRadius: 10 }}
            >
              Go to Sign In
            </button>
          </div>
        ) : (
          <form onSubmit={onSubmit}>
            {error && (
              <div className="alert alert-danger border-0 text-danger text-center small mb-3" style={{ borderRadius: 10 }}>
                {error}
              </div>
            )}

            <div className="mb-3">
              <label className="form-label text-muted small fw-semibold">New Password</label>
              <input
                type="password"
                className="form-control bg-dark border-secondary text-white"
                style={{ borderRadius: 10 }}
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="mb-3">
              <label className="form-label text-muted small fw-semibold">Confirm Password</label>
              <input
                type="password"
                className="form-control bg-dark border-secondary text-white"
                style={{ borderRadius: 10 }}
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <div className="form-check mb-4">
              <input
                type="checkbox"
                className="form-check-input"
                id="agreeTerms"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
              />
              <label className="form-check-label text-muted small" htmlFor="agreeTerms">
                I agree to the <a href="#" className="text-primary text-decoration-none">Terms & Conditions</a>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading || !token}
              className="btn btn-primary w-100 py-2 fw-semibold"
              style={{ borderRadius: 10 }}
            >
              {loading ? "Activating..." : "Activate Account"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
