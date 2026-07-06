const DIMENSION_STORAGE_KEYS = {
  width: "customWidth",
  height: "customHeight",
  depth: "customDepth",
};

export function normalizeDimensionLabel(label) {
  return String(label || "").trim().toLowerCase();
}

export function getConfiguredSizeDimensions(fieldConfig) {
  const configured = Array.isArray(fieldConfig?.customDimensions)
    ? fieldConfig.customDimensions.filter(Boolean)
    : [];
  const seen = new Set();
  return configured
    .map((label) => String(label || "").trim())
    .filter((label) => {
      if (!label) return false;
      const normalized = normalizeDimensionLabel(label);
      if (!normalized || seen.has(normalized)) return false;
      seen.add(normalized);
      return true;
    });
}

export function getSizeFieldConfig(fieldDefs) {
  return (Array.isArray(fieldDefs) ? fieldDefs : []).find((field) => field?.key === "size") || null;
}

export function getDimensionStorageKey(label) {
  return DIMENSION_STORAGE_KEYS[normalizeDimensionLabel(label)] || `customSize_${normalizeDimensionLabel(label)}`;
}

export function getCustomSizeEntries(fieldConfig, fields) {
  return getConfiguredSizeDimensions(fieldConfig).map((label) => {
    const key = getDimensionStorageKey(label);
    return {
      key,
      label,
      value: String(fields?.[key] || "").trim(),
    };
  });
}

export function getCustomSizeStorageKeys(fieldConfig) {
  return getConfiguredSizeDimensions(fieldConfig).map((label) => getDimensionStorageKey(label));
}

export function getCustomSizeSummary(fieldConfig, fields) {
  if (!fields || fields.size !== "Custom") return null;

  const populated = getCustomSizeEntries(fieldConfig, fields).filter((entry) => entry.value);
  if (populated.length) {
    const unit = String(fields.customUnit || "").trim();
    const dims = populated.map((entry) => `${entry.label}: ${entry.value}`).join(" x ");
    return unit ? `${dims} ${unit}` : dims;
  }

  const textCustom = String(fields.sizeCustom || "").trim();
  return textCustom || null;
}

export function buildSizeValueRaw(fields, fieldConfig = null) {
  return getCustomSizeSummary(fieldConfig, fields);
}

export function buildCustomValueRaw(fieldKey, fields, fieldConfig = null) {
  if (!fields || fields[fieldKey] !== "Custom") return null;
  if (fieldKey === "size") return buildSizeValueRaw(fields, fieldConfig);
  const val = String(fields[`${fieldKey}Custom`] || "").trim();
  return val || null;
}

export function collectCustomOptionSaves(fieldDefs, fields) {
  if (!fieldDefs || !fields) return [];
  const results = [];
  for (const f of fieldDefs) {
    if (f.type !== "select" || !f.allowCustom || f.promptText) continue;
    if (fields[f.key] !== "Custom") continue;
    const valueRaw = buildCustomValueRaw(f.key, fields, f);
    if (valueRaw) results.push({ fieldKey: f.key, valueRaw });
  }
  return results;
}
