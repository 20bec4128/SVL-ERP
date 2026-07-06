import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getLeadFlow } from "../../api/flowApi";
import { getAssignableUsersForGroup } from "../../api/userGroupApi";
import { getLeads } from "../../api/leadsApi";
import { getStockItems, createStockRequest } from "../../api/stocksApi";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../components/system/ToastProvider";
import { extractApiErrorMessage } from "../../utils/errorMessage";

const EMPTY_ROW = () => ({ name: "", qty: 1, notes: "", categoryId: null, itemId: null });

export default function StockRequestCreatePage() {
  const { user } = useAuth();
  const role = String(user?.role || "").toUpperCase();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();

  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // Lookup options
  const [stockItems, setStockItems] = useState([]);
  const [leadOptions, setLeadOptions] = useState([]);
  const [assignableUsers, setAssignableUsers] = useState([]);

  // Form states
  const [leadValue, setLeadValue] = useState("");
  const [leadName, setLeadName] = useState("");
  const [selectedAssignee, setSelectedAssignee] = useState("");
  const [rows, setRows] = useState([EMPTY_ROW()]);
  const [touched, setTouched] = useState(false);

  // Load master data
  useEffect(() => {
    let active = true;
    const loadData = async () => {
      setLoading(true);
      try {
        const leadParams = { size: 1000 };
        if (role === "PRODUCTION") {
          leadParams.owner = user?.id;
        }

        const [leadsRows, itemsRows, flow] = await Promise.all([
          getLeads(leadParams),
          getStockItems(),
          getLeadFlow(),
        ]);

        if (!active) return;

        // Leads mapping
        setLeadOptions(
          Array.isArray(leadsRows)
            ? leadsRows
                .filter((row) => row?.id != null && (row?.name || row?.leadName || row?.leadId))
                .map((row) => {
                  const displayId = row.leadId || row.id;
                  const name = row.leadName || row.name || `Lead ${displayId}`;
                  return {
                    id: row.id,
                    name,
                    displayId,
                    label: `${displayId} · ${name}`,
                  };
                })
            : []
        );

        // Stock Items mapping
        setStockItems(Array.isArray(itemsRows) ? itemsRows : []);

        // Assignment users mapping
        const rules = Array.isArray(flow?.rules) ? flow.rules : [];
        const stockRule = rules.find(
          (r) =>
            String(r?.status || "").trim().toLowerCase() === "stock request" ||
            String(r?.status || "").trim().toLowerCase() === "stock requested"
        );
        const groupId = stockRule?.handledByGroupId ?? null;

        if (groupId) {
          const users = await getAssignableUsersForGroup({ groupId });
          if (active) {
            setAssignableUsers(users);
            if (users.length > 0) {
              setSelectedAssignee(users[0].id);
            }
          }
        }
      } catch (e) {
        showError(extractApiErrorMessage(e, "Failed to load page options"));
      } finally {
        if (active) setLoading(false);
      }
    };

    loadData();
    return () => {
      active = false;
    };
  }, [role, user?.id, showError]);

  const selectedItemIds = useMemo(() => {
    const set = new Set();
    rows.forEach((row) => {
      if (row.itemId != null && String(row.itemId).trim()) {
        set.add(String(row.itemId));
      }
    });
    return set;
  }, [rows]);

  const formatItemOptionLabel = (item) => {
    if (!item) return "";
    const parts = [item.name];
    if (item.categoryName) parts.push(item.categoryName);
    if (item.vendorName) parts.push(item.vendorName);
    const qty = Number(item.quantity);
    if (!Number.isNaN(qty)) parts.push(`Qty ${qty}`);
    const minTh = Number(item.minThreshold);
    if (!Number.isNaN(minTh)) parts.push(`Min ${minTh}`);
    const values = item.values || {};
    const valueParts = [];
    const seen = new Set();
    ["material", "manufacturer", "supplier", "size", "uom"].forEach((key) => {
      const entry = values[key];
      if (entry) {
        const part = `${key}: ${entry}`;
        valueParts.push(part);
        seen.add(part);
      }
    });
    if (valueParts.length < 3) {
      for (const [key, value] of Object.entries(values)) {
        if (value && valueParts.length < 3) {
          const part = `${key}: ${value}`;
          if (!seen.has(part)) {
            valueParts.push(part);
            seen.add(part);
          }
        }
      }
    }
    if (valueParts.length) {
      parts.push(valueParts.join(" · "));
    }
    return parts.filter(Boolean).join(" · ");
  };

  const handleAddRow = () => setRows((prev) => [...prev, EMPTY_ROW()]);
  const handleRemoveRow = (index) => setRows((prev) => prev.filter((_, idx) => idx !== index));

  const handleChange = (index, key, value) => {
    setRows((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [key]: value };
      return next;
    });
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setTouched(true);

    const normalized = rows.map((row) => {
      const normalizedName = String(row.name || "").trim();
      const numericQty = Number(row.qty) || 0;
      const selectedItem = stockItems.find((opt) => String(opt.id) === String(row.itemId));
      return {
        ...row,
        qty: numericQty,
        name: normalizedName || selectedItem?.name || "",
        notes: String(row.notes || "").trim(),
        categoryId: row.categoryId ?? selectedItem?.categoryId ?? null,
        itemId: row.itemId ?? null,
      };
    });

    const validRows = normalized.filter((r) => (r.name || r.itemId) && r.qty > 0);
    if (validRows.length === 0) {
      showError("Please add at least one item with a valid quantity");
      return;
    }

    setSaving(true);
    try {
      await createStockRequest({
        leadId: leadValue ? Number(leadValue) : null,
        leadName: leadValue ? leadName : null,
        items: validRows,
        assignedTo: selectedAssignee || undefined,
      });
      showSuccess("Stock request created successfully");
      navigate("/stock-requests");
    } catch (err) {
      showError(extractApiErrorMessage(err, "Failed to create stock request"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="content">
      {/* Breadcrumb Header */}
      <div className="card border-0 shadow-sm p-4 mb-4 bg-white" style={{ borderRadius: 12 }}>
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
          <div>
            <h2 className="leads-header-title mb-1" style={{ fontSize: "1.4rem", fontWeight: "700", color: "#0f172a" }}>
              Create Stock Request
            </h2>
            <nav className="mb-0">
              <ol className="breadcrumb mb-0" style={{ fontSize: "0.9rem" }}>
                <li className="breadcrumb-item">
                  <Link to="/admin-dashboard" style={{ color: "#64748b", textDecoration: "none" }}>
                    Home
                  </Link>
                </li>
                <li className="breadcrumb-item" style={{ color: "#64748b" }}>Inventory</li>
                <li className="breadcrumb-item">
                  <Link to="/stock-requests" style={{ color: "#64748b", textDecoration: "none" }}>
                    Stock Requests
                  </Link>
                </li>
                <li className="breadcrumb-item active" style={{ color: "#0f172a", fontWeight: "500" }}>
                  Create Request
                </li>
              </ol>
            </nav>
          </div>
          <div>
            <Link to="/stock-requests" className="btn btn-secondary d-flex align-items-center gap-2">
              <i className="ti ti-arrow-left" /> Back to Requests
            </Link>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="card p-5 text-center border-0 shadow-sm">
          <div className="spinner-border text-primary mx-auto" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="row">
            {/* Left Side: Lead & Assignment Details */}
            <div className="col-lg-4">
              <div className="card border-0 shadow-sm mb-4 bg-white" style={{ borderRadius: 12 }}>
                <div className="card-header bg-transparent border-bottom py-3">
                  <h5 className="mb-0 fw-bold text-dark">Request Details</h5>
                </div>
                <div className="card-body">
                  <div className="mb-3">
                    <label className="form-label fw-semibold text-dark">Lead (optional)</label>
                    <select
                      className="form-select"
                      value={leadValue}
                      onChange={(e) => {
                        const id = e.target.value;
                        setLeadValue(id);
                        const selectedLead = leadOptions.find((lead) => String(lead.id) === id);
                        setLeadName(selectedLead?.name || "");
                      }}
                      style={{ borderRadius: 8 }}
                    >
                      <option value="">Select Lead (or leave empty for general stock)</option>
                      {leadOptions.map((lead) => (
                        <option key={lead.id} value={lead.id}>
                          {lead.label}
                        </option>
                      ))}
                    </select>
                    {leadName && leadValue && (
                      <small className="text-muted d-block mt-2 fw-bold text-primary">Selected: {leadName}</small>
                    )}
                  </div>

                  {assignableUsers.length > 0 && (
                    <div className="mb-0">
                      <label className="form-label fw-semibold text-dark">Assign To</label>
                      <select
                        className="form-select"
                        value={selectedAssignee || ""}
                        onChange={(e) => setSelectedAssignee(e.target.value ? Number(e.target.value) : null)}
                        style={{ borderRadius: 8 }}
                      >
                        <option value="">(Auto assign)</option>
                        {assignableUsers.map((user) => (
                          <option key={user.id} value={user.id}>
                            {user.username || `User ${user.id}`}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Side: Items Checklist */}
            <div className="col-lg-8">
              <div className="card border-0 shadow-sm mb-4 bg-white" style={{ borderRadius: 12 }}>
                <div className="card-header bg-transparent border-bottom py-3 d-flex justify-content-between align-items-center">
                  <h5 className="mb-0 fw-bold text-dark">Request Items</h5>
                  <button type="button" className="btn btn-primary btn-sm d-flex align-items-center gap-1" onClick={handleAddRow}>
                    <i className="ti ti-plus" /> Add Item
                  </button>
                </div>
                <div className="card-body bg-light" style={{ minHeight: 200, borderBottomLeftRadius: 12, borderBottomRightRadius: 12 }}>
                  {rows.map((row, index) => (
                    <div key={index} className="card p-3 mb-3 border-0 shadow-sm bg-white" style={{ borderRadius: 10 }}>
                      <div className="row align-items-center g-3">
                        <div className="col-md-6">
                          <label className="form-label text-muted small fw-semibold mb-1">Item Name</label>
                          <select
                            className="form-select"
                            value={row.itemId ?? ""}
                            onChange={(e) => {
                              const value = e.target.value;
                              const selectedItem = stockItems.find((opt) => String(opt.id) === value);
                              handleChange(index, "itemId", value ? Number(value) : null);
                              if (selectedItem) {
                                handleChange(index, "name", selectedItem.name);
                                handleChange(index, "categoryId", selectedItem.categoryId);
                              } else {
                                handleChange(index, "name", "");
                                handleChange(index, "categoryId", null);
                              }
                            }}
                            required
                            style={{ borderRadius: 8 }}
                          >
                            <option value="">Select item</option>
                            {stockItems
                              .filter((option) => {
                                if (!option?.id) return false;
                                if (row.itemId != null && String(option.id) === String(row.itemId)) {
                                  return true;
                                }
                                return !selectedItemIds.has(String(option.id));
                              })
                              .map((item) => (
                                <option key={item.id} value={item.id}>
                                  {formatItemOptionLabel(item)}
                                </option>
                              ))}
                          </select>
                        </div>
                        <div className="col-md-4">
                          <label className="form-label text-muted small fw-semibold mb-1">Quantity</label>
                          <input
                            type="number"
                            min="1"
                            className="form-control"
                            value={row.qty}
                            onChange={(e) => handleChange(index, "qty", Number(e.target.value) || 0)}
                            required
                            style={{ height: 40, borderRadius: 8 }}
                          />
                        </div>
                        <div className="col-md-2 text-end">
                          <button
                            type="button"
                            className="btn btn-outline-danger btn-sm border-0 d-flex align-items-center gap-1 ms-auto mt-3"
                            onClick={() => handleRemoveRow(index)}
                            disabled={rows.length === 1}
                          >
                            <i className="ti ti-trash" /> Remove
                          </button>
                        </div>
                        <div className="col-md-12">
                          <label className="form-label text-muted small fw-semibold mb-1">Notes (optional)</label>
                          <input
                            type="text"
                            className="form-control"
                            value={row.notes}
                            onChange={(e) => handleChange(index, "notes", e.target.value)}
                            placeholder="Add specific comments or dimensions..."
                            style={{ height: 38, borderRadius: 8 }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  {touched && !leadValue && (
                    <div className="alert alert-danger py-2 mt-2">Lead ID is required.</div>
                  )}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="card border-0 shadow-sm p-3 bg-white" style={{ borderRadius: 12 }}>
                <div className="d-flex align-items-center justify-content-end gap-2">
                  <Link to="/stock-requests" className="btn btn-light" style={{ borderRadius: 8 }}>
                    Cancel
                  </Link>
                  <button type="submit" className="btn btn-primary" disabled={saving} style={{ borderRadius: 8, minWidth: 120 }}>
                    {saving ? "Submitting..." : "Submit Request"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
