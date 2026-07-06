import { useEffect, useMemo, useState } from "react";
import { getVendors } from "../../api/vendorsApi";
import { createVendorOrder } from "../../api/vendorOrdersApi";
import { getServiceCategories } from "../../api/serviceCategoriesApi";
import { getServiceTypes } from "../../api/serviceTypesApi";
import { extractApiErrorMessage } from "../../utils/errorMessage";
import { useToast } from "../../components/system/ToastProvider";
import "./CreateVendorOrderModal.css";

const initialForm = {
  projectName: "",
  categoryId: "",
  typeId: "",
  subtypeId: "",
  vendorId: "",
  quantity: "",
  requiredDate: "",
  notes: "",
  uploadDesignFile: null,
};

export default function CreateVendorOrderModal({ open, onClose, onCreated }) {
  const { showSuccess, showError } = useToast();

  const [form, setForm] = useState(initialForm);
  const [vendors, setVendors] = useState([]);
  const [categories, setCategories] = useState([]);
  const [allTypes, setAllTypes] = useState([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // Reset form every time the modal opens
  useEffect(() => {
    if (open) {
      setForm(initialForm);
      setError("");
    }
  }, [open]);

  // Load lookup data once
  useEffect(() => {
    const loadLookups = async () => {
      const [vendorData, categoryData, typeData] = await Promise.all([
        getVendors().catch(() => []),
        getServiceCategories().catch(() => []),
        getServiceTypes().catch(() => []),
      ]);
      setVendors(Array.isArray(vendorData) ? vendorData : []);
      setCategories(Array.isArray(categoryData) ? categoryData : []);
      setAllTypes(Array.isArray(typeData) ? typeData : []);
    };
    loadLookups();
  }, []);

  const typeOptions = useMemo(() => {
    if (!form.categoryId) return [];
    return allTypes.filter(
      (t) => String(t.categoryId) === String(form.categoryId) && !t.parentId,
    );
  }, [allTypes, form.categoryId]);

  const subtypeOptions = useMemo(() => {
    if (!form.typeId) return [];
    return allTypes.filter((t) => String(t.parentId) === String(form.typeId));
  }, [allTypes, form.typeId]);

  const filteredVendors = useMemo(() => {
    const activeVendors = vendors.filter((v) => {
      const st = String(v?.status || "").toLowerCase();
      return !st || st === "active";
    });

    if (!form.typeId) return activeVendors;

    const typeId = Number(form.typeId);
    const subtypeId = form.subtypeId ? Number(form.subtypeId) : null;

    const candidateTypeIds = subtypeId
      ? [subtypeId]
      : [
          typeId,
          ...allTypes
            .filter((t) => String(t.parentId) === String(typeId))
            .map((t) => Number(t.id))
            .filter((id) => !Number.isNaN(id)),
        ];

    return activeVendors.filter((v) => {
      const serviceTypeIds = Array.isArray(v?.serviceTypeIds) ? v.serviceTypeIds : [];
      const legacyTypeIds = Array.isArray(v?.brandIds) ? v.brandIds : [];
      const effectiveTypeIds = serviceTypeIds.length > 0 ? serviceTypeIds : legacyTypeIds;
      return candidateTypeIds.some((id) => effectiveTypeIds.includes(id));
    });
  }, [allTypes, form.subtypeId, form.typeId, vendors]);

  // Auto-clear or auto-select vendor when filtered list changes
  useEffect(() => {
    const selectedId = Number(form.vendorId);
    const vendorExists = filteredVendors.some((v) => Number(v.id) === selectedId);
    if (form.vendorId && !vendorExists) {
      setForm((p) => ({ ...p, vendorId: "" }));
      return;
    }
    if (!form.vendorId && filteredVendors.length === 1) {
      setForm((p) => ({ ...p, vendorId: String(filteredVendors[0].id) }));
    }
  }, [filteredVendors, form.vendorId]);

  const selectedCategory = useMemo(
    () => categories.find((c) => String(c.id) === String(form.categoryId)),
    [categories, form.categoryId],
  );
  const selectedType = useMemo(
    () => allTypes.find((t) => String(t.id) === String(form.typeId)),
    [allTypes, form.typeId],
  );
  const selectedSubtype = useMemo(
    () => allTypes.find((t) => String(t.id) === String(form.subtypeId)),
    [allTypes, form.subtypeId],
  );

  const setField = (key, value) => setForm((p) => ({ ...p, [key]: value }));

  const handleSubmit = async () => {
    setError("");

    if (!form.projectName.trim()) return setError("Project Name is required.");
    if (!form.categoryId) return setError("Service Category is required.");
    if (!form.typeId) return setError("Service Type is required.");
    if (!form.vendorId) return setError("Vendor is required.");
    if (!form.quantity.trim()) return setError("Quantity is required.");

    const selectedVendor =
      vendors.find((v) => String(v.id) === String(form.vendorId)) || null;

    setSaving(true);
    try {
      await createVendorOrder({
        projectName: form.projectName.trim(),
        categoryId: Number(form.categoryId),
        categoryName: selectedCategory?.name || "",
        typeId: Number(form.typeId),
        typeName: selectedType?.name || "",
        subtypeId: form.subtypeId ? Number(form.subtypeId) : null,
        subtypeName: selectedSubtype?.name || "",
        materialName: selectedSubtype?.name || selectedType?.name || "",
        vendorId: Number(form.vendorId),
        vendorName: selectedVendor?.vendorName || "",
        quantity: form.quantity.trim(),
        requiredDate: form.requiredDate || "",
        notes: form.notes.trim(),
        uploadDesignFile: form.uploadDesignFile,
        status: "New",
        paymentStatus: "Pending",
        accountsStatus: "Not Sent",
      });
      showSuccess("Vendor order created successfully", { title: "Vendor Orders" });
      onCreated();
      onClose();
    } catch (e) {
      const msg = extractApiErrorMessage(e, "Failed to create vendor order.");
      setError(msg);
      showError(msg, { title: "Vendor Orders" });
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  const hasSubtypes = subtypeOptions.length > 0;

  return (
    <div className="vom-backdrop">
      <div className="vom-modal" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="vom-modal-header">
          <h2 className="vom-modal-title">New Order Request</h2>
          <button type="button" className="vom-modal-close" onClick={onClose}>✕</button>
        </div>

        {/* Body */}
        <div className="vom-body">
          <div className="vom-section-title">Order Details</div>

          <div className="vom-grid">

            {/* Project Name — full width */}
            <div className="vom-field full">
              <label className="vom-label">Project Name <span className="req">*</span></label>
              <input
                className="vom-input"
                type="text"
                placeholder="Enter project name"
                value={form.projectName}
                onChange={(e) => setField("projectName", e.target.value)}
                autoFocus
              />
            </div>

            {/* Service Category */}
            <div className="vom-field">
              <label className="vom-label">Service Category <span className="req">*</span></label>
              <select
                className="vom-select"
                value={form.categoryId}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    categoryId: e.target.value,
                    typeId: "",
                    subtypeId: "",
                    vendorId: "",
                  }))
                }
              >
                <option value="">— select category —</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Service Type */}
            <div className="vom-field">
              <label className="vom-label">Service Type <span className="req">*</span></label>
              <select
                className="vom-select"
                value={form.typeId}
                disabled={!form.categoryId}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    typeId: e.target.value,
                    subtypeId: "",
                    vendorId: "",
                  }))
                }
              >
                <option value="">— select type —</option>
                {typeOptions.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            {/* Sub Type — only if subtypes exist */}
            {hasSubtypes && (
              <div className="vom-field">
                <label className="vom-label">Sub Type</label>
                <select
                  className="vom-select"
                  value={form.subtypeId}
                  disabled={!form.typeId}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, subtypeId: e.target.value, vendorId: "" }))
                  }
                >
                  <option value="">— select sub type —</option>
                  {subtypeOptions.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Vendor */}
            <div className="vom-field">
              <label className="vom-label">Vendor <span className="req">*</span></label>
              <select
                className="vom-select"
                value={form.vendorId}
                disabled={!form.typeId}
                onChange={(e) => setField("vendorId", e.target.value)}
              >
                <option value="">— select vendor —</option>
                {filteredVendors.map((v) => (
                  <option key={v.id} value={v.id}>{v.vendorName}</option>
                ))}
              </select>
            </div>

            {/* Quantity */}
            <div className="vom-field">
              <label className="vom-label">Quantity <span className="req">*</span></label>
              <input
                className="vom-input"
                type="text"
                placeholder="Enter quantity"
                value={form.quantity}
                onChange={(e) => setField("quantity", e.target.value)}
              />
            </div>

            {/* Required Date */}
            <div className="vom-field">
              <label className="vom-label">Required Date</label>
              <input
                className="vom-input"
                type="date"
                value={form.requiredDate}
                onChange={(e) => setField("requiredDate", e.target.value)}
              />
            </div>

            {/* Upload Design — full width */}
            <div className="vom-field full">
              <label className="vom-label">Upload Design</label>
              <input
                className="vom-file-input"
                type="file"
                onChange={(e) => setField("uploadDesignFile", e.target.files?.[0] || null)}
              />
            </div>

            {/* Notes — full width */}
            <div className="vom-field full">
              <label className="vom-label">Notes</label>
              <textarea
                className="vom-textarea"
                placeholder="Add any additional notes..."
                value={form.notes}
                onChange={(e) => setField("notes", e.target.value)}
              />
            </div>

            {/* Inline error */}
            {error && (
              <div className="vom-error">
                <i className="ti ti-alert-circle" />
                {error}
              </div>
            )}

          </div>
        </div>

        {/* Footer */}
        <div className="vom-footer">
          <button type="button" className="vom-btn light" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button type="button" className="vom-btn primary" onClick={handleSubmit} disabled={saving}>
            <i className="ti ti-circle-plus" />
            {saving ? "Creating..." : "Create Order"}
          </button>
        </div>
      </div>
    </div>
  );
}
