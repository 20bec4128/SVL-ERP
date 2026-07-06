import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { createRequirement, updateRequirement, getRequirementById } from "../../api/requirementApi";
import { getCustomOptions, saveCustomOption } from "../../api/customOptionsApi";
import { getServiceCategories } from "../../api/serviceCategoriesApi";
import { getServiceTypes } from "../../api/serviceTypesApi";
import {
  collectCustomOptionSaves,
  getConfiguredSizeDimensions,
  getCustomSizeEntries,
  getCustomSizeStorageKeys,
  getCustomSizeSummary,
} from "../../utils/customSizeUtils";
import { getFieldsByServiceType } from "../../api/productFieldConfigApi";
import "../../../public/assets/css/addModalShared.css";

const STYLE_PREF_OPTIONS = ["Minimal", "Bold", "Traditional", "Corporate", "Fun"];
const LEGACY_CUSTOM_SIZE_FIELD_KEYS = new Set(["customWidth", "customHeight", "customDepth"]);

function readEntryFile(entry) {
  return new Promise((resolve, reject) => {
    entry.file(resolve, reject);
  });
}

function readDirectoryEntries(directoryEntry) {
  return new Promise((resolve, reject) => {
    const reader = directoryEntry.createReader();
    const allEntries = [];

    const readBatch = () => {
      reader.readEntries(
        (entries) => {
          if (!entries.length) {
            resolve(allEntries);
            return;
          }
          allEntries.push(...entries);
          readBatch();
        },
        (error) => reject(error),
      );
    };

    readBatch();
  });
}

function buildSizeDialogState(field, values, fallbackUnit = "mm") {
  return {
    open: true,
    field,
    value: "",
    isFlexCustomSize: true,
    dimensionValues: Object.fromEntries(
      getCustomSizeEntries(field, values).map((entry) => [entry.key, entry.value])
    ),
    customSizeUnitLabel: fallbackUnit,
    sizeUnit: field?.customDimensionUnit || fallbackUnit,
  };
}

function isConfiguredFieldVisible(field, specs = {}) {
  if (!field || field.hidden || LEGACY_CUSTOM_SIZE_FIELD_KEYS.has(field.key)) return false;
  if (field.dependsOn && field.dependsOn.trim() !== "") {
    return String(specs[field.dependsOn] ?? "") === String(field.dependsOnValue ?? "");
  }
  return true;
}

function hasConfiguredFieldValue(field, specs = {}) {
  if (!field || field.type === "computed") return true;
  const value = specs[field.key];
  if (value == null || String(value).trim() === "") return false;

  if (field.hasUnit && (field.unitOptions || []).length > 0) {
    const unitValue = specs[`${field.key}Unit`] ?? field.defaultUnit;
    if (unitValue == null || String(unitValue).trim() === "") return false;
  }

  if (field.type === "select" && field.allowCustom && value === "Custom") {
    if (field.key === "size") {
      if (field.customSizeMode === "text") {
        return String(specs.sizeCustom || "").trim() !== "";
      }
      const sizeEntries = getCustomSizeEntries(field, specs);
      if (sizeEntries.length > 0) {
        return sizeEntries.every((entry) => String(entry.value || "").trim() !== "" && Number(entry.value) > 0);
      }
      return String(getCustomSizeSummary(field, specs) || "").trim() !== "";
    }
    return String(specs[`${field.key}Custom`] || "").trim() !== "";
  }

  return true;
}

function getMissingCompulsoryField(fields = [], specs = {}) {
  return fields.find((field) =>
    field.isRequired && isConfiguredFieldVisible(field, specs) && !hasConfiguredFieldValue(field, specs)
  );
}

function renderFieldLabel(field, suffix = "") {
  return (
    <>
      {field.label}{suffix}
      {field.isRequired && <span className="text-danger ms-1">*</span>}
    </>
  );
}

function normalizeIsoDateWithFourDigitYear(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return "";
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (year < 1 || year > 9999) return "";
  if (month < 1 || month > 12) return "";
  if (day < 1 || day > 31) return "";
  return raw;
}

function isSundayIsoDate(value) {
  const normalized = normalizeIsoDateWithFourDigitYear(value);
  if (!normalized) return false;
  const [year, month, day] = normalized.split("-").map(Number);
  return new Date(year, month - 1, day).getDay() === 0;
}

function createEmptyCustomSpecDialog() {
  return {
    open: false,
    field: null,
    value: "",
    isFlexCustomSize: false,
    dimensionValues: {},
    customSizeUnitLabel: "ft",
    sizeUnit: "mm",
  };
}

function getRequirementFormSeed(requirement = null) {
  let parsedSpecs = {};
  try {
    parsedSpecs = requirement?.specs ? JSON.parse(requirement.specs) : {};
  } catch {
    parsedSpecs = {};
  }

  return {
    categoryId: requirement?.categoryId ? String(requirement.categoryId) : "",
    typeId: requirement?.typeId ? String(requirement.typeId) : "",
    subtypeId: requirement?.subtypeId ? String(requirement.subtypeId) : "",
    quantity: requirement?.quantity != null ? String(requirement.quantity) : "",
    specs: parsedSpecs,
    designNotes: requirement?.designNotes || "",
    stylePreference: requirement?.stylePreference || "",
    colourPreference: requirement?.colourPreference || "",
    referenceNotes: requirement?.referenceNotes || "",
    brandColours: requirement?.brandColours || "",
    designMode: requirement?.designStatus || "",
    deliveryDate: isSundayIsoDate(requirement?.deliveryDate)
      ? ""
      : normalizeIsoDateWithFourDigitYear(requirement?.deliveryDate || ""),
    specialInstructions: requirement?.specialInstructions || "",
  };
}

async function collectDroppedFiles(items) {
  const collected = [];

  const walkEntry = async (entry) => {
    if (!entry) return;
    if (entry.isFile) {
      const file = await readEntryFile(entry);
      collected.push(file);
      return;
    }
    if (entry.isDirectory) {
      const entries = await readDirectoryEntries(entry);
      for (const child of entries) {
        await walkEntry(child);
      }
    }
  };

  if (items && items.length > 0) {
    for (const item of Array.from(items)) {
      const entry = typeof item.webkitGetAsEntry === "function"
        ? item.webkitGetAsEntry()
        : null;
      if (entry) {
        await walkEntry(entry);
        continue;
      }
      const file = item.getAsFile?.();
      if (file) {
        collected.push(file);
      }
    }
  }

  return collected;
}

export default function RequirementFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const leadId = searchParams.get("leadId");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [initialLoading, setInitialLoading] = useState(true);

  // Master data
  const [categories, setCategories] = useState([]);
  const [allTypes, setAllTypes] = useState([]);

  // Form selections
  const [categoryId, setCategoryId] = useState("");
  const [typeId, setTypeId] = useState("");
  const [subtypeId, setSubtypeId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [specs, setSpecs] = useState({});
  const [customSpecDialog, setCustomSpecDialog] = useState(() => createEmptyCustomSpecDialog());
  const [customOptionsByFieldKey, setCustomOptionsByFieldKey] = useState({});

  // Design section
  const [designMode, setDesignMode] = useState("");
  const [designNotes, setDesignNotes] = useState("");
  const [stylePreference, setStylePreference] = useState("");
  const [colourPreference, setColourPreference] = useState("");
  const [referenceNotes, setReferenceNotes] = useState("");
  const [brandColours, setBrandColours] = useState("");
  const [isDragActive, setIsDragActive] = useState(false);

  // Files
  const [files, setFiles] = useState([]);
  const isEditing = Boolean(id);

  const [productFields, setProductFields] = useState([]);
  const [fieldsLoading, setFieldsLoading] = useState(false);

  const applyRequirementSeed = useCallback((requirement = null) => {
    const seed = getRequirementFormSeed(requirement);

    setError("");
    setCategoryId(seed.categoryId);
    setTypeId(seed.typeId);
    setSubtypeId(seed.subtypeId);
    setQuantity(seed.quantity);
    setSpecs(seed.specs);
    setDesignNotes(seed.designNotes);
    setStylePreference(seed.stylePreference);
    setColourPreference(seed.colourPreference);
    setReferenceNotes(seed.referenceNotes);
    setBrandColours(seed.brandColours);
    setDesignMode(seed.designMode);
    setIsDragActive(false);
    setFiles([]);
    setCustomSpecDialog(createEmptyCustomSpecDialog());
    setCustomOptionsByFieldKey({});
    setProductFields([]);
    setFieldsLoading(false);
  }, []);

  // Fetch Master Data and Initial Requirement if editing
  useEffect(() => {
    let active = true;

    async function loadData() {
      try {
        const [cats, types] = await Promise.all([
          getServiceCategories(),
          getServiceTypes(),
        ]);

        if (!active) return;
        setCategories(cats || []);
        setAllTypes(types || []);

        if (isEditing) {
          const req = await getRequirementById(id);
          if (!active) return;
          applyRequirementSeed(req);
        } else {
          applyRequirementSeed(null);
        }
      } catch (err) {
        if (active) {
          setError(err?.message || "Failed to load page data.");
        }
      } finally {
        if (active) {
          setInitialLoading(false);
        }
      }
    }

    loadData();

    return () => {
      active = false;
    };
  }, [id, isEditing, applyRequirementSeed]);

  const handleClose = useCallback(() => {
    if (saving) return;
    if (window.history.length > 1) {
      navigate(-1);
    } else if (leadId) {
      navigate(`/leads/${leadId}`);
    } else {
      navigate("/requirements");
    }
  }, [leadId, navigate, saving]);

  // Derived lists
  const typeOptions = useMemo(() => {
    if (!categoryId) return [];
    return allTypes.filter(
      (t) => String(t.categoryId) === String(categoryId) && !t.parentId,
    );
  }, [allTypes, categoryId]);

  const subtypeOptions = useMemo(() => {
    if (!typeId) return [];
    return allTypes.filter((t) => String(t.parentId) === String(typeId));
  }, [allTypes, typeId]);

  useEffect(() => {
    const resolvedId = subtypeId || typeId;
    if (!resolvedId) { setProductFields([]); return; }
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
          isHidden: f.isHidden,
          hidden: f.isHidden,
          hasUnit: f.hasUnit,
          unitOptions: f.unitOptions || [],
          defaultUnit: f.defaultUnit,
          enable3rdDimension: f.enable3rdDimension,
          thirdDimensionLabel: f.thirdDimensionLabel,
          dependsOn: f.dependsOn,
          dependsOnValue: f.dependsOnValue,
        }));
        setProductFields(mapped);
        setSpecs((prev) => {
          const next = { ...prev };
          let changed = false;
          mapped.forEach((mf) => {
            if (mf.hasUnit && mf.defaultUnit && next[`${mf.key}Unit`] === undefined) {
              next[`${mf.key}Unit`] = mf.defaultUnit;
              changed = true;
            }
          });
          return changed ? next : prev;
        });
      })
      .catch(() => {
        if (!cancelled) setProductFields([]);
      })
      .finally(() => {
        if (!cancelled) setFieldsLoading(false);
      });
    return () => { cancelled = true; };
  }, [typeId, subtypeId]);

  useEffect(() => {
    if (!typeId) { setCustomOptionsByFieldKey({}); return; }
    const selectFields = (productFields || []).filter(
      (f) => f.type === "select" && !f.promptText
    );
    if (!selectFields.length) { setCustomOptionsByFieldKey({}); return; }
    Promise.all(
      selectFields.map((f) =>
        getCustomOptions(typeId, subtypeId || null, f.key)
          .then((opts) => [f.key, (opts || []).map((o) => o.valueRaw)])
          .catch(() => [f.key, []])
      )
    ).then((pairs) => {
      setCustomOptionsByFieldKey(Object.fromEntries(pairs));
    });
  }, [typeId, subtypeId, productFields]);

  useEffect(() => {
    if (!productFields || productFields.length === 0) return;
    const dependentFields = productFields.filter(
      (f) => f.dependsOn && f.dependsOn.trim() !== ""
    );
    if (!dependentFields.length) return;
    setSpecs((prev) => {
      let changed = false;
      const next = { ...prev };
      dependentFields.forEach((field) => {
        if (prev[field.dependsOn] !== field.dependsOnValue && prev[field.key] !== undefined) {
          delete next[field.key];
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [productFields, specs]);

  const handleCategoryChange = (id) => {
    setCategoryId(id);
    setTypeId("");
    setSubtypeId("");
    setSpecs({});
  };

  const handleTypeChange = (id) => {
    setTypeId(id);
    setSubtypeId("");
    setSpecs({});
  };

  const handleSpecChange = useCallback((key, value) => {
    setSpecs((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleSelectSpecChange = useCallback((field, value) => {
    if (field.key === "size" && value === "Custom") {
      if (field.customSizeMode === "text") {
        setCustomSpecDialog({
          open: true,
          field,
          value: String(specs[`${field.key}Custom`] || "").trim(),
          isFlexCustomSize: false,
          dimensionValues: {},
          customSizeUnitLabel: "ft",
          sizeUnit: "mm",
        });
        return;
      }

      const configDims = getConfiguredSizeDimensions(field);
      const unit = field.customDimensionUnit || "mm";

      if (configDims.length > 0) {
        setCustomSpecDialog(buildSizeDialogState(field, specs, unit || "mm"));
        return;
      }
      return;
    }

    if (field.promptText && value) {
      setCustomSpecDialog({
        open: true,
        field,
        value: String(specs[`${field.key}Text`] || "").trim(),
        isFlexCustomSize: false,
        isTextPrompt: true,
        textRows: field.textRows || 4,
        selectedOption: value,
        dimensionValues: {},
        customSizeUnitLabel: "ft",
        sizeUnit: "mm",
      });
      return;
    }

    if (field.allowCustom && value === "Custom") {
      setCustomSpecDialog({
        open: true,
        field,
        value: String(specs[`${field.key}Custom`] || "").trim(),
        isFlexCustomSize: false,
        dimensionValues: {},
        customSizeUnitLabel: "ft",
        sizeUnit: "mm",
      });
      return;
    }

    setSpecs((prev) => {
      const next = { ...prev, [field.key]: value };
      if (field.allowCustom && value !== "Custom") {
        delete next[`${field.key}Custom`];
        if (field.key === "size") {
          getCustomSizeStorageKeys(field).forEach((storageKey) => {
            delete next[storageKey];
          });
          delete next.customUnit;
          delete next.sizeCustom;
        }
      }
      return next;
    });
  }, [specs]);

  const closeCustomSpecDialog = useCallback(() => {
    setCustomSpecDialog({ open: false, field: null, value: "", isFlexCustomSize: false, dimensionValues: {}, customSizeUnitLabel: "ft", sizeUnit: "mm" });
  }, []);

  const saveCustomSpecDialog = useCallback(() => {
    const field = customSpecDialog.field;
    if (!field) return;

    if (customSpecDialog.isFlexCustomSize) {
      const entries = getCustomSizeEntries(field, customSpecDialog.dimensionValues);
      const missing = entries.find((entry) => !String(customSpecDialog.dimensionValues?.[entry.key] || "").trim());

      if (missing) {
        setError(`Please enter ${missing.label.toLowerCase()}`);
        return;
      }

      const dimensionPayload = Object.fromEntries(entries.map((entry) => [entry.key, String(customSpecDialog.dimensionValues?.[entry.key] || "").trim()]));

      setSpecs((prev) => ({
        ...prev,
        [field.key]: "Custom",
        ...dimensionPayload,
        customUnit: customSpecDialog.sizeUnit,
      }));
      const sizeLabel = getCustomSizeSummary(field, { size: "Custom", ...dimensionPayload, customUnit: customSpecDialog.sizeUnit }) || "Custom";
      saveCustomOption(
        typeId,
        subtypeId || null,
        "size",
        sizeLabel
      ).catch(() => {});
      closeCustomSpecDialog();
      setError("");
      return;
    }

    if (customSpecDialog.isTextPrompt) {
      const trimmedText = String(customSpecDialog.value || "").trim();
      setSpecs((prev) => ({
        ...prev,
        [field.key]: customSpecDialog.selectedOption,
        [`${field.key}Text`]: trimmedText,
      }));
      closeCustomSpecDialog();
      return;
    }

    const trimmedValue = String(customSpecDialog.value || "").trim();
    if (!trimmedValue) {
      setSpecs((prev) => {
        const next = { ...prev };
        delete next[field.key];
        delete next[`${field.key}Custom`];
        return next;
      });
      closeCustomSpecDialog();
      return;
    }

    setSpecs((prev) => ({
      ...prev,
      [field.key]: "Custom",
      [`${field.key}Custom`]: trimmedValue,
    }));
    saveCustomOption(
      typeId,
      subtypeId || null,
      field.key,
      trimmedValue
    ).catch(() => {});
    closeCustomSpecDialog();
  }, [closeCustomSpecDialog, customSpecDialog, typeId, subtypeId]);

  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files || []);
    if (selected.length > 0) {
      setFiles((prev) => [...prev, ...selected]);
    }
    e.target.value = "";
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    try {
      const droppedFiles = await collectDroppedFiles(e.dataTransfer?.items);
      if (droppedFiles.length > 0) {
        setFiles((prev) => [...prev, ...droppedFiles]);
        return;
      }
      const fallbackFiles = Array.from(e.dataTransfer?.files || []);
      if (fallbackFiles.length > 0) {
        setFiles((prev) => [...prev, ...fallbackFiles]);
      }
    } catch {
      const fallbackFiles = Array.from(e.dataTransfer?.files || []);
      if (fallbackFiles.length > 0) {
        setFiles((prev) => [...prev, ...fallbackFiles]);
      }
    }
  };

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!leadId) {
      setError("Lead ID is missing from path URL query parameters.");
      return;
    }

    // Comprehensive validations
    if (!categoryId || !typeId) {
      setError("Please select Category and Product.");
      return;
    }
    const subtypesForSelectedType = allTypes.filter((t) => String(t.parentId) === String(typeId));
    if (subtypesForSelectedType.length > 0 && !subtypeId) {
      setError("Please select a Product Subtype.");
      return;
    }
    if (!designMode) {
      setError("Please select a Design Mode.");
      return;
    }

    const missingField = getMissingCompulsoryField(productFields, specs);
    if (missingField) {
      setError(`Please fill compulsory field: ${missingField.label || missingField.key}`);
      return;
    }

    if (designMode !== "design_only" && (!quantity || Number(quantity) <= 0)) {
      setError("Please enter a valid quantity greater than zero.");
      return;
    }

    if (specs.size === "Custom") {
      const sizeField = (productFields || []).find((f) => f.key === "size");
      if (sizeField && sizeField.customSizeMode !== "text" && getConfiguredSizeDimensions(sizeField).length > 0) {
        const sizeEntries = getCustomSizeEntries(sizeField, specs);
        const allCompleted = sizeEntries.every((entry) => {
          const value = String(entry.value || "").trim();
          return value && Number(value) > 0;
        });
        if (!allCompleted) {
          setError("Please complete all selected custom dimensions for size.");
          return;
        }
      }
    }

    setError("");
    setSaving(true);
    try {
      const data = {
        leadId: Number(leadId),
        categoryId: Number(categoryId),
        typeId: Number(typeId),
        subtypeId: subtypeId ? Number(subtypeId) : null,
        quantity: Number(quantity) || 0,
        specs: JSON.stringify(specs),
        designStatus: designMode || null,
        designNotes: designNotes || null,
        fileFormat: null,
        colourMode: null,
        stylePreference: stylePreference || null,
        colourPreference: colourPreference || null,
        referenceNotes: referenceNotes || null,
        brandColours: brandColours || null,
        deliveryDate: null,
        specialInstructions: null,
      };

      if (isEditing) {
        await updateRequirement(id, data, files);
      } else {
        await createRequirement(data, files);
      }

      if (typeId) {
        const saves = collectCustomOptionSaves(productFields || [], specs);
        saves.forEach(({ fieldKey, valueRaw }) => {
          saveCustomOption(Number(typeId), subtypeId ? Number(subtypeId) : null, fieldKey, valueRaw)
            .then((saved) => {
              setCustomOptionsByFieldKey((prev) => {
                const existing = prev[saved.fieldKey] || [];
                if (existing.includes(saved.valueRaw)) return prev;
                return { ...prev, [saved.fieldKey]: [saved.valueRaw, ...existing] };
              });
            })
            .catch(() => {});
        });
      }

      handleClose();
    } catch (e) {
      const msg =
        e?.response?.data?.message ||
        e?.response?.data?.error ||
        e?.message ||
        "Failed to save requirement";
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="d-flex align-items-center justify-content-center min-vh-100">
        <LoadingSpinner size="lg" label="Loading Requirement Form..." />
      </div>
    );
  }

  return (
    <div className="container-fluid py-4">
      <div className="card shadow-sm border-0 rounded-3">
        <div className="card-header d-flex align-items-center justify-content-between flex-wrap gap-2 py-3 bg-white border-bottom">
          <div>
            <h5 className="mb-0 fw-bold text-dark">{isEditing ? "Edit Requirement" : "Add Requirement"}</h5>
            <small className="text-muted">Maintain details and custom product specs.</small>
          </div>
          <button type="button" className="btn btn-outline-secondary" onClick={handleClose}>
            Back
          </button>
        </div>

        <div className="card-body">
          {error && (
            <div className="alert alert-danger py-2 mb-4" role="alert">
              {error}
            </div>
          )}

          <form id="requirement-form" onSubmit={handleSubmit}>
            {/* 1. Product Details Section */}
            <div className="form-section-card card mb-4">
              <div className="card-body">
                <p className="avm-section-title">Product Details</p>
                <div className="row g-3">
                  <div className="col-md-6">
                    <div className="avm-field">
                      <label className="avm-label">Design Mode <span className="text-danger">*</span></label>
                      <select
                        className="avm-select form-select"
                        value={designMode}
                        onChange={(e) => {
                          setDesignMode(e.target.value);
                          setFiles([]);
                        }}
                      >
                        <option value="">Select design mode</option>
                        <option value="design_only">Design Only</option>
                        <option value="production_only">Production Only</option>
                        <option value="design_production">Design + Production</option>
                      </select>
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="avm-field">
                      <label className="avm-label">Category <span className="text-danger">*</span></label>
                      <select
                        className="avm-select form-select"
                        value={categoryId}
                        onChange={(e) => handleCategoryChange(e.target.value)}
                      >
                        <option value="">Select category</option>
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="avm-field">
                      <label className="avm-label">Product <span className="text-danger">*</span></label>
                      <select
                        className="avm-select form-select"
                        value={typeId}
                        onChange={(e) => handleTypeChange(e.target.value)}
                        disabled={!categoryId}
                      >
                        <option value="">Select product</option>
                        {typeOptions.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {typeId && subtypeOptions.length > 0 && (
                    <div className="col-md-6">
                      <div className="avm-field">
                        <label className="avm-label">Sub-Product <span className="text-danger">*</span></label>
                        <select
                          className="avm-select form-select"
                          value={subtypeId}
                          onChange={(e) => setSubtypeId(e.target.value)}
                        >
                          <option value="">Select sub-type</option>
                          {subtypeOptions.map((st) => (
                            <option key={st.id} value={st.id}>
                              {st.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}

                  {designMode !== "design_only" && (
                    <div className="col-md-6">
                      <div className="avm-field">
                        <label className="avm-label">Quantity <span className="text-danger">*</span></label>
                        <input
                          className="form-control"
                          type="number"
                          min="1"
                          value={quantity}
                          onChange={(e) => setQuantity(e.target.value)}
                          placeholder="Enter quantity"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 2. Product Specifications Section */}
            {(typeId || subtypeId) && (
              <div className="form-section-card card mb-4">
                <div className="card-body">
                  <p className="avm-section-title">Product Specifications</p>
                  {fieldsLoading ? (
                    <div className="text-center py-4">
                      <LoadingSpinner size="sm" label="Loading specifications fields..." />
                    </div>
                  ) : productFields.length > 0 ? (
                    <div className="row g-3">
                      {productFields.flatMap((field) => {
                        if (LEGACY_CUSTOM_SIZE_FIELD_KEYS.has(field.key)) return [];
                        if (field.hidden) return [];

                        if (field.dependsOn && field.dependsOn.trim() !== "") {
                          const parentValue = specs[field.dependsOn];
                          if (parentValue !== field.dependsOnValue) {
                            return [];
                          }
                        }

                        if (field.type === "computed") {
                          const val = field.compute(specs);
                          return (
                            <div key={field.key} className="col-md-6">
                              <div className="avm-field">
                                <label className="avm-label">{renderFieldLabel(field)}</label>
                                <input
                                  className="form-control"
                                  value={val}
                                  readOnly
                                />
                              </div>
                            </div>
                          );
                        }

                        if (field.type === "select") {
                          const savedForField = !field.promptText
                            ? (customOptionsByFieldKey[field.key] || [])
                            : [];
                          const staticOpts = field.options.filter((o) => o !== "Custom");
                          const alreadyInStatic = new Set(staticOpts.map((o) => o.toLowerCase()));
                          const uniqueSaved = savedForField.filter((s) => !alreadyInStatic.has(s.toLowerCase()));
                          const effectiveOpts = [...staticOpts, ...uniqueSaved];

                          return (
                            <div key={field.key} className="col-md-6">
                              <div className="avm-field">
                                <label className="avm-label">{renderFieldLabel(field)}</label>
                                <div className="d-flex align-items-center">
                                  <select
                                    className="avm-select form-select"
                                    value={specs[field.key] || ""}
                                    onChange={(e) => handleSelectSpecChange(field, e.target.value)}
                                    title={field.allowCustom && specs[field.key] === "Custom" ? (field.key === "size" ? (getCustomSizeSummary(field, specs) ? `Custom: ${getCustomSizeSummary(field, specs)}` : "Custom") : `Custom: ${specs[`${field.key}Custom`] || ""}`) : ""}
                                  >
                                    <option value="">Select {field.label}</option>
                                    {specs[field.key] === "Custom" && (() => {
                                      if (field.key === "size") {
                                        if (field.customSizeMode === "text") {
                                          const customValue = specs.sizeCustom;
                                          return (
                                            <option key="Custom" value="Custom">
                                              {customValue ? `Custom: ${customValue}` : "Custom"}
                                            </option>
                                          );
                                        }
                                        const summary = getCustomSizeSummary(field, specs);
                                        return (
                                          <option key="Custom" value="Custom">
                                            {summary ? `Custom: ${summary}` : "Custom"}
                                          </option>
                                        );
                                      }
                                      const customValue = specs[`${field.key}Custom`];
                                      return (
                                        <option key="Custom" value="Custom">
                                          {customValue ? `Custom: ${customValue}` : "Custom"}
                                        </option>
                                      );
                                    })()}
                                    {effectiveOpts.map((opt) => (
                                      <option key={opt} value={opt}>
                                        {opt}
                                      </option>
                                    ))}
                                  </select>
                                  {field.allowCustom && (
                                    <button
                                      type="button"
                                      className="btn btn-sm btn-outline-secondary ms-1 flex-shrink-0"
                                      onClick={() => handleSelectSpecChange(field, "Custom")}
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
                            <div key={field.key} className="col-md-6">
                              <div className="avm-field">
                                <label className="avm-label">{field.label}</label>
                                <div className="d-flex align-items-stretch w-100">
                                  <input
                                    className="form-control unit-input"
                                    type={field.type === "number" ? "number" : "text"}
                                    value={specs[field.key] ?? ""}
                                    onChange={(e) => handleSpecChange(field.key, e.target.value)}
                                    placeholder={field.placeholder || ""}
                                  />
                                  <select
                                    className="avm-select form-select unit-select"
                                    style={{ maxWidth: "90px" }}
                                    value={specs[`${field.key}Unit`] ?? field.defaultUnit ?? ""}
                                    onChange={(e) => handleSpecChange(`${field.key}Unit`, e.target.value)}
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

                        const measurementValue = specs["measurement"];
                        const isDimensionField = ["length", "width", "height", "gusset", "depth", "diameter"].includes(field.key);
                        const dimensionSuffix = isDimensionField && !field.hasUnit && measurementValue ? ` (in ${measurementValue})` : "";

                        return (
                          <div key={field.key} className="col-md-6">
                            <div className="avm-field">
                              <label className="avm-label">{renderFieldLabel(field, dimensionSuffix)}</label>
                              <input
                                className="form-control"
                                type={field.type === "number" ? "number" : "text"}
                                value={specs[field.key] ?? (field.default || "")}
                                onChange={(e) =>
                                  handleSpecChange(field.key, e.target.value)
                                }
                                placeholder={field.placeholder || ""}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="alert alert-info py-2 mb-0">
                      No fields configured for this product
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 3. Design Preference & Notes Section */}
            <div className="form-section-card card mb-4">
              <div className="card-body">
                <p className="avm-section-title">Design Preference & Notes</p>
                <div className="row g-3">
                  <div className="col-12">
                    <label className="avm-label fw-semibold">Design Files</label>
                    <label
                      className={`w-100 rounded-3 p-4 text-center ${isDragActive ? "border border-primary bg-light" : "border border-secondary-subtle"}`}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      style={{ cursor: "pointer", borderStyle: "dashed" }}
                    >
                      <input
                        type="file"
                        className="d-none"
                        multiple
                        onChange={handleFileChange}
                      />
                      <div className="fw-semibold mb-1">
                        Drag and drop design files here
                      </div>
                      <small className="text-muted">
                        or click this area to choose files
                      </small>
                    </label>
                    {files.length > 0 && (
                      <div className="mt-2">
                        {files.map((f, i) => (
                          <div
                            key={`${f.name}-${i}`}
                            className="d-flex align-items-center gap-2 py-1"
                          >
                            <i className="ti ti-folder text-muted" />
                            <span className="text-truncate" style={{ maxWidth: 320 }}>
                              {f.name}
                            </span>
                            <small className="text-muted">
                              ({(f.size / 1024).toFixed(1)} KB)
                            </small>
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-danger ms-auto"
                              onClick={() => removeFile(i)}
                            >
                              <i className="ti ti-x" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="col-12">
                    <div className="avm-field">
                      <label className="avm-label">Note / Special Instructions</label>
                      <textarea
                        className="form-control"
                        rows={4}
                        value={designNotes}
                        onChange={(e) => setDesignNotes(e.target.value)}
                        placeholder="Any instructions from customer about the design or custom details..."
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Form Actions Footer */}
            <div className="d-flex justify-content-end gap-2 pt-3 border-top">
              <button
                type="button"
                className="btn btn-light"
                onClick={handleClose}
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={saving}
              >
                {saving
                  ? (isEditing ? "Updating..." : "Saving...")
                  : (isEditing ? "Update Requirement" : "Save Requirement")}
              </button>
            </div>
          </form>
        </div>
      </div>

      {customSpecDialog.open && (
        <div
          className="modal fade show requirement-form-modal"
          style={{ display: "block", backgroundColor: "rgba(0,0,0,0.35)" }}
          tabIndex="-1"
        >
          <div className="modal-dialog modal-dialog-centered" style={{ maxHeight: "auto", maxWidth: "500px", display: "flex", alignItems: "center" }}>
            <div className="modal-content" style={{ maxHeight: "auto", display: "flex", flexDirection: "column", overflowY: "visible" }}>
              <div className="modal-header">
                <h5 className="modal-title">
                  {customSpecDialog.isFlexCustomSize ? "Enter Custom Size" : `Enter Custom ${customSpecDialog.field?.label}`}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={closeCustomSpecDialog}
                  aria-label="Close"
                />
              </div>
              <div className="modal-body" style={{ overflowY: "auto", flex: 1, padding: "1.5rem" }}>
                {customSpecDialog.isFlexCustomSize ? (
                  <>
                    <div className="lead-form-field mb-3">
                      <label className="form-label">Unit <span className="text-danger">*</span></label>
                      <select
                        className="form-select"
                        value={customSpecDialog.sizeUnit}
                        onChange={(e) =>
                          setCustomSpecDialog((prev) => ({ ...prev, sizeUnit: e.target.value }))
                        }
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
                          onChange={(e) => setCustomSpecDialog((prev) => ({ ...prev, dimensionValues: { ...(prev.dimensionValues || {}), [entry.key]: e.target.value } }))}
                          placeholder={`Enter ${entry.label.toLowerCase()} in ${customSpecDialog.sizeUnit}`}
                          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); saveCustomSpecDialog(); } }}
                        />
                      </div>
                    ))}
                    {error && <div className="alert alert-danger mt-2 py-2 mb-0">{error}</div>}
                  </>
                ) : (
                  <div className="lead-form-field">
                    <label className="form-label">
                      {customSpecDialog.isTextPrompt
                        ? `${customSpecDialog.selectedOption} Details`
                        : customSpecDialog.field?.label}
                    </label>
                    {customSpecDialog.isTextPrompt ? (
                      <textarea
                        className="form-control"
                        autoFocus
                        rows={customSpecDialog.textRows || 4}
                        value={customSpecDialog.value}
                        onChange={(e) =>
                          setCustomSpecDialog((prev) => ({ ...prev, value: e.target.value }))
                        }
                        placeholder={`Enter ${customSpecDialog.selectedOption?.toLowerCase() || "details"}`}
                      />
                    ) : (
                      <input
                        className="form-control"
                        autoFocus
                        value={customSpecDialog.value}
                        onChange={(e) =>
                          setCustomSpecDialog((prev) => ({ ...prev, value: e.target.value }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            saveCustomSpecDialog();
                          }
                        }}
                        placeholder={
                          customSpecDialog.field?.customPlaceholder ||
                          `Enter ${customSpecDialog.field?.label || "value"}`
                        }
                      />
                    )}
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-light"
                  onClick={closeCustomSpecDialog}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={saveCustomSpecDialog}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
