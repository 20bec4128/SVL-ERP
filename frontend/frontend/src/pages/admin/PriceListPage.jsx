import { Fragment, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../../components/admin/PageHeader";
import { getFieldsByServiceType } from "../../api/productFieldConfigApi";
import { getPriceList, getPriceListSummary, normalizePriceListPage, savePriceEntry, deletePriceEntry } from "../../api/priceListApi";
import { getServiceCategories } from "../../api/serviceCategoriesApi";
import { getServiceTypes } from "../../api/serviceTypesApi";
import { getCustomOptions, saveCustomOption } from "../../api/customOptionsApi";
import PageSizeSelector from "../../components/admin/PageSizeSelector";
import {
  collectCustomOptionSaves,
  getConfiguredSizeDimensions,
  getCustomSizeEntries,
  getCustomSizeStorageKeys,
  getSizeFieldConfig,
  getCustomSizeSummary,
} from "../../utils/customSizeUtils";
import "./PriceListPage.css";

/* ── helpers ──────────────────────────────────────────────────────────── */
const LEGACY_CUSTOM_SIZE_FIELD_KEYS = new Set(["customWidth", "customHeight", "customDepth"]);

function emptyForm() {
  return {
    categoryId: "",
    typeId: "",
    subtypeId: "",
    variantFields: {},
    quantitySlabs: [{ minQty: "", maxQty: "", pricePerPiece: "" }],
  };
}

function variantSummary(variantFields, sizeFieldConfig = null) {
  const source = variantFields || {};
  const SKIP = new Set([
    "customUnit",
    "customDimensions",
    ...Object.keys(source).filter((key) => key === "customWidth" || key === "customHeight" || key === "customDepth" || key.startsWith("customSize_")),
  ]);
  const entries = Object.entries(source)
    .filter(([key, v]) => !key.endsWith("Custom") && !key.endsWith("Text") && !SKIP.has(key) && v !== "" && v != null)
    .map(([key, v]) => {
      if (v === "Custom") {
        if (key === "size") {
          const summary = getCustomSizeSummary(
            sizeFieldConfig || (source.customDimensions ? { customDimensions: source.customDimensions } : null),
            source
          );
          if (summary) return [key, summary];
        }
        if (source[`${key}Custom`]) return [key, source[`${key}Custom`]];
      }
      return [key, v];
    });
  if (!entries.length) return "—";
  const shown = entries.slice(0, 3).map(([, v]) => v).join(", ");
  return entries.length > 3 ? `${shown} +${entries.length - 3} more` : shown;
}

function variantBadges(variantFields, sizeFieldConfig = null) {
  const source = variantFields || {};
  const SKIP = new Set([
    "customUnit",
    "customDimensions",
    ...Object.keys(source).filter((key) => key === "customWidth" || key === "customHeight" || key === "customDepth" || key.startsWith("customSize_")),
  ]);
  return Object.entries(source)
    .filter(([key, v]) => !key.endsWith("Custom") && !key.endsWith("Text") && !SKIP.has(key) && v !== "" && v != null)
    .map(([key, v]) => {
      if (v === "Custom") {
        if (key === "size") {
          const summary = getCustomSizeSummary(
            sizeFieldConfig || (source.customDimensions ? { customDimensions: source.customDimensions } : null),
            source
          );
          if (summary) return [key, summary];
        }
        if (source[`${key}Custom`]) return [key, source[`${key}Custom`]];
      }
      return [key, v];
    });
}

function isVariantFieldVisible(field, variantFields = {}) {
  if (!field || field.hidden || LEGACY_CUSTOM_SIZE_FIELD_KEYS.has(field.key)) return false;
  if (!field.dependsOn || !field.dependsOn.trim()) return true;
  return String(variantFields[field.dependsOn] ?? "") === String(field.dependsOnValue ?? "");
}

function hasRequiredVariantValue(field, values = {}) {
  if (!field || field.type === "computed") return true;
  const value = values[field.key];
  if (value === "" || value == null) return false;

  if (field.hasUnit && (field.unitOptions || []).length > 0) {
    const unitValue = values[`${field.key}Unit`] ?? field.defaultUnit;
    if (unitValue === "" || unitValue == null) return false;
  }

  if (field.key === "size" && value === "Custom") {
    if (field.customSizeMode === "text") {
      return String(values.sizeCustom || "").trim() !== "";
    }
    const sizeEntries = getCustomSizeEntries(field, values);
    if (sizeEntries.length > 0) {
      return sizeEntries.every((entry) => String(entry.value || "").trim() !== "" && Number(entry.value) > 0);
    }
    return String(getCustomSizeSummary(field, values) || "").trim() !== "";
  }

  if (field.allowCustom && value === "Custom") {
    return String(values[`${field.key}Custom`] || "").trim() !== "";
  }

  return true;
}

function validateRequiredVariantFields(form, fieldDefs = []) {
  const fields = Array.isArray(fieldDefs) ? fieldDefs : [];
  const values = form.variantFields || {};
  for (const field of fields) {
    if (!field?.isRequired) continue;
    if (!isVariantFieldVisible(field, values)) continue;
    if (!hasRequiredVariantValue(field, values)) return `${field.label || field.key} is compulsory.`;
  }
  return null;
}

function validateStep(step, form, subtypeOptions, pricingStep = 2, fieldDefs = []) {
  if (step === 0) {
    if (!form.categoryId) return "Please select a category.";
    if (!form.typeId) return "Please select a product type.";
    if (subtypeOptions.length > 0 && !form.subtypeId) return "Please select a sub-product.";
  }
  if (step > 0 && step < pricingStep) {
    const variantErr = validateRequiredVariantFields(form, fieldDefs);
    if (variantErr) return variantErr;
  }
  if (step === pricingStep) {
    const variantErr = validateRequiredVariantFields(form, fieldDefs);
    if (variantErr) return variantErr;
    const valid = form.quantitySlabs.filter(
      (s) => s.minQty !== "" && s.maxQty !== "" && s.pricePerPiece !== "" && Number(s.pricePerPiece) > 0
    );
    if (!valid.length) return "Add at least one quantity slab with min qty, max qty and price.";
    for (const s of valid) {
      if (Number(s.minQty) >= Number(s.maxQty)) return "Min qty must be less than max qty in each slab.";
    }
  }
  return null;
}

function buildSizeDialogState(field, values, fallbackUnit = "mm") {
  return {
    open: true,
    field,
    value: "",
    isFlexCustomSize: true,
    isTextPrompt: false,
    dimensionValues: Object.fromEntries(
      getCustomSizeEntries(field, values).map((entry) => [entry.key, entry.value])
    ),
    customSizeUnitLabel: fallbackUnit,
    sizeUnit: field?.customDimensionUnit || fallbackUnit,
    textRows: 4,
    selectedOption: "",
  };
}

/* ── sub-components ───────────────────────────────────────────────────── */
function StepCircles({ step, stepLabels }) {
  return (
    <>
      <div className="lead-wizard-progress-bar">
        <div
          className="lead-wizard-progress"
          style={{ width: `${(step / (stepLabels.length - 1)) * 100}%` }}
        />
      </div>
      <div className="lead-wizard-circles">
        {stepLabels.map((label, i) => (
          <div className="lead-wizard-circle-item" key={label}>
            <div className={`lead-wizard-circle${step >= i ? " active" : ""}`}>
              <span>{i + 1}</span>
            </div>
            <div className="lead-wizard-circle-label">{label}</div>
          </div>
        ))}
      </div>
    </>
  );
}

function VariantField({ field, value, variantFields, onChange, optionsOverride }) {
  if (field.hidden) return null;

  if (field.type === "select") {
    const opts = (optionsOverride || field.options || []).filter((o) => o !== "Custom");

    return (
      <div className="col-md-6">
        <div className="lead-form-field">
          <label className="form-label">
            {field.label}{field.isRequired && <span className="text-danger ms-1">*</span>}
          </label>
          <div style={{ display: "flex", alignItems: "center" }}>
            <select
              className="form-select"
              value={value}
              onChange={(e) => onChange(field, e.target.value)}
            >
              <option value="">-- Select --</option>
              {value === "Custom" && field.allowCustom && (() => {
                if (field.key === "size") {
                  if (field.customSizeMode === "text") {
                    const customValue = variantFields.sizeCustom;
                    return (
                      <option key="Custom" value="Custom">
                        {customValue ? `Custom: ${customValue}` : "Custom"}
                      </option>
                    );
                  }
                  const summary = getCustomSizeSummary(field, variantFields);
                  return (
                    <option key="Custom" value="Custom">
                      {summary ? `Custom: ${summary}` : "Custom"}
                    </option>
                  );
                }
                const customValue = variantFields[`${field.key}Custom`];
                return (
                  <option key="Custom" value="Custom">
                    {customValue ? `Custom: ${customValue}` : "Custom"}
                  </option>
                );
              })()}
              {opts.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
            {field.allowCustom && (
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary ms-1"
                style={{ flexShrink: 0 }}
                onClick={() => onChange(field, "Custom")}
                title="Add custom value"
              >
                <i className="ti ti-plus" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (field.hasUnit && (field.type === "number" || field.type === "text")) {
    return (
      <div className="col-md-6">
        <div className="lead-form-field">
          <label className="form-label">
            {field.label}{field.isRequired && <span className="text-danger ms-1">*</span>}
          </label>
          <div style={{ display: "flex", alignItems: "stretch", width: "100%" }}>
            <input
              className="form-control unit-input"
              type={field.type === "number" ? "number" : "text"}
              value={value}
              onChange={(e) => onChange(field, e.target.value)}
              placeholder={field.placeholder || ""}
            />
            <select
              className="form-select unit-select"
              value={variantFields[`${field.key}Unit`] ?? field.defaultUnit ?? ""}
              onChange={(e) => {
                onChange({ ...field, key: `${field.key}Unit` }, e.target.value);
              }}
            >
              {(field.unitOptions || []).map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
    );
  }

  const measurementValue = variantFields["measurement"];
  const dimensionSuffix = !field.hasUnit && field.type === "number" && measurementValue
    ? ` (in ${measurementValue})`
    : "";

  return (
    <div className="col-md-6">
      <div className="lead-form-field">
        <label className="form-label">
          {field.label}{dimensionSuffix}{field.isRequired && <span className="text-danger ms-1">*</span>}
        </label>
        <input
          type={field.type === "number" ? "number" : "text"}
          className="form-control"
          placeholder={field.placeholder || ""}
          value={value}
          onChange={(e) => onChange(field, e.target.value)}
        />
      </div>
    </div>
  );
}
function WizardModal({ title, form, setForm, step, setStep, onClose, onSave, onPersist, error, categories, allTypes, isAddMode }) {
  const [sessionItems, setSessionItems] = useState([]);
  const [editingSessionIdx, setEditingSessionIdx] = useState(null);
  const [customSpecDialog, setCustomSpecDialog] = useState({
    open: false, field: null, value: "",
    isFlexCustomSize: false, isTextPrompt: false,
    dimensionValues: {}, sizeUnit: "mm",
    customSizeUnitLabel: "ft", textRows: 4, selectedOption: "",
  });
  const [dialogError, setDialogError] = useState("");
  const [formError, setFormError] = useState("");
  const [customOptionsByFieldKey, setCustomOptionsByFieldKey] = useState({});

  const typeOptions = useMemo(
    () => allTypes.filter((t) => String(t.categoryId) === String(form.categoryId) && !t.parentId),
    [allTypes, form.categoryId]
  );
  const subtypeOptions = useMemo(
    () => allTypes.filter((t) => String(t.parentId) === String(form.typeId)),
    [allTypes, form.typeId]
  );

  const selectedCategory = useMemo(
    () => categories.find((c) => String(c.id) === String(form.categoryId)),
    [categories, form.categoryId]
  );
  const selectedType = useMemo(
    () => allTypes.find((t) => String(t.id) === String(form.typeId)),
    [allTypes, form.typeId]
  );
  const selectedSubtype = useMemo(
    () => allTypes.find((t) => String(t.id) === String(form.subtypeId)),
    [allTypes, form.subtypeId]
  );

  const [fields, setFields] = useState([]);
  const [fieldsLoading, setFieldsLoading] = useState(false);
  const sizeFieldConfig = useMemo(() => getSizeFieldConfig(fields), [fields]);

  const variantSteps = useMemo(() => {
    if (!fields || fields.length === 0) {
      return [{ section: "Variant", fields: [] }];
    }
    if (fields.length > 8) {
      const numTabs = Math.ceil(fields.length / 8);
      const fieldsPerTab = Math.ceil(fields.length / numTabs);
      const chunks = [];
      for (let i = 0; i < fields.length; i += fieldsPerTab) {
        chunks.push(fields.slice(i, i + fieldsPerTab));
      }
      return chunks.map((chunk, idx) => ({
        section: idx === 0 ? "Variant" : `Variant ${idx + 1}`,
        fields: chunk,
      }));
    }
    return [{ section: "Variant", fields: fields }];
  }, [fields]);

  const variantStepCount = variantSteps.length;
  const firstVariantStep = 1;
  const pricingStep = firstVariantStep + variantStepCount;
  const addedStep = pricingStep + 1;

  const currentVariant = variantSteps[
    Math.max(0, Math.min(step - firstVariantStep, variantSteps.length - 1))
  ] || { section: "Variant", fields: [] };

  const isVariantStep = step >= firstVariantStep && step < pricingStep;
  const stepLabels = useMemo(() => ([
    "Product",
    ...variantSteps.map((s) => s.section),
    "Pricing",
    "Added",
  ]), [variantSteps]);

  useEffect(() => {
    const resolvedId = form.subtypeId || form.typeId;
    if (!resolvedId) { setFields([]); return; }
    let cancelled = false;
    setFieldsLoading(true);
    getFieldsByServiceType(resolvedId)
      .then((data) => {
        if (cancelled) return;
        const mapped = (data || []).map((f) => ({
          key: f.fieldKey,
          label: f.label,
          type: f.fieldType,
          options: f.options || [],
          isRequired: f.isRequired,
          placeholder: f.placeholder,
          allowCustom: f.allowCustom,
          customDimensions: Array.isArray(f.customDimensions) ? f.customDimensions : [],
          customDimensionUnit: f.customDimensionUnit || "mm",
          customSizeMode: f.customSizeMode || null,
          hidden: f.isHidden,
          hasUnit: f.hasUnit,
          unitOptions: f.unitOptions || [],
          defaultUnit: f.defaultUnit,
          dependsOn: f.dependsOn,
          dependsOnValue: f.dependsOnValue,
        }));
        setFields(mapped);
        setForm((p) => {
          const next = { ...(p.variantFields || {}) };
          mapped.forEach((mf) => {
            if (mf.hasUnit && mf.defaultUnit && next[`${mf.key}Unit`] === undefined) {
              next[`${mf.key}Unit`] = mf.defaultUnit;
            }
          });
          return { ...p, variantFields: next };
        });
      })
      .catch(() => { if (!cancelled) setFields([]); })
      .finally(() => { if (!cancelled) setFieldsLoading(false); });
    return () => { cancelled = true; };
  }, [form.typeId, form.subtypeId]);

  // Fetch saved imported/custom options for select fields for this wizard scope
  useEffect(() => {
    if (!form.typeId) { setCustomOptionsByFieldKey({}); return; }
    const selectFields = (fields || []).filter((f) => f.type === "select" && !f.promptText);
    if (!selectFields.length) { setCustomOptionsByFieldKey({}); return; }

    Promise.all(
      selectFields.map((f) =>
        getCustomOptions(form.typeId, form.subtypeId || null, f.key)
          .then((opts) => [f.key, (opts || []).map((o) => o.valueRaw)])
          .catch(() => [f.key, []])
      )
    ).then((pairs) => {
      setCustomOptionsByFieldKey(Object.fromEntries(pairs));
    });
  }, [form.typeId, form.subtypeId, fields]);

  function handleCategoryChange(catId) {
    setForm((p) => ({
      ...p,
      categoryId: catId,
      typeId: "",
      subtypeId: "",
      variantFields: {},
    }));
  }

  function handleTypeChange(tId) {
    setForm((p) => ({
      ...p,
      typeId: tId,
      subtypeId: "",
      variantFields: {},
    }));
  }

  function closeCustomSpecDialog() {
    setCustomSpecDialog({
      open: false, field: null, value: "",
      isFlexCustomSize: false, isTextPrompt: false,
      dimensionValues: {}, sizeUnit: "mm",
      customSizeUnitLabel: "ft", textRows: 4, selectedOption: "",
    });
    setDialogError("");
  }

  const handleVariantChange = (field, val) => {
    if (field.key === "size" && val === "Custom") {
      if (field.customSizeMode === "text") {
        setCustomSpecDialog({
          open: true, field,
          value: String(form.variantFields[`${field.key}Custom`] || "").trim(),
          isFlexCustomSize: false, isTextPrompt: false,
          dimensionValues: {},
          customSizeUnitLabel: "ft", sizeUnit: "mm",
          textRows: 4, selectedOption: "",
        });
        return;
      }

      const configDims = getConfiguredSizeDimensions(field);
      const unit = field.customDimensionUnit || "mm";

      if (configDims.length > 0) {
        setCustomSpecDialog(buildSizeDialogState(field, form.variantFields, unit || "mm"));
        return;
      }

      return;
    }

    if (field.promptText && val) {
      setCustomSpecDialog({
        open: true, field,
        value: String(form.variantFields[`${field.key}Text`] || "").trim(),
        isFlexCustomSize: false, isTextPrompt: true,
        textRows: field.textRows || 4,
        selectedOption: val,
        dimensionValues: {},
        customSizeUnitLabel: "ft", sizeUnit: "mm",
      });
      return;
    }

    if (field.allowCustom && val === "Custom") {
      setCustomSpecDialog({
        open: true, field,
        value: String(form.variantFields[`${field.key}Custom`] || "").trim(),
        isFlexCustomSize: false, isTextPrompt: false,
        dimensionValues: {},
        customSizeUnitLabel: "ft", sizeUnit: "mm",
        textRows: 4, selectedOption: "",
      });
      return;
    }

    setForm((p) => {
      const next = { ...p.variantFields, [field.key]: val };
      if (field.allowCustom && val !== "Custom") {
        delete next[`${field.key}Custom`];
        if (field.key === "size") {
          getCustomSizeStorageKeys(field).forEach((storageKey) => {
            delete next[storageKey];
          });
          delete next.customUnit;
          delete next.sizeCustom;
        }
      }
      return { ...p, variantFields: next };
    });
  };

  function saveCustomSpecDialog() {
    const field = customSpecDialog.field;
    if (!field) return;

    if (customSpecDialog.isFlexCustomSize) {
      const sizeEntries = getCustomSizeEntries(field, customSpecDialog.dimensionValues);
      const missing = sizeEntries.find((entry) => !String(customSpecDialog.dimensionValues?.[entry.key] || "").trim());
      if (missing) { setDialogError(`Please enter ${missing.label.toLowerCase()}`); return; }
      const dimensionPayload = Object.fromEntries(
        sizeEntries.map((entry) => [entry.key, String(customSpecDialog.dimensionValues?.[entry.key] || "").trim()])
      );
      setForm((p) => ({
        ...p,
        variantFields: { ...p.variantFields, size: "Custom", ...dimensionPayload, customUnit: customSpecDialog.sizeUnit },
      }));
      const sizeLabel = getCustomSizeSummary(field, { size: "Custom", ...dimensionPayload, customUnit: customSpecDialog.sizeUnit }) || "Custom";
      saveCustomOption(
        form.typeId,
        form.subtypeId || null,
        "size",
        sizeLabel
      ).catch(() => {});
      closeCustomSpecDialog();
      return;
    }

    if (customSpecDialog.isTextPrompt) {
      const text = String(customSpecDialog.value || "").trim();
      setForm((p) => ({
        ...p,
        variantFields: { ...p.variantFields, [field.key]: customSpecDialog.selectedOption, [`${field.key}Text`]: text },
      }));
      closeCustomSpecDialog();
      return;
    }

    const val = String(customSpecDialog.value || "").trim();
    setForm((p) => {
      const next = { ...p.variantFields };
      if (!val) {
        delete next[field.key];
        delete next[`${field.key}Custom`];
      } else {
        next[field.key] = "Custom";
        next[`${field.key}Custom`] = val;
      }
      return { ...p, variantFields: next };
    });
    if (val) {
      saveCustomOption(
        form.typeId,
        form.subtypeId || null,
        field.key,
        val
      ).catch(() => {});
    }
    closeCustomSpecDialog();
  }

  const handleSlabChange = (i, field, val) =>
    setForm((p) => {
      const slabs = [...p.quantitySlabs];
      slabs[i] = { ...slabs[i], [field]: val };
      return { ...p, quantitySlabs: slabs };
    });

  const addSlab = () =>
    setForm((p) => ({
      ...p,
      quantitySlabs: [...p.quantitySlabs, { minQty: "", maxQty: "", pricePerPiece: "" }],
    }));

  const removeSlab = (i) =>
    setForm((p) => ({ ...p, quantitySlabs: p.quantitySlabs.filter((_, idx) => idx !== i) }));

  function handleSavePrice() {
    setFormError("");
    const err = validateStep(pricingStep, form, subtypeOptions, pricingStep, fields);
    if (err) { setFormError(err); return; }

  const validSlabs = form.quantitySlabs
      .filter((s) => s.minQty !== "" && s.maxQty !== "" && s.pricePerPiece !== "")
      .map((s) => ({
        minQty: Number(s.minQty),
        maxQty: Number(s.maxQty),
        pricePerPiece: Number(s.pricePerPiece),
      }));

    const entry = {
      categoryId: form.categoryId,
      typeId: form.typeId,
      subtypeId: form.subtypeId || null,
      typeName: selectedType?.name || "",
      subtypeName: selectedSubtype?.name || "",
      variantFields: sizeFieldConfig?.customDimensions?.length
        ? { ...form.variantFields, customDimensions: sizeFieldConfig.customDimensions }
        : { ...form.variantFields },
      quantitySlabs: validSlabs,
    };

    if (isAddMode) {
      if (editingSessionIdx !== null) {
        setSessionItems((p) => p.map((item, idx) => idx === editingSessionIdx ? entry : item));
        setEditingSessionIdx(null);
      } else {
        setSessionItems((p) => [...p, entry]);
      }
      setStep(addedStep);
    } else {
      onSave("save", subtypeOptions, fields, pricingStep);
    }
  }

  function handleDone() {
    if (isAddMode && onPersist && sessionItems.length > 0) {
      onPersist(sessionItems);
    }
    onClose();
  }

  function handleAddItem() {
    if (Array.isArray(sessionItems) && sessionItems.length > 0) {
      const lastItem = sessionItems[sessionItems.length - 1];
      setForm({
        categoryId: lastItem.categoryId || "",
        typeId: lastItem.typeId || "",
        subtypeId: lastItem.subtypeId || "",
        variantFields: { ...(lastItem.variantFields || {}) },
        quantitySlabs: [{ minQty: "", maxQty: "", pricePerPiece: "" }],
      });
    } else {
      setForm(emptyForm());
    }
    setEditingSessionIdx(null);
    setStep(firstVariantStep);
  }

  return (
    <>
      <div className="modal fade show lead-create-modal" style={{ display: "block" }} tabIndex="-1">
        <div className="modal-dialog modal-lg modal-dialog-scrollable modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">{title}</h5>
              <button type="button" className="btn-close" onClick={onClose} aria-label="Close" />
            </div>
            <div className="modal-body lead-create-shell service-types-modal-body">
              <div className="lead-wizard">
                  <StepCircles step={step} stepLabels={stepLabels} />

                  {(error || formError) && <div className="alert alert-danger py-2 mb-3">{error || formError}</div>}

                  <div className="lead-create-grid">
                    {/* Step 0 — Category / Type / Subtype */}
                    {step === 0 && (
                      <div className="row g-3 lead-wizard-step-panel">
                        <div className="col-md-6">
                          <div className="lead-form-field">
                            <label className="form-label fw-semibold">
                              Category <span className="text-danger">*</span>
                            </label>
                            <select
                              className="form-select"
                              value={form.categoryId}
                              onChange={(e) => handleCategoryChange(e.target.value)}
                            >
                              <option value="">Select category</option>
                              {categories.map((cat) => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="col-md-6">
                          <div className="lead-form-field">
                            <label className="form-label fw-semibold">
                              Product <span className="text-danger">*</span>
                            </label>
                            <select
                              className="form-select"
                              value={form.typeId}
                              onChange={(e) => handleTypeChange(e.target.value)}
                              disabled={!form.categoryId}
                            >
                              <option value="">Select product</option>
                              {typeOptions.map((t) => (
                                <option key={t.id} value={t.id}>{t.name}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div
                          className="col-md-6"
                          style={{ visibility: form.typeId && subtypeOptions.length > 0 ? "visible" : "hidden" }}
                        >
                          <div className="lead-form-field">
                            <label className="form-label fw-semibold">Sub-product</label>
                            <select
                              className="form-select"
                              value={form.subtypeId}
                              onChange={(e) =>
                                setForm((p) => ({
                                  ...p,
                                  subtypeId: e.target.value,
                                  variantFields: {},
                                }))
                              }
                            >
                              <option value="">Select sub-type</option>
                              {subtypeOptions.map((st) => (
                                <option key={st.id} value={st.id}>{st.name}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {selectedCategory && (
                          <div className="col-12">
                            <div className="alert alert-info py-2 mb-0">
                              {selectedType
                                ? `Selected: ${selectedCategory.name} / ${selectedType.name}${selectedSubtype ? ` / ${selectedSubtype.name}` : ""}`
                                : `Select a product under ${selectedCategory.name} to continue.`}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Step 1 — Variant Details */}
                    {isVariantStep && (
                      <div className="row g-3 lead-wizard-step-panel">
                        {fieldsLoading ? (
                          <div className="col-12 text-center py-3">
                            <div className="spinner-border spinner-border-sm text-primary" role="status">
                              <span className="visually-hidden">Loading...</span>
                            </div>
                            <div className="text-muted mt-2 small">Loading fields…</div>
                          </div>
                        ) : currentVariant.fields.length === 0 ? (
                          <div className="col-12">
                            <p className="text-muted">No variant fields for this product type.</p>
                          </div>
                        ) : (
                          currentVariant.fields.map((field) => {
                            if (LEGACY_CUSTOM_SIZE_FIELD_KEYS.has(field.key)) return null;
                            if (!isVariantFieldVisible(field, form.variantFields)) return null;
                            let optionsOverride = undefined;
                            if (field.type === "select" && !field.promptText) {
                              const savedForField = customOptionsByFieldKey[field.key] || [];
                              const staticOpts = (field.options || []).filter((o) => o !== "Custom");
                              const alreadyInStatic = new Set(staticOpts.map((o) => String(o).toLowerCase()));
                              const uniqueSaved = savedForField.filter((s) => !alreadyInStatic.has(String(s).toLowerCase()));
                              const hasCustomOpt = (field.options || []).includes("Custom");
                              optionsOverride = [...staticOpts, ...uniqueSaved, ...(hasCustomOpt ? ["Custom"] : [])];
                            }
                            return (
                              <VariantField
                                key={field.key}
                                field={field}
                                value={form.variantFields[field.key] ?? ""}
                                variantFields={form.variantFields}
                                onChange={handleVariantChange}
                                optionsOverride={optionsOverride}
                              />
                            );
                          })
                        )}
                      </div>
                    )}

                    {/* Step 2 — Pricing */}
                    {step === pricingStep && (
                      <div className="row g-3 lead-wizard-step-panel">
                        <div className="col-12">
                          <label className="form-label">
                            Quantity Slabs <span className="text-danger">*</span>
                          </label>
                          <table className="price-list-slab-table">
                            <thead>
                              <tr>
                                <th>Min Qty</th>
                                <th>Max Qty</th>
                                <th>Price / Piece (₹)</th>
                                <th></th>
                              </tr>
                            </thead>
                            <tbody>
                              {form.quantitySlabs.map((slab, i) => (
                                <tr key={i}>
                                  <td>
                                    <input
                                      type="number"
                                      className="form-control"
                                      placeholder="e.g. 1"
                                      min="0"
                                      value={slab.minQty}
                                      onChange={(e) => handleSlabChange(i, "minQty", e.target.value)}
                                    />
                                  </td>
                                  <td>
                                    <input
                                      type="number"
                                      className="form-control"
                                      placeholder="e.g. 100"
                                      min="0"
                                      value={slab.maxQty}
                                      onChange={(e) => handleSlabChange(i, "maxQty", e.target.value)}
                                    />
                                  </td>
                                  <td>
                                    <input
                                      type="number"
                                      className="form-control"
                                      placeholder="e.g. 5.00"
                                      min="0"
                                      step="0.01"
                                      value={slab.pricePerPiece}
                                      onChange={(e) => handleSlabChange(i, "pricePerPiece", e.target.value)}
                                    />
                                  </td>
                                  <td style={{ width: 40 }}>
                                    {form.quantitySlabs.length > 1 && (
                                      <button
                                        type="button"
                                        className="btn btn-sm btn-link text-danger p-0"
                                        onClick={() => removeSlab(i)}
                                      >
                                        <i className="ti ti-trash" />
                                      </button>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          <button
                            type="button"
                            className="btn btn-outline-primary price-list-add-slab-btn"
                            onClick={addSlab}
                          >
                            <i className="ti ti-plus me-1" />Add Slab
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                    {/* Step 3 — Added Products (add mode only) */}
                    {step === addedStep && isAddMode && (
                      <div className="price-list-added-items">
                        <table className="table price-list-added-table mb-3">
                          <thead>
                            <tr>
                              <th style={{ width: 60 }}>#</th>
                              <th>Product</th>
                              <th>Variant Details</th>
                              <th>Qty Slabs</th>
                            </tr>
                          </thead>
                          <tbody>
                            {sessionItems.map((item, idx) => (
                              <tr key={idx}>
                                <td>{idx + 1}</td>
                                <td className="fw-semibold">
                                  {item.typeName}
                                  {item.subtypeName && (
                                    <span className="text-muted fw-normal"> / {item.subtypeName}</span>
                                  )}
                                </td>
                                <td>
                                  <small className="text-muted">{variantSummary(item.variantFields)}</small>
                                </td>
                                <td>
                                  {(item.quantitySlabs || []).map((s, i) => (
                                    <div key={i}>
                                      <small>{s.minQty}–{s.maxQty} pcs: ₹{s.pricePerPiece}/pc</small>
                                    </div>
                                  ))}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Navigation */}
                  <div className="lead-wizard-nav">
                    {step > 0 && step < addedStep ? (
                      <button type="button" className="btn btn-light" onClick={() => setStep((s) => s - 1)}>
                        Previous
                      </button>
                    ) : step === addedStep ? (
                      <button type="button" className="btn btn-light" onClick={() => {
                        if (Array.isArray(sessionItems) && sessionItems.length > 0) {
                          const lastIdx = sessionItems.length - 1;
                          const lastItem = sessionItems[lastIdx];
                          setForm({
                            categoryId: lastItem.categoryId || "",
                            typeId: lastItem.typeId || "",
                            subtypeId: lastItem.subtypeId || "",
                            variantFields: { ...(lastItem.variantFields || {}) },
                            quantitySlabs: (lastItem.quantitySlabs || []).map((s) => ({
                              minQty: String(s.minQty ?? ""),
                              maxQty: String(s.maxQty ?? ""),
                              pricePerPiece: String(s.pricePerPiece ?? ""),
                            })),
                          });
                          setEditingSessionIdx(lastIdx);
                        }
                        setStep(pricingStep);
                      }}>
                        Previous
                      </button>
                    ) : (
                      <div />
                    )}
                    {step < pricingStep ? (
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() => onSave("next", subtypeOptions, fields, pricingStep)}
                      >
                        Next
                      </button>
                    ) : step === pricingStep ? (
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={handleSavePrice}
                      >
                        Save Price
                      </button>
                    ) : (
                      <div style={{ display: "flex", gap: "0.75rem" }}>
                        <button
                          type="button"
                          className="btn btn-outline-primary"
                          onClick={handleAddItem}
                        >
                          <i className="ti ti-plus me-1" />Add Item
                        </button>
                        <button
                          type="button"
                          className="btn btn-success"
                          onClick={handleDone}
                        >
                          Done
                        </button>
                      </div>
                    )}
                  </div>
                </div>
            </div>
          </div>
      </div>
      <div className="modal-backdrop fade show lead-create-backdrop" />

      {customSpecDialog.open && (
        <div
          className="modal fade show"
          style={{ display: "block", backgroundColor: "rgba(0,0,0,0.35)", zIndex: 1070 }}
          tabIndex="-1"
        >
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: "500px" }}>
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {customSpecDialog.isFlexCustomSize ? "Enter Custom Size" : `Enter Custom ${customSpecDialog.field?.label}`}
                </h5>
                <button type="button" className="btn-close" onClick={closeCustomSpecDialog} />
              </div>
              <div className="modal-body" style={{ padding: "1.5rem" }}>
                {customSpecDialog.isFlexCustomSize ? (
                  <>
                    <div className="lead-form-field mb-3">
                      <label className="form-label">Unit <span className="text-danger">*</span></label>
                      <select
                        className="form-select"
                        value={customSpecDialog.sizeUnit}
                        onChange={(e) => setCustomSpecDialog((p) => ({ ...p, sizeUnit: e.target.value }))}
                      >
                        {(customSpecDialog.field?.unitOptions?.length > 0
                          ? customSpecDialog.field.unitOptions
                          : ["mm", "cm", "ft", "inch"]
                        ).map((u) => (
                          <option key={u} value={u}>
                            {{ mm: "Millimeters (mm)", cm: "Centimeters (cm)", ft: "Feet (ft)", inch: "Inches (inch)" }[u] || u}
                          </option>
                        ))}
                      </select>
                    </div>
                    {getCustomSizeEntries(customSpecDialog.field, customSpecDialog.dimensionValues).map((entry, index) => (
                      <div key={entry.key} className="lead-form-field mb-3">
                        <label className="form-label">{entry.label} ({customSpecDialog.sizeUnit}) <span className="text-danger">*</span></label>
                        <input
                          className="form-control"
                          type="number"
                          autoFocus={index === 0}
                          value={customSpecDialog.dimensionValues?.[entry.key] || ""}
                          onChange={(e) => setCustomSpecDialog((p) => ({
                            ...p,
                            dimensionValues: { ...(p.dimensionValues || {}), [entry.key]: e.target.value },
                          }))}
                          placeholder={`Enter ${entry.label.toLowerCase()} in ${customSpecDialog.sizeUnit}`}
                          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); saveCustomSpecDialog(); } }}
                        />
                      </div>
                    ))}
                    {dialogError && <div className="alert alert-danger py-2 mb-0">{dialogError}</div>}
                  </>
                ) : (
                  <div className="lead-form-field">
                    <label className="form-label">
                      {customSpecDialog.isTextPrompt ? `${customSpecDialog.selectedOption} Details` : customSpecDialog.field?.label}
                    </label>
                    {customSpecDialog.isTextPrompt ? (
                      <textarea
                        className="form-control" autoFocus
                        rows={customSpecDialog.textRows || 4}
                        value={customSpecDialog.value}
                        onChange={(e) => setCustomSpecDialog((p) => ({ ...p, value: e.target.value }))}
                        placeholder={`Enter ${customSpecDialog.selectedOption?.toLowerCase() || "details"}`}
                      />
                    ) : (
                      <input
                        className="form-control" autoFocus
                        value={customSpecDialog.value}
                        onChange={(e) => setCustomSpecDialog((p) => ({ ...p, value: e.target.value }))}
                        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); saveCustomSpecDialog(); } }}
                        placeholder={customSpecDialog.field?.customPlaceholder || `Enter ${customSpecDialog.field?.label || "value"}`}
                      />
                    )}
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-light" onClick={closeCustomSpecDialog}>Cancel</button>
                <button type="button" className="btn btn-primary" onClick={saveCustomSpecDialog}>Save</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ── Main page ────────────────────────────────────────────────────────── */
export default function PriceListPage() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalRows, setTotalRows] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [selectedTypeId, setSelectedTypeId] = useState(null);
  const [selectedSubtypeId, setSelectedSubtypeId] = useState(null);
  const [priceSummary, setPriceSummary] = useState({ typeCounts: [], subtypeCounts: [] });

  // Service data
  const [categories, setCategories] = useState([]);
  const [allTypes, setAllTypes] = useState([]);
  const [sizeFieldConfigsByServiceId, setSizeFieldConfigsByServiceId] = useState({});

  useEffect(() => {
    Promise.all([getServiceCategories(), getServiceTypes()])
      .then(([cats, types]) => {
        const catArray = Array.isArray(cats) ? cats : [];
        setCategories(catArray);
        if (catArray.length > 0) setSelectedCategoryId((prev) => prev ?? catArray[0].id);
        setAllTypes(Array.isArray(types) ? types : []);
      })
      .catch(() => {});
  }, []);

  // Add modal
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState(emptyForm());
  const [addStep, setAddStep] = useState(0);
  const [addError, setAddError] = useState("");

  // Edit modal
  const [showEdit, setShowEdit] = useState(false);
  const [editForm, setEditForm] = useState(emptyForm());
  const [editStep, setEditStep] = useState(0);
  const [editError, setEditError] = useState("");
  const [editingId, setEditingId] = useState(null);

  // Delete modal
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  const loadPriceList = async (
    nextPage = page,
    nextPageSize = pageSize,
    nextSearch = debouncedSearch,
    nextCategoryId = selectedCategoryId,
    nextTypeId = selectedTypeId,
    nextSubtypeId = selectedSubtypeId
  ) => {
    setLoading(true);
    try {
      const data = await getPriceList({
        page: Math.max(0, Number(nextPage) - 1),
        size: Number(nextPageSize) || 10,
        search: nextSearch || undefined,
        categoryId: nextCategoryId || undefined,
        typeId: nextTypeId || undefined,
        subtypeId: nextSubtypeId || undefined,
      });
      const normalized = normalizePriceListPage(data);
      setRows(normalized.content);
      setTotalRows(normalized.totalElements || normalized.content.length || 0);
      setTotalPages(Math.max(1, normalized.totalPages || 1));
      return normalized;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPriceList(page, pageSize, debouncedSearch, selectedCategoryId, selectedTypeId, selectedSubtypeId).catch(() => {
      setRows([]);
      setTotalRows(0);
      setTotalPages(1);
    });
  }, [page, pageSize, debouncedSearch, selectedCategoryId, selectedTypeId, selectedSubtypeId]);

  const reload = async () => {
    return loadPriceList(page, pageSize, debouncedSearch, selectedCategoryId, selectedTypeId, selectedSubtypeId);
  };

  const filteredRows = useMemo(() => rows, [rows]);

  const groupedRows = useMemo(() => {
    const map = new Map();
    for (const row of filteredRows) {
      const key = `${row.typeName || ""}|${row.subtypeName || ""}`;
      if (!map.has(key)) {
        map.set(key, { groupKey: key, typeName: row.typeName || "", subtypeName: row.subtypeName || "", rows: [] });
      }
      map.get(key).rows.push(row);
    }
    return Array.from(map.values());
  }, [filteredRows]);

  useEffect(() => {
    const serviceIds = Array.from(
      new Set(
        (rows || [])
          .map((row) => row?.subtypeId || row?.typeId)
          .filter(Boolean)
          .map((id) => String(id))
      )
    );
    const missingIds = serviceIds.filter(
      (id) => !Object.prototype.hasOwnProperty.call(sizeFieldConfigsByServiceId, id)
    );
    if (!missingIds.length) return;

    let cancelled = false;
    Promise.all(
      missingIds.map((id) =>
        getFieldsByServiceType(id)
          .then((data) => [id, getSizeFieldConfig((data || []).map((f) => ({
            key: f.fieldKey,
            customDimensions: Array.isArray(f.customDimensions) ? f.customDimensions : [],
            customDimensionUnit: f.customDimensionUnit || "mm",
            customSizeMode: f.customSizeMode || null,
          })))])
          .catch(() => [id, null])
      )
    ).then((pairs) => {
      if (cancelled) return;
      setSizeFieldConfigsByServiceId((prev) => {
        const next = { ...prev };
        pairs.forEach(([id, config]) => {
          next[id] = config;
        });
        return next;
      });
    });

    return () => { cancelled = true; };
  }, [rows, sizeFieldConfigsByServiceId]);

  const typesForCategory = useMemo(
    () => allTypes.filter((t) => !t.parentId && String(t.categoryId) === String(selectedCategoryId)),
    [allTypes, selectedCategoryId]
  );

  const subtypesForType = useMemo(
    () => allTypes.filter((t) => String(t.parentId) === String(selectedTypeId)),
    [allTypes, selectedTypeId]
  );

  const selectedTypeHasSubtypes = subtypesForType.length > 0;

  useEffect(() => {
    let cancelled = false;
    getPriceListSummary({
      categoryId: selectedCategoryId || undefined,
      typeId: selectedTypeId || undefined,
    })
      .then((data) => {
        if (cancelled) return;
        setPriceSummary({
          typeCounts: Array.isArray(data?.typeCounts) ? data.typeCounts : [],
          subtypeCounts: Array.isArray(data?.subtypeCounts) ? data.subtypeCounts : [],
        });
      })
      .catch(() => {
        if (cancelled) return;
        setPriceSummary({ typeCounts: [], subtypeCounts: [] });
      });

    return () => {
      cancelled = true;
    };
  }, [selectedCategoryId, selectedTypeId]);

  const countByTypeId = useMemo(() => {
    const map = {};
    (priceSummary.typeCounts || []).forEach((item) => {
      map[String(item.id)] = Number(item.totalCount || 0);
    });
    return map;
  }, [priceSummary.typeCounts]);

  const countBySubtypeId = useMemo(() => {
    const map = {};
    (priceSummary.subtypeCounts || []).forEach((item) => {
      map[String(item.id)] = Number(item.totalCount || 0);
    });
    return map;
  }, [priceSummary.subtypeCounts]);

  /* ── wizard action handler ── */
  function handleWizardAction(action, form, step, setStep, setError, entryId, subtypeOptions, fieldDefs, pricingStep = 2) {
    const err = validateStep(step, form, subtypeOptions, pricingStep, fieldDefs);
    if (err) { setError(err); return; }
    setError("");

    if (action === "next") {
      setStep((s) => s + 1);
      return;
    }

    // Edit mode only (add mode uses onPersist callback)
    const selectedType = allTypes.find((t) => String(t.id) === String(form.typeId));
    const selectedSubtype = allTypes.find((t) => String(t.id) === String(form.subtypeId));

    const validSlabs = form.quantitySlabs
      .filter((s) => s.minQty !== "" && s.maxQty !== "" && s.pricePerPiece !== "")
      .map((s) => ({
        minQty: Number(s.minQty),
        maxQty: Number(s.maxQty),
        pricePerPiece: Number(s.pricePerPiece),
      }));

  const sizeFieldConfig = getSizeFieldConfig(fieldDefs);
  savePriceEntry({
      ...(entryId ? { id: entryId } : {}),
      categoryId: form.categoryId,
      typeId: form.typeId,
      subtypeId: form.subtypeId || null,
      typeName: selectedType?.name || "",
      subtypeName: selectedSubtype?.name || "",
      variantFields: sizeFieldConfig?.customDimensions?.length
        ? { ...form.variantFields, customDimensions: sizeFieldConfig.customDimensions }
        : { ...form.variantFields },
      quantitySlabs: validSlabs,
    }).then(() => {
      // Persist custom options for all allowCustom fields
      if (form.typeId) {
        const saves = collectCustomOptionSaves(fieldDefs || [], form.variantFields);
        saves.forEach(({ fieldKey, valueRaw }) => {
          saveCustomOption(
            Number(form.typeId),
            form.subtypeId ? Number(form.subtypeId) : null,
            fieldKey,
            valueRaw
          ).catch(() => {});
        });
      }
      reload();
      setShowEdit(false);
    }).catch(() => {});
  }

  function handleAddItemSaved(entries) {
    Promise.all(entries.map((entry) => savePriceEntry(entry))).then(() => {
      // Persist custom options for all allowCustom fields across all session entries
      entries.forEach((entry) => {
        if (!entry.typeId) return;
        const resolvedId = entry.subtypeId || entry.typeId;
        getFieldsByServiceType(resolvedId)
          .then((data) => {
            const fieldDefs = (data || []).map((f) => ({
              key: f.fieldKey,
              type: f.fieldType,
              allowCustom: f.allowCustom,
              customDimensions: Array.isArray(f.customDimensions) ? f.customDimensions : [],
              customDimensionUnit: f.customDimensionUnit || "mm",
              customSizeMode: f.customSizeMode || null,
            }));
            const saves = collectCustomOptionSaves(fieldDefs, entry.variantFields);
            saves.forEach(({ fieldKey, valueRaw }) => {
              saveCustomOption(
                Number(entry.typeId),
                entry.subtypeId ? Number(entry.subtypeId) : null,
                fieldKey,
                valueRaw
              ).catch(() => {});
            });
          })
          .catch(() => {});
      });
      reload();
    }).catch(() => {});
  }

  /* ── open edit ── */
  function openEdit(row) {
    setEditForm({
      categoryId: row.categoryId || "",
      typeId: row.typeId || "",
      subtypeId: row.subtypeId || "",
      variantFields: { ...(row.variantFields || {}) },
      quantitySlabs: (row.quantitySlabs || [{ minQty: "", maxQty: "", pricePerPiece: "" }]).map((s) => ({
        minQty: String(s.minQty ?? ""),
        maxQty: String(s.maxQty ?? ""),
        pricePerPiece: String(s.pricePerPiece ?? ""),
      })),
    });
    setEditingId(row.id);
    setEditStep(0);
    setEditError("");
    setShowEdit(true);
  }

  /* ── delete ── */
  function handleDelete() {
    deletePriceEntry(deleteTarget.id).then(async () => {
      const refreshed = await loadPriceList(page, pageSize, debouncedSearch, selectedCategoryId, selectedTypeId, selectedSubtypeId);
      if (refreshed.content.length === 0 && page > 1) {
        setPage(page - 1);
      }
      setDeleteTarget(null);
    }).catch(() => {});
  }

  const startRow = totalRows === 0 ? 0 : (page - 1) * pageSize + 1;
  const endRow = totalRows === 0 ? 0 : Math.min(page * pageSize, totalRows);

  return (
    <div className="products-shell">
      {/* Custom Header Card */}
      <div className="card border-0 shadow-sm p-4 mb-4 bg-white" style={{ borderRadius: 12 }}>
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
          <div>
            <h2 className="mb-1" style={{ fontSize: "1.4rem", fontWeight: "700", color: "#0f172a" }}>Price List</h2>
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb mb-0" style={{ fontSize: "0.85rem" }}>
                <li className="breadcrumb-item">
                  <a href="/admin-dashboard" className="text-decoration-none text-muted">
                    <i className="ti ti-smart-home" />
                  </a>
                </li>
                <li className="breadcrumb-item text-muted">Services</li>
                <li className="breadcrumb-item active text-primary" aria-current="page">Price List</li>
              </ol>
            </nav>
          </div>
          <div className="d-flex align-items-center gap-2">
            <button
              className="btn btn-outline-info d-flex align-items-center gap-2"
              style={{
                fontWeight: "600",
                padding: "10px 20px",
                borderRadius: "10px",
                fontSize: "0.9rem",
                height: 42
              }}
              onClick={() => navigate("/services/price-list/import")}
            >
              <i className="ti ti-upload" style={{ fontSize: "1.1rem" }} />
              Import Price List
            </button>
            <button
              className="btn btn-primary d-flex align-items-center gap-2"
              style={{
                backgroundColor: "#3b82f6",
                borderColor: "#3b82f6",
                fontWeight: "600",
                padding: "10px 20px",
                borderRadius: "10px",
                fontSize: "0.9rem",
                height: 42
              }}
              onClick={() => {
                setAddForm(emptyForm());
                setAddStep(0);
                setAddError("");
                setShowAdd(true);
              }}
            >
              <i className="ti ti-plus" style={{ fontSize: "1.1rem" }} />
              Add Price
            </button>
          </div>
        </div>
      </div>

      <div className="leads-page-body">
        {/* Category tabs & Search option */}
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-3 mb-4" style={{ borderBottom: "1px solid #e6edf5" }}>
          {categories.length > 0 ? (
            <div className="d-flex gap-1" style={{ marginBottom: "-1px" }}>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => { setSelectedCategoryId(cat.id); setSelectedTypeId(null); setSelectedSubtypeId(null); setPage(1); }}
                  style={{
                    padding: "0.75rem 1.25rem",
                    backgroundColor: selectedCategoryId === cat.id ? "#3b82f6" : "transparent",
                    color: selectedCategoryId === cat.id ? "#fff" : "#64748b",
                    border: "none",
                    borderBottom: selectedCategoryId === cat.id ? "3px solid #3b82f6" : "3px solid transparent",
                    cursor: "pointer",
                    fontWeight: selectedCategoryId === cat.id ? "600" : "500",
                    transition: "all 0.2s",
                    borderRadius: "8px 8px 0 0",
                    fontSize: "0.95rem"
                  }}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          ) : <div />}

          <div className="d-flex align-items-center gap-2 mb-2 p-1 border" style={{ borderRadius: 12, backgroundColor: "#f8fafc", width: "100%", maxWidth: 300 }}>
            <i className="ti ti-search text-muted ms-2" style={{ fontSize: "1.1rem" }} />
            <input
              type="text"
              className="form-control border-0 bg-transparent shadow-none"
              placeholder="Search product or variant..."
              style={{ height: 36, fontSize: "0.9rem" }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Breadcrumb nav */}
        {selectedTypeId && (
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem", fontSize: "0.875rem", color: "#666" }}>
            <button
              onClick={() => { setSelectedTypeId(null); setSelectedSubtypeId(null); setPage(1); }}
              style={{ background: "none", border: "none", cursor: "pointer", color: "#45597a", fontWeight: 600, padding: 0 }}
            >
              ← Back
            </button>
            <span>/</span>
            <span
              style={{ cursor: selectedSubtypeId ? "pointer" : "default", color: selectedSubtypeId ? "#45597a" : "#333", fontWeight: selectedSubtypeId ? 400 : 600 }}
              onClick={() => selectedSubtypeId && setSelectedSubtypeId(null)}
            >
              {allTypes.find((t) => String(t.id) === String(selectedTypeId))?.name || ""}
            </span>
            {selectedSubtypeId && (
              <>
                <span>/</span>
                <span style={{ color: "#333", fontWeight: 600 }}>
                  {allTypes.find((t) => String(t.id) === String(selectedSubtypeId))?.name || ""}
                </span>
              </>
            )}
          </div>
        )}

        {/* Level 1: Type cards */}
        {!selectedTypeId && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "1rem" }}>
            {typesForCategory.length === 0 ? (
              <p style={{ color: "#999", gridColumn: "1/-1" }}>No products in this category yet.</p>
            ) : (
              typesForCategory.map((t) => (
                <button
                  key={t.id}
                  onClick={() => { setSelectedTypeId(t.id); setSelectedSubtypeId(null); setPage(1); }}
                  style={{
                    textAlign: "left",
                    background: "#fff",
                    border: "1px solid #e0e7ef",
                    borderRadius: "10px",
                    padding: "1rem 1.25rem",
                    cursor: "pointer",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                    transition: "box-shadow 0.15s, border-color 0.15s",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#45597a"; e.currentTarget.style.boxShadow = "0 2px 8px rgba(69,89,122,0.15)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#e0e7ef"; e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.06)"; }}
                >
                  <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "#10233f", marginBottom: "0.25rem" }}>{t.name}</div>
                  <div style={{ fontSize: "0.78rem", color: "#7b8fa8" }}>{countByTypeId[String(t.id)] || 0} entries</div>
                </button>
              ))
            )}
          </div>
        )}

        {/* Level 2: Subtype cards */}
        {selectedTypeId && selectedTypeHasSubtypes && !selectedSubtypeId && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "1rem" }}>
            {subtypesForType.map((st) => (
              <button
                key={st.id}
                onClick={() => { setSelectedSubtypeId(st.id); setPage(1); }}
                style={{
                  textAlign: "left",
                  background: "#fff",
                  border: "1px solid #e0e7ef",
                  borderRadius: "10px",
                  padding: "1rem 1.25rem",
                  cursor: "pointer",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                  transition: "box-shadow 0.15s, border-color 0.15s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#45597a"; e.currentTarget.style.boxShadow = "0 2px 8px rgba(69,89,122,0.15)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#e0e7ef"; e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.06)"; }}
              >
                <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "#10233f", marginBottom: "0.25rem" }}>{st.name}</div>
                <div style={{ fontSize: "0.78rem", color: "#7b8fa8" }}>{countBySubtypeId[String(st.id)] || 0} entries</div>
              </button>
            ))}
          </div>
        )}

        {/* Level 3: Variant table */}
        {selectedTypeId && (!selectedTypeHasSubtypes || selectedSubtypeId) && (
          <div className="leads-table-wrap">
            <table className="table leads-table mb-0">
              <thead>
                <tr>
                  <th style={{ width: 60 }}>#</th>
                  <th style={{ width: 90 }}>ID</th>
                  <th>Variant Details</th>
                  <th>Qty Slabs</th>
                  <th style={{ width: 100 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="text-center text-muted py-4">
                      Loading price list...
                    </td>
                  </tr>
                ) : filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center text-muted py-4">
                      No price entries yet. Click "Add Price" to get started.
                    </td>
                  </tr>
                ) : (() => {
                  let rowNum = startRow - 1;
                  return groupedRows.map((group) => {
                    const headerLabel = group.subtypeName
                      ? `${group.typeName} — ${group.subtypeName}`
                      : group.typeName || "—";
                    return (
                      <Fragment key={group.groupKey}>
                        <tr style={{ backgroundColor: "#f0f4fa" }}>
                          <td
                            colSpan={5}
                            style={{
                              fontWeight: 700,
                              fontSize: "0.82rem",
                              textTransform: "uppercase",
                              letterSpacing: "0.05em",
                              color: "#10233f",
                              padding: "0.45rem 0.75rem",
                            }}
                          >
                            {headerLabel}
                          </td>
                        </tr>
                        {group.rows.map((row) => {
                          rowNum += 1;
                          const sizeFieldConfig = sizeFieldConfigsByServiceId[String(row.subtypeId || row.typeId)] || null;
                          const badges = variantBadges(row.variantFields, sizeFieldConfig);
                          return (
                            <tr key={row.id}>
                              <td className="text-muted" style={{ fontSize: "0.82rem" }}>{rowNum}</td>
                              <td className="text-muted" style={{ fontSize: "0.82rem" }}>
                                {row.id}
                              </td>
                              <td>
                                {badges.length === 0 ? (
                                  <small className="text-muted">—</small>
                                ) : (
                                  <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                                    {badges.map(([k, v]) => (
                                      <span
                                        key={k}
                                        style={{
                                          display: "inline-flex",
                                          alignItems: "center",
                                          gap: "3px",
                                          backgroundColor: "#eef2fb",
                                          border: "1px solid #d8e2f5",
                                          borderRadius: "6px",
                                          padding: "2px 7px",
                                          fontSize: "0.75rem",
                                          color: "#34393f",
                                          whiteSpace: "nowrap",
                                        }}
                                      >
                                        <span style={{ color: "#7b8fa8", fontWeight: 600 }}>{k}:</span>
                                        {String(v)}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </td>
                              <td>
                                {(() => {
                                  const slabs = Array.isArray(row.quantitySlabs) ? row.quantitySlabs : [];
                                  const slabSummary = slabs
                                    .map((s) => `${s.minQty}-${s.maxQty} pcs: Rs ${s.pricePerPiece}/pc`)
                                    .join(" | ");
                                  return slabSummary ? (
                                    <small style={{ whiteSpace: "normal", lineHeight: 1.5 }}>{slabSummary}</small>
                                  ) : (
                                    <small className="text-muted">-</small>
                                  );
                                })()}
                              </td>
                              <td>
                                <button
                                  className="btn btn-sm d-inline-flex align-items-center justify-content-center me-1"
                                  style={{ backgroundColor: "#6f65d6", color: "#fff", width: 32, height: 32, padding: 0, borderRadius: 4, border: "none" }}
                                  onClick={() => openEdit(row)}
                                  title="Edit"
                                >
                                  <i className="ti ti-edit" style={{ fontSize: 14 }} />
                                </button>
                                <button
                                  className="btn btn-sm d-inline-flex align-items-center justify-content-center"
                                  style={{ backgroundColor: "#e74c3c", color: "#fff", width: 32, height: 32, padding: 0, borderRadius: 4, border: "none" }}
                                  onClick={() => setDeleteTarget(row)}
                                  title="Delete"
                                >
                                  <i className="ti ti-trash" style={{ fontSize: 14 }} />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </Fragment>
                    );
                  });
                })()}
              </tbody>
            </table>
            <div className="leads-pagination-footer d-flex flex-wrap align-items-center justify-content-between gap-3 pt-3 border-top mt-3 px-3 pb-3">
              <span className="entries-info text-muted small">
                Showing {startRow} to {endRow} of {totalRows} entries
              </span>

              {/* Custom Pagination Numbers */}
              <div className="pagination-numbers-container d-flex align-items-center gap-1">
                <button
                  type="button"
                  className="btn-pagination-arrow btn btn-sm btn-light border-0 d-flex align-items-center justify-content-center"
                  style={{ width: 32, height: 32, borderRadius: 6 }}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={loading || page <= 1}
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
                        disabled={loading}
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
                        disabled={loading}
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
                        disabled={loading}
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
                  disabled={loading || page >= totalPages}
                >
                  <i className="ti ti-chevron-right" />
                </button>
              </div>

              {/* Page Size Selector */}
              <PageSizeSelector
                pageSize={pageSize}
                setPageSize={setPageSize}
                setPage={setPage}
              />
            </div>
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showAdd && (
        <WizardModal
          title="Add Price Entry"
          form={addForm}
          setForm={setAddForm}
          step={addStep}
          setStep={setAddStep}
          onClose={() => setShowAdd(false)}
          error={addError}
          categories={categories}
          allTypes={allTypes}
          isAddMode={true}
          onSave={(action, subtypeOptions, fieldDefs, currentPricingStep) =>
            handleWizardAction(action, addForm, addStep, setAddStep, setAddError, null, subtypeOptions, fieldDefs, currentPricingStep)
          }
          onPersist={handleAddItemSaved}
        />
      )}

      {/* Edit Modal */}
      {showEdit && (
        <WizardModal
          title="Edit Price Entry"
          form={editForm}
          setForm={setEditForm}
          step={editStep}
          setStep={setEditStep}
          onClose={() => setShowEdit(false)}
          error={editError}
          categories={categories}
          allTypes={allTypes}
          isAddMode={false}
          onSave={(action, subtypeOptions, fieldDefs, currentPricingStep) =>
            handleWizardAction(action, editForm, editStep, setEditStep, setEditError, editingId, subtypeOptions, fieldDefs, currentPricingStep)
          }
        />
      )}

      {/* Delete confirm */}
      {deleteTarget && (
        <>
          <div className="modal fade show lead-create-modal" style={{ display: "block" }} tabIndex="-1">
            <div className="modal-dialog modal-sm modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Delete Price Entry</h5>
                  <button type="button" className="btn-close" onClick={() => setDeleteTarget(null)} />
                </div>
                <div className="modal-body">
                  <p className="mb-0">
                    Delete price entry for{" "}
                    <strong>{deleteTarget.typeName || "this entry"}</strong>
                    {deleteTarget.subtypeName && (
                      <> / <strong>{deleteTarget.subtypeName}</strong></>
                    )}
                    ? This cannot be undone.
                  </p>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-outline-secondary" onClick={() => setDeleteTarget(null)}>
                    Cancel
                  </button>
                  <button type="button" className="btn btn-danger" onClick={handleDelete}>
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show lead-create-backdrop" />
        </>
      )}
    </div>
  );
}



