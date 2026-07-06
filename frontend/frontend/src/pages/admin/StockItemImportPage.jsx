import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../../components/admin/PageHeader";
import { getStockCategories, getStockItems, importStockItems } from "../../api/stocksApi";
import "./PriceListPage.css"; // Reuse existing css styles for import flow

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

function validateRow(row, categoryFields, headers) {
  const errors = [];
  const headerSet = new Set(headers);

  if (!headerSet.has("name")) {
    errors.push("Missing name column");
  } else if (!normalizeText(row.values.name)) {
    errors.push("Name is required");
  }

  if (headerSet.has("quantity")) {
    const qty = Number(row.values.quantity);
    if (normalizeText(row.values.quantity) && Number.isNaN(qty)) {
      errors.push("Quantity must be a number");
    }
  }

  if (headerSet.has("minThreshold")) {
    const threshold = Number(row.values.minThreshold);
    if (normalizeText(row.values.minThreshold) && Number.isNaN(threshold)) {
      errors.push("Minimum Threshold must be a number");
    }
  }

  // Validate custom dynamic fields
  for (const field of categoryFields || []) {
    if (!headerSet.has(field.name)) continue;
    const value = normalizeText(row.values[field.name]);
    if ((field.type === "number" || field.type === "number-unit") && value) {
      if (Number.isNaN(Number(value))) {
        errors.push(`${field.name} must be a number`);
      }
    }
  }

  return errors;
}

export default function StockItemImportPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [categories, setCategories] = useState([]);
  const [existingItems, setExistingItems] = useState([]);
  const [categoryId, setCategoryId] = useState("");
  const [parsedRows, setParsedRows] = useState([]);
  const [selectedKeys, setSelectedKeys] = useState(new Set());
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getStockCategories(), getStockItems()])
      .then(([cats, items]) => {
        setCategories(cats || []);
        setExistingItems(items || []);
      })
      .catch((err) => {
        console.error("Failed to load stock categories or items", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const selectedCategory = useMemo(() => {
    return categories.find((cat) => String(cat.id) === String(categoryId)) || null;
  }, [categories, categoryId]);

  const templateColumns = useMemo(() => {
    const cols = ["name", "quantity", "minThreshold"];
    if (selectedCategory && Array.isArray(selectedCategory.fields)) {
      selectedCategory.fields.forEach((f) => {
        if (f.name) cols.push(f.name);
      });
    }
    return cols;
  }, [selectedCategory]);

  const existingNames = useMemo(() => {
    const names = new Set();
    existingItems.forEach((item) => {
      if (String(item.categoryId) === String(categoryId) && item.name) {
        names.add(normalizeComparable(item.name));
      }
    });
    return names;
  }, [existingItems, categoryId]);

  const previewRows = useMemo(() => {
    const rows = [];
    for (const row of parsedRows) {
      if (row.errors.length) {
        rows.push(row);
        continue;
      }
      const nameKey = normalizeComparable(row.values.name);
      const isDuplicate = existingNames.has(nameKey);
      rows.push({
        ...row,
        duplicate: isDuplicate,
        selected: selectedKeys.has(row.key) && !isDuplicate,
      });
    }
    return rows;
  }, [parsedRows, existingNames, selectedKeys]);

  const importableRows = previewRows.filter((r) => !r.duplicate && !r.errors.length);
  const selectedRows = previewRows.filter((r) => r.selected && !r.duplicate && !r.errors.length);

  function resetSelection(nextCategoryId) {
    setCategoryId(nextCategoryId);
    setParsedRows([]);
    setSelectedKeys(new Set());
    setMessage("");
    setError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleDownloadTemplate() {
    if (!selectedCategory) return;
    const sampleRow = ["Sample Item", "10", "2"];
    if (Array.isArray(selectedCategory.fields)) {
      selectedCategory.fields.forEach((f) => {
        if (f.type === "dropdown" && f.options?.length) {
          sampleRow.push(f.options[0]);
        } else if (f.type === "number" || f.type === "number-unit") {
          sampleRow.push("50");
        } else {
          sampleRow.push("Sample Value");
        }
      });
    }
    const catName = normalizeText(selectedCategory.name)
      .replace(/[^a-z0-9]+/gi, "-")
      .toLowerCase();
    downloadCSV(`stock-template-${catName || "items"}.csv`, templateColumns, [sampleRow]);
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
        const errors = validateRow(raw, selectedCategory?.fields || [], headers);
        return {
          ...raw,
          key: `row-${index}-${normalizeText(values.name)}`,
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

  function toggleRow(key) {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function selectAllImportable() {
    setSelectedKeys(new Set(importableRows.map((r) => r.key)));
  }

  async function handleImport() {
    setError("");
    setMessage("");
    if (!selectedRows.length) {
      setError("Select at least one valid item to import.");
      return;
    }

    const payloads = selectedRows.map((row) => {
      const customValues = {};
      if (selectedCategory && Array.isArray(selectedCategory.fields)) {
        selectedCategory.fields.forEach((f) => {
          if (row.values[f.name] !== undefined) {
            customValues[f.name] = row.values[f.name];
          }
        });
      }
      return {
        categoryId: Number(categoryId),
        name: row.values.name,
        quantity: Number(row.values.quantity) || 0,
        minThreshold: Number(row.values.minThreshold) || 0,
        values: customValues,
      };
    });

    setImporting(true);
    try {
      const result = await importStockItems(payloads);
      if (result.failed > 0) {
        setError(`${result.created} items imported, ${result.failed} failed.`);
      } else {
        setMessage(`${result.created} item(s) imported successfully.`);
        // Reload items list and filter imported rows
        const refreshed = await getStockItems();
        setExistingItems(refreshed);
        const importedKeys = new Set(selectedRows.map((r) => r.key));
        setParsedRows((prev) => prev.filter((r) => !importedKeys.has(r.key)));
        setSelectedKeys(new Set());
        if (fileInputRef.current) fileInputRef.current.value = "";
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
        title="Import Stock Items"
        breadcrumb={[
          { label: "Dashboard", path: "/admin-dashboard" },
          { label: "Stocks", path: "" },
          { label: "Items", path: "/stocks/item" },
          { label: "Import", path: "" },
        ]}
      />

      <div className="leads-page-body">
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
          <button className="btn btn-outline-secondary btn-sm" onClick={() => navigate("/stocks/item")}>
            <i className="ti ti-arrow-left me-1" />
            Back to Items
          </button>
          <div className="text-muted small">Import items category-wise. Dynamically reflects configured category fields.</div>
        </div>

        {/* Step 1: Select Category */}
        <div className="card mb-3">
          <div className="card-body">
            <h6 className="card-title">Step 1 - Select Category</h6>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label">Category</label>
                <select className="form-select" value={categoryId} onChange={(e) => resetSelection(e.target.value)}>
                  <option value="">Select category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Step 2: Download Template */}
        <div className="card mb-3">
          <div className="card-body">
            <h6 className="card-title">Step 2 - Download Template</h6>
            <p className="text-muted mb-2">
              The template columns match the specific dynamic fields of the selected stock category.
            </p>
            <button
              className="btn btn-outline-primary btn-sm"
              disabled={!categoryId}
              onClick={handleDownloadTemplate}
            >
              <i className="ti ti-download me-1" />
              Download CSV Template
            </button>
            {selectedCategory && (
              <div className="mt-2 small text-muted">
                Columns: {templateColumns.join(", ")}
              </div>
            )}
          </div>
        </div>

        {/* Step 3: Upload CSV */}
        <div className="card mb-3">
          <div className="card-body">
            <h6 className="card-title">Step 3 - Upload CSV</h6>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              className="form-control"
              style={{ maxWidth: 420 }}
              disabled={!categoryId}
              onChange={handleFileChange}
            />
          </div>
        </div>

        {(error || message) && (
          <div className={`alert py-2 ${error ? "alert-danger" : "alert-success"}`}>
            {error || message}
          </div>
        )}

        {/* Preview and Confirm */}
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
                    disabled={importing || selectedRows.length === 0}
                    onClick={handleImport}
                  >
                    {importing ? "Importing..." : `Import ${selectedRows.length} Item(s)`}
                  </button>
                </div>
              </div>

              <div className="table-responsive">
                <table className="table table-sm table-bordered table-hover">
                  <thead>
                    <tr>
                      <th style={{ width: 44 }} />
                      <th>Name</th>
                      <th>Quantity</th>
                      <th>Min Threshold</th>
                      <th>Dynamic Fields</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.map((row) => {
                      const dynamicValues = Object.entries(row.values).filter(
                        ([key]) => key !== "name" && key !== "quantity" && key !== "minThreshold"
                      );

                      if (row.errors.length) {
                        return (
                          <tr key={row.key} className="table-danger">
                            <td />
                            <td colSpan={4}>Row {row.rowNumber}: {row.errors.join("; ")}</td>
                            <td><span className="badge bg-danger">Error</span></td>
                          </tr>
                        );
                      }

                      return (
                        <tr key={row.key} className={row.duplicate ? "table-warning" : ""}>
                          <td>
                            {!row.duplicate && (
                              <input
                                type="checkbox"
                                checked={row.selected || false}
                                onChange={() => toggleRow(row.key)}
                              />
                            )}
                          </td>
                          <td>{row.values.name}</td>
                          <td>{row.values.quantity || 0}</td>
                          <td>{row.values.minThreshold || 0}</td>
                          <td>
                            {dynamicValues.length ? (
                              <div className="d-flex flex-wrap gap-1">
                                {dynamicValues.map(([k, v]) => (
                                  <span key={k} className="badge text-bg-light border">
                                    {k}: {v}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-muted small">None</span>
                            )}
                          </td>
                          <td>
                            {row.duplicate ? (
                              <span className="badge bg-warning text-dark">Duplicate Name (Skipped)</span>
                            ) : (
                              <span className="badge bg-success">Ready</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
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
