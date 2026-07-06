import React, { Fragment, useEffect, useMemo, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { useToast } from "../../components/system/ToastProvider";
import useConfirmDialog from "../../components/system/useConfirmDialog";
import PageHeader from "../../components/admin/PageHeader";
import { extractApiErrorMessage } from "../../utils/errorMessage";
import { getServiceCategories } from "../../api/serviceCategoriesApi";
import { getServiceTypes } from "../../api/serviceTypesApi";
import {
  getFieldsByServiceType,
  createProductField,
  updateProductField,
  deleteProductField,
  reorderProductFields,
  getDimensionMasters,
  addDimensionMaster,
  deleteDimensionMaster,
  getUnitMasters,
  addUnitMaster,
  deleteUnitMaster
} from "../../api/productFieldConfigApi";
import { getCustomOptions, deleteCustomOption } from "../../api/customOptionsApi";
import "./ProductFieldConfigPage.css";

// ─── Dynamic product tree data ────────────────────────────────────────────────

// ─── Field Library ────────────────────────────────────────────────────────────
const FIELD_LIBRARY = [
  { key: "gusset", label: "Gusset", type: "number" },
  { key: "depth", label: "Depth", type: "number" },
  { key: "diameter", label: "Diameter", type: "number" },
  { key: "length", label: "Length", type: "number" },
  { key: "width", label: "Width", type: "number" },
  { key: "height", label: "Height", type: "number" },
  { key: "loadCapacityKg", label: "Load Capacity (kg)", type: "number" },
  { key: "gsm", label: "GSM", type: "text" },
  { key: "boardGsm", label: "Board GSM", type: "text" },
  { key: "capacityMl", label: "Capacity (ml)", type: "number" },
  { key: "size", label: "Size", type: "select", options: ["Small", "Medium", "Large", "Custom"] },
  { key: "measurement", label: "Measurement", type: "select", options: ["mm", "cm", "inch", "feet"] },
  { key: "lamination", label: "Lamination", type: "select", options: ["Matte", "Gloss", "Glossy", "Velvet", "UV"] },
  { key: "material", label: "Material", type: "select", options: ["Paper", "Plastic", "Bagasse", "Wood", "Bamboo"] },
  { key: "printingMethod", label: "Printing Method", type: "select", options: ["Flexo", "Offset", "Digital", "Screen"] },
  { key: "printColours", label: "Print Colours", type: "select", options: ["Plain", "1 colour", "2 colour", "CMYK"] },
  { key: "printType", label: "Print Type", type: "select", options: ["Single colour", "Multicolour", "Front Only", "Front & Back"] },
  { key: "finish", label: "Finish", type: "select", options: ["Matte", "Glossy", "UV", "Emboss"] },
  { key: "colour", label: "Colour", type: "select", options: ["Single", "Multi", "Custom"] },
  { key: "orientation", label: "Orientation", type: "select", options: ["Horizontal", "Vertical"] },
  { key: "boxStyle", label: "Box Style", type: "select", options: ["RSC", "Die-cut", "Mailer", "Flap"] },
  { key: "ply", label: "Ply", type: "select", options: ["Single", "3", "5", "7"] },
  { key: "fluteType", label: "Flute Type", type: "select", options: ["E", "B", "C", "BC"] },
  { key: "usageType", label: "Usage Type", type: "select", options: ["Food", "Retail", "E-commerce", "Industrial"] },
  { key: "foodSafe", label: "Food Safe", type: "select", options: ["Yes", "No"] },
  { key: "greaseProof", label: "Grease Proof", type: "select", options: ["Yes", "No"] },
  { key: "leakProof", label: "Leak Proof", type: "select", options: ["Yes", "No"] },
  { key: "foodGrade", label: "Food Grade", type: "select", options: ["Yes", "No"] },
  { key: "dielineAvailable", label: "Dieline Available", type: "select", options: ["Yes", "No"] },
  { key: "lidType", label: "Lid Type", type: "select", options: ["Flat", "Dome", "Spout"] },
  { key: "zipperType", label: "Zipper Type", type: "select", options: ["With Zipper", "Without Zipper"] },
  { key: "windowType", label: "Window Type", type: "select", options: ["With Window", "Without Window"] },
  { key: "innerLamination", label: "Inner Lamination", type: "select", options: ["With Lamination", "Without Lamination"] },
  { key: "cornerType", label: "Corner Type", type: "select", options: ["Normal", "Round"] },
  { key: "paperGsm", label: "Paper GSM", type: "select", options: ["300", "350", "400"] },
  { key: "shapeType", label: "Shape Type", type: "select", options: ["Round", "Square", "Dye Cut Model"] },
  { key: "partition", label: "Partition", type: "select", options: ["With Partition", "Without Partition"] },
  { key: "addons", label: "Add-ons", type: "text" },
];

// No longer using mock product fields

// ─── Helpers ──────────────────────────────────────────────────────────────────
const autoGenerateKey = (label) =>
  label.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").trim();

const TYPE_BADGE_STYLE = {
  text:   { background: "#f5f0fd", color: "#5a3ea8" },
  number: { background: "#e8fdf0", color: "#1a7a44" },
  select: { background: "#e8f4fd", color: "#1a6fa8" },
};

const getCustomSizeUnitOptions = (form) => {
  const selected = Array.isArray(form?.unitOptions) ? form.unitOptions.filter(Boolean) : [];
  if (selected.length > 0) return selected;
  return form?.customDimensionUnit ? [form.customDimensionUnit] : ["mm"];
};

const getPayloadUnitOptions = (form) => {
  if (form?.allowCustom && form?.key === "size") {
    return getCustomSizeUnitOptions(form);
  }
  return form?.hasUnit ? (form.unitOptions || []) : [];
};

const DEFAULT_SIZE_DIMENSIONS = ["Width", "Height"];

const isSizeFieldKey = (fieldKey) => String(fieldKey || "").trim().toLowerCase() === "size";

const sanitizeCustomDimensions = (fieldKey, dimensions, availableDimensions = []) => {
  if (!isSizeFieldKey(fieldKey)) return [];
  const hasAvailableDimensions = Array.isArray(availableDimensions) && availableDimensions.length > 0;
  const dimensionNameMap = new Map(
    (Array.isArray(availableDimensions) ? availableDimensions : [])
      .map((dimension) => String(dimension?.name || "").trim())
      .filter(Boolean)
      .map((name) => [name.toLowerCase(), name])
  );
  const seen = new Set();
  return (Array.isArray(dimensions) ? dimensions : [])
    .map((value) => {
      if (!hasAvailableDimensions) {
        return String(value || "").trim();
      }
      const normalized = String(value || "").trim().toLowerCase();
      return dimensionNameMap.get(normalized) || "";
    })
    .filter((value) => {
      if (!value) return false;
      const normalized = value.toLowerCase();
      if (seen.has(normalized)) return false;
      seen.add(normalized);
      return true;
    });
};

const getCustomSizeConfigForField = (fieldKey, source = {}, availableDimensions = []) => {
  if (!isSizeFieldKey(fieldKey)) {
    return {
      customDimensions: [],
      customDimensionUnit: null,
      customSizeMode: null,
    };
  }

  return {
    customDimensions: sanitizeCustomDimensions(fieldKey, source.customDimensions, availableDimensions),
    customDimensionUnit: source.customDimensionUnit || "mm",
    customSizeMode: source.customSizeMode || null,
  };
};

const buildCustomSizePayload = (fieldKey, source = {}, availableDimensions = []) => {
  if (!isSizeFieldKey(fieldKey)) {
    return {
      customDimensions: null,
      customDimensionUnit: null,
      customSizeMode: null,
    };
  }

  const customSizeMode = source.customSizeMode || null;
  if (customSizeMode === "text") {
    return {
      customDimensions: null,
      customDimensionUnit: null,
      customSizeMode,
    };
  }

  const customDimensions = sanitizeCustomDimensions(fieldKey, source.customDimensions, availableDimensions);
  return {
    customDimensions,
    customDimensionUnit: customDimensions.length > 0 ? (source.customDimensionUnit || "mm") : null,
    customSizeMode: null,
  };
};

// ─── Unit Selector Block Component ──────────────────────────────────────────
// ─── Depends On Block Component ──────────────────────────────────────────────
function DependsOnBlock({ form, onChange, fields, currentFieldKey = null, isReviewMode = false }) {
  const dependency = getDependencyData(form);
  if (isReviewMode) {
    if (!dependency.dependsOn) return null;
    const parentField = fields.find((f) => f.key === dependency.dependsOn);
    const parentLabel = parentField ? parentField.label : dependency.dependsOn;
    return (
      <div style={{ fontSize: 12, color: "#666", marginTop: 6 }}>
        Shows when <strong>{parentLabel}</strong> = <strong>{dependency.dependsOnValue || "—"}</strong>
      </div>
    );
  }

  const parentField = fields.find((f) => f.key === dependency.dependsOn);

  return (
    <div className="mb-3">
      <label className="form-label">
        <input
          type="checkbox"
          className="form-check-input me-2"
          checked={form.hasDependency || false}
          onChange={(e) => {
            if (e.target.checked) {
              onChange({ hasDependency: true, dependsOn: "", dependsOnValue: "" });
            } else {
              onChange({ hasDependency: false, dependsOn: "", dependsOnValue: "" });
            }
          }}
        />
        Depends on another field
      </label>
      {form.hasDependency && (
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid #e9ecef" }}>
          <div className="mb-3">
            <label className="form-label" style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Parent field:</label>
            <select
              className="form-select"
              style={{ fontSize: 13 }}
              value={dependency.dependsOn}
              onChange={(e) => onChange({ dependsOn: e.target.value, dependsOnValue: "" })}
            >
              <option value="">Select a field...</option>
              {fields
                .filter((f) => !currentFieldKey || f.key !== currentFieldKey)
                .map((f) => (
                  <option key={f.key} value={f.key}>{f.label}</option>
                ))
              }
            </select>
          </div>
          {dependency.dependsOn !== "" && (
            <div className="mb-0">
              <label className="form-label" style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Show when value is:</label>
              {parentField && parentField.type === "select" ? (
                <select
                  className="form-select"
                  style={{ fontSize: 13 }}
                  value={dependency.dependsOnValue}
                  onChange={(e) => onChange({ dependsOnValue: e.target.value })}
                >
                  <option value="">Select a value...</option>
                  {(parentField.options || []).map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  className="form-control"
                  style={{ fontSize: 13 }}
                  value={dependency.dependsOnValue}
                  onChange={(e) => onChange({ dependsOnValue: e.target.value })}
                  placeholder="Enter value..."
                />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Option Pills ─────────────────────────────────────────────────────────────
function OptionPills({ options = [], max = 3 }) {
  if (!options || options.length === 0) return <span className="text-muted">—</span>;
  const visible = options.slice(0, max);
  const remaining = options.length - max;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
      {visible.map((o, i) => (
        <span key={i} style={{ fontSize: 11, padding: "2px 7px", borderRadius: 3, background: "#f0f0f5", color: "#555", fontWeight: 500 }}>
          {o}
        </span>
      ))}
      {remaining > 0 && <span style={{ fontSize: 11, color: "#999", padding: "2px 4px" }}>+{remaining} more</span>}
    </div>
  );
}

// ─── Options editor (add/remove chips) ───────────────────────────────────────
function normalizeTextValue(value) {
  if (typeof value !== "string") return "";
  return value.trim();
}

function getDependencyData(field) {
  const dependsOn = normalizeTextValue(
    field?.dependsOn ?? field?.depends_on ?? field?.parentFieldKey ?? ""
  );
  const dependsOnValue = normalizeTextValue(
    field?.dependsOnValue ?? field?.depends_on_value ?? field?.parentFieldValue ?? ""
  );
  return {
    dependsOn,
    dependsOnValue,
    hasDependency: dependsOn !== "",
  };
}

function buildDependencyPayload(form) {
  const dependsOn = normalizeTextValue(form?.dependsOn);
  return {
    dependsOn: form?.hasDependency && dependsOn ? dependsOn : null,
    dependsOnValue: form?.hasDependency && dependsOn ? normalizeTextValue(form?.dependsOnValue) : null,
  };
}

function OptionsEditor({
  options = [],
  onChange,
  importedOptions = [],
  onRemoveImported = null,
  removingImportedOptionIds = {},
  loadingImported = false,
}) {
  const [input, setInput] = useState("");

  const addOption = () => {
    const val = input.trim();
    if (!val) return;
    onChange([...options, val]);
    setInput("");
  };

  const removeOption = (idx) => onChange(options.filter((_, i) => i !== idx));
  const normalizeOptionValue = (value) => String(value || "").trim().toLowerCase();
  const configuredKeySet = new Set(options.map((option) => normalizeOptionValue(option)));
  const importedUniqueByValue = new Map();
  (Array.isArray(importedOptions) ? importedOptions : []).forEach((option) => {
    const valueRaw = String(option?.valueRaw || "").trim();
    if (!valueRaw) return;
    const normalized = normalizeOptionValue(valueRaw);
    if (configuredKeySet.has(normalized)) return;
    if (!importedUniqueByValue.has(normalized)) {
      importedUniqueByValue.set(normalized, option);
    }
  });
  const importedRows = Array.from(importedUniqueByValue.values());
  const totalRows = options.length + importedRows.length;

  return (
    <>
      <div className="pfc-options-input-group">
        <div className="input-group">
          <input
            type="text"
            className="form-control"
            placeholder="Enter option value..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addOption(); } }}
          />
          <button type="button" className="btn btn-outline-secondary" onClick={addOption} disabled={!input.trim()}>
            <i className="ti ti-plus me-1" /> Add
          </button>
        </div>
      </div>
      {loadingImported && (
        <div className="text-muted mt-2" style={{ fontSize: 12 }}>
          Loading imported values...
        </div>
      )}
      {totalRows > 0 && (
        <div className="pfc-options-list mt-3">
          <div className="pfc-options-header">
            <span className="text-muted" style={{ fontSize: 12 }}>
              {totalRows} option{totalRows !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="pfc-options-items">
            {options.map((opt, idx) => (
              <div key={`configured-${idx}-${opt}`} className="pfc-option-item">
                <span className="pfc-option-value">{opt}</span>
                <button type="button" className="btn btn-link btn-sm text-danger p-0" onClick={() => removeOption(idx)}>
                  <i className="ti ti-x" />
                </button>
              </div>
            ))}
            {importedRows.map((option) => (
              <div key={`imported-${option.id || option.valueRaw}`} className="pfc-option-item">
                <span className="pfc-option-value">{option.valueRaw}</span>
                <button
                  type="button"
                  className="btn btn-link btn-sm text-danger p-0"
                  disabled={!onRemoveImported || !!removingImportedOptionIds[option.id]}
                  onClick={() => onRemoveImported && onRemoveImported(option)}
                  title="Remove imported value"
                  >
                    {removingImportedOptionIds[option.id] ? (
                      <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
                    ) : (
                      <i className="ti ti-x" />
                    )}
                  </button>
                </div>
              ))}
          </div>
        </div>
      )}
    </>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function ProductFieldConfigPage() {
  const { showSuccess, showError } = useToast();
  const { showConfirm, confirmDialog } = useConfirmDialog();

  // Left panel
  const [searchText, setSearchText] = useState("");
  const [expandedCategories, setExpandedCategories] = useState({ packaging: true, printing: false });
  const [expandedParents, setExpandedParents] = useState({});
  const [selectedProductId, setSelectedProductId] = useState(null);

  // Right panel
  const [loadingProduct, setLoadingProduct] = useState(false);
  const [fields, setFields] = useState([]);

  // Add Fields modal
  const [showAddFieldsModal, setShowAddFieldsModal] = useState(false);
  const [addFieldsStep, setAddFieldsStep] = useState(1);        // 1 = pick, 2 = review
  const [addFieldsTab, setAddFieldsTab] = useState("library");  // 'library' | 'create'

  // Library tab
  const [libSearch, setLibSearch] = useState("");
  const [libTypeFilter, setLibTypeFilter] = useState("all");
  const [selectedLibraryKeys, setSelectedLibraryKeys] = useState([]);

  // Review step — [{ key, label, libraryType, type, options, placeholder, required, hidden }]
  const [reviewFields, setReviewFields] = useState([]);

  // Create tab
  const [newFieldForm, setNewFieldForm] = useState({
    label: "", key: "", type: "text", options: [], placeholder: "", required: false, hidden: false, allowCustom: false,
    dependsOn: "", dependsOnValue: "", hasDependency: false,
    customDimensions: [], customDimensionUnit: "mm", customSizeMode: null,
    hasUnit: false, unitOptions: [], defaultUnit: "",
  });

  // Copy from Product tab
  const [copyProductCategoryId, setCopyProductCategoryId] = useState("");
  const [copyParentProductId, setCopyParentProductId] = useState("");
  const [copyProductId, setCopyProductId] = useState("");
  const [copyProductFields, setCopyProductFields] = useState([]);
  const [copyProductLoading, setCopyProductLoading] = useState(false);
  const [selectedCopyKeys, setSelectedCopyKeys] = useState([]);

  // Edit modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingFieldId, setEditingFieldId] = useState(null);
  const [editFieldForm, setEditFieldForm] = useState(null);

  const fetchedFieldsCache = useRef({});
  const [categories, setCategories] = useState([]);
  const [serviceTypes, setServiceTypes] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [dimensionMasters, setDimensionMasters] = useState([]);
  const [unitMasters, setUnitMasters] = useState([]);
  const [showDimMasterModal, setShowDimMasterModal] = useState(false);
  const [showUnitMasterModal, setShowUnitMasterModal] = useState(false);
  const [newDimName, setNewDimName] = useState("");
  const [newUnitName, setNewUnitName] = useState("");
  const [dimMasterError, setDimMasterError] = useState("");
  const [unitMasterError, setUnitMasterError] = useState("");
  const [customOptionsByFieldKey, setCustomOptionsByFieldKey] = useState({});
  const [customOptionsLoading, setCustomOptionsLoading] = useState(false);
  const [removingCustomOptionIds, setRemovingCustomOptionIds] = useState({});

  // ── INIT DATA ─────────────────────────────────────────────────────────────
  useEffect(() => {
    Promise.all([getServiceCategories(), getServiceTypes()])
      .then(([cats, types]) => {
        setCategories(cats);
        setServiceTypes(types);
      })
      .catch(err => {
        showError(extractApiErrorMessage(err) || "Failed to load product types");
      })
      .finally(() => setLoadingData(false));
  }, []);

  useEffect(() => {
    Promise.all([getDimensionMasters(), getUnitMasters()])
      .then(([dims, units]) => {
        setDimensionMasters(dims);
        setUnitMasters(units);
      })
      .catch(() => {});
  }, []);

  const PRODUCT_CATEGORIES = useMemo(() => {
    return categories.map(cat => {
      const parents = serviceTypes
        .filter(t => t.categoryId === cat.id && !t.parentId)
        .map(p => {
          const subtypes = serviceTypes
            .filter(st => st.parentId === p.id)
            .map(st => ({ id: st.id, name: st.name, count: "" }));
          return { id: p.id, name: p.name, count: "", subtypes };
        });
      return { id: cat.id, name: cat.name, parents };
    });
  }, [categories, serviceTypes]);

  // ── FLAT PRODUCT LIST ─────────────────────────────────────────────────────
  const flatProducts = useMemo(() => {
    const flat = [];
    PRODUCT_CATEGORIES.forEach((category) => {
      category.parents.forEach((parent) => {
        flat.push({ categoryId: category.id, categoryName: category.name, id: parent.id, name: parent.name, type: "parent", count: parent.count });
        parent.subtypes?.forEach((subtype) => {
          flat.push({ categoryId: category.id, categoryName: category.name, parentId: parent.id, parentName: parent.name, id: subtype.id, name: subtype.name, type: "subtype", count: subtype.count });
        });
      });
    });
    return flat;
  }, [PRODUCT_CATEGORIES]);

  // Handle caching and fetching fields
  const fetchFields = async (productId, force = false) => {
    if (!productId) return;
    if (!force && fetchedFieldsCache.current[productId] !== undefined) {
      setFields(fetchedFieldsCache.current[productId]);
      return;
    }
    setLoadingProduct(true);
    try {
      const data = await getFieldsByServiceType(productId);
      const mapped = data.map(f => {
        const dependency = getDependencyData(f);
        return ({
        id: f.id,
        key: f.fieldKey,
        label: f.label,
        type: f.fieldType,
        options: f.options || [],
        required: f.isRequired,
        placeholder: f.placeholder || "",
        hidden: f.isHidden,
        order: f.displayOrder,
        allowCustom: f.allowCustom || false,
        hasUnit: f.hasUnit || false,
        unitOptions: f.unitOptions || [],
        defaultUnit: f.defaultUnit || "",
        ...getCustomSizeConfigForField(f.fieldKey, f, dimensionMasters),
        dependsOn: dependency.dependsOn,
        dependsOnValue: dependency.dependsOnValue,
      });
      });
      fetchedFieldsCache.current[productId] = mapped;
      if (selectedProductId === productId) {
        setFields(mapped);
      }
    } catch (err) {
      showError(extractApiErrorMessage(err) || "Failed to load fields");
    } finally {
      if (selectedProductId === productId) {
        setLoadingProduct(false);
      }
    }
  };

  useEffect(() => {
    if (selectedProductId) {
      fetchFields(selectedProductId);
    } else {
      setFields([]);
    }
  }, [selectedProductId]);

  const filteredProducts = useMemo(() => {
    if (!searchText.trim()) return flatProducts;
    const lower = searchText.toLowerCase();
    return flatProducts.filter((p) => p.name.toLowerCase().includes(lower) || p.parentName?.toLowerCase().includes(lower) || p.categoryName.toLowerCase().includes(lower));
  }, [flatProducts, searchText]);

  const selectedProduct = flatProducts.find((p) => p.id === selectedProductId);
  const selectedServiceType = useMemo(
    () => serviceTypes.find((type) => String(type.id) === String(selectedProductId)),
    [serviceTypes, selectedProductId]
  );
  const customOptionScope = useMemo(() => {
    if (!selectedServiceType) return { typeId: null, subtypeId: null };
    if (selectedServiceType.parentId) {
      return {
        typeId: Number(selectedServiceType.parentId),
        subtypeId: Number(selectedServiceType.id),
      };
    }
    return {
      typeId: Number(selectedServiceType.id),
      subtypeId: null,
    };
  }, [selectedServiceType]);
  const breadcrumb = selectedProduct
    ? `${selectedProduct.categoryName} › ${selectedProduct.parentName ? selectedProduct.parentName + " › " + selectedProduct.name : selectedProduct.name}`
    : "";

  const isParentType = useMemo(() => {
    if (!selectedProductId) return false;
    return PRODUCT_CATEGORIES.flatMap((cat) => cat.parents).some((p) => p.id === selectedProductId && p.subtypes?.length > 0);
  }, [selectedProductId, PRODUCT_CATEGORIES]);

  // ── Already-added keys ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!customOptionScope.typeId || !fields.length || isParentType) {
      setCustomOptionsByFieldKey({});
      setCustomOptionsLoading(false);
      return;
    }

    const selectFields = fields.filter((field) => field.type === "select" && !field.hidden);
    if (!selectFields.length) {
      setCustomOptionsByFieldKey({});
      setCustomOptionsLoading(false);
      return;
    }

    let cancelled = false;
    setCustomOptionsLoading(true);
    Promise.all(
      selectFields.map((field) =>
        getCustomOptions(customOptionScope.typeId, customOptionScope.subtypeId, field.key)
          .then((options) => [field.key, Array.isArray(options) ? options : []])
          .catch(() => [field.key, []])
      )
    )
      .then((pairs) => {
        if (cancelled) return;
        setCustomOptionsByFieldKey(Object.fromEntries(pairs));
      })
      .finally(() => {
        if (!cancelled) setCustomOptionsLoading(false);
      });

    return () => { cancelled = true; };
  }, [fields, customOptionScope.typeId, customOptionScope.subtypeId, isParentType]);

  const alreadyAddedKeys = useMemo(() => new Set(fields.map((f) => f.key)), [fields]);

  // ── Filtered library ────────────────────────────────────────────────────────
  const filteredLibrary = useMemo(() => {
    return FIELD_LIBRARY.filter((f) => {
      const matchSearch = !libSearch.trim() || f.label.toLowerCase().includes(libSearch.toLowerCase()) || f.key.toLowerCase().includes(libSearch.toLowerCase());
      const matchType = libTypeFilter === "all" || f.type === libTypeFilter;
      return matchSearch && matchType;
    });
  }, [libSearch, libTypeFilter]);

  // ── Open Add Fields modal ───────────────────────────────────────────────────
  const openAddFields = () => {
    setAddFieldsStep(1);
    setAddFieldsTab("library");
    setSelectedLibraryKeys([]);
    setLibSearch("");
    setLibTypeFilter("all");
    setReviewFields([]);
    setNewFieldForm({ label: "", key: "", type: "text", options: [], placeholder: "", required: false, hidden: false, allowCustom: false, dependsOn: "", dependsOnValue: "", hasDependency: false, customDimensions: [], customDimensionUnit: "mm", customSizeMode: null, hasUnit: false, unitOptions: [], defaultUnit: "" });
    setCopyProductCategoryId("");
    setCopyParentProductId("");
    setCopyProductId("");
    setCopyProductFields([]);
    setSelectedCopyKeys([]);
    setShowAddFieldsModal(true);
  };

  const closeAddFields = () => setShowAddFieldsModal(false);

  // ── Library: toggle / select-all ───────────────────────────────────────────
  const toggleLibraryField = (key) => {
    setSelectedLibraryKeys((prev) => prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]);
  };

  const selectableInView = filteredLibrary.filter((f) => !alreadyAddedKeys.has(f.key));
  const allSelected = selectableInView.length > 0 && selectableInView.every((f) => selectedLibraryKeys.includes(f.key));

  const handleSelectAll = (checked) => {
    if (checked) {
      const eligible = selectableInView.map((f) => f.key);
      // merge with any already selected outside the current filter
      setSelectedLibraryKeys((prev) => [...new Set([...prev, ...eligible])]);
    } else {
      const inViewKeys = new Set(selectableInView.map((f) => f.key));
      setSelectedLibraryKeys((prev) => prev.filter((k) => !inViewKeys.has(k)));
    }
  };

  // ── Copy from Product: fetch fields when product changes ────────────────────
  useEffect(() => {
    if (!copyProductId) {
      setCopyProductFields([]);
      setSelectedCopyKeys([]);
      return;
    }
    let cancelled = false;
    const fetchCopyFields = async () => {
      setCopyProductLoading(true);
      try {
        const data = await getFieldsByServiceType(copyProductId);
        if (cancelled) return;
        const mapped = data.map(f => {
          const dependency = getDependencyData(f);
          return {
            id: f.id,
            key: f.fieldKey,
            label: f.label,
            type: f.fieldType,
            options: f.options || [],
            required: f.isRequired,
            placeholder: f.placeholder || "",
            hidden: f.isHidden,
            allowCustom: f.allowCustom || false,
            hasUnit: f.hasUnit || false,
            unitOptions: f.unitOptions || [],
            defaultUnit: f.defaultUnit || "",
            ...getCustomSizeConfigForField(f.fieldKey, f, dimensionMasters),
            dependsOn: dependency.dependsOn,
            dependsOnValue: dependency.dependsOnValue,
            hasDependency: dependency.hasDependency,
          };
        });
        setCopyProductFields(mapped);
        setSelectedCopyKeys([]);
      } catch (err) {
        if (!cancelled) showError(extractApiErrorMessage(err) || "Failed to load fields from product");
      } finally {
        if (!cancelled) setCopyProductLoading(false);
      }
    };
    fetchCopyFields();
    return () => { cancelled = true; };
  }, [copyProductId]);

  // ── Parent products for selected copy category ──────────────────────────────
  const copyParentOptions = useMemo(() => {
    if (!copyProductCategoryId) return [];
    return flatProducts.filter(p =>
      String(p.categoryId) === String(copyProductCategoryId) && p.type === "parent"
    );
  }, [copyProductCategoryId, flatProducts]);

  // ── Subtypes for selected copy parent ───────────────────────────────────────
  const copySubtypeOptions = useMemo(() => {
    if (!copyParentProductId) return [];
    return flatProducts.filter(p => p.parentId === Number(copyParentProductId) || String(p.parentId) === String(copyParentProductId));
  }, [copyParentProductId, flatProducts]);

  // ── Does the selected copy parent have subtypes? ────────────────────────────
  const copyParentHasSubtypes = copySubtypeOptions.length > 0;

  // ── Proceed to step 2: build reviewFields ──────────────────────────────────
  const handleProceedToReview = () => {
    const picked = FIELD_LIBRARY
      .filter((f) => selectedLibraryKeys.includes(f.key))
      .map((f) => ({
        key: f.key,
        label: f.label,
        libraryType: f.type,
        type: f.type,
        options: f.options ? [...f.options] : [],
        placeholder: f.placeholder || "",
        required: false,
        hidden: false,
        hasUnit: false,
        unitOptions: [],
        defaultUnit: "",
        ...getCustomSizeConfigForField(f.key, { customDimensions: DEFAULT_SIZE_DIMENSIONS, customDimensionUnit: "mm" }, dimensionMasters),
        dependsOn: null,
        dependsOnValue: null,
        hasDependency: false,
      }));
    setReviewFields(picked);
    setAddFieldsStep(2);
  };

  // ── Proceed to copy review ──────────────────────────────────────────────────
  const handleProceedToCopyReview = () => {
    const picked = copyProductFields
      .filter(f => selectedCopyKeys.includes(f.key))
      .map(f => ({
        key: f.key,
        label: f.label,
        libraryType: f.type,
        type: f.type,
        options: f.options ? [...f.options] : [],
        placeholder: f.placeholder || "",
        required: f.required || false,
        hidden: f.hidden || false,
        hasUnit: f.hasUnit || false,
        unitOptions: f.unitOptions || [],
        defaultUnit: f.defaultUnit || "",
        ...getCustomSizeConfigForField(f.key, f, dimensionMasters),
        dependsOn: f.dependsOn || null,
        dependsOnValue: f.dependsOnValue || null,
        hasDependency: f.hasDependency || false,
      }));
    setReviewFields(picked);
    setAddFieldsStep(2);
  };

  // ── Update one review field ─────────────────────────────────────────────────
  const updateReviewField = (key, patch) => {
    setReviewFields((prev) => prev.map((f) => f.key === key ? { ...f, ...patch } : f));
  };

  // ── Confirm & add ───────────────────────────────────────────────────────────
  const handleConfirmLibraryFields = async () => {
      const toCreate = reviewFields.map(f => ({
      label: f.label,
      fieldKey: f.key,
      fieldType: f.type,
      options: f.type === "select" ? f.options : [],
      isRequired: f.required,
      placeholder: f.placeholder,
      allowCustom: f.allowCustom || false,
      hasUnit: f.hasUnit || false,
      unitOptions: f.unitOptions || [],
      defaultUnit: f.defaultUnit || "",
      isHidden: f.hidden,
      ...buildCustomSizePayload(f.key, f, dimensionMasters),
      ...buildDependencyPayload(f),
    }));
    try {
      for (const payload of toCreate) {
        await createProductField(selectedProductId, payload);
      }
      showSuccess(`${toCreate.length} field${toCreate.length !== 1 ? "s" : ""} added`);
      fetchFields(selectedProductId, true);
      closeAddFields();
    } catch (err) {
      showError(extractApiErrorMessage(err) || "Failed to add some fields");
    }
  };

  // ── Create new field ────────────────────────────────────────────────────────
  const handleCreateField = async () => {
    if (!newFieldForm.label.trim()) { showError("Label is required"); return; }
    if (!newFieldForm.key.trim()) { showError("Field key is required"); return; }
    if (newFieldForm.type === "select" && newFieldForm.options.length === 0) { showError("At least one option is required for select fields"); return; }
    if (alreadyAddedKeys.has(newFieldForm.key)) { showError("A field with this key already exists on this product"); return; }

    const payload = {
      label: newFieldForm.label,
      fieldKey: newFieldForm.key,
      fieldType: newFieldForm.type,
      options: newFieldForm.options,
      isRequired: newFieldForm.required,
      placeholder: newFieldForm.placeholder,
      allowCustom: newFieldForm.allowCustom,
      hasUnit: newFieldForm.hasUnit || false,
      unitOptions: getPayloadUnitOptions(newFieldForm),
      defaultUnit: newFieldForm.hasUnit ? (newFieldForm.defaultUnit || null) : null,
      isHidden: newFieldForm.hidden,
      ...buildCustomSizePayload(newFieldForm.key, newFieldForm, dimensionMasters),
      ...buildDependencyPayload(newFieldForm),
    };

    try {
      await createProductField(selectedProductId, payload);
      showSuccess("Field created and added");
      fetchFields(selectedProductId, true);
      closeAddFields();
    } catch (err) {
      showError(extractApiErrorMessage(err) || "Failed to create field");
    }
  };

  // ── Reorder ─────────────────────────────────────────────────────────────────
  const moveField = async (index, direction) => {
    const next = [...fields];
    const swap = index + direction;
    if (swap < 0 || swap >= next.length) return;
    
    const prevFields = [...fields];
    [next[index], next[swap]] = [next[swap], next[index]];
    
    const reordered = next.map((f, i) => ({ ...f, order: i + 1 }));
    setFields(reordered);
    
    const orderedIds = reordered.map(f => f.id);
    try {
      await reorderProductFields(selectedProductId, orderedIds);
      fetchedFieldsCache.current[selectedProductId] = reordered;
    } catch (err) {
      setFields(prevFields);
      showError(extractApiErrorMessage(err) || "Failed to reorder fields");
    }
  };

  // ── Edit ────────────────────────────────────────────────────────────────────
  const openEditField = (field) => {
    setEditFieldForm({
      ...field,
      options: Array.isArray(field.options) ? [...field.options] : [],
      unitOptions: Array.isArray(field.unitOptions) ? [...field.unitOptions] : [],
      ...getDependencyData(field),
    });
    setEditingFieldId(field.id);
    setShowEditModal(true);
  };

  const handleUpdateField = async () => {
    if (!editFieldForm.label.trim()) { showError("Label is required"); return; }
    if (editFieldForm.type === "select" && (!editFieldForm.options || editFieldForm.options.length === 0)) { showError("At least one option is required for select fields"); return; }
    
    const payload = {
      label: editFieldForm.label,
      fieldType: editFieldForm.type,
      options: editFieldForm.options,
      isRequired: editFieldForm.required,
      placeholder: editFieldForm.placeholder,
      allowCustom: editFieldForm.allowCustom || false,
      hasUnit: editFieldForm.hasUnit || false,
      unitOptions: getPayloadUnitOptions(editFieldForm),
      defaultUnit: editFieldForm.hasUnit ? (editFieldForm.defaultUnit || null) : null,
      isHidden: editFieldForm.hidden,
      ...buildCustomSizePayload(editFieldForm.key, editFieldForm, dimensionMasters),
      ...buildDependencyPayload(editFieldForm),
    };
    
    try {
      await updateProductField(selectedProductId, editingFieldId, payload);
      showSuccess("Field updated");
      fetchFields(selectedProductId, true);
      setShowEditModal(false);
      setEditFieldForm(null);
    } catch (err) {
      showError(extractApiErrorMessage(err) || "Failed to update field");
    }
  };

  // ── Delete ──────────────────────────────────────────────────────────────────
  const handleDeleteField = (field) => {
    showConfirm({
      title: "Delete Field",
      message: `Are you sure you want to delete "${field.label}"? This removes it from ${selectedProduct?.name} only.`,
      onConfirm: async () => {
        try {
          await deleteProductField(selectedProductId, field.id);
          setFields((prev) => prev.filter((f) => f.id !== field.id));
          fetchedFieldsCache.current[selectedProductId] = fetchedFieldsCache.current[selectedProductId].filter(f => f.id !== field.id);
          showSuccess("Field deleted");
        } catch (err) {
          showError(extractApiErrorMessage(err) || "Failed to delete field");
        }
      },
    });
  };

  const handleDeleteImportedCustomOption = (fieldKey, option) => {
    if (!option?.id) return;
    showConfirm({
      title: "Remove Imported Value",
      message: `Remove "${option.valueRaw}" from imported custom values for ${fieldKey}?`,
      onConfirm: async () => {
        try {
          setRemovingCustomOptionIds((prev) => ({ ...prev, [option.id]: true }));
          await deleteCustomOption(option.id);
          setCustomOptionsByFieldKey((prev) => ({
            ...prev,
            [fieldKey]: (prev[fieldKey] || []).filter((item) => item.id !== option.id),
          }));
          showSuccess("Imported custom value removed");
        } catch (err) {
          showError(extractApiErrorMessage(err) || "Failed to remove imported custom value");
        } finally {
          setRemovingCustomOptionIds((prev) => {
            const next = { ...prev };
            delete next[option.id];
            return next;
          });
        }
      },
    });
  };

  const handleAddDimension = async () => {
    const name = newDimName.trim();
    if (!name) return;
    try {
      const added = await addDimensionMaster(name);
      setDimensionMasters((prev) => [...prev, added]);
      setNewDimName("");
      setDimMasterError("");
    } catch (e) {
      setDimMasterError(extractApiErrorMessage(e) || "Already exists or invalid");
    }
  };

  const handleDeleteDimension = async (id) => {
    try {
      await deleteDimensionMaster(id);
      setDimensionMasters((prev) => prev.filter((d) => d.id !== id));
    } catch (e) {
      setDimMasterError(extractApiErrorMessage(e) || "Failed to delete");
    }
  };

  const handleAddUnit = async () => {
    const name = newUnitName.trim();
    if (!name) return;
    try {
      const added = await addUnitMaster(name);
      setUnitMasters((prev) => [...prev, added]);
      setNewUnitName("");
      setUnitMasterError("");
    } catch (e) {
      setUnitMasterError(extractApiErrorMessage(e) || "Already exists or invalid");
    }
  };

  const handleDeleteUnit = async (id) => {
    try {
      await deleteUnitMaster(id);
      setUnitMasters((prev) => prev.filter((u) => u.id !== id));
    } catch (e) {
      setUnitMasterError(extractApiErrorMessage(e) || "Failed to delete");
    }
  };

  // ─── RENDER ─────────────────────────────────────────────────────────────────
  return (
    <div className="container-fluid content">
      {/* Header Block */}
      <div className="card border-0 shadow-sm p-4 mb-4 bg-white" style={{ borderRadius: 12 }}>
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
          <div>
            <h2 className="leads-header-title mb-1" style={{ fontSize: "1.4rem", fontWeight: "700", color: "#0f172a" }}>Product Field Configuration</h2>
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb mb-0" style={{ fontSize: "0.85rem" }}>
                <li className="breadcrumb-item">
                  <Link to="/admin-dashboard" className="text-decoration-none text-muted">
                    <i className="ti ti-smart-home" />
                  </Link>
                </li>
                <li className="breadcrumb-item text-muted">Configuration</li>
                <li className="breadcrumb-item active text-primary" aria-current="page">
                  Product Fields
                </li>
              </ol>
            </nav>
          </div>
        </div>
      </div>

      <div className="product-field-config-container">

        {/* ══════════════════════════════════════════════════════
            LEFT PANEL — product tree
        ══════════════════════════════════════════════════════ */}
        <div className="pfc-left-panel">
          <div className="pfc-search-box">
            <i className="ti ti-search" />
            <input
              type="text"
              placeholder="Search product types..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="pfc-search-input"
            />
          </div>

          <div className="pfc-product-tree">
            {PRODUCT_CATEGORIES.map((category) => {
              const isExpanded = expandedCategories[category.id];
              const categoryProducts = filteredProducts.filter((p) => p.categoryId === category.id);
              if (searchText.trim() && categoryProducts.length === 0) return null;

              return (
                <div key={category.id} className="pfc-category-section">
                  <div className="pfc-category-header" onClick={() => setExpandedCategories((p) => ({ ...p, [category.id]: !p[category.id] }))}>
                    <i className={`ti ti-chevron-right ${isExpanded ? "expanded" : ""}`} />
                    <span>{category.name}</span>
                    <span className="pfc-badge pfc-badge-count">{category.parents.length}</span>
                  </div>

                  {isExpanded && (
                    <div className="pfc-category-items">
                      {category.parents.map((parent) => {
                        const parentProduct = filteredProducts.find((p) => p.id === parent.id && p.type === "parent");
                        if (searchText.trim() && !parentProduct) return null;

                        const hasSubtypes = parent.subtypes?.length > 0;
                        const isParentExpanded = hasSubtypes && expandedParents[parent.id];
                        const visibleSubtypes = filteredProducts.filter((p) => p.parentId === parent.id);

                        return (
                          <Fragment key={parent.id}>
                            <div
                              className={`pfc-product-item pfc-product-parent ${selectedProductId === parent.id ? "selected" : ""}`}
                              onClick={() => hasSubtypes ? setExpandedParents((p) => ({ ...p, [parent.id]: !p[parent.id] })) : setSelectedProductId(parent.id)}
                            >
                              {hasSubtypes ? <i className={`ti ti-chevron-right ${isParentExpanded ? "expanded" : ""}`} /> : <span className="pfc-no-expand" />}
                              <i className="ti ti-box" />
                              <span>{parent.name}</span>
                              <span className="pfc-badge pfc-badge-field-count">{parent.count}</span>
                            </div>

                            {isParentExpanded && visibleSubtypes.map((subtype) => (
                              <div
                                key={subtype.id}
                                className={`pfc-product-item pfc-product-subtype ${selectedProductId === subtype.id ? "selected" : ""}`}
                                onClick={() => setSelectedProductId(subtype.id)}
                              >
                                <span className="pfc-no-expand" />
                                <i className="ti ti-arrow-narrow-right" />
                                <span>{subtype.name}</span>
                                <span className="pfc-badge pfc-badge-field-count">{subtype.count}</span>
                              </div>
                            ))}
                          </Fragment>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════
            RIGHT PANEL — field management
        ══════════════════════════════════════════════════════ */}
        <div className="pfc-right-panel">
          {!selectedProductId ? (
            <div className="pfc-empty-state">
              <i className="ti ti-layout-list" />
              <h3>Select a product type</h3>
              <p>Choose a product from the left panel to view and manage its fields.</p>
            </div>

          ) : isParentType ? (
            <div className="pfc-parent-type-state">
              <div className="pfc-state-header" style={{ width: "100%" }}>
                <div>
                  <div className="pfc-breadcrumb">{breadcrumb}</div>
                  <div className="pfc-field-count">Parent Type</div>
                </div>
              </div>
              <div className="pfc-empty-content">
                <i className="ti ti-folder-open" />
                <p>This is a parent type with subtypes.</p>
                <p className="text-muted" style={{ fontSize: 13 }}>Configure fields directly on the subtypes instead.</p>
                <div style={{ marginTop: 20, paddingTop: 20, borderTop: "1px solid #e9ecef" }}>
                  <p style={{ fontSize: 12, color: "#666", marginBottom: 12 }}>Available subtypes:</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {PRODUCT_CATEGORIES.flatMap((cat) => cat.parents.find((p) => p.id === selectedProductId)?.subtypes || []).map((subtype) => (
                      <button key={subtype.id} className="btn btn-sm btn-outline-primary" onClick={() => setSelectedProductId(subtype.id)} style={{ justifyContent: "flex-start" }}>
                        <i className="ti ti-arrow-narrow-right me-2" />{subtype.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

          ) : loadingProduct ? (
            <div className="pfc-loading-state">
              <div className="spinner-border" role="status"><span className="sr-only">Loading...</span></div>
            </div>

          ) : fields.length === 0 ? (
            <div className="pfc-no-fields-state">
              <div className="pfc-state-header">
                <div>
                  <div className="pfc-breadcrumb">{breadcrumb}</div>
                  <div className="pfc-field-count">0 fields</div>
                </div>
                <button className="btn btn-sm btn-primary" onClick={openAddFields}>
                  <i className="ti ti-plus me-1" /> Add Fields
                </button>
              </div>
              <div className="pfc-empty-content">
                <i className="ti ti-database-off" />
                <p>No fields configured yet.</p>
                <button className="btn btn-outline-primary btn-sm" onClick={openAddFields}>+ Add your first fields</button>
              </div>
            </div>

          ) : (
            <div className="pfc-fields-view">
              <div className="pfc-state-header">
                <div>
                  <div className="pfc-breadcrumb">{breadcrumb}</div>
                  <div className="pfc-field-count">{fields.length} field{fields.length !== 1 ? "s" : ""}</div>
                </div>
                <button className="btn btn-sm btn-primary" onClick={openAddFields}>
                  <i className="ti ti-plus me-1" /> Add Fields
                </button>
              </div>

              <div className="pfc-fields-table-wrapper">
                <table className="table pfc-fields-table">
                  <thead>
                    <tr>
                      <th style={{ width: 80 }}>Order</th>
                      <th>Label</th>
                      <th>Key</th>
                      <th style={{ width: 90 }}>Type</th>
                      <th style={{ width: 120 }}>Requirement</th>
                      <th>Options</th>
                      <th>Condition</th>
                      <th style={{ width: 80 }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fields.map((field, index) => (
                      <tr key={field.id}>
                        {/* Order ↑ ↓ */}
                        <td>
                          <div className="pfc-field-order">
                            <button className="btn btn-link btn-sm" disabled={index === 0} onClick={() => moveField(index, -1)} title="Move up">↑</button>
                            <span style={{ fontSize: 12, color: "#888", minWidth: 16, textAlign: "center" }}>{index + 1}</span>
                            <button className="btn btn-link btn-sm" disabled={index === fields.length - 1} onClick={() => moveField(index, 1)} title="Move down">↓</button>
                          </div>
                        </td>

                        <td className="pfc-field-label">{field.label}</td>
                        <td className="pfc-field-key">{field.key}</td>

                        {/* Type badge */}
                        <td>
                          <span className="badge" style={TYPE_BADGE_STYLE[field.type] || TYPE_BADGE_STYLE.text}>
                            {field.type}
                          </span>
                        </td>

                        <td>
                          {field.required ? (
                            <span className="badge bg-danger-subtle text-danger border border-danger-subtle">
                              Compulsory
                            </span>
                          ) : (
                            <span className="badge bg-secondary-subtle text-secondary border border-secondary-subtle">
                              Optional
                            </span>
                          )}
                        </td>

                        {/* Option pills */}
                        <td className="pfc-field-options">
                          <OptionPills options={field.options} max={3} />
                        </td>

                        {/* Condition badge */}
                        <td>
                          {getDependencyData(field).hasDependency ? (() => {
                            const dependency = getDependencyData(field);
                            const parentExists = fields.some((f) => f.key === dependency.dependsOn);
                            const parentField = fields.find((f) => f.key === dependency.dependsOn);
                            if (!parentExists) {
                              return (
                                <span style={{ fontSize: 11, padding: "3px 7px", borderRadius: 3, background: "#fff3cd", color: "#856404", fontWeight: 500 }}>
                                  ⚠️ {dependency.dependsOn} (missing)
                                </span>
                              );
                            }
                            return (
                              <span style={{ fontSize: 11, padding: "3px 7px", borderRadius: 3, background: "#f0f0f5", color: "#555", fontWeight: 500 }}>
                                {parentField?.label} = "{dependency.dependsOnValue}"
                              </span>
                            );
                          })() : <span className="text-muted">—</span>}
                        </td>

                        {/* Actions */}
                        <td>
                          <div style={{ display: "flex", gap: 4 }}>
                            <button
                              className="btn btn-sm"
                              style={{ background: "#6f65d6", color: "#fff", width: 30, height: 30, padding: 0, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 4 }}
                              onClick={() => openEditField(field)} title="Edit"
                            >
                              <i className="ti ti-pencil" style={{ fontSize: 13 }} />
                            </button>
                            <button
                              className="btn btn-sm"
                              style={{ background: "#e74c3c", color: "#fff", width: 30, height: 30, padding: 0, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 4 }}
                              onClick={() => handleDeleteField(field)} title="Delete"
                            >
                              <i className="ti ti-trash" style={{ fontSize: 13 }} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          ADD FIELDS MODAL
      ══════════════════════════════════════════════════════════════════════ */}
      {showAddFieldsModal && (
        <div className="modal fade show pfc-modal" style={{ display: "block" }} tabIndex="-1">
          <div className="modal-dialog modal-lg">
            <div className="modal-content">

              {/* Header */}
              <div className="modal-header">
                <h5 className="modal-title">
                  {addFieldsStep === 1
                    ? <>Add Fields › {selectedProduct?.name}</>
                    : <>
                        Review Selected Fields&nbsp;
                        <span className="badge bg-secondary">{reviewFields.length}</span>
                      </>
                  }
                </h5>
                <button type="button" className="btn-close" onClick={closeAddFields}>×</button>
              </div>

              {/* Body */}
              <div className="modal-body">

                {/* ── STEP 1 ────────────────────────────────────────────────── */}
                {addFieldsStep === 1 && (
                  <>
                    {/* Tabs */}
                    <div className="nav nav-tabs mb-3">
                      <button className={`nav-link ${addFieldsTab === "library" ? "active" : ""}`} onClick={() => setAddFieldsTab("library")}>
                        <i className="ti ti-books me-2" />Pick from Library
                      </button>
                      <button className={`nav-link ${addFieldsTab === "create" ? "active" : ""}`} onClick={() => setAddFieldsTab("create")}>
                        <i className="ti ti-plus me-2" />Create New Field
                      </button>
                      <button className={`nav-link ${addFieldsTab === "copy" ? "active" : ""}`} onClick={() => setAddFieldsTab("copy")}>
                        <i className="ti ti-copy me-2" />Copy from Product
                      </button>
                    </div>

                    {/* ── LIBRARY TAB ─────────────────────────────────────── */}
                    {addFieldsTab === "library" && (
                      <div className="pfc-library-tab">
                        {/* Search + type filter */}
                        <div className="pfc-library-controls mb-3">
                          <div className="input-group">
                            <span className="input-group-text"><i className="ti ti-search" /></span>
                            <input
                              type="text"
                              className="form-control"
                              placeholder="Search library..."
                              value={libSearch}
                              onChange={(e) => setLibSearch(e.target.value)}
                            />
                            <select
                              className="form-select"
                              style={{ maxWidth: 150 }}
                              value={libTypeFilter}
                              onChange={(e) => setLibTypeFilter(e.target.value)}
                            >
                              <option value="all">All Types</option>
                              <option value="text">Text</option>
                              <option value="number">Number</option>
                              <option value="select">Select</option>
                            </select>
                          </div>
                        </div>

                        {/* Select all row */}
                        <div className="pfc-library-header">
                          <div className="ps-3">
                            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", margin: 0 }}>
                              <input
                                type="checkbox"
                                className="form-check-input"
                                checked={allSelected}
                                onChange={(e) => handleSelectAll(e.target.checked)}
                              />
                              Select All
                            </label>
                          </div>
                          <span className="ms-auto text-muted" style={{ fontSize: 12 }}>
                            {selectedLibraryKeys.length > 0 && (
                              <strong style={{ color: "#007bff" }}>{selectedLibraryKeys.length} selected · </strong>
                            )}
                            {filteredLibrary.length} field{filteredLibrary.length !== 1 ? "s" : ""}
                            {alreadyAddedKeys.size > 0 && ` · ${alreadyAddedKeys.size} already added`}
                          </span>
                        </div>

                        {/* Library list */}
                        <div className="pfc-library-list">
                          {filteredLibrary.length === 0 ? (
                            <div style={{ padding: 24, textAlign: "center", color: "#999", fontSize: 13 }}>
                              No fields match your search.
                            </div>
                          ) : filteredLibrary.map((field) => {
                            const isAdded = alreadyAddedKeys.has(field.key);
                            const isSelected = selectedLibraryKeys.includes(field.key);
                            return (
                              <div
                                key={field.key}
                                className={`pfc-library-item ${isAdded ? "already-added" : ""}`}
                                onClick={() => !isAdded && toggleLibraryField(field.key)}
                                style={{ cursor: isAdded ? "not-allowed" : "pointer" }}
                              >
                                <input
                                  type="checkbox"
                                  className="form-check-input"
                                  disabled={isAdded}
                                  checked={isSelected || isAdded}
                                  onChange={() => !isAdded && toggleLibraryField(field.key)}
                                  onClick={(e) => e.stopPropagation()}
                                />
                                <div className="pfc-library-item-info">
                                  <span className="pfc-library-item-label">{field.label}</span>
                                  <span className="badge" style={TYPE_BADGE_STYLE[field.type]}>{field.type}</span>
                                </div>
                                {field.type === "select" && field.options && (
                                  <span className="pfc-library-item-options">
                                    {field.options.slice(0, 3).join(", ")}{field.options.length > 3 ? "..." : ""}
                                  </span>
                                )}
                                {isAdded
                                  ? <span className="badge bg-success ms-auto">✓ Added</span>
                                  : isSelected && <span className="badge ms-auto" style={{ background: "#e8f4fd", color: "#1a6fa8" }}>✓ Selected</span>
                                }
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* ── COPY FROM PRODUCT TAB ────────────────────────── */}
                    {addFieldsTab === "copy" && (
                      <div className="pfc-copy-tab">
                        <div className="row g-3 mb-3">
                          <div className={copyParentHasSubtypes ? "col-md-4" : "col-md-6"}>
                            <label className="form-label">Category</label>
                            <select
                              className="form-select"
                              value={copyProductCategoryId}
                              onChange={(e) => {
                                setCopyProductCategoryId(e.target.value);
                                setCopyParentProductId("");
                                setCopyProductId("");
                                setCopyProductFields([]);
                                setSelectedCopyKeys([]);
                              }}
                            >
                              <option value="">Select a category...</option>
                              {categories.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                              ))}
                            </select>
                          </div>
                          <div className={copyParentHasSubtypes ? "col-md-4" : "col-md-6"}>
                            <label className="form-label">Product</label>
                            <select
                              className="form-select"
                              value={copyParentProductId}
                              onChange={(e) => {
                                const parentId = e.target.value;
                                setCopyParentProductId(parentId);
                                // If this parent has no subtypes, use it directly as the copy source
                                const hasSubtypes = parentId ? flatProducts.some(p => p.parentId === Number(parentId) || String(p.parentId) === String(parentId)) : false;
                                if (!hasSubtypes && parentId) {
                                  // Skip if it's the currently selected product
                                  setCopyProductId(String(parentId) === String(selectedProductId) ? "" : parentId);
                                } else {
                                  setCopyProductId("");
                                }
                                setCopyProductFields([]);
                                setSelectedCopyKeys([]);
                              }}
                              disabled={!copyProductCategoryId}
                            >
                              <option value="">Select a product...</option>
                              {copyParentOptions.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                              ))}
                            </select>
                          </div>
                          {copyParentHasSubtypes && (
                            <div className="col-md-4">
                              <label className="form-label">Sub-product</label>
                              <select
                                className="form-select"
                                value={copyProductId}
                                onChange={(e) => {
                                  setCopyProductId(e.target.value);
                                  setCopyProductFields([]);
                                  setSelectedCopyKeys([]);
                                }}
                              >
                                <option value="">Select a sub-product...</option>
                                {copySubtypeOptions
                                  .filter(p => p.id !== selectedProductId)
                                  .map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                  ))}
                              </select>
                            </div>
                          )}
                        </div>

                        {copyProductLoading ? (
                          <div style={{ padding: 32, textAlign: "center" }}>
                            <div className="spinner-border spinner-border-sm" role="status" />
                            <span className="ms-2 text-muted" style={{ fontSize: 13 }}>Loading fields...</span>
                          </div>
                        ) : copyProductId && copyProductFields.length === 0 ? (
                          <div style={{ padding: 32, textAlign: "center", color: "#999", fontSize: 13 }}>
                            No fields configured on this product.
                          </div>
                        ) : copyProductFields.length > 0 ? (
                          <>
                            <div className="pfc-library-header">
                              <div className="ps-3">
                                <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", margin: 0 }}>
                                  <input
                                    type="checkbox"
                                    className="form-check-input"
                                    checked={copyProductFields.filter(f => !alreadyAddedKeys.has(f.key)).length > 0 && copyProductFields.filter(f => !alreadyAddedKeys.has(f.key)).every(f => selectedCopyKeys.includes(f.key))}
                                    onChange={(e) => {
                                      const eligible = copyProductFields.filter(f => !alreadyAddedKeys.has(f.key)).map(f => f.key);
                                      setSelectedCopyKeys(e.target.checked ? eligible : []);
                                    }}
                                  />
                                  Select All
                                </label>
                              </div>
                              <span className="ms-auto text-muted" style={{ fontSize: 12 }}>
                                {selectedCopyKeys.length > 0 && (
                                  <strong style={{ color: "#007bff" }}>{selectedCopyKeys.length} selected · </strong>
                                )}
                                {copyProductFields.length} field{copyProductFields.length !== 1 ? "s" : ""}
                              </span>
                            </div>
                            <div className="pfc-library-list">
                              {copyProductFields.map(field => {
                                const isAdded = alreadyAddedKeys.has(field.key);
                                const isSelected = selectedCopyKeys.includes(field.key);
                                const dependency = getDependencyData(field);
                                const hasMissingParent = dependency.hasDependency && !selectedCopyKeys.includes(dependency.dependsOn) && !alreadyAddedKeys.has(dependency.dependsOn);
                                return (
                                  <div
                                    key={field.key}
                                    className={`pfc-library-item ${isAdded ? "already-added" : ""}`}
                                    onClick={() => !isAdded && setSelectedCopyKeys(prev => prev.includes(field.key) ? prev.filter(k => k !== field.key) : [...prev, field.key])}
                                    style={{ cursor: isAdded ? "not-allowed" : "pointer" }}
                                  >
                                    <input
                                      type="checkbox"
                                      className="form-check-input"
                                      disabled={isAdded}
                                      checked={isSelected || isAdded}
                                      onChange={() => !isAdded && setSelectedCopyKeys(prev => prev.includes(field.key) ? prev.filter(k => k !== field.key) : [...prev, field.key])}
                                      onClick={(e) => e.stopPropagation()}
                                    />
                                    <div className="pfc-library-item-info">
                                      <span className="pfc-library-item-label">{field.label}</span>
                                      <span className="badge" style={TYPE_BADGE_STYLE[field.type]}>{field.type}</span>
                                      {dependency.hasDependency && (
                                        <span style={{ fontSize: 11, padding: "2px 6px", borderRadius: 3, background: "#f0f0f5", color: "#666" }}>
                                          depends on: {dependency.dependsOn}
                                        </span>
                                      )}
                                    </div>
                                    {field.type === "select" && field.options && field.options.length > 0 && (
                                      <span className="pfc-library-item-options">
                                        {field.options.slice(0, 3).join(", ")}{field.options.length > 3 ? "..." : ""}
                                      </span>
                                    )}
                                    {isAdded
                                      ? <span className="badge bg-success ms-auto">✓ Added</span>
                                      : isSelected && <span className="badge ms-auto" style={{ background: "#e8f4fd", color: "#1a6fa8" }}>✓ Selected</span>
                                    }
                                    {hasMissingParent && (
                                      <span style={{ fontSize: 10, color: "#856404", background: "#fff3cd", padding: "2px 6px", borderRadius: 3, marginLeft: 4 }}>
                                        ⚠️ parent "{dependency.dependsOn}" not selected
                                      </span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </>
                        ) : !copyProductId && (
                          <div style={{ padding: 32, textAlign: "center", color: "#999", fontSize: 13 }}>
                            Select a category and product to see its fields.
                          </div>
                        )}
                      </div>
                    )}

                    {/* ── CREATE NEW TAB ──────────────────────────────────── */}
                    {addFieldsTab === "create" && (
                      <div className="pfc-create-tab">
                        <div className="mb-3">
                          <label className="form-label">Label <span className="text-danger">*</span></label>
                          <input
                            type="text"
                            className="form-control"
                            value={newFieldForm.label}
                            onChange={(e) => {
                              const label = e.target.value;
                              setNewFieldForm((p) => ({ ...p, label, key: autoGenerateKey(label) }));
                            }}
                            placeholder="e.g. Box Height"
                          />
                        </div>

                        <div className="mb-3">
                          <label className="form-label">
                            Field Key <span className="text-danger">*</span>
                            <small className="text-muted"> (auto-generated, editable)</small>
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            value={newFieldForm.key}
                            onChange={(e) => setNewFieldForm((p) => ({ ...p, key: e.target.value }))}
                          />
                        </div>

                        <div className="mb-3">
                          <label className="form-label">Field Type <span className="text-danger">*</span></label>
                          <div className="pfc-field-type-selector">
                            {["text", "number", "select"].map((t) => (
                              <label key={t} className="form-check">
                                <input
                                  type="radio"
                                  className="form-check-input"
                                  name="newFieldType"
                                  value={t}
                                  checked={newFieldForm.type === t}
                                  onChange={() => setNewFieldForm((p) => ({ ...p, type: t, options: t !== "select" ? [] : p.options }))}
                                />
                                <span className="form-check-label ms-2 text-capitalize">{t}</span>
                              </label>
                            ))}
                          </div>
                        </div>

                        {newFieldForm.type === "select" && (
                          <>
                            <div className="mb-3">
                              <label className="form-label">Options <span className="text-danger">*</span></label>
                              <OptionsEditor
                                options={newFieldForm.options}
                                onChange={(opts) => setNewFieldForm((p) => ({ ...p, options: opts }))}
                              />
                            </div>
                            <div className="mb-2">
                              <label className="form-label">
                                <input type="checkbox" className="form-check-input me-2" checked={newFieldForm.allowCustom || false} onChange={(e) => setNewFieldForm((p) => ({ ...p, allowCustom: e.target.checked }))} />
                                Allow custom value (shows + button)
                              </label>
                            </div>
                            {(newFieldForm.allowCustom && newFieldForm.key === "size") && (
                              <div className="mt-3">
                                <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                                  <label style={{ fontSize: 12, fontWeight: 600, color: "#555" }}>Custom dimension fields</label>
                                  <button
                                    type="button"
                                    className="btn btn-link btn-sm p-0"
                                    style={{ fontSize: 11 }}
                                    onClick={() => { setDimMasterError(""); setShowDimMasterModal(true); }}
                                  >
                                    + Manage
                                  </button>
                                </div>
                                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
                                  {dimensionMasters.map((dim) => (
                                    <label key={dim.id} style={{ display: "flex", alignItems: "center", gap: 4, cursor: "pointer", margin: 0 }}>
                                      <input
                                        type="checkbox"
                                        className="form-check-input"
                                        checked={(newFieldForm.customDimensions || []).includes(dim.name)}
                                        onChange={(e) => {
                                          const current = newFieldForm.customDimensions || [];
                                          const next = e.target.checked ? [...current, dim.name] : current.filter((d) => d !== dim.name);
                                          setNewFieldForm((p) => ({ ...p, customDimensions: next }));
                                        }}
                                      />
                                      <span style={{ fontSize: 13 }}>{dim.name}</span>
                                    </label>
                                  ))}
                                </div>
                                <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                                  <label className="form-label" style={{ fontSize: 12, fontWeight: 600, marginBottom: 0 }}>Unit options</label>
                                  <button
                                    type="button"
                                    className="btn btn-link btn-sm p-0"
                                    style={{ fontSize: 11 }}
                                    onClick={() => { setUnitMasterError(""); setShowUnitMasterModal(true); }}
                                  >
                                    + Manage
                                  </button>
                                </div>
                                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
                                  {unitMasters.map((unit) => {
                                    const selectedUnits = getCustomSizeUnitOptions(newFieldForm);
                                    return (
                                      <label key={unit.id} style={{ display: "flex", alignItems: "center", gap: 4, cursor: "pointer", margin: 0 }}>
                                        <input
                                          type="checkbox"
                                          className="form-check-input"
                                          checked={selectedUnits.includes(unit.name)}
                                          onChange={(e) => {
                                            const current = getCustomSizeUnitOptions(newFieldForm);
                                            const next = e.target.checked
                                              ? [...current, unit.name]
                                              : current.filter((u) => u !== unit.name);
                                            setNewFieldForm((p) => ({
                                              ...p,
                                              unitOptions: next,
                                              customDimensionUnit: next.includes(p.customDimensionUnit) ? p.customDimensionUnit : (next[0] || "mm"),
                                            }));
                                          }}
                                        />
                                        <span style={{ fontSize: 13 }}>{unit.name}</span>
                                      </label>
                                    );
                                  })}
                                </div>
                                <label className="form-label" style={{ fontSize: 12, fontWeight: 600 }}>Default unit</label>
                                <select
                                  className="form-select"
                                  style={{ fontSize: 13 }}
                                  value={newFieldForm.customDimensionUnit || "mm"}
                                  onChange={(e) => setNewFieldForm((p) => ({ ...p, customDimensionUnit: e.target.value }))}
                                >
                                  {getCustomSizeUnitOptions(newFieldForm).map((u) => <option key={u} value={u}>{u}</option>)}
                                </select>
                              </div>
                            )}
                          </>
                        )}

                        {(newFieldForm.type === "text" || newFieldForm.type === "number") && (
                          <div className="mb-3">
                            <label className="form-label">
                              <input
                                type="checkbox"
                                className="form-check-input me-2"
                                checked={newFieldForm.hasUnit || false}
                                onChange={(e) => setNewFieldForm((p) => ({ ...p, hasUnit: e.target.checked }))}
                              />
                              Has unit selector
                            </label>
                            {newFieldForm.hasUnit && (
                              <div style={{ paddingTop: 12, borderTop: "1px solid #e9ecef", marginTop: 8 }}>
                                <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                                  <label className="form-label" style={{ fontSize: 12, fontWeight: 600, marginBottom: 0 }}>
                                    Unit options
                                  </label>
                                  <button
                                    type="button"
                                    className="btn btn-link btn-sm p-0"
                                    style={{ fontSize: 11 }}
                                    onClick={() => { setUnitMasterError(""); setShowUnitMasterModal(true); }}
                                  >
                                    + Manage
                                  </button>
                                </div>
                                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
                                  {unitMasters.map((unit) => (
                                    <label key={unit.id} style={{ display: "flex", alignItems: "center", gap: 4, cursor: "pointer", margin: 0 }}>
                                      <input
                                        type="checkbox"
                                        className="form-check-input"
                                        checked={(newFieldForm.unitOptions || []).includes(unit.name)}
                                        onChange={(e) => {
                                          const current = newFieldForm.unitOptions || [];
                                          const next = e.target.checked
                                            ? [...current, unit.name]
                                            : current.filter((u) => u !== unit.name);
                                          setNewFieldForm((p) => ({
                                            ...p,
                                            unitOptions: next,
                                            defaultUnit: next.includes(p.defaultUnit) ? p.defaultUnit : "",
                                          }));
                                        }}
                                      />
                                      <span style={{ fontSize: 13 }}>{unit.name}</span>
                                    </label>
                                  ))}
                                </div>
                                <label className="form-label" style={{ fontSize: 12, fontWeight: 600 }}>Default unit</label>
                                <select
                                  className="form-select"
                                  style={{ fontSize: 13 }}
                                  value={newFieldForm.defaultUnit || ""}
                                  onChange={(e) => setNewFieldForm((p) => ({ ...p, defaultUnit: e.target.value }))}
                                >
                                  <option value="">— None —</option>
                                  {(newFieldForm.unitOptions || []).map((u) => (
                                    <option key={u} value={u}>{u}</option>
                                  ))}
                                </select>
                              </div>
                            )}
                          </div>
                        )}

                        <div className="mb-3">
                          <label className="form-label d-flex align-items-center gap-2">
                            <input
                              type="checkbox"
                              className="form-check-input m-0"
                              checked={newFieldForm.required || false}
                              onChange={(e) => setNewFieldForm((p) => ({ ...p, required: e.target.checked }))}
                            />
                            Compulsory field
                          </label>
                          <div className="form-text">
                            If checked, this field must be filled whenever it is visible in forms.
                          </div>
                        </div>

                        <div className="mb-3">
                          <label className="form-label">Placeholder</label>
                          <input
                            type="text"
                            className="form-control"
                            value={newFieldForm.placeholder}
                            onChange={(e) => setNewFieldForm((p) => ({ ...p, placeholder: e.target.value }))}
                            placeholder="e.g. Enter custom value"
                            disabled={newFieldForm.type === "select"}
                          />
                        </div>

                        <DependsOnBlock
                          form={newFieldForm}
                          onChange={(updates) => setNewFieldForm((p) => ({ ...p, ...updates }))}
                          fields={fields}
                          currentFieldKey={null}
                        />

                        <div className="alert alert-info mt-3">
                          <i className="ti ti-info-circle me-2" />
                          This field will also be saved to the library for reuse across other products.
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* ── STEP 2: REVIEW & CUSTOMIZE ─────────────────────────── */}
                {addFieldsStep === 2 && (
                  <div>
                    <p style={{ fontSize: 13, color: "#666", marginBottom: 16 }}>
                      <i className="ti ti-info-circle me-1" />
                      Customize how each field behaves for <strong>{selectedProduct?.name}</strong> only.
                      Changes here don't affect the library or other products.
                    </p>

                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      {reviewFields.map((field, idx) => {
                        const typeChanged = field.type !== field.libraryType;
                        return (
                          <div
                            key={field.key}
                            style={{ border: "1px solid #e9ecef", borderRadius: 8, padding: 16, background: "#fafafa" }}
                          >
                            {/* Card header */}
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
                              <span style={{ fontSize: 12, color: "#999", minWidth: 20 }}>{idx + 1}.</span>
                              <strong style={{ fontSize: 14, color: "#333" }}>{field.label}</strong>
                              <code style={{ fontSize: 11, background: "#f0f0f5", padding: "2px 6px", borderRadius: 3, color: "#666" }}>{field.key}</code>
                              {typeChanged && (
                                <span
                                  className="badge ms-auto"
                                  style={{ background: "#fff3cd", color: "#856404", fontSize: 11, border: "1px solid #ffc107" }}
                                >
                                  ⚠️ Type changed from library default ({field.libraryType})
                                </span>
                              )}
                            </div>

                            <div className="row g-2">
                              {/* Type override */}
                              <div className="col-md-4">
                                <label style={{ fontSize: 12, fontWeight: 600, color: "#555", display: "block", marginBottom: 4 }}>Field Type</label>
                                <select
                                  className="form-select"
                                  style={{ fontSize: 13 }}
                                  value={field.type}
                                  onChange={(e) => {
                                    const newType = e.target.value;
                                    updateReviewField(field.key, {
                                      type: newType,
                                      options: newType === "select"
                                        ? (FIELD_LIBRARY.find((l) => l.key === field.key)?.options || [])
                                        : [],
                                    });
                                  }}
                                >
                                  <option value="text">Text</option>
                                  <option value="number">Number</option>
                                  <option value="select">Select (Dropdown)</option>
                                </select>
                              </div>

                              {/* Placeholder for text/number */}
                              {field.type !== "select" && (
                                <div className="col-md-8">
                                  <label style={{ fontSize: 12, fontWeight: 600, color: "#555", display: "block", marginBottom: 4 }}>Placeholder</label>
                                  <input
                                    type="text"
                                    className="form-control"
                                    style={{ fontSize: 13 }}
                                    value={field.placeholder}
                                    onChange={(e) => updateReviewField(field.key, { placeholder: e.target.value })}
                                    placeholder="e.g. Enter value"
                                  />
                                </div>
                              )}

                              {/* Options for select */}
                              {field.type === "select" && (
                                <div className="col-12 mt-1">
                                  <label style={{ fontSize: 12, fontWeight: 600, color: "#555", display: "block", marginBottom: 4 }}>Options</label>
                                  <OptionsEditor
                                    options={field.options}
                                    onChange={(opts) => updateReviewField(field.key, { options: opts })}
                                  />
                                  <div className="mb-2 mt-2">
                                    <label className="form-label" style={{ fontSize: 12 }}>
                                      <input type="checkbox" className="form-check-input me-2" checked={field.allowCustom || false} onChange={(e) => updateReviewField(field.key, { allowCustom: e.target.checked })} />
                                      Allow custom value (shows + button)
                                    </label>
                                  </div>
                                  {(field.allowCustom && field.key === "size") && (
                                    <div className="mt-3">
                                      <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                                        <label style={{ fontSize: 12, fontWeight: 600, color: "#555" }}>Custom dimension fields</label>
                                        <button
                                          type="button"
                                          className="btn btn-link btn-sm p-0"
                                          style={{ fontSize: 11 }}
                                          onClick={() => { setDimMasterError(""); setShowDimMasterModal(true); }}
                                        >
                                          + Manage
                                        </button>
                                      </div>
                                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
                                        {dimensionMasters.map((dim) => (
                                          <label key={dim.id} style={{ display: "flex", alignItems: "center", gap: 4, cursor: "pointer", margin: 0 }}>
                                            <input
                                              type="checkbox"
                                              className="form-check-input"
                                              checked={(field.customDimensions || []).includes(dim.name)}
                                              onChange={(e) => {
                                                const current = field.customDimensions || [];
                                                const next = e.target.checked ? [...current, dim.name] : current.filter((d) => d !== dim.name);
                                                updateReviewField(field.key, { customDimensions: next });
                                              }}
                                            />
                                            <span style={{ fontSize: 13 }}>{dim.name}</span>
                                          </label>
                                        ))}
                                      </div>
                                      <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                                        <label className="form-label" style={{ fontSize: 12, fontWeight: 600, marginBottom: 0 }}>Unit options</label>
                                        <button
                                          type="button"
                                          className="btn btn-link btn-sm p-0"
                                          style={{ fontSize: 11 }}
                                          onClick={() => { setUnitMasterError(""); setShowUnitMasterModal(true); }}
                                        >
                                          + Manage
                                        </button>
                                      </div>
                                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
                                        {unitMasters.map((unit) => {
                                          const selectedUnits = getCustomSizeUnitOptions(field);
                                          return (
                                            <label key={unit.id} style={{ display: "flex", alignItems: "center", gap: 4, cursor: "pointer", margin: 0 }}>
                                              <input
                                                type="checkbox"
                                                className="form-check-input"
                                                checked={selectedUnits.includes(unit.name)}
                                                onChange={(e) => {
                                                  const current = getCustomSizeUnitOptions(field);
                                                  const next = e.target.checked
                                                    ? [...current, unit.name]
                                                    : current.filter((u) => u !== unit.name);
                                                  updateReviewField(field.key, {
                                                    unitOptions: next,
                                                    customDimensionUnit: next.includes(field.customDimensionUnit) ? field.customDimensionUnit : (next[0] || "mm"),
                                                  });
                                                }}
                                              />
                                              <span style={{ fontSize: 13 }}>{unit.name}</span>
                                            </label>
                                          );
                                        })}
                                      </div>
                                      <label className="form-label" style={{ fontSize: 12, fontWeight: 600 }}>Default unit</label>
                                      <select
                                        className="form-select"
                                        style={{ fontSize: 13 }}
                                        value={field.customDimensionUnit || "mm"}
                                        onChange={(e) => updateReviewField(field.key, { customDimensionUnit: e.target.value })}
                                      >
                                        {getCustomSizeUnitOptions(field).map((u) => <option key={u} value={u}>{u}</option>)}
                                      </select>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Checkboxes */}
                              <div className="col-12">
                                <label className="form-label d-flex align-items-center gap-2">
                                  <input
                                    type="checkbox"
                                    className="form-check-input m-0"
                                    checked={field.required || false}
                                    onChange={(e) => updateReviewField(field.key, { required: e.target.checked })}
                                  />
                                  Compulsory field
                                </label>
                                <div className="form-text">
                                  If checked, this field must be filled whenever it is visible in forms.
                                </div>
                              </div>

                              {(field.type === "text" || field.type === "number") && (
                                <div className="col-12">
                                  <label className="form-label">
                                    <input
                                      type="checkbox"
                                      className="form-check-input me-2"
                                      checked={field.hasUnit || false}
                                      onChange={(e) => updateReviewField(field.key, { hasUnit: e.target.checked })}
                                    />
                                    Has unit selector
                                  </label>
                                  {field.hasUnit && (
                                    <div style={{ paddingTop: 12, borderTop: "1px solid #e9ecef", marginTop: 8 }}>
                                      <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                                        <label className="form-label" style={{ fontSize: 12, fontWeight: 600, marginBottom: 0 }}>
                                          Unit options
                                        </label>
                                        <button
                                          type="button"
                                          className="btn btn-link btn-sm p-0"
                                          style={{ fontSize: 11 }}
                                          onClick={() => { setUnitMasterError(""); setShowUnitMasterModal(true); }}
                                        >
                                          + Manage
                                        </button>
                                      </div>
                                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
                                        {unitMasters.map((unit) => (
                                          <label key={unit.id} style={{ display: "flex", alignItems: "center", gap: 4, cursor: "pointer", margin: 0 }}>
                                            <input
                                              type="checkbox"
                                              className="form-check-input"
                                              checked={(field.unitOptions || []).includes(unit.name)}
                                              onChange={(e) => {
                                                const current = field.unitOptions || [];
                                                const next = e.target.checked
                                                  ? [...current, unit.name]
                                                  : current.filter((u) => u !== unit.name);
                                                updateReviewField(field.key, {
                                                  unitOptions: next,
                                                  defaultUnit: next.includes(field.defaultUnit) ? field.defaultUnit : "",
                                                });
                                              }}
                                            />
                                            <span style={{ fontSize: 13 }}>{unit.name}</span>
                                          </label>
                                        ))}
                                      </div>
                                      <label className="form-label" style={{ fontSize: 12, fontWeight: 600 }}>Default unit</label>
                                      <select
                                        className="form-select"
                                        style={{ fontSize: 13 }}
                                        value={field.defaultUnit || ""}
                                        onChange={(e) => updateReviewField(field.key, { defaultUnit: e.target.value })}
                                      >
                                        <option value="">— None —</option>
                                        {(field.unitOptions || []).map((u) => (
                                          <option key={u} value={u}>{u}</option>
                                        ))}
                                      </select>
                                    </div>
                                  )}
                                </div>
                              )}

                              <div className="col-12">
                                <DependsOnBlock
                                  form={field}
                                  onChange={(updates) => updateReviewField(field.key, updates)}
                                  fields={fields}
                                  currentFieldKey={field.key}
                                  isReviewMode={true}
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="modal-footer">
                {addFieldsStep === 1 ? (
                  <>
                    <button type="button" className="btn btn-outline-secondary" onClick={closeAddFields}>Cancel</button>
                    {addFieldsTab === "library" ? (
                      <button
                        type="button"
                        className="btn btn-primary"
                        disabled={selectedLibraryKeys.length === 0}
                        onClick={handleProceedToReview}
                      >
                        Review {selectedLibraryKeys.length > 0 ? selectedLibraryKeys.length : ""} Selected →
                      </button>
                    ) : addFieldsTab === "copy" ? (
                      <button
                        type="button"
                        className="btn btn-primary"
                        disabled={selectedCopyKeys.length === 0}
                        onClick={handleProceedToCopyReview}
                      >
                        Review {selectedCopyKeys.length > 0 ? selectedCopyKeys.length : ""} Selected →
                      </button>
                    ) : (
                      <button type="button" className="btn btn-primary" onClick={handleCreateField}>
                        Create & Add Field →
                      </button>
                    )}
                  </>
                ) : (
                  <>
                    <button type="button" className="btn btn-outline-secondary" onClick={() => setAddFieldsStep(1)}>← Back</button>
                    <button type="button" className="btn btn-primary" onClick={handleConfirmLibraryFields}>
                      Confirm & Add {reviewFields.length} Field{reviewFields.length !== 1 ? "s" : ""}
                    </button>
                  </>
                )}
              </div>

            </div>
          </div>
        </div>
      )}
      {showAddFieldsModal && <div className="modal-backdrop fade show" />}

      {/* ══════════════════════════════════════════════════════════════════════
          EDIT FIELD MODAL
      ══════════════════════════════════════════════════════════════════════ */}
      {showEditModal && editFieldForm && (
        <div className="modal fade show pfc-modal" style={{ display: "block" }} tabIndex="-1">
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Edit Field: {editFieldForm.label}</h5>
                <button type="button" className="btn-close" onClick={() => setShowEditModal(false)}>×</button>
              </div>

              <div className="modal-body">
                <div className="pfc-edit-grid">

                  {/* ── LEFT COLUMN ── */}
                  <section className="pfc-edit-section">
                    <div className="pfc-edit-section-header">
                      <h6>Field Details</h6>
                      <span>Basic field information</span>
                    </div>
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label">Label</label>
                        <input
                          type="text"
                          className="form-control"
                          value={editFieldForm.label}
                          onChange={(e) => setEditFieldForm((p) => ({ ...p, label: e.target.value }))}
                        />
                      </div>

                      <div className="col-md-6">
                        <label className="form-label">Field Key <small className="text-muted">(locked)</small></label>
                        <input type="text" className="form-control" value={editFieldForm.key} disabled />
                      </div>

                      <div className="col-md-6">
                        <label className="form-label">Field Type</label>
                        <select
                          className="form-select"
                          value={editFieldForm.type}
                          onChange={(e) => setEditFieldForm((p) => ({ ...p, type: e.target.value, options: e.target.value !== "select" ? [] : p.options }))}
                        >
                          <option value="text">Text</option>
                          <option value="number">Number</option>
                          <option value="select">Select (Dropdown)</option>
                        </select>
                      </div>

                      <div className="col-md-6">
                        <label className="form-label">Placeholder</label>
                        <input
                          type="text"
                          className="form-control"
                          value={editFieldForm.placeholder || ""}
                          onChange={(e) => setEditFieldForm((p) => ({ ...p, placeholder: e.target.value }))}
                          placeholder="e.g. Enter custom value"
                          disabled={editFieldForm.type === "select"}
                        />
                      </div>

                      <div className="col-12">
                        <label className="form-label d-flex align-items-center gap-2">
                          <input
                            type="checkbox"
                            className="form-check-input m-0"
                            checked={editFieldForm.required || false}
                            onChange={(e) => setEditFieldForm((p) => ({ ...p, required: e.target.checked }))}
                          />
                          Compulsory field
                        </label>
                        <div className="form-text">
                          If checked, this field must be filled whenever it is visible in forms.
                        </div>
                      </div>
                    </div>
                  </section>

                  {editFieldForm.type === "select" && (
                    <section className="pfc-edit-section">
                      <div className="pfc-edit-section-header">
                        <h6>Options</h6>
                        <span>Dropdown values for this field</span>
                      </div>
                      <OptionsEditor
                        options={editFieldForm.options || []}
                        onChange={(opts) => setEditFieldForm((p) => ({ ...p, options: opts }))}
                        importedOptions={customOptionsByFieldKey[editFieldForm.key] || []}
                        loadingImported={customOptionsLoading}
                        removingImportedOptionIds={removingCustomOptionIds}
                        onRemoveImported={(option) => handleDeleteImportedCustomOption(editFieldForm.key, option)}
                      />
                      <div className="mb-2">
                        <label className="form-label">
                          <input type="checkbox" className="form-check-input me-2" checked={editFieldForm.allowCustom || false} onChange={(e) => setEditFieldForm((p) => ({ ...p, allowCustom: e.target.checked }))} />
                          Allow custom value (shows + button)
                        </label>
                      </div>
                      {(editFieldForm.allowCustom && editFieldForm.key === "size") && (
                        <div className="mt-3">
                          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                            <label style={{ fontSize: 12, fontWeight: 600, color: "#555" }}>Custom dimension fields</label>
                            <button
                              type="button"
                              className="btn btn-link btn-sm p-0"
                              style={{ fontSize: 11 }}
                              onClick={() => { setDimMasterError(""); setShowDimMasterModal(true); }}
                            >
                              + Manage
                            </button>
                          </div>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
                            {dimensionMasters.map((dim) => (
                              <label key={dim.id} style={{ display: "flex", alignItems: "center", gap: 4, cursor: "pointer", margin: 0 }}>
                                <input
                                  type="checkbox"
                                  className="form-check-input"
                                  checked={(editFieldForm.customDimensions || []).includes(dim.name)}
                                  onChange={(e) => {
                                    const current = editFieldForm.customDimensions || [];
                                    const next = e.target.checked ? [...current, dim.name] : current.filter((d) => d !== dim.name);
                                    setEditFieldForm((p) => ({ ...p, customDimensions: next }));
                                  }}
                                />
                                <span style={{ fontSize: 13 }}>{dim.name}</span>
                              </label>
                            ))}
                          </div>
                          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                            <label className="form-label" style={{ fontSize: 12, fontWeight: 600, marginBottom: 0 }}>Unit options</label>
                            <button
                              type="button"
                              className="btn btn-link btn-sm p-0"
                              style={{ fontSize: 11 }}
                              onClick={() => { setUnitMasterError(""); setShowUnitMasterModal(true); }}
                            >
                              + Manage
                            </button>
                          </div>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
                            {unitMasters.map((unit) => {
                              const selectedUnits = getCustomSizeUnitOptions(editFieldForm);
                              return (
                                <label key={unit.id} style={{ display: "flex", alignItems: "center", gap: 4, cursor: "pointer", margin: 0 }}>
                                  <input
                                    type="checkbox"
                                    className="form-check-input"
                                    checked={selectedUnits.includes(unit.name)}
                                    onChange={(e) => {
                                      const current = getCustomSizeUnitOptions(editFieldForm);
                                      const next = e.target.checked
                                        ? [...current, unit.name]
                                        : current.filter((u) => u !== unit.name);
                                      setEditFieldForm((p) => ({
                                        ...p,
                                        unitOptions: next,
                                        customDimensionUnit: next.includes(p.customDimensionUnit) ? p.customDimensionUnit : (next[0] || "mm"),
                                      }));
                                    }}
                                  />
                                  <span style={{ fontSize: 13 }}>{unit.name}</span>
                                </label>
                              );
                            })}
                          </div>
                          <label className="form-label" style={{ fontSize: 12, fontWeight: 600 }}>Default unit</label>
                          <select
                            className="form-select"
                            style={{ fontSize: 13 }}
                            value={editFieldForm.customDimensionUnit || "mm"}
                            onChange={(e) => setEditFieldForm((p) => ({ ...p, customDimensionUnit: e.target.value }))}
                          >
                            {getCustomSizeUnitOptions(editFieldForm).map((u) => <option key={u} value={u}>{u}</option>)}
                          </select>
                        </div>
                      )}
                    </section>
                  )}

                  {/* ── RIGHT COLUMN ── */}
                  {(editFieldForm.type === "text" || editFieldForm.type === "number") && (
                    <section className="pfc-edit-section">
                      <div className="pfc-edit-section-header">
                        <h6>Unit Settings</h6>
                        <span>Attach a unit selector to this field</span>
                      </div>
                      <div className="mb-3">
                        <label className="form-label">
                          <input
                            type="checkbox"
                            className="form-check-input me-2"
                            checked={editFieldForm.hasUnit || false}
                            onChange={(e) => setEditFieldForm((p) => ({ ...p, hasUnit: e.target.checked }))}
                          />
                          Has unit selector
                        </label>
                      </div>
                      {editFieldForm.hasUnit && (
                        <div style={{ paddingTop: 12, borderTop: "1px solid #e9ecef" }}>
                          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                            <label className="form-label" style={{ fontSize: 12, fontWeight: 600, marginBottom: 0 }}>
                              Unit options
                            </label>
                            <button
                              type="button"
                              className="btn btn-link btn-sm p-0"
                              style={{ fontSize: 11 }}
                              onClick={() => { setUnitMasterError(""); setShowUnitMasterModal(true); }}
                            >
                              + Manage
                            </button>
                          </div>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
                            {unitMasters.map((unit) => (
                              <label key={unit.id} style={{ display: "flex", alignItems: "center", gap: 4, cursor: "pointer", margin: 0 }}>
                                <input
                                  type="checkbox"
                                  className="form-check-input"
                                  checked={(editFieldForm.unitOptions || []).includes(unit.name)}
                                  onChange={(e) => {
                                    const current = editFieldForm.unitOptions || [];
                                    const next = e.target.checked
                                      ? [...current, unit.name]
                                      : current.filter((u) => u !== unit.name);
                                    setEditFieldForm((p) => ({
                                      ...p,
                                      unitOptions: next,
                                      defaultUnit: next.includes(p.defaultUnit) ? p.defaultUnit : "",
                                    }));
                                  }}
                                />
                                <span style={{ fontSize: 13 }}>{unit.name}</span>
                              </label>
                            ))}
                          </div>
                          <label className="form-label" style={{ fontSize: 12, fontWeight: 600 }}>Default unit</label>
                          <select
                            className="form-select"
                            style={{ fontSize: 13 }}
                            value={editFieldForm.defaultUnit || ""}
                            onChange={(e) => setEditFieldForm((p) => ({ ...p, defaultUnit: e.target.value }))}
                          >
                            <option value="">— None —</option>
                            {(editFieldForm.unitOptions || []).map((u) => (
                              <option key={u} value={u}>{u}</option>
                            ))}
                          </select>
                        </div>
                      )}
                    </section>
                  )}

                  <section className="pfc-edit-section">
                    <div className="pfc-edit-section-header">
                      <h6>Dependency</h6>
                      <span>Show this field only when another field matches</span>
                    </div>
                    <DependsOnBlock
                      form={editFieldForm}
                      onChange={(updates) => setEditFieldForm((p) => ({ ...p, ...updates }))}
                      fields={fields}
                      currentFieldKey={editFieldForm.key}
                    />
                  </section>

                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-outline-secondary" onClick={() => setShowEditModal(false)}>Cancel</button>
                <button type="button" className="btn btn-primary" onClick={handleUpdateField}>Update Field</button>
              </div>
            </div>
          </div>
        </div>
      )}
      {showEditModal && <div className="modal-backdrop fade show" />}

      {showDimMasterModal && (
        <div className="modal fade show pfc-modal" style={{ display: "block", zIndex: 1060 }} tabIndex="-1">
          <div className="modal-dialog" style={{ maxWidth: 400 }}>
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Manage Dimensions</h5>
                <button className="btn-close" onClick={() => setShowDimMasterModal(false)}>x</button>
              </div>
              <div className="modal-body">
                {dimMasterError && <div className="alert alert-danger py-2 mb-3">{dimMasterError}</div>}
                <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
                  {dimensionMasters.map((d) => (
                    <div key={d.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 10px", background: "var(--bs-gray-100)", borderRadius: 6 }}>
                      <span style={{ fontSize: 13 }}>{d.name}</span>
                      <button className="btn btn-link btn-sm text-danger p-0" onClick={() => handleDeleteDimension(d.id)}>
                        <i className="ti ti-x" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="input-group">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Thickness"
                    value={newDimName}
                    onChange={(e) => setNewDimName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddDimension(); }}}
                  />
                  <button className="btn btn-outline-secondary" onClick={handleAddDimension} disabled={!newDimName.trim()}>
                    <i className="ti ti-plus me-1" /> Add
                  </button>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-primary" onClick={() => setShowDimMasterModal(false)}>Done</button>
              </div>
            </div>
          </div>
        </div>
      )}
      {showDimMasterModal && <div className="modal-backdrop fade show" style={{ zIndex: 1055 }} />}

      {showUnitMasterModal && (
        <div className="modal fade show pfc-modal" style={{ display: "block", zIndex: 1060 }} tabIndex="-1">
          <div className="modal-dialog" style={{ maxWidth: 400 }}>
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Manage Units</h5>
                <button className="btn-close" onClick={() => setShowUnitMasterModal(false)}>x</button>
              </div>
              <div className="modal-body">
                {unitMasterError && <div className="alert alert-danger py-2 mb-3">{unitMasterError}</div>}
                <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
                  {unitMasters.map((u) => (
                    <div key={u.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 10px", background: "var(--bs-gray-100)", borderRadius: 6 }}>
                      <span style={{ fontSize: 13 }}>{u.name}</span>
                      <button className="btn btn-link btn-sm text-danger p-0" onClick={() => handleDeleteUnit(u.id)}>
                        <i className="ti ti-x" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="input-group">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. ml, pcs, ltr"
                    value={newUnitName}
                    onChange={(e) => setNewUnitName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddUnit(); }}}
                  />
                  <button className="btn btn-outline-secondary" onClick={handleAddUnit} disabled={!newUnitName.trim()}>
                    <i className="ti ti-plus me-1" /> Add
                  </button>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-primary" onClick={() => setShowUnitMasterModal(false)}>Done</button>
              </div>
            </div>
          </div>
        </div>
      )}
      {showUnitMasterModal && <div className="modal-backdrop fade show" style={{ zIndex: 1055 }} />}

      {confirmDialog}
    </div>
  );
}
