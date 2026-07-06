import { useEffect, useState } from "react";
import {
  deleteAllAuditLogs,
  deleteAuditLogsOlderThan,
  getAuditLogs,
} from "../../api/auditLogApi";
import { extractApiErrorMessage } from "../../utils/errorMessage";
import { useAuth } from "../../context/AuthContext";
import { usePageAccess } from "../../context/PageAccessContext";
import { useToast } from "../../components/system/ToastProvider";

export default function LogsPage() {
  const { user } = useAuth();
  const { canAccess } = usePageAccess();
  const role = String(user?.role || "").toUpperCase();
  const { showSuccess, showError } = useToast();
  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(20);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [olderThanDays, setOlderThanDays] = useState(30);
  const canViewLogs = canAccess("settings-logs");
  const canDeleteLogs = role === "SUPER_ADMIN" || role === "ADMIN";

  const load = async (nextPage = page, nextSize = size) => {
    if (!canViewLogs) {
      setRows([]);
      setPage(0);
      setTotalPages(0);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const payload = await getAuditLogs(nextPage, nextSize);
      setRows(payload.items || []);
      setPage(payload.page ?? nextPage);
      setSize(payload.size ?? nextSize);
      setTotalPages(payload.totalPages ?? 0);
    } catch (e) {
      showError(extractApiErrorMessage(e, "Failed to load audit logs"));
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(0, size);
  }, [role, size, canViewLogs]);

  const handleDeleteAll = async () => {
    setLoading(true);
    try {
      const res = await deleteAllAuditLogs();
      showSuccess(res?.message || "All logs deleted");
      await load(0, size);
    } catch (e) {
      showError(extractApiErrorMessage(e, "Failed to delete logs"));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteOlder = async () => {
    setLoading(true);
    try {
      const res = await deleteAuditLogsOlderThan(Number(olderThanDays) || 30);
      showSuccess(res?.message || "Logs deleted");
      await load(0, size);
    } catch (e) {
      showError(extractApiErrorMessage(e, "Failed to delete logs"));
    } finally {
      setLoading(false);
    }
  };

  const totalLabel = totalPages ? `Page ${page + 1} of ${totalPages}` : "Page 1";

  return (
    <div className="container-fluid">

      <div className="card mb-3">
        <div className="card-header d-flex align-items-center justify-content-between">
          <h4 className="mb-0">Audit Logs</h4>
          {canDeleteLogs ? (
            <div className="d-flex align-items-center gap-2">
              <div className="input-group" style={{ width: 220 }}>
                <input
                  type="number"
                  min="1"
                  className="form-control"
                  value={olderThanDays}
                  onChange={(e) => setOlderThanDays(e.target.value)}
                />
                <button
                  className="btn btn-outline-danger"
                  onClick={handleDeleteOlder}
                  disabled={loading}
                >
                  Delete Older
                </button>
              </div>
              <button
                className="btn btn-danger"
                onClick={handleDeleteAll}
                disabled={loading}
              >
                Delete All
              </button>
            </div>
          ) : null}
        </div>
        <div className="card-body">
          {!canViewLogs ? (
            <div className="alert alert-warning mb-0">
              You do not have permission to view audit logs.
            </div>
          ) : (
          <div className="d-flex align-items-center justify-content-between mb-3">
            <div>{totalLabel}</div>
            <div className="d-flex align-items-center gap-2">
              <label className="me-2">Rows</label>
              <select
                className="form-select"
                style={{ width: 120 }}
                value={size}
                onChange={(e) => load(0, Number(e.target.value))}
              >
                {[10, 20, 30, 50].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
              <button
                className="btn btn-outline-secondary"
                disabled={page <= 0 || loading}
                onClick={() => load(page - 1, size)}
              >
                Prev
              </button>
              <button
                className="btn btn-outline-secondary"
                disabled={page + 1 >= totalPages || loading}
                onClick={() => load(page + 1, size)}
              >
                Next
              </button>
            </div>
          </div>
          )}
          {canViewLogs && (
          <div className="table-responsive">
            <table className="table table-striped table-bordered table-hover">
              <thead className="table-dark">
                <tr>
                  <th>#</th>
                  <th>Action</th>
                  <th>Actor</th>
                  <th>IP</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5}>Loading...</td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={5}>No logs found</td>
                  </tr>
                ) : (
                  rows.map((row, idx) => (
                    <tr key={row.id ?? `${row.action}-${idx}`}>
                      <td>{idx + 1 + page * size}</td>
                      <td>{row.action || "-"}</td>
                      <td>{row.actor || "-"}</td>
                      <td>{row.ipAddress || "-"}</td>
                      <td>{row.createdAt || "-"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          )}
        </div>
      </div>
    </div>
  );
}
