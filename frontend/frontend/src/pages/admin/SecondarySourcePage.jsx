import { useEffect, useMemo, useState } from "react";
import {
  getSecondarySources,
  createSecondarySource,
  updateSecondarySource,
  deleteSecondarySource,
} from "../../api/secondarySourceApi";
import { getPrimarySources } from "../../api/primarySourceApi";
import { extractApiErrorMessage } from "../../utils/errorMessage";
import { useToast } from "../../components/system/ToastProvider";
import PageSizeSelector from "../../components/admin/PageSizeSelector";

function SecondarySourcePage() {
  const { showSuccess, showError } = useToast();
  const [rows, setRows] = useState([]);
  const [primaryRows, setPrimaryRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingRow, setEditingRow] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [formName, setFormName] = useState("");
  const [formPrimarySourceId, setFormPrimarySourceId] = useState("");
  const [saving, setSaving] = useState(false);

  // Search & Pagination states
  const [searchText, setSearchText] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const load = async () => {
    setLoading(true);
    try {
      const [secondaryList, primaryList] = await Promise.all([
        getSecondarySources(),
        getPrimarySources(),
      ]);
      setRows(Array.isArray(secondaryList) ? secondaryList : []);
      setPrimaryRows(Array.isArray(primaryList) ? primaryList : []);
    } catch (e) {
      showError(extractApiErrorMessage(e, "Failed to load"));
      setRows([]);
      setPrimaryRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // Reset page when search changes
  useEffect(() => {
    setPage(1);
  }, [searchText]);

  const ordered = useMemo(
    () => [...rows].sort((a, b) => (b.id || 0) - (a.id || 0)),
    [rows],
  );

  const primaryNameMap = useMemo(() => {
    const map = new Map();
    (Array.isArray(primaryRows) ? primaryRows : []).forEach((row) => {
      map.set(String(row.id), row.primarySource || row.name || row.sourceName || "-");
    });
    return map;
  }, [primaryRows]);

  const getName = (r) => r.name || r.sourceName || r.secondarySource || "-";
  const getPrimaryName = (r) => {
    if (!r) return "-";
    if (r.primarySource) return r.primarySource;
    if (r.primarySourceId != null && primaryNameMap.has(String(r.primarySourceId))) {
      return primaryNameMap.get(String(r.primarySourceId));
    }
    return "-";
  };

  const filteredRows = useMemo(() => {
    const term = searchText.toLowerCase().trim();
    if (!term) return ordered;
    return ordered.filter((r) => {
      const name = String(getName(r) || "").toLowerCase();
      const primaryName = String(getPrimaryName(r) || "").toLowerCase();
      return name.includes(term) || primaryName.includes(term);
    });
  }, [ordered, searchText, primaryNameMap]);

  const totalPages = Math.ceil(filteredRows.length / pageSize);
  const pagedRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, page, pageSize]);

  const handleSave = async () => {
    if (!formName.trim()) {
      showError("Name is required");
      return;
    }
    if (!String(formPrimarySourceId || "").trim()) {
      showError("Primary source is required");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        secondarySource: formName.trim(),
        primarySourceId: Number(formPrimarySourceId),
      };
      editingRow?.id
        ? await updateSecondarySource(editingRow.id, payload)
        : await createSecondarySource(payload);
      showSuccess(editingRow ? "Updated" : "Created");
      setShowModal(false);
      setFormName("");
      setFormPrimarySourceId("");
      setEditingRow(null);
      await load();
    } catch (e) {
      showError(extractApiErrorMessage(e, "Failed to save"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      await deleteSecondarySource(pendingDelete.id);
      showSuccess("Deleted");
      setPendingDelete(null);
      await load();
    } catch (e) {
      showError(extractApiErrorMessage(e, "Failed to delete"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container-fluid content">
      <div className="card border-0 shadow-sm p-4 mb-4 bg-white" style={{ borderRadius: 12 }}>
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
          <div>
            <h2 className="leads-header-title mb-1" style={{ fontSize: "1.4rem", fontWeight: "700", color: "#0f172a" }}>Secondary Lead Source</h2>
            <p className="leads-header-subtitle text-muted mb-0" style={{ fontSize: "0.9rem" }}>
              Configure and manage secondary lead acquisition sources mapped to primary sources.
            </p>
          </div>
          <button
            className="btn btn-primary d-flex align-items-center gap-2"
            style={{ backgroundColor: "#3b82f6", borderColor: "#3b82f6", fontWeight: "600", padding: "10px 20px", borderRadius: "10px" }}
            onClick={() => {
              setFormName("");
              setFormPrimarySourceId("");
              setEditingRow(null);
              setShowModal(true);
            }}
          >
            <i className="ti ti-plus" />
            Add Secondary Source
          </button>
        </div>
      </div>

      <div className="card table-list-card border-0 shadow-sm" style={{ borderRadius: 12 }}>
        <div className="card-body">
          {/* Controls Bar */}
          <div className="leads-controls-bar d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
            <div className="d-flex align-items-center gap-2 p-1 border" style={{ borderRadius: 12, backgroundColor: "#f8fafc", width: "100%", maxWidth: 350 }}>
              <i className="ti ti-search text-muted ms-2" style={{ fontSize: "1.1rem" }} />
              <input
                type="text"
                className="form-control border-0 bg-transparent shadow-none"
                placeholder="Search secondary or primary source..."
                style={{ height: 36, fontSize: "0.9rem" }}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
            </div>
          </div>

          <div className="table-responsive leads-table-wrap border-0 shadow-sm mb-4" style={{ borderRadius: 12 }}>
            <table className="table table-hover align-middle leads-table mb-0">
              <thead>
                <tr>
                  <th className="text-muted" style={{ width: 80, fontWeight: "600", fontSize: "0.85rem" }}>#</th>
                  <th className="text-muted" style={{ fontWeight: "600", fontSize: "0.85rem" }}>Secondary Source Name</th>
                  <th className="text-muted" style={{ fontWeight: "600", fontSize: "0.85rem" }}>Primary Source</th>
                  <th className="text-muted" style={{ width: 200, fontWeight: "600", fontSize: "0.85rem" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={4} className="text-center py-4 text-muted">Loading...</td>
                  </tr>
                ) : pagedRows.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-4 text-muted">No records found</td>
                  </tr>
                ) : (
                  pagedRows.map((r, i) => (
                    <tr key={r.id}>
                      <td className="fw-semibold" style={{ color: "#1e293b", fontSize: "0.9rem" }}>{(page - 1) * pageSize + i + 1}</td>
                      <td className="fw-semibold" style={{ color: "#0f172a", fontSize: "0.9rem" }}>{getName(r)}</td>
                      <td>
                        <span className="badge bg-light text-dark px-2.5 py-1.5 fs-12 fw-semibold" style={{ border: "1px solid #e2e8f0", borderRadius: "6px" }}>
                          {getPrimaryName(r)}
                        </span>
                      </td>
                      <td>
                        <div className="d-flex gap-2">
                          <button
                            className="btn btn-sm btn-outline-primary"
                            style={{ borderRadius: 8, fontWeight: "600" }}
                            onClick={() => {
                              setEditingRow(r);
                              setFormName(getName(r) === "-" ? "" : getName(r));
                              setFormPrimarySourceId(r.primarySourceId ? String(r.primarySourceId) : "");
                              setShowModal(true);
                            }}
                          >
                            Edit
                          </button>
                          <button
                            className="btn btn-sm btn-outline-danger"
                            style={{ borderRadius: 8, fontWeight: "600" }}
                            onClick={() => setPendingDelete(r)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          {filteredRows.length > 0 && (
            <div className="leads-pagination-footer d-flex flex-wrap align-items-center justify-content-between gap-3 mt-4 pt-3 border-top">
              <span className="entries-info text-muted small">
                Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, filteredRows.length)} of {filteredRows.length} entries
              </span>

              <div className="pagination-numbers-container d-flex align-items-center gap-1">
                <button
                  type="button"
                  className="btn-pagination-arrow btn btn-sm btn-light border-0 d-flex align-items-center justify-content-center"
                  style={{ width: 32, height: 32, borderRadius: 6 }}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                >
                  <i className="ti ti-chevron-left" />
                </button>

                {(() => {
                  const buttons = [];
                  const maxVisible = 5;
                  let startPage = Math.max(1, page - 2);
                  let endPage = Math.min(totalPages, startPage + maxVisible - 1);
                  if (maxVisible - 1 > endPage - startPage) {
                    startPage = Math.max(1, endPage - maxVisible + 1);
                  }

                  if (startPage > 1) {
                    buttons.push(
                      <button
                        key={1}
                        className={`btn-pagination-num btn btn-sm border-0 ${page === 1 ? 'btn-primary text-white' : 'btn-light'}`}
                        style={{ width: 32, height: 32, borderRadius: 6, fontWeight: "500", backgroundColor: page === 1 ? "#3b82f6" : undefined }}
                        onClick={() => setPage(1)}
                      >
                        1
                      </button>
                    );
                    if (startPage > 2) {
                      buttons.push(<span key="dots-start" className="pagination-dots px-1 text-muted">...</span>);
                    }
                  }

                  for (let i = startPage; endPage >= i; i++) {
                    buttons.push(
                      <button
                        key={i}
                        className={`btn-pagination-num btn btn-sm border-0 ${page === i ? 'btn-primary text-white' : 'btn-light'}`}
                        style={{ width: 32, height: 32, borderRadius: 6, fontWeight: "500", backgroundColor: page === i ? "#3b82f6" : undefined }}
                        onClick={() => setPage(i)}
                      >
                        {i}
                      </button>
                    );
                  }

                  if (totalPages > endPage) {
                    if (totalPages - 1 > endPage) {
                      buttons.push(<span key="dots-end" className="pagination-dots px-1 text-muted">...</span>);
                    }
                    buttons.push(
                      <button
                        key={totalPages}
                        className={`btn-pagination-num btn btn-sm border-0 ${page === totalPages ? 'btn-primary text-white' : 'btn-light'}`}
                        style={{ width: 32, height: 32, borderRadius: 6, fontWeight: "500", backgroundColor: page === totalPages ? "#3b82f6" : undefined }}
                        onClick={() => setPage(totalPages)}
                      >
                        {totalPages}
                      </button>
                    );
                  }

                  return buttons;
                })()}

                <button
                  type="button"
                  className="btn-pagination-arrow btn btn-sm btn-light border-0 d-flex align-items-center justify-content-center"
                  style={{ width: 32, height: 32, borderRadius: 6 }}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                >
                  <i className="ti ti-chevron-right" />
                </button>
              </div>

              <PageSizeSelector
                pageSize={pageSize}
                setPageSize={setPageSize}
                setPage={setPage}
              />
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <>
          <div
            className="modal fade show"
            style={{ display: "block", zIndex: 1060 }}
            tabIndex="-1"
          >
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content border-0 shadow-lg" style={{ borderRadius: 14 }}>
                <div className="modal-header bg-light">
                  <h5 className="modal-title fw-bold" style={{ color: "#334155" }}>
                    {editingRow ? "Edit" : "Add"} Secondary Source
                  </h5>
                  <button
                    className="btn-close"
                    onClick={() => {
                      setShowModal(false);
                      setFormName("");
                      setFormPrimarySourceId("");
                      setEditingRow(null);
                    }}
                  />
                </div>
                <div className="modal-body p-4">
                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-muted">Secondary Source Name</label>
                    <input
                      className="form-control"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="Source name"
                      style={{ borderRadius: 8, padding: "10px 14px" }}
                    />
                  </div>
                  <div>
                    <label className="form-label small fw-semibold text-muted">Primary Source</label>
                    <select
                      className="form-select"
                      value={formPrimarySourceId}
                      onChange={(e) => setFormPrimarySourceId(e.target.value)}
                      style={{ borderRadius: 8, padding: "10px 14px" }}
                    >
                      <option value="">Select primary source</option>
                      {(Array.isArray(primaryRows) ? primaryRows : []).map((row) => (
                        <option key={row.id} value={row.id}>
                          {row.primarySource || row.name || row.sourceName}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="modal-footer border-0 p-3 bg-light">
                  <button
                    className="btn btn-light"
                    style={{ borderRadius: 8, fontWeight: "600" }}
                    onClick={() => {
                      setShowModal(false);
                      setFormName("");
                      setFormPrimarySourceId("");
                      setEditingRow(null);
                    }}
                    disabled={saving}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn btn-primary"
                    style={{ borderRadius: 8, fontWeight: "600", backgroundColor: "#3b82f6", borderColor: "#3b82f6" }}
                    onClick={handleSave}
                    disabled={saving}
                  >
                    {saving ? "Saving..." : editingRow ? "Update" : "Create"}
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show" style={{ zIndex: 1040 }} />
        </>
      )}

      {pendingDelete && (
        <>
          <div
            className="modal fade show"
            style={{ display: "block", zIndex: 1060 }}
            tabIndex="-1"
          >
            <div className="modal-dialog modal-dialog-centered modal-sm">
              <div className="modal-content border-0 shadow-lg" style={{ borderRadius: 14 }}>
                <div className="modal-header bg-light">
                  <h5 className="modal-title fw-bold" style={{ color: "#334155" }}>Delete Secondary Source</h5>
                  <button
                    className="btn-close"
                    onClick={() => setPendingDelete(null)}
                  />
                </div>
                <div className="modal-body p-4 text-center">
                  <i className="ti ti-alert-triangle text-danger mb-3" style={{ fontSize: "2rem" }}></i>
                  <p className="mb-0">
                    Are you sure you want to delete <strong>{getName(pendingDelete)}</strong>?
                  </p>
                </div>
                <div className="modal-footer border-0 p-3 bg-light d-flex justify-content-center">
                  <button
                    className="btn btn-light px-3"
                    style={{ borderRadius: 8, fontWeight: "600" }}
                    onClick={() => setPendingDelete(null)}
                    disabled={saving}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn btn-danger px-3"
                    style={{ borderRadius: 8, fontWeight: "600" }}
                    onClick={handleDelete}
                    disabled={saving}
                  >
                    {saving ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show" style={{ zIndex: 1040 }} />
        </>
      )}
    </div>
  );
}

export default SecondarySourcePage;
