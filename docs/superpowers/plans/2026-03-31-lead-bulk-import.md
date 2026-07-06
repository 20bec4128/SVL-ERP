# Lead Bulk Import Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a CSV bulk import page for leads where admins upload a CSV, preview/select rows, assign to employees (single or round-robin), and submit a single bulk-create API call.

**Architecture:** Frontend parses CSV client-side, shows preview table, handles round-robin distribution, then sends one `POST /api/v1/leads/bulk` request. Backend adds two new endpoints: one to list importable employees scoped to the actor, and one to bulk-create leads with explicit owner assignment.

**Tech Stack:** React (JSX), React Router `useNavigate`, Axios via existing `api.js`, Spring Boot, Jakarta Validation, `@Transactional`

---

## File Map

| Action | File |
|--------|------|
| **Create** | `frontend/frontend/src/pages/admin/LeadImportPage.jsx` |
| **Modify** | `frontend/frontend/src/pages/admin/LeadsPage.jsx` — add Import button (lines 1095–1109) |
| **Modify** | `frontend/frontend/src/adminPhpRoutes.js` — add `leads/import` route |
| **Modify** | `frontend/frontend/src/api/leadsApi.js` — add `getImportableEmployees`, `bulkCreateLeads` |
| **Create** | `backend/backend/src/main/java/com/nexorcrm/backend/dto/BulkLeadItem.java` |
| **Create** | `backend/backend/src/main/java/com/nexorcrm/backend/dto/BulkLeadCreateRequest.java` |
| **Create** | `backend/backend/src/main/java/com/nexorcrm/backend/dto/BulkLeadResponse.java` |
| **Modify** | `backend/backend/src/main/java/com/nexorcrm/backend/service/LeadService.java` — add `getImportableEmployees`, `bulkCreate` |
| **Modify** | `backend/backend/src/main/java/com/nexorcrm/backend/controller/LeadController.java` — add 2 endpoints |

---

## Task 1: Backend DTOs

**Files:**
- Create: `backend/backend/src/main/java/com/nexorcrm/backend/dto/BulkLeadItem.java`
- Create: `backend/backend/src/main/java/com/nexorcrm/backend/dto/BulkLeadCreateRequest.java`
- Create: `backend/backend/src/main/java/com/nexorcrm/backend/dto/BulkLeadResponse.java`

- [ ] **Step 1: Create `BulkLeadItem.java`**

```java
package com.nexorcrm.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class BulkLeadItem {

    @NotBlank(message = "Name is required")
    @Size(max = 200, message = "Name must be at most 200 characters")
    private String name;

    @NotBlank(message = "Mobile is required")
    @Size(max = 40, message = "Mobile must be at most 40 characters")
    private String mobile;

    @NotBlank(message = "Primary Source is required")
    @Size(max = 160, message = "Primary Source must be at most 160 characters")
    private String primarySource;

    @NotNull(message = "Assigned user ID is required")
    private Long assignedUserId;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getMobile() { return mobile; }
    public void setMobile(String mobile) { this.mobile = mobile; }

    public String getPrimarySource() { return primarySource; }
    public void setPrimarySource(String primarySource) { this.primarySource = primarySource; }

    public Long getAssignedUserId() { return assignedUserId; }
    public void setAssignedUserId(Long assignedUserId) { this.assignedUserId = assignedUserId; }
}
```

- [ ] **Step 2: Create `BulkLeadCreateRequest.java`**

```java
package com.nexorcrm.backend.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import java.util.List;

public class BulkLeadCreateRequest {

    @NotEmpty(message = "At least one lead is required")
    @Valid
    private List<BulkLeadItem> leads;

    public List<BulkLeadItem> getLeads() { return leads; }
    public void setLeads(List<BulkLeadItem> leads) { this.leads = leads; }
}
```

- [ ] **Step 3: Create `BulkLeadResponse.java`**

```java
package com.nexorcrm.backend.dto;

import java.util.List;

public class BulkLeadResponse {

    private int created;
    private List<String> errors;

    public BulkLeadResponse(int created, List<String> errors) {
        this.created = created;
        this.errors = errors;
    }

    public int getCreated() { return created; }
    public void setCreated(int created) { this.created = created; }

    public List<String> getErrors() { return errors; }
    public void setErrors(List<String> errors) { this.errors = errors; }
}
```

- [ ] **Step 4: Commit**

```bash
git add backend/backend/src/main/java/com/nexorcrm/backend/dto/BulkLeadItem.java \
        backend/backend/src/main/java/com/nexorcrm/backend/dto/BulkLeadCreateRequest.java \
        backend/backend/src/main/java/com/nexorcrm/backend/dto/BulkLeadResponse.java
git commit -m "feat: add bulk lead import DTOs"
```

---

## Task 2: Backend — `getImportableEmployees` service method + endpoint

**Files:**
- Modify: `backend/backend/src/main/java/com/nexorcrm/backend/service/LeadService.java`
- Modify: `backend/backend/src/main/java/com/nexorcrm/backend/controller/LeadController.java`

- [ ] **Step 1: Add `getImportableEmployees` to `LeadService.java`**

Add this method after the `filters()` method (around line 332). It reuses the existing `findLeadVisibleGroupsForActor` to scope by role, then collects all active EMPLOYEE members across those groups.

```java
public List<LeadAllocatorOptionResponse> getImportableEmployees(String actorPrincipal) {
    User actor = assertLeadAccess(actorPrincipal);
    List<UserGroup> groups = findLeadVisibleGroupsForActor(actor);

    Map<Long, LeadAllocatorOptionResponse> seen = new LinkedHashMap<>();
    for (UserGroup group : groups) {
        List<UserGroupMember> members = userGroupMemberRepository
            .findByGroup_IdAndUser_RoleAndUser_ActivationStatusAndUser_ActiveTrueAndUser_IsDeletedFalseOrderByUserUsernameAsc(
                group.getId(),
                Role.EMPLOYEE,
                ActivationStatus.ACTIVE
            );
        for (UserGroupMember m : members) {
            if (!memberHasLeadVisibility(m)) continue;
            User u = m.getUser();
            if (u == null || u.getId() == null) continue;
            seen.putIfAbsent(u.getId(), toAllocatorOptionResponse(u));
        }
    }
    return new java.util.ArrayList<>(seen.values());
}
```

- [ ] **Step 2: Add endpoint to `LeadController.java`**

Add this import at the top of `LeadController.java` (it's already imported, `LeadAllocatorOptionResponse` is already imported):

Add this endpoint after the `listAssignableGroups` endpoint (around line 98):

```java
@GetMapping("/importable-employees")
public List<LeadAllocatorOptionResponse> listImportableEmployees(Authentication authentication) {
    return leadService.getImportableEmployees(authentication.getName());
}
```

- [ ] **Step 3: Start the Spring Boot backend and manually test the endpoint**

```
GET http://localhost:8081/api/v1/leads/importable-employees
Authorization: Bearer <token>
```

Expected: JSON array of `[{id, username, role}, ...]` with only EMPLOYEE role entries.

- [ ] **Step 4: Commit**

```bash
git add backend/backend/src/main/java/com/nexorcrm/backend/service/LeadService.java \
        backend/backend/src/main/java/com/nexorcrm/backend/controller/LeadController.java
git commit -m "feat: add importable-employees endpoint for bulk lead import"
```

---

## Task 3: Backend — `bulkCreate` service method + endpoint

**Files:**
- Modify: `backend/backend/src/main/java/com/nexorcrm/backend/service/LeadService.java`
- Modify: `backend/backend/src/main/java/com/nexorcrm/backend/controller/LeadController.java`

- [ ] **Step 1: Add `bulkCreate` to `LeadService.java`**

Add this method after `getImportableEmployees`. It validates each row, resolves the assigned user, and saves all leads in one `@Transactional` block.

```java
@Transactional
public BulkLeadResponse bulkCreate(BulkLeadCreateRequest request, String actorPrincipal) {
    User actor = assertLeadAccess(actorPrincipal);

    // Employees cannot use bulk import (they have no assignedUserId selection)
    if (actor.getRole() == Role.EMPLOYEE) {
        throw new AccessDeniedException("Employees cannot use bulk import");
    }

    List<String> errors = new java.util.ArrayList<>();
    List<Lead> toSave = new java.util.ArrayList<>();
    Long flowGroupId = resolveFlowGroupForStatus("New Lead");

    for (int i = 0; i < request.getLeads().size(); i++) {
        BulkLeadItem item = request.getLeads().get(i);
        int rowNum = i + 1;

        // Validate assigned user exists and is an active EMPLOYEE visible to actor
        User assignedUser;
        try {
            assignedUser = userRepository.findById(item.getAssignedUserId())
                .orElseThrow(() -> new EntityNotFoundException("User not found"));
            if (assignedUser.getRole() != Role.EMPLOYEE || !assignedUser.isActive()
                    || assignedUser.getActivationStatus() != ActivationStatus.ACTIVE
                    || Boolean.TRUE.equals(assignedUser.getIsDeleted())) {
                errors.add("Row " + rowNum + ": assigned user is not an active employee");
                continue;
            }
        } catch (EntityNotFoundException e) {
            errors.add("Row " + rowNum + ": assigned user ID " + item.getAssignedUserId() + " not found");
            continue;
        }

        String mobile = item.getMobile().trim();
        String mobileNormalized = normalizeMobile(mobile);
        if (!StringUtils.hasText(mobileNormalized)) {
            errors.add("Row " + rowNum + ": mobile number is invalid");
            continue;
        }

        // Resolve group: prefer flow group, fall back to first assignable group for actor
        Long groupId = flowGroupId;
        if (groupId == null) {
            List<UserGroup> groups = findLeadVisibleGroupsForActor(actor);
            if (groups.isEmpty()) {
                errors.add("Row " + rowNum + ": no lead group available for assignment");
                continue;
            }
            groupId = groups.get(0).getId();
        }

        Lead row = new Lead();
        row.setLeadId("LEAD_" + UUID.randomUUID().toString().replace("-", "").substring(0, 14).toUpperCase(Locale.ROOT));
        row.setEuid(leadRepository.countByDeletedFalse() + toSave.size() + 1);
        row.setName(item.getName().trim());
        row.setMobile(mobile);
        row.setMobileNormalized(mobileNormalized);
        row.setPrimarySource(item.getPrimarySource().trim());
        row.setStatus("New Lead");
        row.setSvStatus(null);
        row.setAssignedGroupId(groupId);
        row.setAllocatorUserId(actor.getId());
        row.setOwnerUserId(assignedUser.getId());
        row.setOwner(assignedUser.getUsername());
        toSave.add(row);
    }

    if (!errors.isEmpty()) {
        throw new IllegalStateException("Bulk import failed: " + String.join("; ", errors));
    }

    leadRepository.saveAll(toSave);
    toSave.forEach(saved ->
        auditService.log("LEAD_BULK_CREATE", "Bulk imported lead " + saved.getLeadId(), actor.getEmail())
    );

    return new BulkLeadResponse(toSave.size(), List.of());
}
```

Note: The method also needs these imports added at the top of `LeadService.java` if not present:
- `com.nexorcrm.backend.dto.BulkLeadCreateRequest`
- `com.nexorcrm.backend.dto.BulkLeadItem`
- `com.nexorcrm.backend.dto.BulkLeadResponse`

- [ ] **Step 2: Add `bulkCreate` endpoint to `LeadController.java`**

Add this import to `LeadController.java`:
```java
import com.nexorcrm.backend.dto.BulkLeadCreateRequest;
import com.nexorcrm.backend.dto.BulkLeadResponse;
```

Add this endpoint after `listImportableEmployees`:

```java
@PostMapping("/bulk")
public ResponseEntity<?> bulkCreate(@Valid @RequestBody BulkLeadCreateRequest request,
                                     Authentication authentication) {
    try {
        BulkLeadResponse result = leadService.bulkCreate(request, authentication.getName());
        return ResponseEntity.ok(result);
    } catch (IllegalStateException e) {
        return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
    }
}
```

- [ ] **Step 3: Test the endpoint manually**

```
POST http://localhost:8081/api/v1/leads/bulk
Authorization: Bearer <token>
Content-Type: application/json

{
  "leads": [
    { "name": "Test User", "mobile": "9876543210", "primarySource": "Facebook", "assignedUserId": <valid_employee_id> }
  ]
}
```

Expected: `{ "created": 1, "errors": [] }`
Check DB: lead row exists with `owner_user_id = <valid_employee_id>`, `status = 'New Lead'`

- [ ] **Step 4: Commit**

```bash
git add backend/backend/src/main/java/com/nexorcrm/backend/service/LeadService.java \
        backend/backend/src/main/java/com/nexorcrm/backend/controller/LeadController.java
git commit -m "feat: add bulk lead create endpoint"
```

---

## Task 4: Frontend API functions

**Files:**
- Modify: `frontend/frontend/src/api/leadsApi.js`

- [ ] **Step 1: Add `getImportableEmployees` and `bulkCreateLeads` to `leadsApi.js`**

Append to the end of `leadsApi.js`:

```js
export async function getImportableEmployees() {
  const response = await api.get('/api/v1/leads/importable-employees')
  return Array.isArray(response?.data) ? response.data : []
}

export async function bulkCreateLeads(leads) {
  // leads: [{ name, mobile, primarySource, assignedUserId }]
  const response = await api.post('/api/v1/leads/bulk', { leads })
  return response?.data || {}
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/frontend/src/api/leadsApi.js
git commit -m "feat: add getImportableEmployees and bulkCreateLeads API functions"
```

---

## Task 5: Frontend — Add route + Import button to LeadsPage

**Files:**
- Modify: `frontend/frontend/src/adminPhpRoutes.js`
- Modify: `frontend/frontend/src/pages/admin/LeadsPage.jsx`

- [ ] **Step 1: Add route to `adminPhpRoutes.js`**

Insert after the `leads/:id` route (around line 630):

```js
  {
    path: "leads/import",
    component: "LeadImportPage",
  },
```

The leads section should now look like:
```js
  {
    path: "leads",
    component: "LeadsPage",
  },
  {
    path: "leads/import",
    component: "LeadImportPage",
  },
  {
    path: "leads/:id",
    component: "LeadEditPage",
  },
```

**Important:** `leads/import` must be placed BEFORE `leads/:id` so the router matches the literal path first.

- [ ] **Step 2: Add Import Leads button to `LeadsPage.jsx`**

In `LeadsPage.jsx`, locate the toolbar section (around lines 1095–1109). Add the Import button between Filter and Create New Lead:

Find this block:
```jsx
            <div className="d-flex gap-2 align-items-center">
              <button
                className="btn btn-outline-warning"
                onClick={() => setFilterOpen((prev) => !prev)}
              >
                <i className="ti ti-filter me-1" />
                Filter
              </button>
              <button
                className="btn btn-success"
                onClick={openCreateModal}
              >
                <i className="ti ti-plus me-1" />
                Create New Lead
              </button>
            </div>
```

Replace with:
```jsx
            <div className="d-flex gap-2 align-items-center">
              <button
                className="btn btn-outline-warning"
                onClick={() => setFilterOpen((prev) => !prev)}
              >
                <i className="ti ti-filter me-1" />
                Filter
              </button>
              <button
                className="btn btn-outline-info"
                onClick={() => navigate('/leads/import')}
              >
                <i className="ti ti-upload me-1" />
                Import Leads
              </button>
              <button
                className="btn btn-success"
                onClick={openCreateModal}
              >
                <i className="ti ti-plus me-1" />
                Create New Lead
              </button>
            </div>
```

- [ ] **Step 3: Verify `navigate` is already available in `LeadsPage.jsx`**

Check line 228 confirms `const navigate = useNavigate()` — already present, no change needed.

- [ ] **Step 4: Commit**

```bash
git add frontend/frontend/src/adminPhpRoutes.js \
        frontend/frontend/src/pages/admin/LeadsPage.jsx
git commit -m "feat: add Import Leads button and route"
```

---

## Task 6: Frontend — `LeadImportPage.jsx`

**Files:**
- Create: `frontend/frontend/src/pages/admin/LeadImportPage.jsx`

- [ ] **Step 1: Create the full `LeadImportPage.jsx`**

```jsx
import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getImportableEmployees, bulkCreateLeads } from "../../api/leadsApi";
import { useEffect } from "react";

const QUICK_SELECT_OPTIONS = [
  { label: "First 10", value: 10 },
  { label: "First 25", value: 25 },
  { label: "First 50", value: 50 },
  { label: "First 100", value: 100 },
  { label: "All", value: Infinity },
];

function parseCSV(text) {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];
  // Skip header row
  return lines.slice(1).map((line, idx) => {
    const cols = line.split(",").map((c) => c.trim());
    return {
      _rowIndex: idx,
      name: cols[0] || "",
      mobile: cols[1] || "",
      primarySource: cols[2] || "",
      _error: !cols[0] || !cols[1] || !cols[2]
        ? "Missing required field(s)"
        : null,
    };
  });
}

function downloadSampleCSV() {
  const content = "name,mobile,primarySource\nJohn Doe,9876543210,Facebook\nJane Smith,9123456789,Google";
  const blob = new Blob([content], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "leads-sample.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export default function LeadImportPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [rows, setRows] = useState([]);
  const [checkedIndexes, setCheckedIndexes] = useState(new Set());
  const [employees, setEmployees] = useState([]);
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    getImportableEmployees().then(setEmployees).catch(() => setEmployees([]));
  }, []);

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const parsed = parseCSV(ev.target.result || "");
      setRows(parsed);
      setCheckedIndexes(new Set());
      setSubmitError("");
      setSuccessMsg("");
    };
    reader.readAsText(file);
  }

  function handleQuickSelect(value) {
    const validRows = rows.filter((r) => !r._error);
    const limit = value === Infinity ? validRows.length : value;
    const newSet = new Set(validRows.slice(0, limit).map((r) => r._rowIndex));
    setCheckedIndexes(newSet);
  }

  function toggleRow(rowIndex) {
    setCheckedIndexes((prev) => {
      const next = new Set(prev);
      if (next.has(rowIndex)) next.delete(rowIndex);
      else next.add(rowIndex);
      return next;
    });
  }

  function toggleEmployee(id) {
    setSelectedEmployeeIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  async function handleSubmit() {
    setSubmitError("");
    setSuccessMsg("");

    const selectedRows = rows.filter(
      (r) => checkedIndexes.has(r._rowIndex) && !r._error
    );
    if (selectedRows.length === 0) {
      setSubmitError("Select at least one valid row.");
      return;
    }
    if (selectedEmployeeIds.length === 0) {
      setSubmitError("Select at least one employee to assign leads to.");
      return;
    }

    // Distribute assignedUserId: round-robin if multiple employees
    const leads = selectedRows.map((row, i) => ({
      name: row.name,
      mobile: row.mobile,
      primarySource: row.primarySource,
      assignedUserId: selectedEmployeeIds[i % selectedEmployeeIds.length],
    }));

    setSubmitting(true);
    try {
      const result = await bulkCreateLeads(leads);
      setSuccessMsg(`${result.created ?? leads.length} leads imported successfully.`);
      setTimeout(() => navigate("/leads"), 1500);
    } catch (err) {
      const msg = err?.response?.data?.error || err?.message || "Import failed.";
      setSubmitError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  const checkedValidCount = rows.filter(
    (r) => checkedIndexes.has(r._rowIndex) && !r._error
  ).length;

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="d-flex align-items-center gap-2 mb-4">
          <button
            className="btn btn-outline-secondary btn-sm"
            onClick={() => navigate("/leads")}
          >
            <i className="ti ti-arrow-left me-1" />
            Back to Leads
          </button>
          <h4 className="mb-0">Import Leads</h4>
        </div>

        {/* Step 1: Download Sample */}
        <div className="card mb-3">
          <div className="card-body">
            <h6 className="card-title">Step 1 — Download Sample CSV</h6>
            <p className="text-muted mb-2">
              The CSV must have columns: <strong>name</strong>, <strong>mobile</strong>, <strong>primarySource</strong>
            </p>
            <button className="btn btn-outline-primary btn-sm" onClick={downloadSampleCSV}>
              <i className="ti ti-download me-1" />
              Download Sample CSV
            </button>
          </div>
        </div>

        {/* Step 2: Upload */}
        <div className="card mb-3">
          <div className="card-body">
            <h6 className="card-title">Step 2 — Upload CSV</h6>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="form-control"
              style={{ maxWidth: 360 }}
              onChange={handleFileChange}
            />
          </div>
        </div>

        {/* Preview Table */}
        {rows.length > 0 && (
          <div className="card mb-3">
            <div className="card-body">
              <div className="d-flex align-items-center gap-3 mb-3 flex-wrap">
                <h6 className="card-title mb-0">Preview ({rows.length} rows)</h6>
                <div className="d-flex align-items-center gap-2">
                  <label className="mb-0 text-muted small">Quick Select:</label>
                  <select
                    className="form-select form-select-sm"
                    style={{ width: "auto" }}
                    defaultValue=""
                    onChange={(e) => {
                      const val = e.target.value;
                      handleQuickSelect(val === "all" ? Infinity : Number(val));
                    }}
                  >
                    <option value="" disabled>Choose...</option>
                    {QUICK_SELECT_OPTIONS.map((opt) => (
                      <option key={opt.label} value={opt.value === Infinity ? "all" : opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                <span className="text-muted small">{checkedValidCount} selected</span>
              </div>

              <div className="table-responsive">
                <table className="table table-sm table-bordered table-hover">
                  <thead>
                    <tr>
                      <th style={{ width: 40 }}>#</th>
                      <th style={{ width: 40 }}>
                        <input
                          type="checkbox"
                          checked={checkedValidCount > 0 && checkedValidCount === rows.filter((r) => !r._error).length}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setCheckedIndexes(new Set(rows.filter((r) => !r._error).map((r) => r._rowIndex)));
                            } else {
                              setCheckedIndexes(new Set());
                            }
                          }}
                        />
                      </th>
                      <th>Name</th>
                      <th>Mobile</th>
                      <th>Primary Source</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, idx) => (
                      <tr
                        key={row._rowIndex}
                        className={row._error ? "table-danger" : ""}
                      >
                        <td>{idx + 1}</td>
                        <td>
                          {!row._error && (
                            <input
                              type="checkbox"
                              checked={checkedIndexes.has(row._rowIndex)}
                              onChange={() => toggleRow(row._rowIndex)}
                            />
                          )}
                        </td>
                        <td>{row.name || <span className="text-danger">—</span>}</td>
                        <td>{row.mobile || <span className="text-danger">—</span>}</td>
                        <td>{row.primarySource || <span className="text-danger">—</span>}</td>
                        <td>
                          {row._error
                            ? <span className="badge bg-danger">{row._error}</span>
                            : <span className="badge bg-success">Valid</span>
                          }
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Assign & Submit */}
        {rows.length > 0 && (
          <div className="card mb-3">
            <div className="card-body">
              <h6 className="card-title">Step 3 — Assign to Employee(s)</h6>
              {employees.length === 0 ? (
                <p className="text-muted">No active employees available.</p>
              ) : (
                <div className="d-flex flex-wrap gap-2 mb-3">
                  {employees.map((emp) => (
                    <button
                      key={emp.id}
                      type="button"
                      className={`btn btn-sm ${selectedEmployeeIds.includes(emp.id) ? "btn-primary" : "btn-outline-secondary"}`}
                      onClick={() => toggleEmployee(emp.id)}
                    >
                      {emp.username}
                    </button>
                  ))}
                </div>
              )}
              {selectedEmployeeIds.length > 1 && (
                <p className="text-muted small mb-2">
                  {checkedValidCount} leads will be distributed round-robin across {selectedEmployeeIds.length} employees.
                </p>
              )}

              {submitError && (
                <div className="alert alert-danger py-2">{submitError}</div>
              )}
              {successMsg && (
                <div className="alert alert-success py-2">{successMsg}</div>
              )}

              <button
                className="btn btn-success"
                disabled={submitting || checkedValidCount === 0 || selectedEmployeeIds.length === 0}
                onClick={handleSubmit}
              >
                {submitting ? "Importing..." : `Import ${checkedValidCount} Lead(s)`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify the page renders**

Start the frontend dev server:
```bash
cd frontend/frontend
npm run dev
```

Navigate to `/leads` → click "Import Leads" → should land on the import page with Step 1 and Step 2 visible.

- [ ] **Step 3: Test full flow**

1. Download sample CSV — file `leads-sample.csv` downloads with correct columns
2. Upload a CSV with 5+ rows — preview table shows rows, invalid rows (empty fields) highlighted red
3. Select "First 3" from Quick Select → 3 rows checked
4. Click 2 employees → both highlighted in blue
5. "Import 3 Lead(s)" button becomes enabled
6. Click submit → toast "3 leads imported successfully" → redirect to `/leads`
7. Verify leads appear in the leads table with correct owners alternating round-robin

- [ ] **Step 4: Commit**

```bash
git add frontend/frontend/src/pages/admin/LeadImportPage.jsx
git commit -m "feat: add LeadImportPage with CSV preview, selection, and bulk assign"
```

---

## Verification Checklist

- [ ] `GET /api/v1/leads/importable-employees` returns only active employees scoped to actor's role
- [ ] `POST /api/v1/leads/bulk` with invalid row returns 400 and no leads created
- [ ] `POST /api/v1/leads/bulk` with valid rows creates all leads; `allocatorUserId` = actor, `ownerUserId` = assignedUserId
- [ ] Import Leads button visible on `/leads` toolbar
- [ ] Navigating to `/leads/import` loads the page (not caught by `leads/:id` route)
- [ ] Sample CSV downloads with correct headers
- [ ] Uploading CSV shows preview table; rows with missing fields highlighted red
- [ ] Quick Select "First 50" checks first 50 valid rows
- [ ] Selecting 1 employee + submit → all leads assigned to that employee
- [ ] Selecting 3 employees + 6 rows → leads distributed 2-2-2 (round-robin)
- [ ] Submit with no selection → error message shown, no API call made
- [ ] Success → redirect to `/leads` after 1.5s
