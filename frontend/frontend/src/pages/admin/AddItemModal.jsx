import React, { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { getFieldsByServiceType } from "../../api/productFieldConfigApi";
import { getServiceCategories } from "../../api/serviceCategoriesApi";
import { getServiceTypes } from "../../api/serviceTypesApi";
import { getCustomOptions, saveCustomOption } from "../../api/customOptionsApi";
import {
  collectCustomOptionSaves,
  getConfiguredSizeDimensions,
  getCustomSizeEntries,
  getCustomSizeStorageKeys,
  getSizeFieldConfig,
  getCustomSizeSummary,
} from "../../utils/customSizeUtils";
import { createRequirement, updateRequirement } from "../../api/requirementApi";
import "./LeadsPage.css";
import "./RequirementFormModal.css";
import "./AddItemModal.css";

// ── Helpers ──────────────────────────────────────────────────────────────────

const LEGACY_CUSTOM_SIZE_FIELD_KEYS = new Set(["customWidth", "customHeight", "customDepth"]);

function findSlab(quantitySlabs, qty) {
  const list = Array.isArray(quantitySlabs) ? quantitySlabs : [];
  const n = Number(qty);
  if (!n || n <= 0) return null;
  return list.find((s) => n >= Number(s.minQty) && n <= Number(s.maxQty)) ?? null;
}

function getDesignOnlyPrice(priceMatch) {
  if (!priceMatch?.quantitySlabs?.length) return null;
  const value = Number(priceMatch.quantitySlabs[0].pricePerPiece);
  return Number.isFinite(value) ? value : null;
}

function getVariantSummary(variantFields, fieldDefs = []) {
  const source = variantFields || {};
  const sizeField = getSizeFieldConfig(fieldDefs) || (source.customDimensions ? { customDimensions: source.customDimensions } : null);
  const skipKeys = new Set([
    "customUnit",
    ...Object.keys(source).filter((key) => key === "customWidth" || key === "customHeight" || key === "customDepth" || key.startsWith("customSize_")),
  ]);
  const entries = Object.entries(source)
    .filter(([key, value]) =>
      !key.endsWith("Custom") && !key.endsWith("Text") &&
      !skipKeys.has(key) && value !== "" && value != null)
    .map(([key, value]) => {
      if (value === "Custom") {
        if (key === "size" && sizeField) {
          const summary = getCustomSizeSummary(sizeField, source);
          if (summary) return [key, summary];
        }
        if (source[`${key}Custom`]) return [key, source[`${key}Custom`]];
      }
      return [key, value];
    });
  if (!entries.length) return "";
  const shown = entries.slice(0, 3).map(([, v]) => v).join(", ");
  return entries.length > 3 ? `${shown} +${entries.length - 3} more` : shown;
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
  const date = new Date(year, month - 1, day);
  return date.getDay() === 0;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function AddItemModal({
  open,
  priceList = [],
  prefill,
  onConfirm,
  onClose,
  leadId,
  onRequirementSaved,
}) {
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");

  // Step 0 — product selection
  const [categories, setCategories] = useState([]);
  const [allTypes, setAllTypes] = useState([]);
  const [categoryId, setCategoryId] = useState("");
  const [typeId, setTypeId] = useState("");
  const [subtypeId, setSubtypeId] = useState("");

  // Spec steps — DB-driven fields
  const [productFields, setProductFields] = useState([]);
  const [fieldsLoading, setFieldsLoading] = useState(false);
  const [specs, setSpecs] = useState({});
  const [customOptionsByFieldKey, setCustomOptionsByFieldKey] = useState({});
  const [customSpecDialog, setCustomSpecDialog] = useState({
    open: false, field: null, value: "",
    isFlexCustomSize: false, dimensionValues: {},
    customSizeUnitLabel: "ft", sizeUnit: "mm",
  });

  const [quantity, setQuantity] = useState("");

  // Design step
  const [designMode,       setDesignMode]       = useState("");
  const [designNotes,      setDesignNotes]       = useState("");
  const [stylePreference,  setStylePreference]   = useState("");
  const [colourPreference, setColourPreference]  = useState("");
  const [referenceNotes,   setReferenceNotes]    = useState("");
  const [brandColours,     setBrandColours]      = useState("");
  const [files,            setFiles]             = useState([]);
  const [isDragActive,     setIsDragActive]      = useState(false);

  // Delivery step
  const [deliveryDate,          setDeliveryDate]          = useState("");
  const [specialInstructions,   setSpecialInstructions]   = useState("");

  // Saving
  const [saving, setSaving] = useState(false);

  // ── Load master data on mount ─────────────────────────────────────────────

  useEffect(() => {
    Promise.all([getServiceCategories(), getServiceTypes()])
      .then(([cats, types]) => {
        setCategories(Array.isArray(cats) ? cats : []);
        setAllTypes(Array.isArray(types) ? types : []);
      })
      .catch(() => {});
  }, []);

  // ── Reset when modal opens ────────────────────────────────────────────────

  useEffect(() => {
    if (!open) return;
    setStep(0);
    setError("");
    setSpecs({});
    setQuantity(prefill?.quantity != null ? String(prefill.quantity) : "");
    setCustomOptionsByFieldKey({});

    if (prefill?.typeId) {
      // Derive categoryId from the type's parent when not directly available
      let resolvedCategoryId = prefill.categoryId ? String(prefill.categoryId) : "";
      if (!resolvedCategoryId && allTypes.length > 0) {
        const matchedType = allTypes.find(t => String(t.id) === String(prefill.typeId) && !t.parentId);
        if (matchedType?.categoryId) {
          resolvedCategoryId = String(matchedType.categoryId);
        } else {
          // typeId might be a subtype — find the parent type first
          const matchedSubtype = allTypes.find(t => String(t.id) === String(prefill.typeId) && t.parentId);
          if (matchedSubtype?.categoryId) {
            resolvedCategoryId = String(matchedSubtype.categoryId);
          }
        }
      }
      setCategoryId(resolvedCategoryId);
      setTypeId(String(prefill.typeId));
      setSubtypeId(prefill.subtypeId ? String(prefill.subtypeId) : "");
      const parsedSpecs = prefill.specs && typeof prefill.specs === "object"
        ? prefill.specs
        : {};
      setSpecs(parsedSpecs);
    } else {
      setCategoryId("");
      setTypeId("");
      setSubtypeId("");
    }

    // Reset design step
    setDesignMode(prefill?.designStatus || "");
    setDesignNotes(prefill?.designNotes || "");
    setStylePreference(prefill?.stylePreference || "");
    setColourPreference(prefill?.colourPreference || "");
    setReferenceNotes(prefill?.referenceNotes || "");
    setBrandColours(prefill?.brandColours || "");
    setFiles([]);
    setIsDragActive(false);

    // Reset delivery step
    setDeliveryDate(isSundayIsoDate(prefill?.deliveryDate) ? "" : normalizeIsoDateWithFourDigitYear(prefill?.deliveryDate || ""));
    setSpecialInstructions(prefill?.specialInstructions || "");
    setSaving(false);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Derived lists ─────────────────────────────────────────────────────────

  const typeOptions = useMemo(() => {
    if (!categoryId) return [];
    return allTypes.filter(t => String(t.categoryId) === String(categoryId) && !t.parentId);
  }, [allTypes, categoryId]);

  const subtypeOptions = useMemo(() => {
    if (!typeId) return [];
    return allTypes.filter(t => String(t.parentId) === String(typeId));
  }, [allTypes, typeId]);

  const selectedCategory = useMemo(
    () => categories.find(c => String(c.id) === String(categoryId)),
    [categories, categoryId],
  );
  const selectedType = useMemo(
    () => allTypes.find(t => String(t.id) === String(typeId)),
    [allTypes, typeId],
  );
  const selectedSubtype = useMemo(
    () => allTypes.find(t => String(t.id) === String(subtypeId)),
    [allTypes, subtypeId],
  );

  // ── Fetch DB fields when type/subtype changes ─────────────────────────────

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
        setSpecs(prev => {
          const next = { ...prev };
          let changed = false;
          mapped.forEach(mf => {
            if (mf.hasUnit && mf.defaultUnit && next[`${mf.key}Unit`] === undefined) {
              next[`${mf.key}Unit`] = mf.defaultUnit;
              changed = true;
            }
          });
          return changed ? next : prev;
        });
      })
      .catch(() => { if (!cancelled) setProductFields([]); })
      .finally(() => { if (!cancelled) setFieldsLoading(false); });
    return () => { cancelled = true; };
  }, [typeId, subtypeId]);

  // ── Fetch custom options ──────────────────────────────────────────────────

  useEffect(() => {
    if (!typeId) { setCustomOptionsByFieldKey({}); return; }
    const selectFields = (productFields || []).filter(
      f => f.type === "select" && !f.promptText
    );
    if (!selectFields.length) { setCustomOptionsByFieldKey({}); return; }
    Promise.all(
      selectFields.map(f =>
        getCustomOptions(typeId, subtypeId || null, f.key)
          .then(opts => [f.key, (opts || []).map(o => o.valueRaw)])
          .catch(() => [f.key, []])
      )
    ).then(pairs => setCustomOptionsByFieldKey(Object.fromEntries(pairs)));
  }, [typeId, subtypeId, productFields]);

  // ── Clear dependent field values ──────────────────────────────────────────

  useEffect(() => {
    if (!productFields || productFields.length === 0) return;
    const dependentFields = productFields.filter(f => f.dependsOn && f.dependsOn.trim() !== "");
    if (!dependentFields.length) return;
    setSpecs(prev => {
      let changed = false;
      const next = { ...prev };
      dependentFields.forEach(field => {
        if (prev[field.dependsOn] !== field.dependsOnValue && prev[field.key] !== undefined) {
          delete next[field.key];
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [productFields, specs]);

  // ── Spec steps ────────────────────────────────────────────────────────────

  const specificationSteps = useMemo(() => {
    if (!productFields || productFields.length === 0) {
      return [{ section: "Specification", fields: [] }];
    }
    if (productFields.length > 8) {
      const numTabs = Math.ceil(productFields.length / 8);
      const fieldsPerTab = Math.ceil(productFields.length / numTabs);
      const chunks = [];
      for (let i = 0; i < productFields.length; i += fieldsPerTab) {
        chunks.push(productFields.slice(i, i + fieldsPerTab));
      }
      return chunks.map((chunk, idx) => ({
        section: idx === 0 ? "Specification" : idx === 1 ? "Spec 2" : `Specification ${idx + 1}`,
        fields: chunk,
      }));
    }
    return [{ section: "Specification", fields: productFields }];
  }, [productFields]);

  const specificationStepCount = specificationSteps.length;
  const firstSpecStep  = 1;
  const designStep     = firstSpecStep + specificationStepCount;
  const isSpecStep     = step >= firstSpecStep && step < designStep;
  const currentSpec    = specificationSteps[
    Math.max(0, Math.min(step - firstSpecStep, specificationSteps.length - 1))
  ] || { section: "Specification", fields: [] };

  const stepLabels = useMemo(() => ([
    "Product",
    ...specificationSteps.map(s => s.section),
    "Design",
  ]), [specificationSteps]);

  // ── Breadcrumb ────────────────────────────────────────────────────────────

  const breadcrumb = useMemo(() => {
    const parts = ["SVL"];
    if (selectedCategory) parts.push(selectedCategory.name);
    if (selectedType) parts.push(selectedType.name);
    if (selectedSubtype) parts.push(selectedSubtype.name);
    return parts.join(" > ");
  }, [selectedCategory, selectedType, selectedSubtype]);

  // ── Price matching ────────────────────────────────────────────────────────

  const priceMatch = useMemo(() => {
    if (!typeId || !priceList.length) return null;
    return priceList.find(p =>
      Number(p.typeId) === Number(typeId) &&
      (p.subtypeId == null
        ? !subtypeId
        : Number(p.subtypeId) === Number(subtypeId))
    ) || null;
  }, [priceList, typeId, subtypeId]);

  const slab = useMemo(
    () => findSlab(priceMatch?.quantitySlabs, quantity),
    [priceMatch, quantity],
  );

  const slabPrice = useMemo(() => {
    if (!slab) return null;
    const v = Number(slab.pricePerPiece);
    return Number.isFinite(v) ? v : null;
  }, [slab]);
  const designOnlyPrice = useMemo(() => getDesignOnlyPrice(priceMatch), [priceMatch]);

  // ── Spec change handlers ──────────────────────────────────────────────────

  const handleSpecChange = useCallback((key, value) => {
    setSpecs(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleSelectSpecChange = useCallback((field, value) => {
    if (field.key === "size" && value === "Custom") {
      if (field.customSizeMode === "text") {
        setCustomSpecDialog({
          open: true, field,
          value: String(specs[`${field.key}Custom`] || "").trim(),
          isFlexCustomSize: false, dimensionValues: {},
          customSizeUnitLabel: "ft", sizeUnit: "mm",
        });
        return;
      }
      const configDims = getConfiguredSizeDimensions(field);
      if (configDims.length > 0) {
        setCustomSpecDialog(
          buildSizeDialogState(field, specs, field.customDimensionUnit || "mm")
        );
      }
      return;
    }

    if (field.promptText && value) {
      setCustomSpecDialog({
        open: true, field,
        value: String(specs[`${field.key}Text`] || "").trim(),
        isFlexCustomSize: false,
        isTextPrompt: true,
        textRows: field.textRows || 4,
        selectedOption: value,
        dimensionValues: {},
        customSizeUnitLabel: "ft", sizeUnit: "mm",
      });
      return;
    }

    if (field.allowCustom && value === "Custom") {
      setCustomSpecDialog({
        open: true, field,
        value: String(specs[`${field.key}Custom`] || "").trim(),
        isFlexCustomSize: false, dimensionValues: {},
        customSizeUnitLabel: "ft", sizeUnit: "mm",
      });
      return;
    }

    setSpecs(prev => {
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
    setCustomSpecDialog({
      open: false, field: null, value: "",
      isFlexCustomSize: false, dimensionValues: {},
      customSizeUnitLabel: "ft", sizeUnit: "mm",
    });
  }, []);

  const saveCustomSpecDialog = useCallback(() => {
    const field = customSpecDialog.field;
    if (!field) return;

    if (customSpecDialog.isFlexCustomSize) {
      const sizeEntries = getCustomSizeEntries(field, customSpecDialog.dimensionValues);
      const missing = sizeEntries.find((entry) => !String(customSpecDialog.dimensionValues?.[entry.key] || "").trim());
      if (missing) { setError(`Please enter ${missing.label.toLowerCase()}`); return; }
      const dimensionPayload = Object.fromEntries(
        sizeEntries.map((entry) => [entry.key, String(customSpecDialog.dimensionValues?.[entry.key] || "").trim()])
      );
      setSpecs(prev => ({
        ...prev,
        [field.key]: "Custom",
        ...dimensionPayload,
        customUnit: customSpecDialog.sizeUnit,
      }));
      const sizeLabel = getCustomSizeSummary(field, { size: "Custom", ...dimensionPayload, customUnit: customSpecDialog.sizeUnit }) || "Custom";
      saveCustomOption(typeId, subtypeId || null, "size", sizeLabel).catch(() => {});
      closeCustomSpecDialog();
      setError("");
      return;
    }

    if (customSpecDialog.isTextPrompt) {
      const trimmedText = String(customSpecDialog.value || "").trim();
      setSpecs(prev => ({
        ...prev,
        [field.key]: customSpecDialog.selectedOption,
        [`${field.key}Text`]: trimmedText,
      }));
      closeCustomSpecDialog();
      return;
    }

    const trimmedValue = String(customSpecDialog.value || "").trim();
    if (!trimmedValue) {
      setSpecs(prev => {
        const next = { ...prev };
        delete next[field.key];
        delete next[`${field.key}Custom`];
        return next;
      });
      closeCustomSpecDialog();
      return;
    }

    setSpecs(prev => ({
      ...prev,
      [field.key]: "Custom",
      [`${field.key}Custom`]: trimmedValue,
    }));
    saveCustomOption(typeId, subtypeId || null, field.key, trimmedValue).catch(() => {});
    closeCustomSpecDialog();
  }, [closeCustomSpecDialog, customSpecDialog, typeId, subtypeId]);

  // ── Navigation handlers ───────────────────────────────────────────────────

  function handleCategoryChange(id) {
    setCategoryId(id);
    setTypeId("");
    setSubtypeId("");
    setSpecs({});
  }

  function handleTypeChange(id) {
    setTypeId(id);
    setSubtypeId("");
    setSpecs({});
  }

  function canProceed(s) {
    if (s === 0) {
      if (!categoryId || !typeId) return false;
      if (!designMode) return false;
      if (subtypeOptions.length > 0 && !subtypeId) return false;
      return true;
    }
    if (s >= firstSpecStep && s < designStep) {
      return !getMissingCompulsoryField(productFields, specs);
    }
    if (s === designStep) {
      if (!designMode) return false;
      return true;
    }
    return true;
  }

  function handleNext() {
    if (!canProceed(step)) {
      if (step === 0) {
        if (!categoryId || !typeId) {
          setError("Please select a category and product.");
        } else if (!designMode) {
          setError("Please select a design mode.");
        } else if (subtypeOptions.length > 0 && !subtypeId) {
          setError("Please select a sub-product.");
        }
      } else if (step >= firstSpecStep && step < designStep) {
        const missingField = getMissingCompulsoryField(productFields, specs);
        if (missingField) setError(`Please fill compulsory field: ${missingField.label || missingField.key}`);
      } else if (step === designStep) {
        if (!designMode) setError("Please select a design mode.");
      }
      return;
    }
    setError("");
    setStep(s => Math.min(s + 1, designStep));
  }

  function handleBack() {
    setError("");
    setStep(s => Math.max(s - 1, 0));
  }

  // ── handleConfirm ─────────────────────────────────────────────────────────

  async function handleConfirm() {
    console.log("leadId:", leadId);
    setError("");
    setSaving(true);

    try {
      const isDesignOnly = designMode === "design_only";
      const qty = isDesignOnly ? 0 : Number(quantity);
      const lineItemDesignFee = isDesignOnly ? (designOnlyPrice || 0) : 0;
      const lineItemUnitPrice = !isDesignOnly && slabPrice != null ? slabPrice : 0;
      const lineItemTotal = isDesignOnly ? lineItemDesignFee : qty * lineItemUnitPrice;
      const pricingStatus = lineItemTotal > 0 ? "PRICED" : "UNPRICED";

      if (!isDesignOnly && (!qty || qty <= 0)) {
        setError("Please enter a valid quantity.");
        setSaving(false);
        return;
      }

      if (!typeId) {
        setError("Please select a product.");
        setSaving(false);
        return;
      }

      const missingField = getMissingCompulsoryField(productFields, specs);
      if (missingField) {
        setError(`Please fill compulsory field: ${missingField.label || missingField.key}`);
        setSaving(false);
        return;
      }

      if (deliveryDate && isSundayIsoDate(deliveryDate)) {
        setError("Sunday delivery dates are not allowed.");
        setSaving(false);
        return;
      }

      // Build requirement payload
      const requirementData = {
        leadId: Number(leadId),
        categoryId: Number(categoryId),
        typeId: Number(typeId),
        subtypeId: subtypeId ? Number(subtypeId) : null,
        quantity: qty,
        specs: JSON.stringify(specs),
        designStatus: designMode || null,
        designNotes: designNotes || null,
        fileFormat: null,
        colourMode: null,
        stylePreference: stylePreference || null,
        colourPreference: colourPreference || null,
        referenceNotes: referenceNotes || null,
        brandColours: brandColours || null,
        deliveryDate: deliveryDate || null,
        specialInstructions: specialInstructions || null,
      };

      let savedRequirement;
      if (leadId) {
        if (prefill?.requirementId) {
          savedRequirement = await updateRequirement(
            prefill.requirementId,
            requirementData,
            files
          );
        } else {
          savedRequirement = await createRequirement(requirementData, files);
        }
      }

      // Save custom options
      if (typeId) {
        const saves = collectCustomOptionSaves(productFields || [], specs);
        saves.forEach(({ fieldKey, valueRaw }) => {
          saveCustomOption(
            Number(typeId),
            subtypeId ? Number(subtypeId) : null,
            fieldKey,
            valueRaw
          ).catch(() => {});
        });
      }

      // Build line item shape for quotation
      const productName = [selectedType?.name, selectedSubtype?.name]
        .filter(Boolean).join(" / ");
      const optionsSummary = getVariantSummary(specs, productFields);

      onConfirm({
        id: prefill?.id ?? `item-${Date.now()}`,
        requirementId: savedRequirement?.id ?? prefill?.requirementId ?? null,
        productId: null,
        categoryId: categoryId ? Number(categoryId) : null,
        typeId: Number(typeId),
        subtypeId: subtypeId ? Number(subtypeId) : null,
        typeName: selectedType?.name || "",
        subtypeName: selectedSubtype?.name || null,
        productName,
        quantity: isDesignOnly ? 0 : qty,
        unitPrice: lineItemUnitPrice,
        pricePerUnit: lineItemUnitPrice,
        lineTotal: lineItemTotal,
        designCost: lineItemDesignFee,
        pricingStatus,
        designStatus: designMode || null,
        specs,
        variantFields: specs,
        optionsSummary,
        priceListEntryId: priceMatch?.id ?? null,
      });

      // Notify parent to refresh requirements list
      if (onRequirementSaved) onRequirementSaved();

    } catch (e) {
      const msg = e?.response?.data?.message
        || e?.response?.data?.error
        || e?.message
        || "Failed to save. Please try again.";
      setError(msg);
    } finally {
      setSaving(false);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  if (!open) return null;

  const shouldReduceMotion = false;

  return (
    <>
      <div className="modal fade show" style={{ display: "block" }} tabIndex="-1">
        <div className="modal-dialog modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">
                {prefill?.id ? "Edit Item" : "Add Item"}
              </h5>
              <button type="button" className="btn-close" onClick={onClose} aria-label="Close" />
            </div>

            <div className="modal-body">
              <div className="lead-wizard">

                {/* Breadcrumb + Reset */}
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <small className="text-muted">{breadcrumb}</small>
                  {step > 0 && (
                    <button
                      type="button"
                      className="btn btn-link btn-sm p-0"
                      onClick={() => { setStep(0); setError(""); }}
                    >
                      Reset
                    </button>
                  )}
                </div>

                {error && (
                  <div className="alert alert-danger py-2 mb-3">{error}</div>
                )}

                {/* Progress bar */}
                <div className="lead-wizard-progress-bar">
                  <motion.div
                    className="lead-wizard-progress"
                    initial={shouldReduceMotion ? false : { width: "0%" }}
                    animate={shouldReduceMotion ? {} : { width: `${((step + 1) / stepLabels.length) * 100}%` }}
                    transition={{ duration: 0.35, ease: "easeOut" }}
                  />
                </div>

                {/* Step circles */}
                <motion.div
                  className="lead-wizard-circles"
                  initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
                  animate={shouldReduceMotion ? {} : { opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: 0.05 }}
                >
                  {stepLabels.map((label, idx) => (
                    <div
                      key={label}
                      className="lead-wizard-circle-item"
                      onClick={() => { if (idx < step) { setStep(idx); setError(""); } }}
                      style={{ cursor: idx < step ? "pointer" : "default" }}
                    >
                      <motion.div
                        className={`lead-wizard-circle${step >= idx ? " active" : ""}`}
                        initial={shouldReduceMotion ? false : { scale: 0.94 }}
                        animate={shouldReduceMotion ? {} : { scale: 1 }}
                        transition={{ duration: 0.2, delay: 0.08 + idx * 0.02 }}
                      >
                        <span style={{ fontSize: "0.75rem", fontWeight: 600 }}>{idx + 1}</span>
                      </motion.div>
                      <div className="lead-wizard-circle-label">{label}</div>
                    </div>
                  ))}
                </motion.div>

                {/* Step content */}
                <div className="lead-create-grid">
                  <AnimatePresence mode="wait">

                    {/* Step 0 — Product selection */}
                    {step === 0 && (
                      <motion.div
                        key="step-0"
                        initial={shouldReduceMotion ? false : { opacity: 0, x: 18, filter: "blur(4px)" }}
                        animate={shouldReduceMotion ? {} : { opacity: 1, x: 0, filter: "blur(0px)" }}
                        exit={shouldReduceMotion ? false : { opacity: 0, x: -18, filter: "blur(4px)" }}
                        transition={{ duration: 0.26, ease: "easeOut" }}
                        className="row g-3 lead-wizard-step-panel"
                      >
                        <div className="col-12">
                          <div className="lead-form-field">
                            <label className="form-label fw-semibold">
                              Design Mode <span className="text-danger">*</span>
                            </label>
                            <select
                              className="form-select mt-1"
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
                          <div className="lead-form-field">
                            <label className="form-label fw-semibold">
                              Category <span className="text-danger">*</span>
                            </label>
                            <select
                              className="form-select"
                              value={categoryId}
                              onChange={e => handleCategoryChange(e.target.value)}
                            >
                              <option value="">Select category</option>
                              {categories.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
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
                              value={typeId}
                              onChange={e => handleTypeChange(e.target.value)}
                              disabled={!categoryId}
                            >
                              <option value="">Select product</option>
                              {typeOptions.map(t => (
                                <option key={t.id} value={t.id}>{t.name}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div
                          className="col-md-6"
                          style={{ visibility: typeId && subtypeOptions.length > 0 ? "visible" : "hidden" }}
                        >
                          <div className="lead-form-field">
                            <label className="form-label fw-semibold">Sub-product</label>
                            <select
                              className="form-select"
                              value={subtypeId}
                              onChange={e => setSubtypeId(e.target.value)}
                            >
                              <option value="">Select sub-type</option>
                              {subtypeOptions.map(s => (
                                <option key={s.id} value={s.id}>{s.name}</option>
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
                      </motion.div>
                    )}

                    {/* Spec steps */}
                    {isSpecStep && (
                      <motion.div
                        key={`step-spec-${step}`}
                        initial={shouldReduceMotion ? false : { opacity: 0, x: 18, filter: "blur(4px)" }}
                        animate={shouldReduceMotion ? {} : { opacity: 1, x: 0, filter: "blur(0px)" }}
                        exit={shouldReduceMotion ? false : { opacity: 0, x: -18, filter: "blur(4px)" }}
                        transition={{ duration: 0.26, ease: "easeOut" }}
                        className="row g-3 lead-wizard-step-panel"
                      >
                        {step === firstSpecStep && designMode !== "design_only" && (
                          <div className="col-md-6">
                            <div className="lead-form-field">
                              <label className="form-label">
                                Quantity <span className="text-danger">*</span>
                              </label>
                              <input
                                className="form-control"
                                type="number"
                                min="1"
                                value={quantity}
                                onChange={e => setQuantity(e.target.value)}
                                placeholder="Enter quantity"
                              />
                            </div>
                          </div>
                        )}

                        {fieldsLoading ? (
                          <div className="col-12 text-center py-4">
                            <div className="spinner-border spinner-border-sm text-primary" />
                            <div className="text-muted mt-2 small">Loading fields…</div>
                          </div>
                        ) : currentSpec.fields.length === 0 ? (
                          <div className="col-12">
                            <div className="alert alert-info py-2 mb-0">
                              No specification fields for this product. Click Next to continue.
                            </div>
                          </div>
                        ) : (
                          currentSpec.fields
                            .filter(field => {
                              if (LEGACY_CUSTOM_SIZE_FIELD_KEYS.has(field.key)) return false;
                              if (field.hidden) return false;
                              if (field.dependsOn && field.dependsOn.trim() !== "") {
                                return specs[field.dependsOn] === field.dependsOnValue;
                              }
                              return true;
                            })
                            .map(field => {
                              if (field.type === "select") {
                                const savedForField = !field.promptText
                                  ? (customOptionsByFieldKey[field.key] || []) : [];
                                const staticOpts = field.options.filter(o => o !== "Custom");
                                const alreadyInStatic = new Set(staticOpts.map(o => o.toLowerCase()));
                                const uniqueSaved = savedForField.filter(s => !alreadyInStatic.has(s.toLowerCase()));
                                const effectiveOpts = [...staticOpts, ...uniqueSaved];
                                return (
                                  <div key={field.key} className="col-md-6">
                                    <div className="lead-form-field">
                                      <label className="form-label">{renderFieldLabel(field)}</label>
                                      <div style={{ display: "flex", alignItems: "center" }}>
                                        <select
                                          className="form-select"
                                          value={specs[field.key] || ""}
                                          onChange={e => handleSelectSpecChange(field, e.target.value)}
                                        >
                                          <option value="">Select {field.label}</option>
                                          {specs[field.key] === "Custom" && (
                                          <option value="Custom">
                                              {field.key === "size" && getCustomSizeSummary(field, specs)
                                                ? `Custom: ${getCustomSizeSummary(field, specs)}`
                                                : specs[`${field.key}Custom`]
                                                  ? `Custom: ${specs[`${field.key}Custom`]}` 
                                                  : "Custom"}
                                            </option>
                                          )}
                                          {effectiveOpts.map(opt => (
                                            <option key={opt} value={opt}>{opt}</option>
                                          ))}
                                        </select>
                                        {field.allowCustom && (
                                          <button
                                            type="button"
                                            className="btn btn-sm btn-outline-secondary ms-1"
                                            style={{ flexShrink: 0 }}
                                            onClick={() => handleSelectSpecChange(field, "Custom")}
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
                                    <div className="lead-form-field">
                                      <label className="form-label">{renderFieldLabel(field)}</label>
                                      <div style={{ display: "flex", alignItems: "stretch", width: "100%" }}>
                                        <input
                                          className="form-control unit-input"
                                          type={field.type === "number" ? "number" : "text"}
                                          value={specs[field.key] ?? ""}
                                          onChange={e => handleSpecChange(field.key, e.target.value)}
                                          placeholder={field.placeholder || ""}
                                        />
                                        <select
                                          className="form-select unit-select"
                                          value={specs[`${field.key}Unit`] ?? field.defaultUnit ?? ""}
                                          onChange={e => handleSpecChange(`${field.key}Unit`, e.target.value)}
                                        >
                                          {(field.unitOptions || []).map(u => (
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
                                  <div className="lead-form-field">
                                    <label className="form-label">{renderFieldLabel(field, dimensionSuffix)}</label>
                                    <input
                                      className="form-control"
                                      type={field.type === "number" ? "number" : "text"}
                                      value={specs[field.key] ?? ""}
                                      onChange={e => handleSpecChange(field.key, e.target.value)}
                                      placeholder={field.placeholder || ""}
                                    />
                                  </div>
                                </div>
                              );
                            })
                        )}
                      </motion.div>
                    )}

                    {/* Design step */}
                    {step === designStep && (
                      <motion.div
                        key="step-design"
                        initial={shouldReduceMotion ? false : { opacity: 0, x: 18, filter: "blur(4px)" }}
                        animate={shouldReduceMotion ? {} : { opacity: 1, x: 0, filter: "blur(0px)" }}
                        exit={shouldReduceMotion ? false : { opacity: 0, x: -18, filter: "blur(4px)" }}
                        transition={{ duration: 0.26, ease: "easeOut" }}
                        className="row g-3 lead-wizard-step-panel"
                      >
                        {/* Read-only design mode indicator */}
                        <div className="col-12">
                          <div className="alert alert-info py-2 mb-0">
                            <strong>Design mode:</strong>{" "}
                            {{
                              design_only:       "Design Only",
                              production_only:   "Production Only",
                              design_production: "Design + Production",
                            }[designMode] || designMode}
                          </div>
                        </div>

                        {/* Optional file upload for production_only */}
                        {designMode === "production_only" && (
                          <div className="col-12">
                            <label className="form-label fw-semibold">Design Folder</label>
                            <small className="text-muted d-block mb-2">Optional</small>
                            <label
                              className={`w-100 rounded-3 p-4 text-center ${isDragActive ? "border border-primary bg-light" : "border border-secondary-subtle"}`}
                              onDragOver={e => { e.preventDefault(); e.stopPropagation(); setIsDragActive(true); }}
                              onDragLeave={e => { e.preventDefault(); e.stopPropagation(); setIsDragActive(false); }}
                              onDrop={async e => {
                                e.preventDefault(); e.stopPropagation(); setIsDragActive(false);
                                const dropped = Array.from(e.dataTransfer?.files || []);
                                if (dropped.length) setFiles(prev => [...prev, ...dropped]);
                              }}
                              style={{ cursor: "pointer", borderStyle: "dashed" }}
                            >
                              <input
                                type="file"
                                className="d-none"
                                multiple
                                onChange={e => setFiles(prev => [...prev, ...Array.from(e.target.files || [])])}
                              />
                              <div className="fw-semibold mb-1">Drag and drop design files here</div>
                              <small className="text-muted">or click to choose files</small>
                            </label>
                            {files.length > 0 && (
                              <div className="mt-2">
                                {files.map((f, i) => (
                                  <div key={`${f.name}-${i}`} className="d-flex align-items-center gap-2 py-1">
                                    <i className="ti ti-file text-muted" />
                                    <span className="text-truncate" style={{ maxWidth: 320 }}>{f.name}</span>
                                    <small className="text-muted">({(f.size / 1024).toFixed(1)} KB)</small>
                                    <button
                                      type="button"
                                      className="btn btn-sm btn-outline-danger ms-auto"
                                      onClick={() => setFiles(prev => prev.filter((_, idx) => idx !== i))}
                                    >
                                      <i className="ti ti-x" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Notes */}
                        {designMode && (
                          <div className="col-12">
                            <label className="form-label">Design Notes</label>
                            <textarea
                              className="form-control"
                              rows={3}
                              value={designNotes}
                              onChange={e => setDesignNotes(e.target.value)}
                              placeholder="Any instructions about the design"
                            />
                          </div>
                        )}
                      </motion.div>
                    )}

                  </AnimatePresence>
                </div>

                {/* Navigation */}
                <motion.div
                  className="lead-wizard-nav"
                  initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
                  animate={shouldReduceMotion ? {} : { opacity: 1, y: 0 }}
                  transition={{ duration: 0.18, delay: 0.18 }}
                >
                  {step > 0 ? (
                    <button type="button" className="btn btn-light" onClick={handleBack}>
                      Previous
                    </button>
                  ) : (
                    <div />
                  )}
                  {step < designStep ? (
                    <button type="button" className="btn btn-primary" onClick={handleNext}>
                      Next
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="btn btn-success"
                      onClick={handleConfirm}
                      disabled={saving}
                    >
                      {saving
                        ? <><span className="spinner-border spinner-border-sm me-2" />Saving...</>
                        : prefill?.requirementId ? "Update Item" : "Add Item"
                      }
                    </button>
                  )}
                </motion.div>

              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="modal-backdrop fade show" />

      {/* Custom spec dialog */}
      {customSpecDialog.open && (
        <div
          className="modal fade show requirement-form-modal"
          style={{ display: "block", backgroundColor: "rgba(0,0,0,0.35)" }}
          tabIndex="-1"
        >
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: "500px" }}>
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {customSpecDialog.isFlexCustomSize
                    ? "Enter Custom Size"
                    : `Enter Custom ${customSpecDialog.field?.label}`}
                </h5>
                <button type="button" className="btn-close" onClick={closeCustomSpecDialog} aria-label="Close" />
              </div>
              <div className="modal-body" style={{ padding: "1.5rem" }}>
                {customSpecDialog.isFlexCustomSize ? (
                  <>
                    <div className="lead-form-field mb-3">
                      <label className="form-label">Unit <span className="text-danger">*</span></label>
                      <select
                        className="form-select"
                        value={customSpecDialog.sizeUnit}
                        onChange={e => setCustomSpecDialog(prev => ({ ...prev, sizeUnit: e.target.value }))}
                      >
                        {(customSpecDialog.field?.unitOptions?.length > 0
                          ? customSpecDialog.field.unitOptions
                          : ["mm", "cm", "ft", "inch"]
                        ).map(u => (
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
                          onChange={e => setCustomSpecDialog(prev => ({
                            ...prev,
                            dimensionValues: { ...(prev.dimensionValues || {}), [entry.key]: e.target.value },
                          }))}
                          placeholder={`Enter ${entry.label.toLowerCase()} in ${customSpecDialog.sizeUnit}`}
                          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); saveCustomSpecDialog(); } }}
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
                        onChange={e => setCustomSpecDialog(prev => ({ ...prev, value: e.target.value }))}
                        placeholder={`Enter ${customSpecDialog.selectedOption?.toLowerCase() || "details"}`}
                      />
                    ) : (
                      <input
                        className="form-control"
                        autoFocus
                        value={customSpecDialog.value}
                        onChange={e => setCustomSpecDialog(prev => ({ ...prev, value: e.target.value }))}
                        onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); saveCustomSpecDialog(); } }}
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
