import { useEffect, useMemo, useState } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import {
  getStockCategories,
  getStockItems,
  updateStockItem,
  deleteStockItem,
  createStockRequest,
} from "../../api/stocksApi";
import { getLeads } from "../../api/leadsApi";
import { extractApiErrorMessage } from "../../utils/errorMessage";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../components/system/ToastProvider";
import useConfirmDialog from "../../components/system/useConfirmDialog";
import StockRequestFormModal from "../../components/system/StockRequestFormModal";
import PageHeader from "../../components/admin/PageHeader";

function colorFor(item) {
  const qty = Number(item.quantity) || 0;
  const min = Number(item.minThreshold) || 0;
  if (qty <= min * 0.2) return { bg: "bg-danger", tone: "dark" };
  if (qty <= min * 0.5) return { bg: "bg-warning", tone: "dark" };
  return { bg: "bg-success", tone: "light" };
}

export default function StocksDashboardPage() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const { showConfirm, confirmDialog } = useConfirmDialog();
  const [notification, setNotification] = useState(null);
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [adjustModal, setAdjustModal] = useState({ visible: false, item: null, sign: 1 });
  const [adjustAmount, setAdjustAmount] = useState(0);
  const [stockRequestModalOpen, setStockRequestModalOpen] = useState(false);
  const [stockRequestModalItem, setStockRequestModalItem] = useState(null);
  const [stockRequestError, setStockRequestError] = useState("");
  const [creatingRequest, setCreatingRequest] = useState(false);
  const [leadOptions, setLeadOptions] = useState([]);
  const initialLeadId = useMemo(
    () =>
      String(location.state?.leadId ?? searchParams.get("leadId") ?? "").trim(),
    [location.state, searchParams],
  );
  const [modalLeadId, setModalLeadId] = useState(initialLeadId);
  useEffect(() => {
    setModalLeadId(initialLeadId);
  }, [initialLeadId]);
  const selectedLeadOption = useMemo(() => {
    if (!modalLeadId) return null;
    return leadOptions.find((opt) => String(opt.id) === String(modalLeadId));
  }, [leadOptions, modalLeadId]);

  const requestModalRows = useMemo(() => {
    if (stockRequestModalItem) {
      return [
        {
          name: stockRequestModalItem.name || "",
          qty: 1,
          notes: "",
          categoryId: stockRequestModalItem.categoryId,
          itemId: stockRequestModalItem.id ?? null,
        },
      ];
    }
    return [{ name: "", qty: 1, notes: "", categoryId: null, itemId: null }];
  }, [stockRequestModalItem]);

  const openStockRequestModal = (item = null) => {
    setStockRequestModalItem(item);
    setStockRequestModalOpen(true);
    setStockRequestError("");
  };

  const handleStockRequestSubmit = async ({ leadId, leadName, items }) => {
    const finalLeadId = leadId || modalLeadId;
    if (!finalLeadId) {
      const message = "Lead ID is required";
      setStockRequestError(message);
      notifyError(message);
      return;
    }
    if (!Array.isArray(items) || items.length === 0) {
      const message = "Add at least one item";
      setStockRequestError(message);
      notifyError(message);
      return;
    }
    setCreatingRequest(true);
    setStockRequestError("");
    try {
      const resolvedLeadName =
        leadName ||
        selectedLeadOption?.name ||
        leadOptions.find((opt) => String(opt.id) === String(finalLeadId))?.name ||
        "";
      await createStockRequest({
        leadId: Number(finalLeadId),
        leadName: resolvedLeadName,
        requestedBy: user?.id,
        status: "pending",
        items,
      });
      showSuccess("Stock request routed to Accounts", { title: "Stock Dashboard" });
      setStockRequestModalOpen(false);
      setStockRequestModalItem(null);
      await loadData();
    } catch (e) {
      const message = extractApiErrorMessage(e, "Failed to create stock request");
      setStockRequestError(message);
      notifyError(message);
    } finally {
      setCreatingRequest(false);
    }
  };
  const customStyle = `
    .stock-card .bg-soft-white {
      background-color: rgba(255,255,255,0.85) !important;
      color: #0f172a;
    }
    .stock-card .bg-custom-muted {
      background-color: rgba(255,255,255,0.35);
    }
    .stock-card .card-body {
      min-height: 240px;
      background: linear-gradient(135deg, rgba(15,23,42,0.9), rgba(56,189,248,0.3));
      overflow: hidden;
    }
    .stock-card .btn-outline-light {
      border-color: rgba(255,255,255,0.2);
    }
  `;

  const loadData = useMemo(
    () => async () => {
      setLoading(true);
      const cats = await getStockCategories();
      const its = await getStockItems();
      setCategories(cats);
      setItems(its);
      setLoading(false);
    },
    [],
  );

  useEffect(() => {
    let active = true;
    const run = async () => {
      if (!active) return;
      await loadData();
    };
    run();
    return () => {
      active = false;
    };
  }, [loadData]);

  useEffect(() => {
    let active = true;
    const loadLeadsOptions = async () => {
      try {
        const rows = await getLeads({ size: 100 });
        if (!active) return;
        const normalized = Array.isArray(rows)
          ? rows
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
          : [];
        setLeadOptions(normalized);
      } catch (e) {
        console.error("failed to load lead options", e);
      }
    };
    loadLeadsOptions();
    return () => {
      active = false;
    };
  }, []);

  const filteredCats = categories.filter((c) =>
    !filter || c.name.toLowerCase().includes(filter.toLowerCase()),
  );

  const itemsByCat = filteredCats.map((cat) => ({
    ...cat,
    items: items.filter((i) => i.categoryId === cat.id),
  }));

  const notifySuccess = (message) => {
    setNotification({ type: "success", message });
    showSuccess(message, { title: "Stock Dashboard" });
  };

  const notifyError = (message) => {
    setNotification({ type: "error", message });
    showError(message, { title: "Stock Dashboard" });
  };

  useEffect(() => {
    if (!notification) return undefined;
    const timeout = window.setTimeout(() => setNotification(null), 5000);
    return () => window.clearTimeout(timeout);
  }, [notification]);

  const adjustQuantity = async (item, delta) => {
    const newQty = (Number(item.quantity) || 0) + delta;
    if (newQty < 0) {
      notifyError("Quantity cannot go below zero");
      return;
    }
    const payload = {
      categoryId: item.categoryId,
      name: item.name,
      minThreshold: item.minThreshold,
      values: item.values || {},
      vendorId: item.vendorId,
      vendorName: item.vendorName,
      quantity: newQty,
    };
    try {
      const previousQty = Number(item.quantity) || 0;
      const updated = await updateStockItem(item.id, payload);
      setItems((prev) => prev.map((it) => (it.id === item.id ? updated : it)));
      const updatedQty = Number(updated.quantity) || 0;
      const change = updatedQty - previousQty;
      if (change > 0) {
        notifySuccess("Stock quantity increased");
      } else if (change < 0) {
        notifySuccess("Stock quantity decreased");
      } else {
        notifySuccess("Stock quantity updated");
      }
    } catch (e) {
      notifyError(extractApiErrorMessage(e, "Failed to update stock quantity"));
      throw e;
    }
  };

  const removeItem = (item) => {
    showConfirm({
      title: "Delete stock item",
      message: `Delete "${item.name || "item"}"? This action cannot be undone.`,
      confirmLabel: "Delete",
      cancelLabel: "Cancel",
      onConfirm: async () => {
        try {
          await deleteStockItem(item.id);
          setItems((prev) => prev.filter((it) => it.id !== item.id));
          notifySuccess("Stock item deleted");
        } catch (e) {
          notifyError(extractApiErrorMessage(e, "Failed to delete stock item"));
        }
      },
    });
  };

  return (
    <>
      <style>{customStyle}</style>
      <div className="container-fluid">
        <PageHeader
          title="Stock Dashboard"
          breadcrumb={[
            { label: "Dashboard", path: "/admin-dashboard" },
            { label: "Stocks", path: "" },
          ]}
        />
        <div className="d-flex align-items-center justify-content-between mb-3">
          <div>
            <input
              type="text"
              className="form-control w-25"
              placeholder="Filter by category"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </div>
          <div>
            <button
              className="btn btn-sm btn-outline-primary me-2"
              onClick={() => (window.location.href = "/stocks/item")}
            >
              + Add Item
            </button>
            <button
              className="btn btn-sm btn-outline-secondary"
              onClick={() => (window.location.href = "/stocks/categories")}
            >
              Manage Categories
            </button>
          </div>
        </div>
        {loading ? (
          <div>Loading...</div>
        ) : (
          itemsByCat.map((cat) => (
            <div key={cat.id} className="mb-4">
              <h5>{cat.name}</h5>
              {cat.items.length === 0 ? (
                <div className="text-muted">No items</div>
              ) : (
                <div className="row g-2">
                  {cat.items.map((item) => (
                    <div key={item.id} className="col-md-4">
                      <div className="card border-0 shadow-sm h-100 stock-card">
                        <div className={`card-body rounded-3 position-relative p-4 ${colorFor(item).bg}`}>
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <div>
                              <span className="badge rounded-pill bg-soft-white text-dark me-2">
                                Qty {item.quantity ?? 0}
                              </span>
                              <span className="badge rounded-pill bg-custom-muted">
                                Min {item.minThreshold ?? 0}
                              </span>
                            </div>
                            {item.vendorName && (
                              <span className="text-uppercase fw-semibold lh-1 fs-7">
                                {item.vendorName}
                              </span>
                            )}
                          </div>
                          <h5 className="card-title fw-bold text-white">{item.name || "Stock Item"}</h5>
                          <p className="card-text text-white-75 small mb-3">
                            {item.categoryName || "Uncategorized"} · {item.values?.material || "-"}
                          </p>
                          <div className="d-flex flex-wrap gap-2">
                            <button
                              className="btn btn-sm btn-light text-success fw-semibold"
                              onClick={() => setAdjustModal({ visible: true, item, sign: 1 })}
                            >
                              + Add
                            </button>
                            <button
                              className="btn btn-sm btn-light text-danger fw-semibold"
                              onClick={() => setAdjustModal({ visible: true, item, sign: -1 })}
                            >
                              - Remove
                            </button>
                            <button
                              className="btn btn-sm btn-outline-light text-white fw-semibold"
                              onClick={() => removeItem(item)}
                            >
                              Delete
                            </button>
                            <button
                              className="btn btn-sm btn-outline-warning text-white fw-semibold"
                              onClick={() => openStockRequestModal(item)}
                            >
                              Request Stock
                            </button>
                          </div>
                          <ul className="list-unstyled small text-white-50 mt-3 mb-0">
                            {Object.entries(item.values || {}).map(([k, v]) => (
                              <li key={k} className="d-flex justify-content-between">
                                <span className="text-uppercase fs-7">{k}</span>
                                <span className="fw-semibold">{v}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
      {adjustModal.visible && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-dark bg-opacity-50"
          style={{ zIndex: 1050 }}
          onClick={() => setAdjustModal({ visible: false, item: null, sign: 1 })}
        >
          <div className="card p-4" onClick={(e) => e.stopPropagation()} style={{ minWidth: 300 }}>
            <h5>{adjustModal.sign === 1 ? "Increase" : "Decrease"} Quantity</h5>
            <div className="mb-3">
              <input
                type="number"
                className="form-control"
                value={adjustAmount}
                onChange={(e) => setAdjustAmount(e.target.value)}
                placeholder="Amount"
              />
            </div>
            <div className="d-flex justify-content-end gap-2">
              <button className="btn btn-secondary" onClick={() => setAdjustModal({ visible: false, item: null, sign: 1 })}>
                Cancel
              </button>
              <button
                className="btn btn-primary"
                    onClick={async () => {
                      const amt = Number(adjustAmount) || 0;
                      if (amt !== 0 && adjustModal.item) {
                        try {
                          await adjustQuantity(adjustModal.item, adjustModal.sign * amt);
                        } catch (e) {
                          // error already notified
                        }
                      }
                      setAdjustAmount(0);
                      setAdjustModal({ visible: false, item: null, sign: 1 });
                    }}
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
      {confirmDialog}
      <StockRequestFormModal
        open={stockRequestModalOpen}
        leadId={modalLeadId}
        initialLeadName={selectedLeadOption?.name || ""}
        leadOptions={leadOptions}
        initialRows={requestModalRows}
        onClose={() => setStockRequestModalOpen(false)}
        onSubmit={handleStockRequestSubmit}
        submitting={creatingRequest}
        requireLeadId={false}
        title={stockRequestModalItem ? `Request ${stockRequestModalItem.name || "Item"}` : "Request Stock"}
        itemOptions={items}
      />
    </>
  );
}
