# Quotation System — Product-Driven Refactor

**Date:** 2026-04-14
**Scope:** UX-only refactor — interaction layer only, no backend or pricing logic changes
**Approach:** Approach A (surgical refactor)

---

## 1. Goal

Transform the quotation flow from requirement-driven to product-driven (Vyapar-style). Users add products like a cart; pricing is automatic; requirements are demoted to optional context only.

---

## 2. Files Changed

| File | Change |
|---|---|
| `frontend/frontend/src/pages/admin/QuotationPage.jsx` | Remove requirement-driven add dialog state; add `+ Add Item` button; demote requirements table; wire `AddItemModal` |
| `frontend/frontend/src/pages/admin/AddItemModal.jsx` | **New** — product drill-down, qty, auto price, inline specs |
| `frontend/frontend/src/pages/admin/SpecsInlineForm.jsx` | **New** — controlled dynamic field renderer from `productFieldConfigs.js` |

**Untouched (no changes):**
- `quotationUtils.js` (findSlab, createQuotationPayload, PDF, draft persistence)
- `priceListApi.js`
- `productFieldConfigs.js`
- `quotationApi.js`
- All approval/verification logic
- All customer/lead selection logic

---

## 3. Line Item Shape

Every line item in `lineItems[]` must conform to this shape:

```js
{
  id,                  // string — "item-{timestamp}" for new, preserved for edits
  productId,           // number — priceList entry id
  typeId,              // number
  subtypeId,           // number | null
  typeName,            // string
  subtypeName,         // string | null
  productName,         // string — "{typeName} - {subtypeName}" or typeName alone
  quantity,            // number
  unitPrice,           // number — always from findSlab(), never manually entered
  lineTotal,           // number — quantity * unitPrice
  pricingStatus,       // "PRICED" | "UNPRICED"
  specs,               // object — from SpecsInlineForm, keyed by productFieldConfigs keys
  variantFields,       // object — from selected priceList entry
  optionsSummary,      // string — display summary for the line items table and PDF
}
```

**Pricing invariant:**
```
unitPrice = findSlab(product.quantitySlabs, quantity)?.pricePerPiece ?? 0
lineTotal  = quantity * unitPrice
pricingStatus = slab found ? "PRICED" : "UNPRICED"
```
No manual price override. No price dropdown.

---

## 4. QuotationPage.jsx Changes

### State removed
```js
// REMOVE these entirely:
addRequirement
addPriceEntryId
addQuantity
addDialogOpen
// editingItemId becomes editingItem (full object, not just id)
```

### State added
```js
const [addModalOpen, setAddModalOpen]   = useState(false);
const [editingItem,  setEditingItem]    = useState(null);  // null = new item, object = item being edited
```

### Handler changes

| Old handler | New handler |
|---|---|
| `openAddFromRequirement(req)` | `openAddModal(prefill?)` — accepts optional prefill object |
| `closeAddDialog()` | `closeAddModal()` |
| `handleConfirmAddOrUpdate()` | Moved into `AddItemModal` — calls `onConfirm(lineItem)` callback |
| `handleEditItem(item)` | `openAddModal(item)` — same modal, item is prefill |

### Requirements table (demoted)

- Keep the card and table as-is visually
- Replace "Add to Quotation" `<button>` with a small muted link:
  ```jsx
  <button className="btn btn-link btn-sm p-0 text-muted" onClick={() => openAddModal(buildPrefill(req))}>
    use as reference
  </button>
  ```
  Where `buildPrefill(req)` maps a requirement to the modal's prefill shape:
  ```js
  function buildPrefill(req) {
    return {
      // no id — so onConfirm will add a new item, not update
      typeId:    req.typeId,
      subtypeId: req.subtypeId,
      typeName:  req.typeName,
      subtypeName: req.subtypeName,
      quantity:  req.quantity,
      specs:     safeJsonParse(req.specs, {}),
      productId: null,   // user must still pick the variant
    };
  }
  ```
- Add a prominent `+ Add Item` button in the Line Items card header:
  ```jsx
  <button className="btn btn-primary btn-sm" onClick={() => openAddModal()}>
    <i className="ti ti-plus me-1" /> Add Item
  </button>
  ```

### Modal wiring

```jsx
<AddItemModal
  open={addModalOpen}
  priceList={priceList}
  prefill={editingItem}         // null for new, item object for edit/reference
  onConfirm={(lineItem) => {
    if (editingItem?.id) {
      setLineItems(prev => prev.map(i => i.id === editingItem.id ? lineItem : i));
    } else {
      setLineItems(prev => [...prev, lineItem]);
    }
    closeAddModal();
  }}
  onClose={closeAddModal}
/>
```

**Single source of truth:** All three entry points (+ Add Item, Edit, Use as reference) open the same modal. No alternate paths.

---

## 5. AddItemModal.jsx

### Shared helpers
`findSlab` and `getVariantSummary` are currently local functions in `QuotationPage.jsx`. The modal needs both. To avoid coupling files, define them locally inside `AddItemModal.jsx` — they are pure functions with no dependencies. `QuotationPage.jsx` keeps its own copies unchanged.



### Props
```ts
{
  open: boolean
  priceList: PriceEntry[]
  prefill: LineItem | RequirementPrefill | null   // null = new item
  onConfirm: (lineItem: LineItem) => void
  onClose: () => void
}
```

### Internal state
```js
const [step, setStep]           = useState(1);  // 1 = type, 2 = subtype, 3 = variant+qty+specs
const [selectedTypeId, ...]     = useState(prefill?.typeId ?? null);
const [selectedSubtypeId, ...]  = useState(prefill?.subtypeId ?? null);
const [selectedEntryId, ...]    = useState(prefill?.productId ?? null);
const [quantity, ...]           = useState(String(prefill?.quantity ?? ""));
const [specs, ...]              = useState(prefill?.specs ?? {});
```

### Step flow

**Step 1 — Type selection**
- Derive unique types from `priceList`: `[...new Map(priceList.map(p => [p.typeId, {id: p.typeId, name: p.typeName}]))]`
- Render as clickable radio cards
- If `prefill.typeId` is set, auto-advance to step 2

**Step 2 — Subtype selection**
- Filter priceList by `selectedTypeId`, derive unique subtypes
- If only one subtype exists (or subtype is null), auto-advance to step 3
- Render as clickable radio cards; include a "Back" link

**Step 3 — Variant + Qty + Specs**
- Filter priceList by `selectedTypeId` + `selectedSubtypeId` → `candidates[]`
- Show candidates as a selectable table (variant summary as row label, using existing `getVariantSummary`)
- Quantity input (number, min 1)
- Auto-computed price display:
  ```
  Slab found:    "Rs. 2.50 / piece  →  Total: Rs. 2,500"
  No slab found: badge "PRICE NOT FOUND for this quantity"
  ```
- Inline specs section (collapsible, defaults open):
  ```jsx
  <SpecsInlineForm typeName={selectedTypeName} specs={specs} onChange={setSpecs} />
  ```
- Confirm button: "Add Item" (or "Update Item" when editing)
- Validation: quantity > 0 required; entry selection required

### Prefill behaviour
When `prefill` is provided (from requirement "use as reference" or from edit):
- Pre-select type, subtype, variant (if `productId` matches)
- Pre-fill quantity
- Pre-fill specs
- User must still confirm selection — no auto-add

### Product selection is independent
The product list is **not** filtered by requirement. Requirements only set initial field values. User can change any selection freely.

---

## 6. SpecsInlineForm.jsx

### Props
```ts
{
  typeName: string          // used to look up field config
  specs: Record<string, any>
  onChange: (specs: Record<string, any>) => void
}
```

### Behaviour
- Import the type→fields map from `productFieldConfigs.js`
- If no config exists for `typeName`, render nothing (no error)
- Render each field based on its `type`:
  - `"number"` → `<input type="number">`
  - `"text"` → `<input type="text">`
  - `"select"` with `allowCustom` → select + conditional text input for "Custom" value
  - `"select"` without `allowCustom` → plain `<select>`
  - `hidden: true` fields → only shown when their parent select has value "Custom"
- Fully controlled: reads from `specs`, writes via `onChange`
- No internal business logic — pure field renderer

### Type name mapping
```js
const TYPE_FIELD_MAP = {
  "Box Packaging":         BOX_PACKAGING_FIELDS,
  "Food Cup":              FOOD_CUP_FIELDS,
  "Wrap":                  WRAP_FIELDS,
  "Accessory":             ACCESSORY_FIELDS,
  "Wood Plastic Spoon":    WOOD_PLASTIC_SPOON_FIELDS,
  "Ice Cream":             ICE_CREAM_FIELDS,
  "Monocotton Box":        MONOCOTTON_BOX_FIELDS,
  "Branding Box":          BRANDING_BOX_FIELDS,
  "Plain Customized Box":  PLAIN_CUSTOMIZED_BOX_FIELDS,
  "Flex Printing":         FLEX_PRINTING_FIELDS,
  // extend as new types are added to productFieldConfigs.js
};
```

---

## 7. Edge Cases

| Case | Handling |
|---|---|
| Quantity outside all slabs | `pricingStatus = "UNPRICED"`, badge shown in modal and in line items table; item can still be added |
| Quantity changed → slab changes | Recompute `unitPrice` and `lineTotal` reactively on every quantity keystroke inside the modal. Show a subtle `text-muted small` line "Price updated" next to the price display when the displayed price has changed from the prefill value (only relevant during edit flow). |
| No candidates for type+subtype | Step 3 shows "No products configured for this combination" |
| `typeName` has no field config | `SpecsInlineForm` renders nothing; item still addable |
| Editing an item | Same modal, pre-filled; confirms as update (replaces by `id`) |
| "Use as reference" for requirement with no matching product | Modal opens pre-filtered to type; user selects variant freely |

---

## 8. Constraints (must not break)

- `findSlab()` logic unchanged
- `createQuotationPayload()` unchanged — receives same `lineItems` shape
- `downloadQuotationPdf()` unchanged — `optionsSummary` field on line item drives PDF description
- Draft persistence (localStorage) unchanged
- Save / approve / verify flow unchanged
- Lead selection and customer section unchanged

---

## 9. Sanity Checklist (pre-merge)

- [ ] Old state `addRequirement`, `addPriceEntryId` fully removed from `QuotationPage.jsx`
- [ ] All three entry points (+ Add Item, Edit, Use as reference) open the same `AddItemModal`
- [ ] No manual price override or price dropdown anywhere
- [ ] `unitPrice` always set by `findSlab()`, never by user input
- [ ] `SpecsInlineForm` contains no business logic
- [ ] All line items follow the shape defined in Section 3
- [ ] `optionsSummary` is built from `specs` + `variantFields` before calling `onConfirm`
- [ ] Price display in modal reacts to every quantity change without requiring blur/submit
