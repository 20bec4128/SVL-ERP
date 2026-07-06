# Quotation Post-Approval Flow — Design Spec
**Date:** 2026-04-07  
**Status:** Approved for implementation

---

## Context

Currently the quotation lifecycle ends at `APPROVED`. The employee can download the PDF but there is no way to track what happens after the quotation is shared with the customer. This spec extends the flow to cover the customer response cycle — entirely tracked manually by the employee (no customer portal).

---

## Full Status State Machine

```
DRAFT
  → VERIFICATION_PENDING   (employee sends for approval)
      → APPROVED           (manager/admin/team lead approves)
          → QUOTATION_SENT (employee marks "Sent to Customer")
              → QUOTATION_REJECTED   [terminal]  employee marks, notes required
              → NEGOTIATING                       employee marks, notes required
              → QUOTATION_ACCEPTED   [terminal]  employee marks, notes optional

NEGOTIATING
  → [employee edits quotation]
  → VERIFICATION_PENDING   (employee re-sends for approval — same approval flow)
      → APPROVED
          → QUOTATION_SENT
              → ... (loop continues until terminal state)
```

---

## New Statuses

| Constant | Value | Badge | Terminal? |
|---|---|---|---|
| `QUOTATION_STATUS_SENT` | `"QUOTATION_SENT"` | Blue (`bg-info`) | No |
| `QUOTATION_STATUS_NEGOTIATING` | `"NEGOTIATING"` | Orange (`bg-warning text-dark`) | No |
| `QUOTATION_STATUS_REJECTED` | `"QUOTATION_REJECTED"` | Red (`bg-danger`) | Yes |
| `QUOTATION_STATUS_ACCEPTED` | `"QUOTATION_ACCEPTED"` | Green (`bg-success`) | Yes |

Add all four to `frontend/frontend/src/utils/quotationUtils.js`.

---

## New Payload Fields

Add to `createQuotationPayload()` in `quotationUtils.js` and the backend entity/DTO:

```
sentAt                  — ISO timestamp when marked sent
sentByName              — employee name who marked sent

negotiatingAt           — ISO timestamp when marked negotiating
negotiatingByName       — employee name
negotiatingNotes        — required notes from employee

rejectedAt              — ISO timestamp when marked rejected
rejectedByName          — employee name
rejectionNotes          — required notes from employee

acceptedAt              — ISO timestamp when marked accepted
acceptedByName          — employee name
acceptanceNotes         — optional notes from employee
```

---

## New API Endpoints

Add to `quotationApi.js` (frontend) and `QuotationController` (backend):

| Method | Endpoint | Role | Notes field |
|---|---|---|---|
| POST | `/api/quotations/{id}/mark-sent` | Employee (creator) | None |
| POST | `/api/quotations/{id}/mark-negotiating` | Employee (creator) | Required |
| POST | `/api/quotations/{id}/mark-rejected` | Employee (creator) | Required |
| POST | `/api/quotations/{id}/mark-accepted` | Employee (creator) | Optional |

All four endpoints accept: `{ notes: string }` in request body.  
All four return the updated quotation object.

**Backend validation rules:**
- `mark-sent` — only allowed when status is `APPROVED`
- `mark-negotiating` — only allowed when status is `QUOTATION_SENT`
- `mark-rejected` — only allowed when status is `QUOTATION_SENT`
- `mark-accepted` — only allowed when status is `QUOTATION_SENT`
- Re-send for approval (`/verify`) — also allowed when status is `NEGOTIATING` (in addition to existing `DRAFT`)

---

## UI Changes — QuotationListPage

### Status Badge (`getStatusUi`)
Extend to handle all 6 statuses.

### Employee Action Buttons (status-aware)

| Status | Buttons |
|---|---|
| `DRAFT` | Edit, Send for Verification |
| `VERIFICATION_PENDING` | (disabled — awaiting approval) |
| `APPROVED` | Download PDF, **"Mark as Sent"** |
| `QUOTATION_SENT` | **"Rejected"**, **"Negotiating"**, **"Accepted"** |
| `NEGOTIATING` | Edit (re-opens quotation form), **"Re-send for Approval"** |
| `QUOTATION_REJECTED` | (view only — terminal) |
| `QUOTATION_ACCEPTED` | (view only — terminal) |

### Modal Dialogs (extend existing `notesDialog` state)

Add new modes to the existing notes dialog pattern:

| Mode | Title | Notes field | Notes required? | Submit label |
|---|---|---|---|---|
| `mark-sent` | "Mark as Sent to Customer" | Hidden | — | "Mark as Sent" |
| `mark-negotiating` | "Mark as Negotiating" | Shown | Yes | "Save" |
| `mark-rejected` | "Mark as Rejected" | Shown | Yes | "Save" |
| `mark-accepted` | "Mark as Accepted" | Shown | No (optional) | "Save" |
| `re-verify` | "Re-send for Approval" | Shown (optional) | No | "Re-send" |

`mark-sent` skips the modal — just a confirm action inline (no notes needed).

### Edit from NEGOTIATING

When employee clicks Edit on a `NEGOTIATING` quotation, load it into the quotation form (same `setQuotationDraft` + navigate flow). The backend must allow save/update when status is `NEGOTIATING`.

### Higher Authority View

Managers/Admins/Team Leads see the new statuses as read-only badges — no new action buttons needed for them in this phase.

---

## Files to Modify

### Frontend
- `frontend/frontend/src/utils/quotationUtils.js` — add 4 new status constants, extend `createQuotationPayload`, extend `getStatusUi` (currently in `QuotationListPage`, move to utils or extend inline)
- `frontend/frontend/src/api/quotationApi.js` — add 4 new API call functions
- `frontend/frontend/src/pages/admin/QuotationListPage.jsx` — extend `getStatusUi`, add new buttons and modal modes, allow edit from `NEGOTIATING`
- `frontend/frontend/src/pages/admin/QuotationPage.jsx` — allow save when status is `NEGOTIATING`

### Backend
- `backend/backend/src/main/java/com/nexorcrm/backend/entity/Lead.java` (or Quotation entity) — add new status constants and new audit fields
- `backend/backend/src/main/java/com/nexorcrm/backend/dto/` — extend request/response DTOs
- `backend/backend/src/main/java/com/nexorcrm/backend/service/LeadService.java` — add business logic for 4 new transitions + allow re-verify from NEGOTIATING
- QuotationController — add 4 new endpoints
- DB migration — new SQL migration adding the new columns

---

## Verification / Testing

1. **APPROVED → Mark as Sent:** Click "Mark as Sent" on an approved quotation → status badge changes to "Quotation Sent" (blue).
2. **QUOTATION_SENT → Rejected:** Click "Rejected", enter required notes, submit → status shows "Rejected" (red), notes visible in table.
3. **QUOTATION_SENT → Accepted:** Click "Accepted", optional notes, submit → status shows "Accepted" (green).
4. **QUOTATION_SENT → Negotiating:** Click "Negotiating", enter required notes, submit → status shows "Negotiating" (orange), Edit button is active.
5. **NEGOTIATING → Edit → Re-send:** Edit quotation, save, click "Re-send for Approval" → status returns to "Verification Pending", same approval flow runs.
6. **Loop test:** After re-approval, mark sent again, then accepted → ends at terminal state.
7. **Validation:** Attempt to mark-sent on a non-APPROVED quotation → backend rejects with error.
8. **Notes validation:** Submit "Rejected" or "Negotiating" without notes → frontend blocks submission (required field).
