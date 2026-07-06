import { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { getLeadFlow } from "../../api/flowApi";
import { getAssignableUsersForGroup } from "../../api/userGroupApi";

const EMPTY_ROW = () => ({ name: "", qty: 1, notes: "", categoryId: null, itemId: null });

export default function StockRequestFormModal({
  open,
  leadId,
  initialRows,
  itemOptions = [],
  leadOptions = [],
  initialLeadName = "",
  onClose,
  onSubmit,
  title = "Create Stock Request",
  requireLeadId = false,
  submitting = false,
  statusOptions = [],
  statusValue,
  onStatusChange,
  initialStatus = "",
}) {
  const defaultRows = useMemo(() => {
    const rows = Array.isArray(initialRows) && initialRows.length ? initialRows : [EMPTY_ROW()];
    return rows.map((row) => {
      const match = itemOptions.find(
        (item) => String(item.name || "").toLowerCase() === String(row.name || "").toLowerCase(),
      );
      const resolvedItemId = row.itemId ?? match?.id ?? null;
      return {
        ...row,
        name: row.name || match?.name || "",
        categoryId: row.categoryId ?? match?.categoryId ?? null,
        itemId: resolvedItemId,
      };
    });
  }, [initialRows, itemOptions]);
  const [rows, setRows] = useState(defaultRows);
  const [leadValue, setLeadValue] = useState(leadId ? String(leadId) : "");
  const [leadName, setLeadName] = useState(initialLeadName || "");
  const [touched, setTouched] = useState(false);
  const hasStatusField = Array.isArray(statusOptions) && statusOptions.length > 0;
  const [statusField, setStatusField] = useState(
    hasStatusField ? statusValue ?? initialStatus ?? "" : "",
  );

  const [assignableUsers, setAssignableUsers] = useState([]);
  const [selectedAssignee, setSelectedAssignee] = useState(null);

  useEffect(() => {
    if (open) {
      setRows(defaultRows);
    }
  }, [open, defaultRows]);

  useEffect(() => {
    if (!open) return;

    const loadAssignableUsers = async () => {
      try {
        const flow = await getLeadFlow();
        const rules = Array.isArray(flow?.rules) ? flow.rules : [];
        const stockRule = rules.find(
          (r) =>
            String(r?.status || "").trim().toLowerCase() === "stock request" ||
            String(r?.status || "").trim().toLowerCase() === "stock requested",
        );
        const groupId = stockRule?.handledByGroupId ?? null;
        if (!groupId) {
          setAssignableUsers([]);
          setSelectedAssignee(null);
          return;
        }
        const users = await getAssignableUsersForGroup({ groupId });
        setAssignableUsers(users);
        if (!selectedAssignee && users.length > 0) {
          setSelectedAssignee(users[0].id);
        }
      } catch {
        setAssignableUsers([]);
        setSelectedAssignee(null);
      }
    };

    loadAssignableUsers();
  }, [open]);

  useEffect(() => {
    if (leadId != null) {
      setLeadValue(String(leadId));
    } else if (!open) {
      setLeadValue("");
    }
  }, [leadId, open]);

  useEffect(() => {
    if (hasStatusField) {
      setStatusField(statusValue ?? initialStatus ?? "");
    } else {
      setStatusField("");
    }
  }, [hasStatusField, statusValue, initialStatus, open]);

  const normalizedRows = useMemo(
    () =>
      rows.map((row) => {
        const normalizedName = String(row.name || "").trim();
        const numericQty = Number(row.qty) || 0;
        const selectedItem = itemOptions.find((opt) => String(opt.id) === String(row.itemId));
        return {
          ...row,
          qty: numericQty,
          name: normalizedName || selectedItem?.name || "",
          notes: String(row.notes || "").trim(),
          categoryId: row.categoryId ?? selectedItem?.categoryId ?? null,
          itemId: row.itemId ?? null,
        };
      }),
    [rows, itemOptions],
  );

  useEffect(() => {
    if (leadId != null) {
      const selectedLead = leadOptions.find((lead) => String(lead.id) === String(leadId));
      setLeadName(selectedLead?.name || initialLeadName || "");
      setLeadValue(String(leadId));
    } else if (!open) {
      setLeadName(initialLeadName || "");
      setLeadValue("");
    }
  }, [leadId, leadOptions, initialLeadName, open]);

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

  const validRows = useMemo(
    () =>
      normalizedRows.filter(
        (row) => (row.name || row.itemId) && row.qty > 0,
      ),
    [normalizedRows],
  );

  const isLeadValid = !requireLeadId || Boolean(leadValue && leadValue.toString().trim());
  const isValid = isLeadValid && validRows.length > 0;

  const handleChange = (index, key, value) => {
    setRows((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [key]: value };
      return next;
    });
  };

  const handleAddRow = () => setRows((prev) => [...prev, EMPTY_ROW()]);
  const handleRemoveRow = (index) =>
    setRows((prev) => prev.filter((_, idx) => idx !== index));

  const handleSubmit = () => {
    setTouched(true);
    if (submitting) return;
    // recompute validity in case memo is stale
    const normalized = rows.map((row) => {
      const normalizedName = String(row.name || "").trim();
      const numericQty = Number(row.qty) || 0;
      const selectedItem = itemOptions.find((opt) => String(opt.id) === String(row.itemId));
      return {
        ...row,
        qty: numericQty,
        name: normalizedName || selectedItem?.name || "",
        notes: String(row.notes || "").trim(),
        categoryId: row.categoryId ?? selectedItem?.categoryId ?? null,
        itemId: row.itemId ?? null,
      };
    });
    const currValid = normalized.filter((r) => (r.name || r.itemId) && r.qty > 0);
    if (!isLeadValid || currValid.length === 0) {
      console.debug("validation failed", { isLeadValid, currValid, normalized, rows });
      alert(
        "Invalid request:\n" +
          JSON.stringify({ isLeadValid, currValid, normalized, rows }, null, 2),
      );
      return;
    }
    onSubmit?.({
      leadId: Number(leadValue),
      leadName,
      items: currValid,
      status: hasStatusField ? statusField || undefined : undefined,
      assignedTo: selectedAssignee || undefined,
    });
  };

  if (!open) return null;

  return (
    <div
      className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
      style={{ zIndex: 1050, background: "rgba(0,0,0,0.35)" }}
    >
      <div className="card shadow-lg" style={{ width: "min(460px, 90vw)" }}>
        <div className="card-header d-flex justify-content-between align-items-center">
          <h5 className="mb-0">{title}</h5>
          <button type="button" className="btn-close" onClick={onClose} />
        </div>
        <div className="card-body">
          {requireLeadId && (
            <div className="mb-3">
              <label className="form-label">Lead</label>
              {leadOptions && leadOptions.length > 0 ? (
                <>
                  <select
                    className="form-select"
                    value={leadValue}
                    onChange={(e) => {
                      const id = e.target.value;
                      setLeadValue(id);
                      const selectedLead = leadOptions.find((lead) => String(lead.id) === id);
                      setLeadName(selectedLead?.name || "");
                    }}
                  >
                    <option value="">Select Lead</option>
                    {leadOptions.map((lead) => (
                      <option key={lead.id} value={lead.id}>
                        {lead.label || `${lead.displayId || lead.id} · ${lead.name || "Unnamed"}`}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    className="form-control mt-2"
                    value={leadValue}
                    onChange={(e) => {
                      const next = e.target.value;
                      setLeadValue(next);
                      const matchingLead = leadOptions.find(
                        (lead) => String(lead.displayId || lead.id) === String(next),
                      );
                      setLeadName(matchingLead?.name || "");
                    }}
                    placeholder="Or type Lead ID"
                    min="0"
                  />
                </>
              ) : (
                <input
                  type="number"
                  className="form-control"
                  value={leadValue}
                  onChange={(e) => setLeadValue(e.target.value)}
                  placeholder="Enter Lead ID"
                />
              )}
              {leadName && leadValue && (
                <small className="text-muted d-block">{leadName}</small>
              )}
            </div>
          )}

          {assignableUsers.length > 0 && (
            <div className="mb-3">
              <label className="form-label">Assign To</label>
              <select
                className="form-select"
                value={selectedAssignee || ""}
                onChange={(e) => setSelectedAssignee(e.target.value ? Number(e.target.value) : null)}
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
          {hasStatusField && (
            <div className="mb-3">
              <label className="form-label">Status</label>
              <select
                className="form-select"
                value={statusField}
                onChange={(e) => {
                  const next = e.target.value;
                  setStatusField(next);
                  onStatusChange?.(next);
                }}
              >
                <option value="">Select status</option>
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="mb-2 d-flex justify-content-between align-items-center">
            <label className="form-label mb-0">Items</label>
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary"
              onClick={handleAddRow}
            >
              + Add item
            </button>
          </div>
          {rows.map((row, index) => (
            <div key={index} className="border rounded p-2 mb-2">
              <div className="row g-2 align-items-center">
                <div className="col-5">
                  <label className="form-label">Item name</label>
                  {itemOptions && itemOptions.length > 0 ? (
                    <select
                      className="form-select"
                      value={row.itemId ?? ""}
                      onChange={(e) => {
                        const value = e.target.value;
                        const selectedItem = itemOptions.find((opt) => String(opt.id) === value);
                        handleChange(index, "itemId", value ? Number(value) : null);
                        if (selectedItem) {
                          handleChange(index, "name", selectedItem.name);
                          handleChange(index, "categoryId", selectedItem.categoryId);
                        } else {
                          handleChange(index, "name", "");
                          handleChange(index, "categoryId", null);
                        }
                      }}
                    >
                      <option value="">Select item</option>
                      {itemOptions
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
                  ) : (
                    <input
                      type="text"
                      className="form-control"
                      value={row.name}
                      onChange={(e) => handleChange(index, "name", e.target.value)}
                    />
                  )}
                  {itemOptions && itemOptions.length === 0 && (
                    <small className="text-muted d-block">No stock items available. Please add items first.</small>
                  )}
                  {itemOptions && itemOptions.length > 0 && row.itemId != null && (
                    <div className="mt-1">
                      <small className="text-muted d-block">
                        {formatItemOptionLabel(itemOptions.find((item) => String(item.id) === String(row.itemId)))}
                      </small>
                    </div>
                  )}
                </div>
                <div className="col-4">
                  <label className="form-label">Quantity</label>
                  <input
                    type="number"
                    min={0}
                    className="form-control"
                    value={row.qty}
                    onChange={(e) => handleChange(index, "qty", e.target.value)}
                  />
                </div>
                <div className="col-3 d-flex align-items-end">
                  <button
                    type="button"
                    className="btn btn-outline-danger w-100"
                    onClick={() => handleRemoveRow(index)}
                    disabled={rows.length === 1}
                  >
                    Remove
                  </button>
                </div>
              </div>
              <div className="mt-2">
                <label className="form-label">Notes (optional)</label>
                <input
                  type="text"
                  className="form-control"
                  value={row.notes}
                  onChange={(e) => handleChange(index, "notes", e.target.value)}
                />
              </div>
            </div>
          ))}
          {touched && !isLeadValid && (
            <div className="alert alert-danger py-2">Lead ID is required.</div>
          )}
          {touched && validRows.length === 0 && (
            <div className="alert alert-danger py-2">Enter at least one item with quantity.</div>
          )}
          <div className="d-flex justify-content-end gap-2">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? "Submitting..." : "Submit"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

StockRequestFormModal.propTypes = {
  open: PropTypes.bool,
  leadId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  itemOptions: PropTypes.arrayOf(PropTypes.object),
  leadOptions: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    name: PropTypes.string,
  })),
  initialLeadName: PropTypes.string,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  title: PropTypes.string,
  requireLeadId: PropTypes.bool,
  submitting: PropTypes.bool,
  statusOptions: PropTypes.arrayOf(PropTypes.string),
  statusValue: PropTypes.string,
  onStatusChange: PropTypes.func,
  initialStatus: PropTypes.string,
};
