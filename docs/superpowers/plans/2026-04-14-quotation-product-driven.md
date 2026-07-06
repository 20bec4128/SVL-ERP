# Quotation — Product-Driven Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the requirement-driven quotation flow with a product-driven cart-style flow using a three-step `AddItemModal`, while preserving all existing pricing, PDF, and save logic.

**Architecture:** Surgical refactor — only three files change. `SpecsInlineForm.jsx` is a pure field renderer. `AddItemModal.jsx` owns the three-step product selection flow and emits a complete `lineItem` object. `QuotationPage.jsx` drops its old add-dialog state and wires the modal.

**Tech Stack:** React 18, Bootstrap 5 classes, existing `productFieldConfigs.js`, existing `findSlab` + `getVariantSummary` logic (duplicated locally in the modal — pure functions, no shared state).

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `frontend/frontend/src/pages/admin/SpecsInlineForm.jsx` | **Create** | Pure controlled renderer for dynamic spec fields |
| `frontend/frontend/src/pages/admin/AddItemModal.jsx` | **Create** | Three-step product selector modal: type → subtype → variant + qty + specs |
| `frontend/frontend/src/pages/admin/QuotationPage.jsx` | **Modify** | Remove old dialog state/JSX; add `+ Add Item` button; wire `AddItemModal`; demote requirements buttons |

---

## Task 1: Create `SpecsInlineForm.jsx`

**Files:**
- Create: `frontend/frontend/src/pages/admin/SpecsInlineForm.jsx`

This component is a pure controlled field renderer. It reads `typeName`, looks up the field config array from `productFieldConfigs.js`, and renders each field. No business logic. No side effects.

**Hidden-field rule:** Fields with `hidden: true` are only shown when the most recent preceding `allowCustom` field has its value set to `"Custom"` in `specs`. Precompute the parent key with a linear scan before rendering.

- [ ] **Step 1: Create the file with the complete component**

```jsx
// frontend/frontend/src/pages/admin/SpecsInlineForm.jsx
import React from "react";
import {
  ACCESSORY_FIELDS,
  AGRALIC_2D_FIELDS,
  AGRALIC_3D_FIELDS,
  BIRIYANI_BOX_FIELDS,
  BLACK_LIGHT_FLEX_FIELDS,
  BOTH_SIDE_TRANSPARENT_POUCH_FIELDS,
  BOX_PACKAGING_FIELDS,
  BRANDING_BOX_FIELDS,
  BROCHURE_FIELDS,
  BURGER_BOX_FIELDS,
  CAKE_BOX_FIELDS,
  CORRUGATED_ROLL_FIELDS,
  CORRUGATED_SHEET_FIELDS,
  CUSTOM_PAPER_STICKER_FIELDS,
  DAILY_CALENDAR_FIELDS,
  DAIRY_FIELDS,
  DOCTOR_FILE_FIELDS,
  ENVELOPE_FIELDS,
  FLEX_PRINTING_FIELDS,
  FLEX_WITH_COLOUR_AND_VARIENT_FIELDS,
  FLEX_WITH_COLOUR_FIELDS,
  FOAM_STICKER_FIELDS,
  FOOD_CUP_FIELDS,
  ICE_CREAM_FIELDS,
  JAR_CAKE_FIELDS,
  LED_CUTTING_WITH_LIGHTING_FIELDS,
  MONOCOTTON_BOX_FIELDS,
  MONTHLY_CALENDAR_FIELDS,
  NOTEPAD_FIELDS,
  ONE_SIDE_SILVER_ONE_SIDE_TRANSPARENT_POUCH_FIELDS,
  PAMPHLET_FIELDS,
  PLAIN_CUSTOMIZED_BOX_FIELDS,
  POCKET_CALENDAR_FIELDS,
  POLYCARBONATE_STICKER_FIELDS,
  POPCORN_BOX_FIELDS,
  PRINTING_ZIPPER_POUCH_FIELDS,
  REFLECTOR_FLEX_FIELDS,
  SANDWICH_WAFFLE_BOX_FIELDS,
  TABLE_TOP_CALENDAR_FIELDS,
  VINYL_STICKER_FIELDS,
  VISITING_CARD_FIELDS,
  WOOD_PLASTIC_SPOON_FIELDS,
  WRAP_FIELDS,
  ZIPPER_POUCH_FIELDS,
  ZIPPER_POUCH_PLAIN_FIELDS,
} from "../../utils/productFieldConfigs";

// Keys must match the typeName values returned by the backend price list API.
// If a typeName has no entry here, SpecsInlineForm renders nothing — which is fine.
const TYPE_FIELD_MAP = {
  "Box Packaging": BOX_PACKAGING_FIELDS,
  "Food Cup": FOOD_CUP_FIELDS,
  "Wrap": WRAP_FIELDS,
  "Accessory": ACCESSORY_FIELDS,
  "Wood Plastic Spoon": WOOD_PLASTIC_SPOON_FIELDS,
  "Ice Cream": ICE_CREAM_FIELDS,
  "Monocotton Box": MONOCOTTON_BOX_FIELDS,
  "Branding Box": BRANDING_BOX_FIELDS,
  "Plain Customized Box": PLAIN_CUSTOMIZED_BOX_FIELDS,
  "Flex Printing": FLEX_PRINTING_FIELDS,
  "Flex With Colour": FLEX_WITH_COLOUR_FIELDS,
  "Flex With Colour And Varient": FLEX_WITH_COLOUR_AND_VARIENT_FIELDS,
  "Visiting Card": VISITING_CARD_FIELDS,
  "Reflector Flex": REFLECTOR_FLEX_FIELDS,
  "Black Light Flex": BLACK_LIGHT_FLEX_FIELDS,
  "LED Cutting With Lighting": LED_CUTTING_WITH_LIGHTING_FIELDS,
  "Agralic 2D": AGRALIC_2D_FIELDS,
  "Agralic 3D": AGRALIC_3D_FIELDS,
  "Custom Paper Sticker": CUSTOM_PAPER_STICKER_FIELDS,
  "Vinyl Sticker": VINYL_STICKER_FIELDS,
  "Polycarbonate Sticker": POLYCARBONATE_STICKER_FIELDS,
  "Foam Sticker": FOAM_STICKER_FIELDS,
  "Zipper Pouch": ZIPPER_POUCH_FIELDS,
  "Zipper Pouch Plain": ZIPPER_POUCH_PLAIN_FIELDS,
  "Both Side Transparent Pouch": BOTH_SIDE_TRANSPARENT_POUCH_FIELDS,
  "Printing Zipper Pouch": PRINTING_ZIPPER_POUCH_FIELDS,
  "One Side Silver One Side Transparent Pouch": ONE_SIDE_SILVER_ONE_SIDE_TRANSPARENT_POUCH_FIELDS,
  "Envelope": ENVELOPE_FIELDS,
  "Notepad": NOTEPAD_FIELDS,
  "Dairy": DAIRY_FIELDS,
  "Daily Calendar": DAILY_CALENDAR_FIELDS,
  "Monthly Calendar": MONTHLY_CALENDAR_FIELDS,
  "Pocket Calendar": POCKET_CALENDAR_FIELDS,
  "Table Top Calendar": TABLE_TOP_CALENDAR_FIELDS,
  "Doctor File": DOCTOR_FILE_FIELDS,
  "Pamphlet": PAMPHLET_FIELDS,
  "Brochure": BROCHURE_FIELDS,
  "Corrugated Roll": CORRUGATED_ROLL_FIELDS,
  "Corrugated Sheet": CORRUGATED_SHEET_FIELDS,
  "Cake Box": CAKE_BOX_FIELDS,
  "Jar Cake": JAR_CAKE_FIELDS,
  "Sandwich Waffle Box": SANDWICH_WAFFLE_BOX_FIELDS,
  "Burger Box": BURGER_BOX_FIELDS,
  "Popcorn Box": POPCORN_BOX_FIELDS,
  "Biriyani Box": BIRIYANI_BOX_FIELDS,
};

export default function SpecsInlineForm({ typeName, specs, onChange }) {
  const fields = TYPE_FIELD_MAP[typeName] ?? [];
  if (!fields.length) return null;

  function handleChange(key, value) {
    onChange({ ...specs, [key]: value });
  }

  // Build parent-key map for hidden fields before rendering
  // Hidden fields are only visible when their preceding allowCustom field === "Custom"
  const hiddenParentMap = {};
  let lastAllowCustomKey = null;
  for (const field of fields) {
    if (field.allowCustom) lastAllowCustomKey = field.key;
    if (field.hidden) hiddenParentMap[field.key] = lastAllowCustomKey;
  }

  const rendered = [];
  let trackCustomKey = null;
  for (const field of fields) {
    if (field.allowCustom) trackCustomKey = field.key;

    if (field.hidden) {
      const parentKey = hiddenParentMap[field.key];
      if (!parentKey || specs[parentKey] !== "Custom") continue;
    }

    rendered.push(
      <div key={field.key} className="col-md-4">
        <label className="form-label small mb-1">{field.label}</label>
        {field.type === "select" ? (
          <>
            <select
              className="form-select form-select-sm"
              value={specs[field.key] ?? ""}
              onChange={(e) => handleChange(field.key, e.target.value)}
            >
              <option value="">--</option>
              {(field.options ?? []).map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
            {field.allowCustom && specs[field.key] === "Custom" && (
              <input
                type="text"
                className="form-control form-control-sm mt-1"
                placeholder={field.customPlaceholder ?? "Enter custom value"}
                value={specs[`${field.key}Custom`] ?? ""}
                onChange={(e) => handleChange(`${field.key}Custom`, e.target.value)}
              />
            )}
          </>
        ) : (
          <input
            type={field.type === "number" ? "number" : "text"}
            className="form-control form-control-sm"
            placeholder={field.placeholder ?? ""}
            value={specs[field.key] ?? ""}
            onChange={(e) => handleChange(field.key, e.target.value)}
          />
        )}
      </div>
    );
  }

  return <div className="row g-2">{rendered}</div>;
}
```

- [ ] **Step 2: Verify TYPE_FIELD_MAP keys match actual typeName values in the database**

Open the browser at `http://localhost:5173/price-list` (or wherever the price list is managed).
Look at the "Type" column values. Compare them to the keys in `TYPE_FIELD_MAP` above.
If any typeName in the price list does not match a key, add it to `TYPE_FIELD_MAP` with the correct field array.
If there is no matching field config for a type, leave it out — `SpecsInlineForm` will render nothing for that type.

- [ ] **Step 3: Commit**

```bash
git add frontend/frontend/src/pages/admin/SpecsInlineForm.jsx
git commit -m "feat: add SpecsInlineForm — controlled dynamic spec field renderer"
```

---

## Task 2: Create `AddItemModal.jsx`

**Files:**
- Create: `frontend/frontend/src/pages/admin/AddItemModal.jsx`

This modal owns the full add/edit flow: three-step product drill-down, quantity input, live auto-pricing, inline specs. It calls `onConfirm(lineItem)` with a complete line item and is responsible for building `optionsSummary`.

`findSlab` and `getVariantSummary` are defined locally — they are pure functions copied from `QuotationPage.jsx`. No import coupling between files.

- [ ] **Step 1: Create the file with the complete component**

```jsx
// frontend/frontend/src/pages/admin/AddItemModal.jsx
import React, { useState, useMemo, useEffect } from "react";
import SpecsInlineForm from "./SpecsInlineForm";

// Pure helpers — defined locally to avoid coupling with QuotationPage
function findSlab(quantitySlabs, qty) {
  const list = Array.isArray(quantitySlabs) ? quantitySlabs : [];
  const n = Number(qty);
  if (!n || n <= 0) return null;
  return list.find((s) => n >= Number(s.minQty) && n <= Number(s.maxQty)) ?? null;
}

function formatCustomSize(width, height, depth, unit) {
  if (!width || !height) return "";
  return depth
    ? `${width} x ${height} x ${depth} ${unit || ""}`.trim()
    : `${width} x ${height} ${unit || ""}`.trim();
}

function getVariantSummary(variantFields) {
  const source = variantFields || {};
  const skipKeys = new Set(["customWidth", "customHeight", "customDepth", "customUnit"]);
  const entries = Object.entries(source)
    .filter(([key, value]) =>
      !key.endsWith("Custom") && !key.endsWith("Text") && !skipKeys.has(key) &&
      value !== "" && value != null
    )
    .map(([key, value]) => {
      if (value === "Custom") {
        if (key === "size") {
          const formatted = formatCustomSize(
            source.customWidth, source.customHeight, source.customDepth, source.customUnit
          );
          if (formatted) return [key, formatted];
        }
        if (source[`${key}Custom`]) return [key, source[`${key}Custom`]];
      }
      return [key, value];
    });
  if (!entries.length) return "-";
  const shown = entries.slice(0, 3).map(([, v]) => v).join(", ");
  return entries.length > 3 ? `${shown} +${entries.length - 3} more` : shown;
}

export default function AddItemModal({ open, priceList, prefill, onConfirm, onClose }) {
  const [step, setStep] = useState(1);
  const [selectedTypeId, setSelectedTypeId] = useState(null);
  const [selectedSubtypeId, setSelectedSubtypeId] = useState(null);
  const [selectedEntryId, setSelectedEntryId] = useState(null);
  const [quantity, setQuantity] = useState("");
  const [specs, setSpecs] = useState({});
  const [error, setError] = useState("");
  const [priceUpdated, setPriceUpdated] = useState(false);

  // Reset and apply prefill each time modal opens
  useEffect(() => {
    if (!open) return;
    const hasType = prefill?.typeId != null;
    setStep(hasType ? 2 : 1);
    setSelectedTypeId(prefill?.typeId ?? null);
    setSelectedSubtypeId(prefill?.subtypeId ?? null);
    setSelectedEntryId(prefill?.productId ?? null);
    setQuantity(prefill?.quantity != null ? String(prefill.quantity) : "");
    setSpecs(prefill?.specs ?? {});
    setError("");
    setPriceUpdated(false);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  // Derived: unique types from price list
  const types = useMemo(() => {
    const seen = new Map();
    for (const p of priceList) {
      if (!seen.has(p.typeId)) seen.set(p.typeId, { id: p.typeId, name: p.typeName });
    }
    return [...seen.values()];
  }, [priceList]);

  // Derived: unique subtypes for selected type
  const subtypes = useMemo(() => {
    if (!selectedTypeId) return [];
    const filtered = priceList.filter((p) => Number(p.typeId) === Number(selectedTypeId));
    const seen = new Map();
    for (const p of filtered) {
      const key = p.subtypeId ?? "__none__";
      if (!seen.has(key)) seen.set(key, { id: p.subtypeId, name: p.subtypeName });
    }
    return [...seen.values()];
  }, [priceList, selectedTypeId]);

  // Derived: candidate price entries for selected type + subtype
  const candidates = useMemo(() => {
    if (!selectedTypeId) return [];
    return priceList.filter((p) => {
      const typeMatch = Number(p.typeId) === Number(selectedTypeId);
      const subMatch =
        selectedSubtypeId == null
          ? p.subtypeId == null
          : Number(p.subtypeId) === Number(selectedSubtypeId);
      return typeMatch && subMatch;
    });
  }, [priceList, selectedTypeId, selectedSubtypeId]);

  const selectedEntry = useMemo(
    () => candidates.find((c) => Number(c.id) === Number(selectedEntryId)) ?? null,
    [candidates, selectedEntryId]
  );

  const selectedTypeName = useMemo(
    () => types.find((t) => Number(t.id) === Number(selectedTypeId))?.name ?? "",
    [types, selectedTypeId]
  );

  const selectedSubtypeName = useMemo(
    () => subtypes.find((s) => s.id === selectedSubtypeId)?.name ?? null,
    [subtypes, selectedSubtypeId]
  );

  // Auto-pricing — reacts to every quantity keystroke
  const slab = useMemo(
    () => findSlab(selectedEntry?.quantitySlabs, quantity),
    [selectedEntry, quantity]
  );

  const unitPrice = useMemo(() => {
    if (!slab) return null;
    const v = Number(slab.pricePerPiece);
    return Number.isFinite(v) ? v : null;
  }, [slab]);

  const lineTotal = useMemo(
    () => (unitPrice != null && quantity ? Number(quantity) * unitPrice : null),
    [unitPrice, quantity]
  );

  // Auto-advance step 2 when there is only one subtype option
  useEffect(() => {
    if (step === 2 && subtypes.length === 1) {
      setSelectedSubtypeId(subtypes[0].id);
      setSelectedEntryId(null);
      setStep(3);
    }
  }, [step, subtypes]);

  function handleSelectType(typeId) {
    setSelectedTypeId(typeId);
    setSelectedSubtypeId(null);
    setSelectedEntryId(null);
    setError("");
    setStep(2);
  }

  function handleSelectSubtype(subtypeId) {
    setSelectedSubtypeId(subtypeId);
    setSelectedEntryId(null);
    setError("");
    setStep(3);
  }

  function handleQuantityChange(e) {
    setQuantity(e.target.value);
    // Show "Price updated" indicator only during edits where original price existed
    if (prefill?.unitPrice != null) setPriceUpdated(true);
  }

  function handleConfirm() {
    setError("");

    const qty = Number(quantity);
    if (!qty || qty <= 0) {
      setError("Please enter a valid quantity.");
      return;
    }
    if (!selectedEntry) {
      setError("Please select a product variant.");
      return;
    }

    const resolvedUnitPrice = unitPrice ?? 0;
    const pricingStatus = unitPrice != null ? "PRICED" : "UNPRICED";

    // Build optionsSummary for line items table and PDF
    const specParts = Object.entries(specs)
      .filter(([, v]) => v !== "" && v != null)
      .map(([k, v]) => `${k}: ${v}`)
      .slice(0, 6);
    const variantSummary = getVariantSummary(selectedEntry.variantFields);
    const variantPart = variantSummary !== "-" ? `Variant: ${variantSummary}` : "";
    const optionsSummary = [...specParts, variantPart].filter(Boolean).join(", ") || "-";

    const productName = [selectedTypeName, selectedSubtypeName].filter(Boolean).join(" - ");

    onConfirm({
      id: prefill?.id ?? `item-${Date.now()}`,
      productId: Number(selectedEntry.id),
      typeId: selectedEntry.typeId,
      subtypeId: selectedEntry.subtypeId ?? null,
      typeName: selectedEntry.typeName,
      subtypeName: selectedEntry.subtypeName ?? null,
      productName: productName || selectedTypeName,
      quantity: qty,
      unitPrice: resolvedUnitPrice,
      pricePerUnit: resolvedUnitPrice, // kept for PDF compatibility (quotationUtils uses pricePerUnit)
      lineTotal: qty * resolvedUnitPrice,
      pricingStatus,
      specs,
      variantFields: selectedEntry.variantFields ?? {},
      optionsSummary,
      designCost: prefill?.designCost ?? 0,
      priceListEntryId: Number(selectedEntry.id),
    });
  }

  if (!open) return null;

  return (
    <>
      <div className="modal fade show d-block" tabIndex="-1" role="dialog" aria-modal="true">
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">{prefill?.id ? "Edit Item" : "Add Item"}</h5>
              <button type="button" className="btn-close" onClick={onClose}></button>
            </div>

            <div className="modal-body">
              {/* Step breadcrumb */}
              <div className="d-flex gap-2 align-items-center mb-4 small">
                <span className={step >= 1 ? "fw-semibold text-primary" : "text-muted"}>
                  1. Product Type
                </span>
                <i className="ti ti-chevron-right text-muted" />
                <span className={step >= 2 ? "fw-semibold text-primary" : "text-muted"}>
                  2. Subtype
                </span>
                <i className="ti ti-chevron-right text-muted" />
                <span className={step >= 3 ? "fw-semibold text-primary" : "text-muted"}>
                  3. Variant & Qty
                </span>
              </div>

              {/* ── Step 1: Type selection ── */}
              {step === 1 && (
                <div>
                  <p className="text-muted mb-3">Select a product category:</p>
                  {types.length === 0 && (
                    <div className="alert alert-warning">No products in price list yet.</div>
                  )}
                  <div className="row g-2">
                    {types.map((t) => (
                      <div key={t.id} className="col-6 col-md-4">
                        <div
                          role="button"
                          className={`border rounded p-3 text-center${Number(selectedTypeId) === Number(t.id) ? " border-primary bg-primary bg-opacity-10" : ""}`}
                          style={{ cursor: "pointer" }}
                          onClick={() => handleSelectType(t.id)}
                        >
                          {t.name}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Step 2: Subtype selection ── */}
              {step === 2 && (
                <div>
                  <button
                    type="button"
                    className="btn btn-link btn-sm p-0 mb-3 text-decoration-none"
                    onClick={() => { setSelectedSubtypeId(null); setStep(1); }}
                  >
                    ← Back
                  </button>
                  <p className="text-muted mb-3">Select a subtype:</p>
                  <div className="row g-2">
                    {subtypes.map((s) => (
                      <div key={s.id ?? "__none__"} className="col-6 col-md-4">
                        <div
                          role="button"
                          className={`border rounded p-3 text-center${selectedSubtypeId === s.id ? " border-primary bg-primary bg-opacity-10" : ""}`}
                          style={{ cursor: "pointer" }}
                          onClick={() => handleSelectSubtype(s.id)}
                        >
                          {s.name || "(Default)"}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Step 3: Variant + Qty + Specs ── */}
              {step === 3 && (
                <div>
                  <button
                    type="button"
                    className="btn btn-link btn-sm p-0 mb-3 text-decoration-none"
                    onClick={() => {
                      setSelectedEntryId(null);
                      setStep(subtypes.length > 1 ? 2 : 1);
                    }}
                  >
                    ← Back
                  </button>

                  {/* Variant table */}
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Select Variant</label>
                    {candidates.length === 0 ? (
                      <div className="alert alert-warning mb-0">
                        No products configured for this combination.
                      </div>
                    ) : (
                      <div className="table-responsive">
                        <table className="table table-hover table-bordered align-middle mb-0">
                          <thead>
                            <tr>
                              <th style={{ width: 36 }}></th>
                              <th>Variant</th>
                            </tr>
                          </thead>
                          <tbody>
                            {candidates.map((c) => {
                              const isSelected = Number(selectedEntryId) === Number(c.id);
                              return (
                                <tr
                                  key={c.id}
                                  role="button"
                                  style={{ cursor: "pointer", background: isSelected ? "var(--bs-primary-bg-subtle, #e8f0fe)" : "" }}
                                  onClick={() => setSelectedEntryId(c.id)}
                                >
                                  <td className="text-center">
                                    <input type="radio" readOnly checked={isSelected} onChange={() => {}} />
                                  </td>
                                  <td>{getVariantSummary(c.variantFields)}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Quantity + live price */}
                  <div className="row g-3 mb-3 align-items-end">
                    <div className="col-md-4">
                      <label className="form-label fw-semibold">Quantity</label>
                      <input
                        type="number"
                        className="form-control"
                        value={quantity}
                        onChange={handleQuantityChange}
                        min={1}
                        placeholder="Enter quantity"
                      />
                    </div>
                    <div className="col-md-8">
                      <div className="border rounded p-2 bg-light">
                        {unitPrice != null ? (
                          <div className="d-flex justify-content-between align-items-center">
                            <span>
                              Rs.&nbsp;{unitPrice.toFixed(2)} / piece
                              &nbsp;→&nbsp;
                              <strong>Rs.&nbsp;{(lineTotal ?? 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}</strong>
                            </span>
                            {priceUpdated && (
                              <span className="text-muted small ms-2">Price updated</span>
                            )}
                          </div>
                        ) : quantity && selectedEntry ? (
                          <span className="badge bg-danger">PRICE NOT FOUND for this quantity</span>
                        ) : (
                          <span className="text-muted small">Enter quantity to see price</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Inline specs */}
                  {selectedTypeName && (
                    <div className="border-top pt-3">
                      <div className="fw-semibold mb-2">
                        Customization&nbsp;
                        <span className="text-muted small fw-normal">(optional)</span>
                      </div>
                      <SpecsInlineForm typeName={selectedTypeName} specs={specs} onChange={setSpecs} />
                    </div>
                  )}
                </div>
              )}

              {error && (
                <div className="alert alert-danger mt-3 mb-0">
                  <i className="ti ti-alert-circle me-2"></i>{error}
                </div>
              )}
            </div>

            {/* Footer only shown on step 3 */}
            {step === 3 && (
              <div className="modal-footer">
                <button type="button" className="btn btn-outline-secondary" onClick={onClose}>
                  Cancel
                </button>
                <button type="button" className="btn btn-primary" onClick={handleConfirm}>
                  {prefill?.id ? "Update Item" : "Add Item"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="modal-backdrop fade show"></div>
    </>
  );
}
```

- [ ] **Step 2: Verify the file saved correctly**

```bash
ls frontend/frontend/src/pages/admin/AddItemModal.jsx
```
Expected: file exists (no error).

- [ ] **Step 3: Commit**

```bash
git add frontend/frontend/src/pages/admin/AddItemModal.jsx
git commit -m "feat: add AddItemModal — three-step product-driven item selector"
```

---

## Task 3: Modify `QuotationPage.jsx`

**Files:**
- Modify: `frontend/frontend/src/pages/admin/QuotationPage.jsx`

This is the main surgery. Four areas change:
1. State declarations — remove old, add new
2. Computed values (useMemo) — remove six stale computed values
3. Handlers — remove five old handlers, add three new ones
4. JSX — demote requirements table button, add `+ Add Item`, replace old dialog with `<AddItemModal>`

### Part A — Imports

- [ ] **Step 1: Add the AddItemModal import at the top of the file**

Find this line (it's in the imports block):
```js
import "./QuotationPage.css";
```

Replace it with:
```js
import "./QuotationPage.css";
import AddItemModal from "./AddItemModal";
```

### Part B — Remove old state declarations

- [ ] **Step 2: Remove the five old add-dialog state declarations**

Find and delete this block (lines ~160–172 in the original file):
```js
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addRequirement, setAddRequirement] = useState(null);
  const [addQuantity, setAddQuantity] = useState("");
  const [addPriceEntryId, setAddPriceEntryId] = useState("");
  const [configError, setConfigError] = useState("");
  const [lineItems, setLineItems] = useState([]);
```

Replace it with (keep `configError` and `lineItems`, add the two new modal states):
```js
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [configError, setConfigError] = useState("");
  const [lineItems, setLineItems] = useState([]);
```

Then separately find and delete:
```js
  const [editingItemId, setEditingItemId] = useState(null);
```
(This line stands alone after `isSaving`.)

### Part C — Remove stale computed values

- [ ] **Step 3: Remove the six stale useMemo blocks**

Find and delete the entire block from `const addCandidates = useMemo` through the end of `const addComputedUnitPrice = useMemo`. In the original this spans roughly lines 375–405:

```js
  const addCandidates = useMemo(() => {
    ...
  }, [addRequirement, priceList]);

  const addSelectedPriceEntry = useMemo(() => {
    ...
  }, [addPriceEntryId, addCandidates]);

  const addSpecsObj = useMemo(() => safeJsonParse(addRequirement?.specs, {}), [addRequirement?.specs]);
  const addSpecsSummary = useMemo(() => toKeyValueSummary(addSpecsObj), [addSpecsObj]);

  const addSlab = useMemo(
    () => findSlab(addSelectedPriceEntry?.quantitySlabs, addQuantity),
    [addSelectedPriceEntry?.quantitySlabs, addQuantity],
  );

  const addComputedUnitPrice = useMemo(() => {
    ...
  }, [addSlab]);
```

Delete all six of those `useMemo` blocks entirely.

### Part D — Replace old handlers with new ones

- [ ] **Step 4: Remove the five old handler functions**

Find and delete each of these functions in their entirety:

- `openAddFromRequirement` (starts with `const openAddFromRequirement = (req) => {`)
- `closeAddDialog` (starts with `const closeAddDialog = () => {`)
- `handleEditItem` (starts with `const handleEditItem = (item) => {`)
- `handleCancelEdit` (starts with `const handleCancelEdit = () => {`)
- `handleConfirmAddOrUpdate` (starts with `const handleConfirmAddOrUpdate = () => {`)

- [ ] **Step 5: Add the three new handlers in their place**

After the `handlePartyModeChange` function, add:

```js
  function buildPrefill(req) {
    return {
      // no id — so onConfirm will create a new item, not update
      typeId: req.typeId,
      subtypeId: req.subtypeId ?? null,
      typeName: req.typeName,
      subtypeName: req.subtypeName ?? null,
      quantity: req.quantity,
      specs: safeJsonParse(req.specs, {}),
      productId: null, // user must still pick the variant
    };
  }

  function openAddModal(prefill) {
    setEditingItem(prefill ?? null);
    setConfigError("");
    setSaveMessage("");
    setAddModalOpen(true);
  }

  function closeAddModal() {
    setAddModalOpen(false);
    setEditingItem(null);
  }
```

### Part E — JSX changes

- [ ] **Step 6: Demote the "Add to Quotation" button in the requirements table**

Find this button inside the requirements table (inside `requirements.map`):
```jsx
                            <button type="button" className="btn btn-primary btn-sm" onClick={() => openAddFromRequirement(req)}>
                              Add to Quotation
                            </button>
```

Replace it with:
```jsx
                            <button
                              type="button"
                              className="btn btn-link btn-sm p-0 text-muted"
                              onClick={() => openAddModal(buildPrefill(req))}
                            >
                              use as reference
                            </button>
```

- [ ] **Step 7: Add the "+ Add Item" button to the Line Items card header**

Find the Line Items card header:
```jsx
        <div className="card-header">
          <h5 className="card-title mb-0">Line Items</h5>
        </div>
```

Replace it with:
```jsx
        <div className="card-header d-flex justify-content-between align-items-center">
          <h5 className="card-title mb-0">Line Items</h5>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => openAddModal()}
            disabled={!canEditQuotation}
          >
            <i className="ti ti-plus me-1"></i>Add Item
          </button>
        </div>
```

- [ ] **Step 8: Update the Edit button in the line items table**

Find this in the line items table body:
```jsx
                        <button type="button" className="btn btn-primary btn-sm" onClick={() => handleEditItem(item)}>
                          <i className="ti ti-edit"></i>
                        </button>
```

Replace it with:
```jsx
                        <button type="button" className="btn btn-primary btn-sm" onClick={() => openAddModal(item)}>
                          <i className="ti ti-edit"></i>
                        </button>
```

- [ ] **Step 9: Remove the old add dialog JSX**

Find and delete the entire old dialog block. It starts at:
```jsx
      {addDialogOpen && (
        <>
          <div className="modal fade show d-block" ...
```
And ends with its closing:
```jsx
          <div className="modal-backdrop fade show"></div>
        </>
      )}
```

Delete those ~90 lines entirely.

- [ ] **Step 10: Add `<AddItemModal>` just before the closing `</div>` of the page**

Find the very last lines of the return statement:
```jsx
      {approveDialogOpen && (
        ...
      )}
    </div>
  );
}
```

Insert `<AddItemModal>` between the approve dialog block and the closing `</div>`:

```jsx
      {approveDialogOpen && (
        <>
          {/* existing approve dialog — untouched */}
        </>
      )}

      <AddItemModal
        open={addModalOpen}
        priceList={priceList}
        prefill={editingItem}
        onConfirm={(lineItem) => {
          if (editingItem?.id) {
            setLineItems((prev) => prev.map((i) => (i.id === editingItem.id ? lineItem : i)));
          } else {
            setLineItems((prev) => [...prev, lineItem]);
          }
          closeAddModal();
        }}
        onClose={closeAddModal}
      />
    </div>
  );
}
```

### Part F — Verify and commit

- [ ] **Step 11: Check for any remaining references to deleted state**

Search the file for any remaining usage of the deleted variables. None of these should appear:

Use the Grep tool to search for each of these strings in `frontend/frontend/src/pages/admin/QuotationPage.jsx`:
`addDialogOpen`, `addRequirement`, `addQuantity`, `addPriceEntryId`, `editingItemId`, `addCandidates`, `addSelectedPriceEntry`, `addSpecsObj`, `addSpecsSummary`, `addSlab`, `addComputedUnitPrice`, `handleEditItem`, `handleCancelEdit`, `handleConfirmAddOrUpdate`, `openAddFromRequirement`, `closeAddDialog`

Expected: zero matches for each. If any remain, delete or replace them.

- [ ] **Step 12: Start the dev server and do a full manual walkthrough**

```bash
cd frontend/frontend && npm run dev
```

Open `http://localhost:5173/quotation` and verify:

1. **+ Add Item button** appears in the Line Items card header
2. Clicking it opens the modal at Step 1 — type cards visible
3. Clicking a type advances to Step 2 — subtype cards visible
4. Clicking a subtype (or auto-advancing when only one) shows Step 3 — variant table + qty input
5. Entering a valid quantity shows live price: "Rs. X.XX / piece → Rs. XXXXX"
6. Entering a quantity outside all slabs shows "PRICE NOT FOUND for this quantity" badge
7. Changing quantity updates the price immediately without blur
8. Changing quantity during edit shows "Price updated" indicator
9. Customization fields appear below for a type that has a field config (e.g. Box Packaging)
10. Clicking "Add Item" adds a row to the Line Items table
11. Clicking Edit on a line item reopens the same modal pre-filled
12. Requirements table still shows; each row has a "use as reference" link
13. Clicking "use as reference" opens the modal pre-filled with that requirement's type/qty/specs, but product is not pre-selected (user picks variant)
14. Save Quotation, Download PDF still work

- [ ] **Step 13: Commit**

```bash
git add frontend/frontend/src/pages/admin/QuotationPage.jsx
git commit -m "feat: replace requirement-driven dialog with product-driven AddItemModal"
```

---

## Post-Implementation Sanity Checklist

Verify each item is true before merging:

- [ ] `addRequirement`, `addPriceEntryId`, `addQuantity`, `addDialogOpen`, `editingItemId` — zero occurrences in `QuotationPage.jsx`
- [ ] All three entry points (+ Add Item, Edit, use as reference) call `openAddModal()` and open the same `<AddItemModal>`
- [ ] No manual price input or price dropdown exists anywhere
- [ ] `unitPrice` in emitted line item always comes from `findSlab()` inside `AddItemModal`
- [ ] `SpecsInlineForm` contains no business logic — only field rendering
- [ ] Every line item emitted by `onConfirm` has: `id`, `productId`, `typeId`, `subtypeId`, `typeName`, `subtypeName`, `productName`, `quantity`, `unitPrice`, `pricePerUnit`, `lineTotal`, `pricingStatus`, `specs`, `variantFields`, `optionsSummary`, `designCost`
- [ ] `optionsSummary` is built inside `AddItemModal.handleConfirm` before calling `onConfirm`
- [ ] Price display in modal reacts to every quantity keystroke (no blur required)
