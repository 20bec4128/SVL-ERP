import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../../components/admin/PageHeader";
import { saveCustomOption } from "../../api/customOptionsApi";
import { getFieldsByServiceType } from "../../api/productFieldConfigApi";
import { getPriceList, importPriceEntries, normalizePriceListEntries } from "../../api/priceListApi";
import { getServiceCategories } from "../../api/serviceCategoriesApi";
import { getServiceTypes } from "../../api/serviceTypesApi";
import {
  getSizeFieldConfig,
} from "../../utils/customSizeUtils";
import "./PriceListPage.css";

const PRICE_COLUMNS = ["minQty", "maxQty", "pricePerPiece"];
const NON_VARIANT_KEYS = new Set(["customDimensions"]);

function normalizeText(value) {
  return String(value ?? "").trim();
}

function normalizeComparable(value) {
  return normalizeText(value).toLowerCase();
}

function csvEscape(value) {
  const text = String(value ?? "");
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function parseCSV(text) {
  const rows = [];
  let current = "";
  let row = [];
  let inQuotes = false;

  for (let i = 0; i < String(text || "").length; i += 1) {
    const char = text[i];
    const next = text[i + 1];
    if (char === '"' && inQuotes && next === '"') {
      current += '"';
      i += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      row.push(current);
      current = "";
    } else if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") i += 1;
      row.push(current);
      if (row.some((cell) => normalizeText(cell))) rows.push(row);
      row = [];
      current = "";
    } else {
      current += char;
    }
  }

  row.push(current);
  if (row.some((cell) => normalizeText(cell))) rows.push(row);
  return rows;
}

function downloadCSV(filename, headers, rows) {
  const csv = [headers, ...rows]
    .map((row) => row.map(csvEscape).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function mapFieldConfig(field) {
  return {
    key: field.fieldKey,
    label: field.label,
    type: field.fieldType,
    options: Array.isArray(field.options) ? field.options : [],
    isRequired: !!field.isRequired,
    allowCustom: !!field.allowCustom,
    promptText: !!field.promptText,
    hidden: !!field.isHidden,
    hasUnit: !!field.hasUnit,
    unitOptions: Array.isArray(field.unitOptions) ? field.unitOptions : [],
    defaultUnit: field.defaultUnit || "",
    dependsOn: field.dependsOn || "",
    dependsOnValue: field.dependsOnValue || "",
    customDimensions: Array.isArray(field.customDimensions) ? field.customDimensions : [],
    customDimensionUnit: field.customDimensionUnit || "mm",
    customSizeMode: field.customSizeMode || null,
  };
}

function isFieldVisible(field, values) {
  if (field.hidden) return false;
  if (!field.dependsOn) return true;
  return normalizeText(values[field.dependsOn]) === normalizeText(field.dependsOnValue);
}

function buildTemplateColumns(fields) {
  const columns = [];
  for (const field of fields.filter((f) => !f.hidden)) {
    columns.push(field.key);
    if (field.hasUnit) columns.push(`${field.key}Unit`);
  }
  return [...columns, ...PRICE_COLUMNS];
}

function sampleForField(field) {
  if (field.type === "select") {
    return field.options.find((option) => option && option !== "Custom") || "Standard";
  }
  if (field.type === "number") return "10";
  return field.placeholder || field.label || field.key;
}

function buildVariantFields(fields, rawValues) {
  const variantFields = {};
  for (const field of fields.filter((f) => isFieldVisible(f, rawValues))) {
    const value = normalizeText(rawValues[field.key]);
    if (value) variantFields[field.key] = value;
    if (field.hasUnit) {
      const unit = normalizeText(rawValues[`${field.key}Unit`]) || field.defaultUnit;
      if (unit) variantFields[`${field.key}Unit`] = unit;
    }
  }

  const sizeField = getSizeFieldConfig(fields);
  if (sizeField?.customDimensions?.length) {
    variantFields.customDimensions = sizeField.customDimensions;
  }
  return variantFields;
}

function variantKey(variantFields) {
  return JSON.stringify(
    Object.keys(variantFields || {})
      .filter((key) => !NON_VARIANT_KEYS.has(key))
      .sort()
      .map((key) => [key, normalizeComparable(variantFields[key])])
  );
}

function validateRow(row, fields, headers) {
  const errors = [];
  const headerSet = new Set(headers);

  for (const column of PRICE_COLUMNS) {
    if (!headerSet.has(column)) errors.push(`Missing ${column} column`);
  }

  for (const field of fields.filter((f) => !f.hidden)) {
    if (!headerSet.has(field.key)) {
      if (field.isRequired && isFieldVisible(field, row.values)) errors.push(`Missing ${field.key} column`);
      continue;
    }
    if (!isFieldVisible(field, row.values)) continue;
    const value = normalizeText(row.values[field.key]);
    if (field.isRequired && !value) errors.push(`${field.label || field.key} is required`);
    if (field.type === "number" && value && Number.isNaN(Number(value))) {
      errors.push(`${field.label || field.key} must be a number`);
    }
  }

  const minQty = Number(row.values.minQty);
  const maxQty = Number(row.values.maxQty);
  const pricePerPiece = Number(row.values.pricePerPiece);
  if (!normalizeText(row.values.minQty) || Number.isNaN(minQty)) errors.push("minQty must be a number");
  if (!normalizeText(row.values.maxQty) || Number.isNaN(maxQty)) errors.push("maxQty must be a number");
  if (!normalizeText(row.values.pricePerPiece) || Number.isNaN(pricePerPiece)) errors.push("pricePerPiece must be a number");
  if (!Number.isNaN(minQty) && !Number.isNaN(maxQty) && minQty >= maxQty) {
    errors.push("minQty must be less than maxQty");
  }
  if (!Number.isNaN(pricePerPiece) && pricePerPiece <= 0) {
    errors.push("pricePerPiece must be greater than 0");
  }

  return errors;
}

function buildExistingKeys(rows, categoryId, typeId, subtypeId) {
  const keys = new Set();
  for (const row of rows || []) {
    if (String(row.categoryId || "") !== String(categoryId || "")) continue;
    if (String(row.typeId || "") !== String(typeId || "")) continue;
    if (String(row.subtypeId || "") !== String(subtypeId || "")) continue;
    keys.add(variantKey(row.variantFields || {}));
  }
  return keys;
}

async function saveImportedCustomOptions(entries, fields, typeId, subtypeId) {
  if (!Array.isArray(entries) || entries.length === 0) return;
  if (!Array.isArray(fields) || fields.length === 0) return;

  const savesByKey = new Map();
  for (const entry of entries) {
    const variantFields = entry?.variantFields || {};
    for (const field of fields) {
      if (field.type !== "select" || field.hidden || !field.allowCustom) continue;
      if (!isFieldVisible(field, variantFields)) continue;

      const value = normalizeText(variantFields[field.key]);
      if (!value) continue;

      const configuredOptions = Array.isArray(field.options) ? field.options : [];
      const alreadyConfigured = configuredOptions.some(
        (option) => normalizeComparable(option) === normalizeComparable(value)
      );
      if (alreadyConfigured) continue;

      savesByKey.set(`${field.key}:${normalizeComparable(value)}`, {
        fieldKey: field.key,
        value,
      });
    }
  }

  for (const save of savesByKey.values()) {
    try {
      await saveCustomOption(Number(typeId), subtypeId ? Number(subtypeId) : null, save.fieldKey, save.value);
    } catch (err) {
      console.warn(`Failed to save imported custom option ${save.fieldKey}="${save.value}"`, err);
    }
  }
}

export default function PriceListImportPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [categories, setCategories] = useState([]);
  const [allTypes, setAllTypes] = useState([]);
  const [existingRows, setExistingRows] = useState([]);
  const [categoryId, setCategoryId] = useState("");
  const [typeId, setTypeId] = useState("");
  const [subtypeId, setSubtypeId] = useState("");
  const [fields, setFields] = useState([]);
  const [fieldsLoading, setFieldsLoading] = useState(false);
  const [parsedRows, setParsedRows] = useState([]);
  const [selectedKeys, setSelectedKeys] = useState(new Set());
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const seededCustomOptionKeysRef = useRef(new Set());

  useEffect(() => {
    Promise.all([getServiceCategories(), getServiceTypes(), getPriceList()])
      .then(([cats, types, prices]) => {
        setCategories(Array.isArray(cats) ? cats : []);
        setAllTypes(Array.isArray(types) ? types : []);
        setExistingRows(normalizePriceListEntries(prices));
      })
      .catch(() => {
        setCategories([]);
        setAllTypes([]);
        setExistingRows([]);
      });
  }, []);

  const typeOptions = useMemo(
    () => allTypes.filter((type) => String(type.categoryId) === String(categoryId) && !type.parentId),
    [allTypes, categoryId]
  );
  const subtypeOptions = useMemo(
    () => allTypes.filter((type) => String(type.parentId) === String(typeId)),
    [allTypes, typeId]
  );
  const selectedType = useMemo(
    () => allTypes.find((type) => String(type.id) === String(typeId)),
    [allTypes, typeId]
  );
  const selectedSubtype = useMemo(
    () => allTypes.find((type) => String(type.id) === String(subtypeId)),
    [allTypes, subtypeId]
  );
  const resolvedServiceTypeId = subtypeId || (subtypeOptions.length ? "" : typeId);
  const canUseTemplate = !!categoryId && !!typeId && (!subtypeOptions.length || !!subtypeId);
  const templateColumns = useMemo(() => buildTemplateColumns(fields), [fields]);
  const existingKeys = useMemo(
    () => buildExistingKeys(existingRows, categoryId, typeId, subtypeId || null),
    [existingRows, categoryId, typeId, subtypeId]
  );

  const groups = useMemo(() => {
    const grouped = new Map();
    for (const row of parsedRows) {
      if (row.errors.length) continue;
      const key = variantKey(row.variantFields);
      if (!grouped.has(key)) {
        grouped.set(key, {
          key,
          variantFields: row.variantFields,
          rows: [],
          duplicate: existingKeys.has(key),
        });
      }
      grouped.get(key).rows.push(row);
    }
    return Array.from(grouped.values()).map((group) => ({
      ...group,
      selected: selectedKeys.has(group.key),
    }));
  }, [parsedRows, existingKeys, selectedKeys]);

  const importableGroups = groups.filter((group) => !group.duplicate);
  const selectedGroups = groups.filter((group) => group.selected && !group.duplicate);

  useEffect(() => {
    if (!canUseTemplate || !fields.length || !existingRows.length) return;
    const selectedSubtypeId = subtypeId || null;
    const seedKey = `${categoryId}:${typeId}:${selectedSubtypeId || ""}:${existingRows.length}`;
    if (seededCustomOptionKeysRef.current.has(seedKey)) return;
    seededCustomOptionKeysRef.current.add(seedKey);

    const matchingEntries = existingRows.filter((row) =>
      String(row.categoryId || "") === String(categoryId || "")
      && String(row.typeId || "") === String(typeId || "")
      && String(row.subtypeId || "") === String(selectedSubtypeId || "")
    );
    if (!matchingEntries.length) return;

    saveImportedCustomOptions(matchingEntries, fields, typeId, selectedSubtypeId);
  }, [canUseTemplate, categoryId, typeId, subtypeId, fields, existingRows]);

  useEffect(() => {
    setParsedRows([]);
    setSelectedKeys(new Set());
    setMessage("");
    setError("");
    if (!resolvedServiceTypeId) {
      setFields([]);
      return;
    }
    let cancelled = false;
    setFieldsLoading(true);
    getFieldsByServiceType(resolvedServiceTypeId)
      .then((data) => {
        if (cancelled) return;
        setFields((Array.isArray(data) ? data : []).map(mapFieldConfig));
      })
      .catch(() => {
        if (!cancelled) setFields([]);
      })
      .finally(() => {
        if (!cancelled) setFieldsLoading(false);
      });
    return () => { cancelled = true; };
  }, [resolvedServiceTypeId]);

  function resetProductSelection(nextCategoryId) {
    setCategoryId(nextCategoryId);
    setTypeId("");
    setSubtypeId("");
    setFields([]);
    setParsedRows([]);
    setSelectedKeys(new Set());
  }

  function handleDownloadTemplate() {
    if (!canUseTemplate) return;
    const variantValues = fields
      .filter((field) => !field.hidden)
      .flatMap((field) => {
        const values = [sampleForField(field)];
        if (field.hasUnit) values.push(field.defaultUnit || field.unitOptions[0] || "mm");
        return values;
      });
    const rows = [
      [...variantValues, "1", "100", "2.5"],
      [...variantValues, "101", "500", "2.1"],
    ];
    const productName = normalizeText(selectedSubtype?.name || selectedType?.name || "price-list")
      .replace(/[^a-z0-9]+/gi, "-")
      .replace(/^-|-$/g, "")
      .toLowerCase();
    downloadCSV(`${productName || "price-list"}-price-template.csv`, templateColumns, rows);
  }

  function handleFileChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      const csvRows = parseCSV(loadEvent.target?.result || "");
      if (csvRows.length < 2) {
        setParsedRows([]);
        setSelectedKeys(new Set());
        setError("CSV must include a header row and at least one data row.");
        return;
      }
      const headers = csvRows[0].map(normalizeText);
      const rows = csvRows.slice(1).map((cells, index) => {
        const values = {};
        headers.forEach((header, headerIndex) => {
          values[header] = normalizeText(cells[headerIndex]);
        });
        const raw = { rowNumber: index + 2, values };
        const variantFields = buildVariantFields(fields, values);
        const errors = validateRow(raw, fields, headers);
        return {
          ...raw,
          key: `${index}-${variantKey(variantFields)}`,
          variantFields,
          quantitySlab: {
            minQty: Number(values.minQty),
            maxQty: Number(values.maxQty),
            pricePerPiece: Number(values.pricePerPiece),
          },
          errors,
        };
      });
      setParsedRows(rows);
      setSelectedKeys(new Set());
      setMessage("");
      setError("");
    };
    reader.readAsText(file);
  }

  function toggleGroup(key) {
    setSelectedKeys((previous) => {
      const next = new Set(previous);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function selectAllImportable() {
    setSelectedKeys(new Set(importableGroups.map((group) => group.key)));
  }

  async function handleImport() {
    setError("");
    setMessage("");
    if (!selectedGroups.length) {
      setError("Select at least one valid non-duplicate group to import.");
      return;
    }

    const entries = selectedGroups.map((group) => ({
      categoryId,
      typeId,
      subtypeId: subtypeId || null,
      typeName: selectedType?.name || "",
      subtypeName: selectedSubtype?.name || "",
      variantFields: group.variantFields,
      quantitySlabs: group.rows.map((row) => row.quantitySlab),
    }));

    setImporting(true);
    try {
      const result = await importPriceEntries(entries);
      const importedEntries = (result.results || [])
        .filter((item) => item.ok)
        .map((item) => item.entry || item.originalEntry)
        .filter(Boolean);
      await saveImportedCustomOptions(importedEntries, fields, typeId, subtypeId || null);

      if (result.failed > 0) {
        setError(`${result.created} imported, ${result.failed} failed. Please retry failed rows.`);
      } else {
        setMessage(`${result.created} price entr${result.created === 1 ? "y" : "ies"} imported successfully.`);
        const refreshed = await getPriceList();
        setExistingRows(normalizePriceListEntries(refreshed));
        setParsedRows((previous) => previous.filter((row) => !selectedKeys.has(variantKey(row.variantFields))));
        setSelectedKeys(new Set());
      }
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Import failed.");
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="products-shell">
      <PageHeader
        title="Import Price List"
        breadcrumb={[
          { label: "Dashboard", path: "/admin-dashboard" },
          { label: "Services", path: "" },
          { label: "Price List", path: "/services/price-list" },
          { label: "Import", path: "" },
        ]}
      />

      <div className="leads-page-body">
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
          <button className="btn btn-outline-secondary btn-sm" onClick={() => navigate("/services/price-list")}>
            <i className="ti ti-arrow-left me-1" />
            Back to Price List
          </button>
          <div className="text-muted small">CSV import is product-wise, so each template matches the selected product config.</div>
        </div>

        <div className="card mb-3">
          <div className="card-body">
            <h6 className="card-title">Step 1 - Select Product</h6>
            <div className="row g-3">
              <div className="col-md-4">
                <label className="form-label">Category</label>
                <select className="form-select" value={categoryId} onChange={(e) => resetProductSelection(e.target.value)}>
                  <option value="">Select category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-4">
                <label className="form-label">Product</label>
                <select
                  className="form-select"
                  value={typeId}
                  disabled={!categoryId}
                  onChange={(e) => {
                    setTypeId(e.target.value);
                    setSubtypeId("");
                    setParsedRows([]);
                    setSelectedKeys(new Set());
                  }}
                >
                  <option value="">Select product</option>
                  {typeOptions.map((type) => (
                    <option key={type.id} value={type.id}>{type.name}</option>
                  ))}
                </select>
              </div>
              {subtypeOptions.length > 0 && (
                <div className="col-md-4">
                  <label className="form-label">Sub-product</label>
                  <select
                    className="form-select"
                    value={subtypeId}
                    onChange={(e) => {
                      setSubtypeId(e.target.value);
                      setParsedRows([]);
                      setSelectedKeys(new Set());
                    }}
                  >
                    <option value="">Select sub-product</option>
                    {subtypeOptions.map((subtype) => (
                      <option key={subtype.id} value={subtype.id}>{subtype.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="card mb-3">
          <div className="card-body">
            <h6 className="card-title">Step 2 - Download Template</h6>
            <p className="text-muted mb-2">
              The template columns are generated from this product's Product Field Config.
            </p>
            <button
              className="btn btn-outline-primary btn-sm"
              disabled={!canUseTemplate || fieldsLoading}
              onClick={handleDownloadTemplate}
            >
              <i className="ti ti-download me-1" />
              {fieldsLoading ? "Loading fields..." : "Download CSV Template"}
            </button>
            {canUseTemplate && (
              <div className="mt-2 small text-muted">
                Columns: {templateColumns.join(", ")}
              </div>
            )}
          </div>
        </div>

        <div className="card mb-3">
          <div className="card-body">
            <h6 className="card-title">Step 3 - Upload CSV</h6>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              className="form-control"
              style={{ maxWidth: 420 }}
              disabled={!canUseTemplate || fieldsLoading}
              onChange={handleFileChange}
            />
          </div>
        </div>

        {(error || message) && (
          <div className={`alert py-2 ${error ? "alert-danger" : "alert-success"}`}>
            {error || message}
          </div>
        )}

        {parsedRows.length > 0 && (
          <div className="card mb-3">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
                <h6 className="card-title mb-0">Preview</h6>
                <div className="d-flex gap-2">
                  <button className="btn btn-outline-secondary btn-sm" onClick={selectAllImportable}>
                    Select All Valid
                  </button>
                  <button
                    className="btn btn-success btn-sm"
                    disabled={importing || selectedGroups.length === 0}
                    onClick={handleImport}
                  >
                    {importing ? "Importing..." : `Import ${selectedGroups.length} Entr${selectedGroups.length === 1 ? "y" : "ies"}`}
                  </button>
                </div>
              </div>

              <div className="table-responsive">
                <table className="table table-sm table-bordered table-hover">
                  <thead>
                    <tr>
                      <th style={{ width: 44 }} />
                      <th>Variant</th>
                      <th>Slabs</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groups.map((group) => {
                      const badges = Object.entries(group.variantFields || {})
                        .filter(([key, value]) => !NON_VARIANT_KEYS.has(key) && normalizeText(value));
                      return (
                        <tr key={group.key} className={group.duplicate ? "table-warning" : ""}>
                          <td>
                            {!group.duplicate && (
                              <input
                                type="checkbox"
                                checked={group.selected}
                                onChange={() => toggleGroup(group.key)}
                              />
                            )}
                          </td>
                          <td>
                            {badges.length ? (
                              <div className="d-flex flex-wrap gap-1">
                                {badges.map(([key, value]) => (
                                  <span key={key} className="badge text-bg-light border">
                                    {key}: {String(value)}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-muted">No variant fields</span>
                            )}
                          </td>
                          <td>
                            {group.rows.map((row) => (
                              <div key={row.rowNumber}>
                                <small>
                                  Row {row.rowNumber}: {row.quantitySlab.minQty}-{row.quantitySlab.maxQty} pcs: Rs.{row.quantitySlab.pricePerPiece}/pc
                                </small>
                              </div>
                            ))}
                          </td>
                          <td>
                            {group.duplicate ? (
                              <span className="badge bg-warning text-dark">Duplicate skipped</span>
                            ) : (
                              <span className="badge bg-success">Ready</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                    {parsedRows.filter((row) => row.errors.length).map((row) => (
                      <tr key={row.key} className="table-danger">
                        <td />
                        <td>Row {row.rowNumber}</td>
                        <td colSpan={2}>{row.errors.join("; ")}</td>
                      </tr>
                    ))}
                    {groups.length === 0 && parsedRows.every((row) => row.errors.length) && (
                      <tr>
                        <td colSpan={4} className="text-center text-muted py-3">No valid rows to import.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
