import { Link } from "react-router-dom";

export default function UnauthorizedPage() {
  return (
    <div className="d-flex align-items-center justify-content-center min-vh-100 p-3">
      <div className="card" style={{ width: "100%", maxWidth: 520 }}>
        <div className="card-body text-center">
          <h4 className="mb-2">Unauthorized</h4>
          <p className="mb-3">You do not have permission to view this page.</p>
          <Link className="btn btn-primary" to="/login">
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
