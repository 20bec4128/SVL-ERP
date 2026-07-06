import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getVendors } from "../../api/vendorsApi";
import { createVendorOrder } from "../../api/vendorOrdersApi";
import { getServiceCategories } from "../../api/serviceCategoriesApi";
import { getServiceTypes } from "../../api/serviceTypesApi";
import "./VendorOrderCreatePage.css";

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

export default function VendorOrderCreatePage() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [vendors, setVendors] = useState([]);
  const [categories, setCategories] = useState([]);
  const [allTypes, setAllTypes] = useState([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.projectName.trim()) return setError("Project Name is required.");
    if (!form.categoryId) return setError("Service Category is required.");
    if (!form.typeId) return setError("Service Type is required.");
    if (!form.vendorId) return setError("Vendor is required.");
    if (!form.quantity.trim()) return setError("Quantity is required.");

    const selectedVendor =
      vendors.find((vendor) => String(vendor.id) === String(form.vendorId)) || null;

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
      navigate("/stocks/vendor-orders");
    } catch {
      setError("Failed to create vendor order.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="content">
      <div className="voc-card">
        <div className="voc-card-header">
          <h5 className="voc-card-title">New Order Request</h5>
          <Link to="/stocks/vendor-orders" className="voc-back-btn">
            <i className="ti ti-arrow-left"></i>
            Back
          </Link>
        </div>

        <div className="voc-card-body">
          <h6 className="voc-section-title">Order Details</h6>

          <form onSubmit={handleSubmit} className="voc-form">
            <div className="voc-row">
              <div className="voc-col">
                <label className="voc-label">Project Name<span className="required">*</span></label>
                <input
                  type="text"
                  className="voc-input"
                  placeholder="Enter project name"
                  value={form.projectName}
                  onChange={(e) => setForm((p) => ({ ...p, projectName: e.target.value }))}
                />
              </div>
              <div className="voc-col">
                <label className="voc-label">Service Category<span className="required">*</span></label>
                <select
                  className="voc-select"
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
                  <option value="">-- Select category --</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="voc-row">
              <div className="voc-col">
                <label className="voc-label">Service Type<span className="required">*</span></label>
                <select
                  className="voc-select"
                  value={form.typeId}
                  disabled={!form.categoryId}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, typeId: e.target.value, subtypeId: "", vendorId: "" }))
                  }
                >
                  <option value="">-- Select type --</option>
                  {typeOptions.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
              <div className="voc-col">
                {subtypeOptions.length > 0 ? (
                  <>
                    <label className="voc-label">Sub Type</label>
                    <select
                      className="voc-select"
                      value={form.subtypeId}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, subtypeId: e.target.value, vendorId: "" }))
                      }
                    >
                      <option value="">-- Select sub type --</option>
                      {subtypeOptions.map((t) => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </>
                ) : (
                  <>
                    <label className="voc-label">Vendor<span className="required">*</span></label>
                    <select
                      className="voc-select"
                      value={form.vendorId}
                      onChange={(e) => setForm((p) => ({ ...p, vendorId: e.target.value }))}
                    >
                      <option value="">-- Select vendor --</option>
                      {filteredVendors.map((v) => (
                        <option key={v.id} value={v.id}>{v.vendorName}</option>
                      ))}
                    </select>
                  </>
                )}
              </div>
            </div>

            {subtypeOptions.length > 0 ? (
              <div className="voc-row">
                <div className="voc-col">
                  <label className="voc-label">Vendor<span className="required">*</span></label>
                  <select
                    className="voc-select"
                  value={form.vendorId}
                  onChange={(e) => setForm((p) => ({ ...p, vendorId: e.target.value }))}
                >
                  <option value="">-- Select vendor --</option>
                  {filteredVendors.map((v) => (
                    <option key={v.id} value={v.id}>{v.vendorName}</option>
                  ))}
                </select>
              </div>
                <div className="voc-col">
                  <label className="voc-label">Quantity<span className="required">*</span></label>
                  <input
                    type="text"
                    className="voc-input"
                    placeholder="Enter quantity"
                    value={form.quantity}
                    onChange={(e) => setForm((p) => ({ ...p, quantity: e.target.value }))}
                  />
                </div>
              </div>
            ) : (
              <div className="voc-row">
                <div className="voc-col">
                  <label className="voc-label">Quantity<span className="required">*</span></label>
                  <input
                    type="text"
                    className="voc-input"
                    placeholder="Enter quantity"
                    value={form.quantity}
                    onChange={(e) => setForm((p) => ({ ...p, quantity: e.target.value }))}
                  />
                </div>
                   <div className="voc-col">
                <label className="voc-label">Required Date</label>
                <input
                  type="date"
                  className="voc-input"
                  value={form.requiredDate}
                  onChange={(e) => setForm((p) => ({ ...p, requiredDate: e.target.value }))}
                />
              </div>
                <div className="voc-col"></div>
              </div>
            )}

            <div className="voc-row">
           
              <div className="voc-col">
                <label className="voc-label">Upload Design</label>
                <input
                  type="file"
                  className="voc-input"
                  onChange={(e) =>
                    setForm((p) => ({ ...p, uploadDesignFile: e.target.files?.[0] || null }))
                  }
                />
              </div>
            </div>

            <div className="voc-row">
              <div className="voc-col">
                <label className="voc-label">Notes</label>
                <textarea
                  className="voc-textarea"
                  placeholder="Add any additional notes..."
                  value={form.notes}
                  onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                ></textarea>
              </div>
              
            </div>

            {error ? (
              <div className="voc-error">
                <i className="ti ti-alert-circle" style={{ marginRight: "0.4rem" }}></i>
                {error}
              </div>
            ) : null}

            <div className="voc-actions">
              <button type="submit" className="voc-btn primary" disabled={saving}>
                <i className="ti ti-check"></i>
                {saving ? "Creating..." : "Create Order"}
              </button>
              <Link to="/stocks/vendor-orders" className="voc-btn light">
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
