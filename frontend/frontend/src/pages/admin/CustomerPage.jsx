import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence } from "motion/react";
import CustomerWizardModal from "../../components/admin/CustomerWizardModal";
import { useCreateCustomerWizard } from "../../hooks/useCreateCustomerWizard";
import { getUsers, createUser, deleteUser } from "../../api/userAdminApi";
import { useToast } from "../../components/system/ToastProvider";
import { extractApiErrorMessage } from "../../utils/errorMessage";
import PageSizeSelector from "../../components/admin/PageSizeSelector";
import { validatePhoneNumber } from "../../utils/phoneUtils";

export default function CustomerPage() {
  const { showSuccess, showError } = useToast();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);

  // Search & Pagination states
  const [searchText, setSearchText] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const {
    form,
    setForm,
    wizardStep,
    showModal,
    openModal,
    closeModal,
    nextStep,
    prevStep,
    resetForm,
  } = useCreateCustomerWizard();

  const load = async () => {
    setLoading(true);
    try {
      // SVL typical users count is moderate, so fetch a larger pool and filter client-side
      const data = await getUsers(0, 1000);
      const allUsers = Array.isArray(data.items) ? data.items : [];
      // Filter for CUSTOMER role
      const customers = allUsers.filter((u) => String(u.role).toUpperCase() === "CUSTOMER");
      setRows(customers);
    } catch (e) {
      showError(extractApiErrorMessage(e, "Failed to load customers"));
      setRows([]);
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

  const filteredRows = useMemo(() => {
    const term = searchText.toLowerCase().trim();
    if (!term) return ordered;
    return ordered.filter((r) => {
      const name = `${r.firstName || ""} ${r.lastName || ""}`.toLowerCase();
      const email = String(r.email || "").toLowerCase();
      const username = String(r.username || "").toLowerCase();
      return name.includes(term) || email.includes(term) || username.includes(term);
    });
  }, [ordered, searchText]);

  const totalPages = Math.ceil(filteredRows.length / pageSize);
  const pagedRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, page, pageSize]);

  const handleSave = async (e) => {
    e?.preventDefault?.();

    if (!form.firstName.trim()) {
      showError("First Name is required");
      return;
    }
    if (!form.lastName.trim()) {
      showError("Last Name is required");
      return;
    }
    if (!form.email.trim()) {
      showError("Email is required");
      return;
    }

    const phoneError = validatePhoneNumber(form.phone, form.countryCode);
    if (phoneError) {
      showError(phoneError);
      return;
    }

    setSaving(true);
    try {
      await createUser({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        username: form.email.trim(),
        email: form.email.trim(),
        password: form.password || "Customer@123", // fallback password
        confirmPassword: form.password || "Customer@123",
        role: "CUSTOMER",
      });

      showSuccess("Customer account created successfully!");
      closeModal();
      await load();
    } catch (e) {
      showError(extractApiErrorMessage(e, "Failed to create customer"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!pendingDelete?.id) return;
    setSaving(true);
    try {
      await deleteUser(pendingDelete.id);
      showSuccess("Customer deleted successfully");
      setPendingDelete(null);
      await load();
    } catch (e) {
      showError(extractApiErrorMessage(e, "Failed to delete customer"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container-fluid content">
      <div className="card border-0 shadow-sm p-4 mb-4 bg-white" style={{ borderRadius: 12 }}>
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
          <div>
            <h2 className="leads-header-title mb-1" style={{ fontSize: "1.4rem", fontWeight: "700", color: "#0f172a" }}>Customers</h2>
            <p className="leads-header-subtitle text-muted mb-0" style={{ fontSize: "0.9rem" }}>
              Manage customer accounts, track registration info, and configure access settings.
            </p>
          </div>
          <button
            className="btn btn-primary d-flex align-items-center gap-2"
            style={{ backgroundColor: "#3b82f6", borderColor: "#3b82f6", fontWeight: "600", padding: "10px 20px", borderRadius: "10px" }}
            onClick={openModal}
          >
            <i className="ti ti-plus" />
            Add Customer
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
                placeholder="Search customers..."
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
                  <th className="text-muted" style={{ fontWeight: "600", fontSize: "0.85rem" }}>Customer Name</th>
                  <th className="text-muted" style={{ fontWeight: "600", fontSize: "0.85rem" }}>Email / Username</th>
                  <th className="text-muted" style={{ fontWeight: "600", fontSize: "0.85rem" }}>Status</th>
                  <th className="text-muted" style={{ width: 150, fontWeight: "600", fontSize: "0.85rem" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="text-center py-4 text-muted">Loading...</td>
                  </tr>
                ) : pagedRows.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-4 text-muted">No records found</td>
                  </tr>
                ) : (
                  pagedRows.map((r, i) => (
                    <tr key={r.id}>
                      <td className="fw-semibold" style={{ color: "#1e293b", fontSize: "0.9rem" }}>{(page - 1) * pageSize + i + 1}</td>
                      <td className="fw-semibold" style={{ color: "#0f172a", fontSize: "0.9rem" }}>
                        {r.firstName || r.lastName ? `${r.firstName || ""} ${r.lastName || ""}` : "-"}
                      </td>
                      <td style={{ color: "#475569", fontSize: "0.9rem" }}>
                        <div>{r.email || "-"}</div>
                        <div className="text-muted small">{r.username}</div>
                      </td>
                      <td>
                        <span className={`badge px-2.5 py-1.5 fs-12 fw-semibold ${r.active ? "bg-success-subtle text-success" : "bg-danger-subtle text-danger"}`} style={{ borderRadius: "6px" }}>
                          {r.active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td>
                        <button
                          className="btn btn-sm btn-outline-primary me-2"
                          style={{ borderRadius: 8, fontWeight: "600" }}
                          onClick={() => navigate("/quotation", { state: { prefillCustomer: r } })}
                        >
                          Create Quotation
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger"
                          style={{ borderRadius: 8, fontWeight: "600" }}
                          onClick={() => setPendingDelete(r)}
                        >
                          Delete
                        </button>
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

      {/* Customer Creation Modal */}
      <AnimatePresence>
        {showModal && (
          <CustomerWizardModal
            wizardStep={wizardStep}
            form={form}
            setForm={setForm}
            onNext={nextStep}
            onPrev={prevStep}
            onSubmit={handleSave}
            onClose={closeModal}
            saving={saving}
          />
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
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
                  <h5 className="modal-title fw-bold" style={{ color: "#334155" }}>Delete Customer</h5>
                  <button
                    className="btn-close"
                    onClick={() => setPendingDelete(null)}
                  />
                </div>
                <div className="modal-body p-4 text-center">
                  <i className="ti ti-alert-triangle text-danger mb-3" style={{ fontSize: "2rem" }}></i>
                  <p className="mb-0">
                    Are you sure you want to delete customer <strong>{pendingDelete.firstName || pendingDelete.username}</strong>?
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
