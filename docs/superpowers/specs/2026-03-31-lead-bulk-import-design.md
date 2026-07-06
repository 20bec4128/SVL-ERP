# Lead Bulk Import — Design Spec
**Date:** 2026-03-31

## Context

Admins, managers, and super admins need to import leads in bulk from a CSV file. Currently, leads can only be created one at a time via the create modal on the Leads page. This feature adds a dedicated import page where the user uploads a CSV, previews the parsed rows, selects a subset, assigns them to one or more employees (with round-robin distribution for multiple), and submits a single bulk create request.

---

## User Flow

1. Admin clicks **Import Leads** button on the Leads page toolbar → navigates to `/leads/import`
2. Downloads the sample CSV to understand the required format
3. Uploads a filled `.csv` file → browser parses it instantly (no server upload)
4. Preview table shows all parsed rows; invalid rows (missing required fields) are highlighted red
5. Admin picks a quick-select from a dropdown: **First 10 / First 25 / First 50 / First 100 / All** → those rows get checked
6. Admin opens **Assign to Employee** multi-select dropdown (fetched from backend) → selects 1 or more employees
   - 1 employee → all selected rows assigned to that employee
   - Multiple employees → round-robin distribution across selected rows (frontend)
7. Admin clicks **Submit** → `POST /api/v1/leads/bulk`
8. Success → toast "X leads imported successfully" + navigate back to `/leads`
9. Error → per-row error messages shown inline in the table

---

## Frontend

### New Page: `LeadImportPage.jsx`
**Route:** `leads/import`
**File:** `frontend/frontend/src/pages/admin/LeadImportPage.jsx`

**Layout (top to bottom):**
- Header: "Import Leads" title + back button → `/leads`
- **Step 1 — Sample CSV:** Download button that triggers client-side generation of a sample `.csv` with columns `name,mobile,primarySource` and 2 example rows
- **Step 2 — Upload CSV:** File input (`.csv` only) + drag-and-drop area. On file select, parse using `FileReader` + manual split (no extra library — format is flat 3 columns)
- **Preview Table:** Columns: #, Name, Mobile, Primary Source, Status (valid/error). Rows with missing required fields highlighted red.
- **Selection Bar:** Dropdown with options: First 10, First 25, First 50, First 100, All. Selecting an option checks those rows via checkboxes. Individual row checkboxes also work.
- **Assign Bar:** Multi-select dropdown of employees (fetched from `GET /api/v1/leads/importable-employees`). Shows employee name.
- **Submit Button:** Disabled until at least 1 valid row is checked and at least 1 employee is selected.

### Modified: `LeadsPage.jsx`
- Add **Import Leads** button to the toolbar (between Filter and Create New Lead)
- On click: `navigate('/leads/import')`

### Modified: `adminPhpRoutes.js`
- Add `{ path: "leads/import", component: "LeadImportPage" }`

### Modified: `leadsApi.js`
- Add `getImportableEmployees()` → `GET /api/v1/leads/importable-employees`
- Add `bulkCreateLeads(payload)` → `POST /api/v1/leads/bulk`

### Frontend Assignment Logic
```
selectedRows = checked rows (valid only)
if (employees.length === 1) {
  each row → assignedUserId = employees[0].id
} else {
  each row at index i → assignedUserId = employees[i % employees.length].id
}
```

---

## Backend

### New Endpoint: `GET /api/v1/leads/importable-employees`
- Returns `List<{id, name}>` of active EMPLOYEE users visible to the actor
- Reuses existing scope logic (SUPER_ADMIN → all, ADMIN → department, MANAGER → team)
- Added to `LeadController.java`
- Added to `LeadService.java` as `getImportableEmployees(actorPrincipal)`

### New Endpoint: `POST /api/v1/leads/bulk`
- Accepts `BulkLeadCreateRequest` — wrapper with `List<BulkLeadItem>`
- Each `BulkLeadItem`: `name`, `mobile`, `primarySource`, `assignedUserId`
- Validates every row; if any row is invalid → reject entire batch with row-level errors
- Creates all leads in a **single `@Transactional` block**
- Each lead: status = "New Lead", `allocatorUserId` = actor, `ownerUserId` = `assignedUserId`
- Returns `BulkLeadResponse`: `{ created: N, errors: [...] }`

### New Classes (Backend)
| Class | Location |
|-------|----------|
| `BulkLeadCreateRequest.java` | `dto/` |
| `BulkLeadItem.java` | `dto/` |
| `BulkLeadResponse.java` | `dto/` |
| `bulkCreate()` method | `LeadService.java` |
| `bulkCreate()` + `getImportableEmployees()` endpoints | `LeadController.java` |

---

## Sample CSV Format
```
name,mobile,primarySource
John Doe,9876543210,Facebook
Jane Smith,9123456789,Google
```

---

## Key Files to Modify
| File | Change |
|------|--------|
| `frontend/frontend/src/pages/admin/LeadsPage.jsx` | Add Import Leads button |
| `frontend/frontend/src/adminPhpRoutes.js` | Add `leads/import` route |
| `frontend/frontend/src/api/leadsApi.js` | Add 2 new API functions |
| `backend/.../controller/LeadController.java` | Add 2 new endpoints |
| `backend/.../service/LeadService.java` | Add `bulkCreate()` and `getImportableEmployees()` |

---

## Verification
1. Navigate to Leads page → Import Leads button visible in toolbar
2. Click Import Leads → `/leads/import` page loads
3. Download sample CSV → opens with `name,mobile,primarySource` columns
4. Upload a CSV with 10+ rows → preview table renders, invalid rows highlighted
5. Select "First 5" from dropdown → 5 rows checked
6. Open assign dropdown → shows active employees
7. Select 2 employees → submit → verify round-robin in DB (`ownerUserId` alternates)
8. Select 1 employee → submit → all leads assigned to that employee
9. Submit with a missing-name row → error shown, no leads created
10. Success → toast shown, redirected to `/leads`, new leads visible
