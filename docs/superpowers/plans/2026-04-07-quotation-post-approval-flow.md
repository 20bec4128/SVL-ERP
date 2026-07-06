# Quotation Post-Approval Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend the quotation lifecycle beyond APPROVED to track: Sent to Customer → Rejected / Negotiating / Accepted, with a re-approval loop for negotiations.

**Architecture:** Add 4 new enum values to `QuotationStatus`, add 11 audit columns to the `quotations` DB table, extend service/controller with 4 new action endpoints, then update the frontend status constants, API calls, and `QuotationListPage` action buttons/modals.

**Tech Stack:** Java 17 / Spring Boot / Flyway (backend), React 18 / Bootstrap 5 / Axios (frontend)

---

## File Map

| File | Change |
|---|---|
| `backend/.../entity/QuotationStatus.java` | Add 4 new enum values |
| `backend/.../entity/Quotation.java` | Add 11 new fields + getters/setters |
| `backend/.../dto/QuotationResponse.java` | Add 11 new response fields + getters/setters |
| `backend/.../service/QuotationService.java` | Add 4 new methods; update `canEdit`, `canView`, `sendForVerification`, `toResponse` |
| `backend/.../controller/QuotationController.java` | Add 4 new POST endpoints |
| `backend/.../resources/db/migration/V165__add_quotation_post_approval_fields.sql` | New migration adding 11 columns |
| `frontend/.../utils/quotationUtils.js` | Add 4 new status constants |
| `frontend/.../api/quotationApi.js` | Add 4 new API functions |
| `frontend/.../pages/admin/QuotationListPage.jsx` | Extend `getStatusUi`, add new buttons and modal modes |

---

## Task 1: Add new enum values to QuotationStatus

**Files:**
- Modify: `backend/backend/src/main/java/com/nexorcrm/backend/entity/QuotationStatus.java`

- [ ] **Step 1: Update the enum**

Replace the entire file with:

```java
package com.nexorcrm.backend.entity;

public enum QuotationStatus {
    DRAFT,
    VERIFICATION_PENDING,
    APPROVED,
    QUOTATION_SENT,
    NEGOTIATING,
    QUOTATION_REJECTED,
    QUOTATION_ACCEPTED
}
```

- [ ] **Step 2: Commit**

```bash
cd backend/backend
git add src/main/java/com/nexorcrm/backend/entity/QuotationStatus.java
git commit -m "feat: add QUOTATION_SENT, NEGOTIATING, QUOTATION_REJECTED, QUOTATION_ACCEPTED statuses"
```

---

## Task 2: Add new fields to Quotation entity

**Files:**
- Modify: `backend/backend/src/main/java/com/nexorcrm/backend/entity/Quotation.java`

- [ ] **Step 1: Add 11 new fields after the `approvalNotes` field (after line 94)**

Insert the following block after the `approvalNotes` field and before `createdById`:

```java
    @Column(name = "sent_at")
    private LocalDateTime sentAt;

    @Column(name = "sent_by_name", length = 255)
    private String sentByName;

    @Column(name = "negotiating_at")
    private LocalDateTime negotiatingAt;

    @Column(name = "negotiating_by_name", length = 255)
    private String negotiatingByName;

    @Lob
    @Column(name = "negotiating_notes", columnDefinition = "text")
    private String negotiatingNotes;

    @Column(name = "rejected_at")
    private LocalDateTime rejectedAt;

    @Column(name = "rejected_by_name", length = 255)
    private String rejectedByName;

    @Lob
    @Column(name = "rejection_notes", columnDefinition = "text")
    private String rejectionNotes;

    @Column(name = "accepted_at")
    private LocalDateTime acceptedAt;

    @Column(name = "accepted_by_name", length = 255)
    private String acceptedByName;

    @Lob
    @Column(name = "acceptance_notes", columnDefinition = "text")
    private String acceptanceNotes;
```

- [ ] **Step 2: Add getters and setters for all 11 new fields**

Add these methods to the end of the class, before the closing `}`:

```java
    public LocalDateTime getSentAt() { return sentAt; }
    public void setSentAt(LocalDateTime sentAt) { this.sentAt = sentAt; }

    public String getSentByName() { return sentByName; }
    public void setSentByName(String sentByName) { this.sentByName = sentByName; }

    public LocalDateTime getNegotiatingAt() { return negotiatingAt; }
    public void setNegotiatingAt(LocalDateTime negotiatingAt) { this.negotiatingAt = negotiatingAt; }

    public String getNegotiatingByName() { return negotiatingByName; }
    public void setNegotiatingByName(String negotiatingByName) { this.negotiatingByName = negotiatingByName; }

    public String getNegotiatingNotes() { return negotiatingNotes; }
    public void setNegotiatingNotes(String negotiatingNotes) { this.negotiatingNotes = negotiatingNotes; }

    public LocalDateTime getRejectedAt() { return rejectedAt; }
    public void setRejectedAt(LocalDateTime rejectedAt) { this.rejectedAt = rejectedAt; }

    public String getRejectedByName() { return rejectedByName; }
    public void setRejectedByName(String rejectedByName) { this.rejectedByName = rejectedByName; }

    public String getRejectionNotes() { return rejectionNotes; }
    public void setRejectionNotes(String rejectionNotes) { this.rejectionNotes = rejectionNotes; }

    public LocalDateTime getAcceptedAt() { return acceptedAt; }
    public void setAcceptedAt(LocalDateTime acceptedAt) { this.acceptedAt = acceptedAt; }

    public String getAcceptedByName() { return acceptedByName; }
    public void setAcceptedByName(String acceptedByName) { this.acceptedByName = acceptedByName; }

    public String getAcceptanceNotes() { return acceptanceNotes; }
    public void setAcceptanceNotes(String acceptanceNotes) { this.acceptanceNotes = acceptanceNotes; }
```

- [ ] **Step 3: Commit**

```bash
git add src/main/java/com/nexorcrm/backend/entity/Quotation.java
git commit -m "feat: add post-approval audit fields to Quotation entity"
```

---

## Task 3: Add new fields to QuotationResponse DTO

**Files:**
- Modify: `backend/backend/src/main/java/com/nexorcrm/backend/dto/QuotationResponse.java`

- [ ] **Step 1: Add 11 new fields after `approvalNotes` (after line 30) in the class body**

Insert after `private String approvalNotes;`:

```java
    private LocalDateTime sentAt;
    private String sentByName;
    private LocalDateTime negotiatingAt;
    private String negotiatingByName;
    private String negotiatingNotes;
    private LocalDateTime rejectedAt;
    private String rejectedByName;
    private String rejectionNotes;
    private LocalDateTime acceptedAt;
    private String acceptedByName;
    private String acceptanceNotes;
```

- [ ] **Step 2: Add getters and setters at end of class before closing `}`**

```java
    public LocalDateTime getSentAt() { return sentAt; }
    public void setSentAt(LocalDateTime sentAt) { this.sentAt = sentAt; }

    public String getSentByName() { return sentByName; }
    public void setSentByName(String sentByName) { this.sentByName = sentByName; }

    public LocalDateTime getNegotiatingAt() { return negotiatingAt; }
    public void setNegotiatingAt(LocalDateTime negotiatingAt) { this.negotiatingAt = negotiatingAt; }

    public String getNegotiatingByName() { return negotiatingByName; }
    public void setNegotiatingByName(String negotiatingByName) { this.negotiatingByName = negotiatingByName; }

    public String getNegotiatingNotes() { return negotiatingNotes; }
    public void setNegotiatingNotes(String negotiatingNotes) { this.negotiatingNotes = negotiatingNotes; }

    public LocalDateTime getRejectedAt() { return rejectedAt; }
    public void setRejectedAt(LocalDateTime rejectedAt) { this.rejectedAt = rejectedAt; }

    public String getRejectedByName() { return rejectedByName; }
    public void setRejectedByName(String rejectedByName) { this.rejectedByName = rejectedByName; }

    public String getRejectionNotes() { return rejectionNotes; }
    public void setRejectionNotes(String rejectionNotes) { this.rejectionNotes = rejectionNotes; }

    public LocalDateTime getAcceptedAt() { return acceptedAt; }
    public void setAcceptedAt(LocalDateTime acceptedAt) { this.acceptedAt = acceptedAt; }

    public String getAcceptedByName() { return acceptedByName; }
    public void setAcceptedByName(String acceptedByName) { this.acceptedByName = acceptedByName; }

    public String getAcceptanceNotes() { return acceptanceNotes; }
    public void setAcceptanceNotes(String acceptanceNotes) { this.acceptanceNotes = acceptanceNotes; }
```

- [ ] **Step 3: Commit**

```bash
git add src/main/java/com/nexorcrm/backend/dto/QuotationResponse.java
git commit -m "feat: add post-approval fields to QuotationResponse DTO"
```

---

## Task 4: DB migration — add 11 new columns

**Files:**
- Create: `backend/backend/src/main/resources/db/migration/V165__add_quotation_post_approval_fields.sql`

- [ ] **Step 1: Create the migration file**

```sql
ALTER TABLE quotations
    ADD COLUMN sent_at           DATETIME        NULL,
    ADD COLUMN sent_by_name      VARCHAR(255)    NULL,
    ADD COLUMN negotiating_at    DATETIME        NULL,
    ADD COLUMN negotiating_by_name VARCHAR(255)  NULL,
    ADD COLUMN negotiating_notes TEXT            NULL,
    ADD COLUMN rejected_at       DATETIME        NULL,
    ADD COLUMN rejected_by_name  VARCHAR(255)    NULL,
    ADD COLUMN rejection_notes   TEXT            NULL,
    ADD COLUMN accepted_at       DATETIME        NULL,
    ADD COLUMN accepted_by_name  VARCHAR(255)    NULL,
    ADD COLUMN acceptance_notes  TEXT            NULL;
```

- [ ] **Step 2: Commit**

```bash
git add src/main/resources/db/migration/V165__add_quotation_post_approval_fields.sql
git commit -m "feat: db migration V165 - add post-approval columns to quotations table"
```

---

## Task 5: Update QuotationService — new methods + updated helpers

**Files:**
- Modify: `backend/backend/src/main/java/com/nexorcrm/backend/service/QuotationService.java`

- [ ] **Step 1: Update `canView` to include new statuses for higher authorities**

Find this block in `canView` (lines 168-175):
```java
        if (actor.getRole() == Role.TEAM_LEAD) {
            return (status == QuotationStatus.VERIFICATION_PENDING || status == QuotationStatus.APPROVED)
                    && isEmployeeOwnedBySameTeam(quotation, actor);
        }

        if (actor.getRole() == Role.MANAGER || actor.getRole() == Role.ADMIN || actor.getRole() == Role.SUPER_ADMIN) {
            return status == QuotationStatus.VERIFICATION_PENDING || status == QuotationStatus.APPROVED;
        }
```

Replace with:
```java
        if (actor.getRole() == Role.TEAM_LEAD) {
            return (status == QuotationStatus.VERIFICATION_PENDING
                    || status == QuotationStatus.APPROVED
                    || status == QuotationStatus.QUOTATION_SENT
                    || status == QuotationStatus.NEGOTIATING
                    || status == QuotationStatus.QUOTATION_REJECTED
                    || status == QuotationStatus.QUOTATION_ACCEPTED)
                    && isEmployeeOwnedBySameTeam(quotation, actor);
        }

        if (actor.getRole() == Role.MANAGER || actor.getRole() == Role.ADMIN || actor.getRole() == Role.SUPER_ADMIN) {
            return status == QuotationStatus.VERIFICATION_PENDING
                    || status == QuotationStatus.APPROVED
                    || status == QuotationStatus.QUOTATION_SENT
                    || status == QuotationStatus.NEGOTIATING
                    || status == QuotationStatus.QUOTATION_REJECTED
                    || status == QuotationStatus.QUOTATION_ACCEPTED;
        }
```

- [ ] **Step 2: Update `canEdit` to allow editing when status is NEGOTIATING**

Find this block in `canEdit` (lines 187-190):
```java
        if (actor.getRole() == Role.EMPLOYEE) {
            return Objects.equals(quotation.getCreatedById(), actor.getId())
                    && quotation.getStatus() == QuotationStatus.DRAFT;
        }
```

Replace with:
```java
        if (actor.getRole() == Role.EMPLOYEE) {
            return Objects.equals(quotation.getCreatedById(), actor.getId())
                    && (quotation.getStatus() == QuotationStatus.DRAFT
                        || quotation.getStatus() == QuotationStatus.NEGOTIATING);
        }
```

- [ ] **Step 3: Update `sendForVerification` to also allow re-sending from NEGOTIATING**

Find this validation block (lines 113-115):
```java
        if (quotation.getStatus() != QuotationStatus.DRAFT) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only draft quotations can be sent for verification");
        }
```

Replace with:
```java
        if (quotation.getStatus() != QuotationStatus.DRAFT && quotation.getStatus() != QuotationStatus.NEGOTIATING) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only draft or negotiating quotations can be sent for verification");
        }
```

- [ ] **Step 4: Add the `markSent` method after the `approve` method (after line 156)**

```java
    public QuotationResponse markSent(Long id, String principal) {
        User actor = resolveActor(principal);
        Quotation quotation = quotationRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Quotation not found"));

        if (actor.getRole() != Role.EMPLOYEE || !Objects.equals(actor.getId(), quotation.getCreatedById())) {
            throw new AccessDeniedException("Only the owning employee can mark this quotation as sent");
        }
        if (quotation.getStatus() != QuotationStatus.APPROVED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only approved quotations can be marked as sent");
        }

        quotation.setStatus(QuotationStatus.QUOTATION_SENT);
        quotation.setSentAt(LocalDateTime.now());
        quotation.setSentByName(resolveDisplayName(actor));
        return toResponse(quotationRepository.save(quotation));
    }
```

- [ ] **Step 5: Add the `markNegotiating` method**

```java
    public QuotationResponse markNegotiating(Long id, QuotationActionRequest request, String principal) {
        User actor = resolveActor(principal);
        Quotation quotation = quotationRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Quotation not found"));

        if (actor.getRole() != Role.EMPLOYEE || !Objects.equals(actor.getId(), quotation.getCreatedById())) {
            throw new AccessDeniedException("Only the owning employee can mark this quotation as negotiating");
        }
        if (quotation.getStatus() != QuotationStatus.QUOTATION_SENT) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only sent quotations can be marked as negotiating");
        }
        String notes = request != null ? trimToNull(request.getNotes()) : null;
        if (notes == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Negotiating notes are required");
        }

        quotation.setStatus(QuotationStatus.NEGOTIATING);
        quotation.setNegotiatingAt(LocalDateTime.now());
        quotation.setNegotiatingByName(resolveDisplayName(actor));
        quotation.setNegotiatingNotes(notes);
        return toResponse(quotationRepository.save(quotation));
    }
```

- [ ] **Step 6: Add the `markRejected` method**

```java
    public QuotationResponse markRejected(Long id, QuotationActionRequest request, String principal) {
        User actor = resolveActor(principal);
        Quotation quotation = quotationRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Quotation not found"));

        if (actor.getRole() != Role.EMPLOYEE || !Objects.equals(actor.getId(), quotation.getCreatedById())) {
            throw new AccessDeniedException("Only the owning employee can mark this quotation as rejected");
        }
        if (quotation.getStatus() != QuotationStatus.QUOTATION_SENT) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only sent quotations can be marked as rejected");
        }
        String notes = request != null ? trimToNull(request.getNotes()) : null;
        if (notes == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Rejection notes are required");
        }

        quotation.setStatus(QuotationStatus.QUOTATION_REJECTED);
        quotation.setRejectedAt(LocalDateTime.now());
        quotation.setRejectedByName(resolveDisplayName(actor));
        quotation.setRejectionNotes(notes);
        return toResponse(quotationRepository.save(quotation));
    }
```

- [ ] **Step 7: Add the `markAccepted` method**

```java
    public QuotationResponse markAccepted(Long id, QuotationActionRequest request, String principal) {
        User actor = resolveActor(principal);
        Quotation quotation = quotationRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Quotation not found"));

        if (actor.getRole() != Role.EMPLOYEE || !Objects.equals(actor.getId(), quotation.getCreatedById())) {
            throw new AccessDeniedException("Only the owning employee can mark this quotation as accepted");
        }
        if (quotation.getStatus() != QuotationStatus.QUOTATION_SENT) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only sent quotations can be marked as accepted");
        }

        quotation.setStatus(QuotationStatus.QUOTATION_ACCEPTED);
        quotation.setAcceptedAt(LocalDateTime.now());
        quotation.setAcceptedByName(resolveDisplayName(actor));
        quotation.setAcceptanceNotes(request != null ? trimToNull(request.getNotes()) : null);
        return toResponse(quotationRepository.save(quotation));
    }
```

- [ ] **Step 8: Update `toResponse` to map the 11 new fields**

Add these lines at the end of `toResponse`, just before `return response;`:

```java
        response.setSentAt(quotation.getSentAt());
        response.setSentByName(quotation.getSentByName());
        response.setNegotiatingAt(quotation.getNegotiatingAt());
        response.setNegotiatingByName(quotation.getNegotiatingByName());
        response.setNegotiatingNotes(quotation.getNegotiatingNotes());
        response.setRejectedAt(quotation.getRejectedAt());
        response.setRejectedByName(quotation.getRejectedByName());
        response.setRejectionNotes(quotation.getRejectionNotes());
        response.setAcceptedAt(quotation.getAcceptedAt());
        response.setAcceptedByName(quotation.getAcceptedByName());
        response.setAcceptanceNotes(quotation.getAcceptanceNotes());
```

- [ ] **Step 9: Commit**

```bash
git add src/main/java/com/nexorcrm/backend/service/QuotationService.java
git commit -m "feat: add markSent/markNegotiating/markRejected/markAccepted methods to QuotationService"
```

---

## Task 6: Add 4 new endpoints to QuotationController

**Files:**
- Modify: `backend/backend/src/main/java/com/nexorcrm/backend/controller/QuotationController.java`

- [ ] **Step 1: Add 4 new POST endpoints after the `approve` endpoint (after line 74)**

```java
    @PostMapping("/{id}/mark-sent")
    public QuotationResponse markSent(
            @PathVariable Long id,
            Authentication authentication
    ) {
        String principal = authentication != null ? authentication.getName() : null;
        return quotationService.markSent(id, principal);
    }

    @PostMapping("/{id}/mark-negotiating")
    public QuotationResponse markNegotiating(
            @PathVariable Long id,
            @RequestBody(required = false) QuotationActionRequest request,
            Authentication authentication
    ) {
        String principal = authentication != null ? authentication.getName() : null;
        return quotationService.markNegotiating(id, request, principal);
    }

    @PostMapping("/{id}/mark-rejected")
    public QuotationResponse markRejected(
            @PathVariable Long id,
            @RequestBody(required = false) QuotationActionRequest request,
            Authentication authentication
    ) {
        String principal = authentication != null ? authentication.getName() : null;
        return quotationService.markRejected(id, request, principal);
    }

    @PostMapping("/{id}/mark-accepted")
    public QuotationResponse markAccepted(
            @PathVariable Long id,
            @RequestBody(required = false) QuotationActionRequest request,
            Authentication authentication
    ) {
        String principal = authentication != null ? authentication.getName() : null;
        return quotationService.markAccepted(id, request, principal);
    }
```

- [ ] **Step 2: Commit**

```bash
git add src/main/java/com/nexorcrm/backend/controller/QuotationController.java
git commit -m "feat: add mark-sent/mark-negotiating/mark-rejected/mark-accepted endpoints"
```

---

## Task 7: Frontend — add status constants to quotationUtils.js

**Files:**
- Modify: `frontend/frontend/src/utils/quotationUtils.js`

- [ ] **Step 1: Add 4 new constants after line 8 (after `QUOTATION_STATUS_APPROVED`)**

```js
export const QUOTATION_STATUS_SENT = "QUOTATION_SENT";
export const QUOTATION_STATUS_NEGOTIATING = "NEGOTIATING";
export const QUOTATION_STATUS_REJECTED = "QUOTATION_REJECTED";
export const QUOTATION_STATUS_ACCEPTED = "QUOTATION_ACCEPTED";
```

- [ ] **Step 2: Commit**

```bash
cd ../../frontend/frontend
git add src/utils/quotationUtils.js
git commit -m "feat: add post-approval status constants to quotationUtils"
```

---

## Task 8: Frontend — add 4 API functions to quotationApi.js

**Files:**
- Modify: `frontend/frontend/src/api/quotationApi.js`

- [ ] **Step 1: Add 4 new exported functions at the end of the file**

```js
export async function markQuotationSent(id) {
  const response = await api.post(`/api/quotations/${normalizeId(id)}/mark-sent`);
  return response.data;
}

export async function markQuotationNegotiating(id, notes) {
  const response = await api.post(`/api/quotations/${normalizeId(id)}/mark-negotiating`, {
    notes: notes || "",
  });
  return response.data;
}

export async function markQuotationRejected(id, notes) {
  const response = await api.post(`/api/quotations/${normalizeId(id)}/mark-rejected`, {
    notes: notes || "",
  });
  return response.data;
}

export async function markQuotationAccepted(id, notes) {
  const response = await api.post(`/api/quotations/${normalizeId(id)}/mark-accepted`, {
    notes: notes || "",
  });
  return response.data;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/api/quotationApi.js
git commit -m "feat: add mark-sent/negotiating/rejected/accepted API functions"
```

---

## Task 9: Frontend — update QuotationListPage

**Files:**
- Modify: `frontend/frontend/src/pages/admin/QuotationListPage.jsx`

- [ ] **Step 1: Update the import from `quotationUtils`**

Find:
```js
import {
  QUOTATION_STATUS_APPROVED,
  QUOTATION_STATUS_DRAFT,
  QUOTATION_STATUS_VERIFICATION_PENDING,
  downloadQuotationPdf,
  setQuotationDraft,
} from "../../utils/quotationUtils";
```

Replace with:
```js
import {
  QUOTATION_STATUS_APPROVED,
  QUOTATION_STATUS_DRAFT,
  QUOTATION_STATUS_VERIFICATION_PENDING,
  QUOTATION_STATUS_SENT,
  QUOTATION_STATUS_NEGOTIATING,
  QUOTATION_STATUS_REJECTED,
  QUOTATION_STATUS_ACCEPTED,
  downloadQuotationPdf,
  setQuotationDraft,
} from "../../utils/quotationUtils";
```

- [ ] **Step 2: Update the import from `quotationApi`**

Find:
```js
import {
  approveQuotation,
  getQuotations,
  sendQuotationForVerification,
} from "../../api/quotationApi";
```

Replace with:
```js
import {
  approveQuotation,
  getQuotations,
  markQuotationAccepted,
  markQuotationNegotiating,
  markQuotationRejected,
  markQuotationSent,
  sendQuotationForVerification,
} from "../../api/quotationApi";
```

- [ ] **Step 3: Replace `getStatusUi` function to handle all 6 statuses**

Find:
```js
function getStatusUi(status) {
  if (status === QUOTATION_STATUS_APPROVED) {
    return { label: "Approved", className: "badge bg-success" };
  }
  if (status === QUOTATION_STATUS_VERIFICATION_PENDING) {
    return { label: "Verification Pending", className: "badge bg-warning text-dark" };
  }
  return { label: "Draft", className: "badge bg-secondary" };
}
```

Replace with:
```js
function getStatusUi(status) {
  switch (status) {
    case QUOTATION_STATUS_APPROVED:
      return { label: "Approved", className: "badge bg-success" };
    case QUOTATION_STATUS_VERIFICATION_PENDING:
      return { label: "Verification Pending", className: "badge bg-warning text-dark" };
    case QUOTATION_STATUS_SENT:
      return { label: "Sent to Customer", className: "badge bg-info text-dark" };
    case QUOTATION_STATUS_NEGOTIATING:
      return { label: "Negotiating", className: "badge bg-warning text-dark" };
    case QUOTATION_STATUS_REJECTED:
      return { label: "Rejected", className: "badge bg-danger" };
    case QUOTATION_STATUS_ACCEPTED:
      return { label: "Accepted", className: "badge bg-success" };
    default:
      return { label: "Draft", className: "badge bg-secondary" };
  }
}
```

- [ ] **Step 4: Add handlers for the 4 new actions**

Add these 4 handler functions after the existing `openApproveDialog` function (after line 146):

```js
  const handleMarkSent = async (quotation) => {
    setActionError("");
    try {
      const updated = await markQuotationSent(quotation.id);
      if (updated) updateSingleQuotation(updated);
    } catch (error) {
      const message = error?.response?.data?.message || "Failed to mark quotation as sent.";
      setActionError(message);
    }
  };

  const openMarkNegotiatingDialog = (quotation) => {
    setNotesDialog({ open: true, mode: "mark-negotiating", quotationId: quotation.id, notes: "" });
  };

  const openMarkRejectedDialog = (quotation) => {
    setNotesDialog({ open: true, mode: "mark-rejected", quotationId: quotation.id, notes: "" });
  };

  const openMarkAcceptedDialog = (quotation) => {
    setNotesDialog({ open: true, mode: "mark-accepted", quotationId: quotation.id, notes: "" });
  };
```

- [ ] **Step 5: Update `submitNotesDialog` to handle the 3 new modal modes**

Find:
```js
      let updated = null;
      if (notesDialog.mode === "verify") {
        updated = await sendQuotationForVerification(quotation.id, notesDialog.notes);
      } else if (notesDialog.mode === "approve") {
        updated = await approveQuotation(quotation.id, notesDialog.notes);
      }
```

Replace with:
```js
      let updated = null;
      if (notesDialog.mode === "verify") {
        updated = await sendQuotationForVerification(quotation.id, notesDialog.notes);
      } else if (notesDialog.mode === "approve") {
        updated = await approveQuotation(quotation.id, notesDialog.notes);
      } else if (notesDialog.mode === "mark-negotiating") {
        updated = await markQuotationNegotiating(quotation.id, notesDialog.notes);
      } else if (notesDialog.mode === "mark-rejected") {
        updated = await markQuotationRejected(quotation.id, notesDialog.notes);
      } else if (notesDialog.mode === "mark-accepted") {
        updated = await markQuotationAccepted(quotation.id, notesDialog.notes);
      }
```

- [ ] **Step 6: Update the table row to add new employee buttons**

Find this block in the table body (the `{isEmployee && (` block, around line 275):
```jsx
                            {isEmployee && (
                              <button
                                type="button"
                                className="btn btn-warning btn-sm"
                                onClick={() => openVerifyDialog(quotation)}
                                disabled={status !== QUOTATION_STATUS_DRAFT}
                              >
                                <i className="ti ti-send me-1"></i>
                                {status === QUOTATION_STATUS_DRAFT && "Verify Quotation"}
                                {status === QUOTATION_STATUS_VERIFICATION_PENDING && "Sent for Verification"}
                                {status === QUOTATION_STATUS_APPROVED && "Approved"}
                              </button>
                            )}
```

Replace with:
```jsx
                            {isEmployee && status === QUOTATION_STATUS_DRAFT && (
                              <button
                                type="button"
                                className="btn btn-warning btn-sm"
                                onClick={() => openVerifyDialog(quotation)}
                              >
                                <i className="ti ti-send me-1"></i>
                                Send for Verification
                              </button>
                            )}

                            {isEmployee && status === QUOTATION_STATUS_NEGOTIATING && (
                              <button
                                type="button"
                                className="btn btn-warning btn-sm"
                                onClick={() => openVerifyDialog(quotation)}
                              >
                                <i className="ti ti-send me-1"></i>
                                Re-send for Approval
                              </button>
                            )}

                            {isEmployee && status === QUOTATION_STATUS_APPROVED && (
                              <button
                                type="button"
                                className="btn btn-info btn-sm"
                                onClick={() => handleMarkSent(quotation)}
                              >
                                <i className="ti ti-mail-forward me-1"></i>
                                Mark as Sent
                              </button>
                            )}

                            {isEmployee && status === QUOTATION_STATUS_SENT && (
                              <>
                                <button
                                  type="button"
                                  className="btn btn-success btn-sm"
                                  onClick={() => openMarkAcceptedDialog(quotation)}
                                >
                                  <i className="ti ti-circle-check me-1"></i>
                                  Accepted
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-warning btn-sm"
                                  onClick={() => openMarkNegotiatingDialog(quotation)}
                                >
                                  <i className="ti ti-refresh me-1"></i>
                                  Negotiating
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-danger btn-sm"
                                  onClick={() => openMarkRejectedDialog(quotation)}
                                >
                                  <i className="ti ti-x me-1"></i>
                                  Rejected
                                </button>
                              </>
                            )}
```

- [ ] **Step 7: Update the modal to handle the 3 new modes**

Find:
```jsx
                <div className="modal-header">
                  <h5 className="modal-title">
                    {notesDialog.mode === "verify" ? "Send for Verification" : "Approve Quotation"}
                  </h5>
```

Replace with:
```jsx
                <div className="modal-header">
                  <h5 className="modal-title">
                    {notesDialog.mode === "verify" && "Send for Verification"}
                    {notesDialog.mode === "approve" && "Approve Quotation"}
                    {notesDialog.mode === "mark-negotiating" && "Mark as Negotiating"}
                    {notesDialog.mode === "mark-rejected" && "Mark as Rejected"}
                    {notesDialog.mode === "mark-accepted" && "Mark as Accepted"}
                  </h5>
```

Find:
```jsx
                  <label className="form-label">
                    {notesDialog.mode === "verify"
                      ? "Verification Notes (optional)"
                      : "Approval Notes (optional)"}
                  </label>
                  <textarea
                    className="form-control"
                    rows={4}
                    value={notesDialog.notes}
                    onChange={(event) =>
                      setNotesDialog((previous) => ({ ...previous, notes: event.target.value }))
                    }
                    placeholder="Add notes..."
                  />
```

Replace with:
```jsx
                  <label className="form-label">
                    {notesDialog.mode === "verify" && "Verification Notes (optional)"}
                    {notesDialog.mode === "approve" && "Approval Notes (optional)"}
                    {notesDialog.mode === "mark-negotiating" && "Negotiation Notes (required)"}
                    {notesDialog.mode === "mark-rejected" && "Rejection Notes (required)"}
                    {notesDialog.mode === "mark-accepted" && "Acceptance Notes (optional)"}
                  </label>
                  <textarea
                    className="form-control"
                    rows={4}
                    value={notesDialog.notes}
                    onChange={(event) =>
                      setNotesDialog((previous) => ({ ...previous, notes: event.target.value }))
                    }
                    placeholder="Add notes..."
                    required={notesDialog.mode === "mark-negotiating" || notesDialog.mode === "mark-rejected"}
                  />
                  {(notesDialog.mode === "mark-negotiating" || notesDialog.mode === "mark-rejected") && !notesDialog.notes.trim() && (
                    <div className="form-text text-danger">Notes are required.</div>
                  )}
```

Find:
```jsx
                  <button type="button" className="btn btn-primary" onClick={submitNotesDialog}>
                    {notesDialog.mode === "verify" ? "Send Verification" : "Approve"}
                  </button>
```

Replace with:
```jsx
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={submitNotesDialog}
                    disabled={
                      (notesDialog.mode === "mark-negotiating" || notesDialog.mode === "mark-rejected")
                      && !notesDialog.notes.trim()
                    }
                  >
                    {notesDialog.mode === "verify" && "Send Verification"}
                    {notesDialog.mode === "approve" && "Approve"}
                    {notesDialog.mode === "mark-negotiating" && "Save"}
                    {notesDialog.mode === "mark-rejected" && "Save"}
                    {notesDialog.mode === "mark-accepted" && "Save"}
                  </button>
```

- [ ] **Step 8: Update Edit button to also be enabled for NEGOTIATING status (for employees)**

Find:
```jsx
                            <button
                              type="button"
                              className="btn btn-primary btn-sm"
                              onClick={() => handleEdit(quotation)}
                              disabled={isEmployee && !canEditForEmployee}
                            >
```

The `canEditForEmployee` variable is computed as `status === QUOTATION_STATUS_DRAFT`. Update that computed variable in the table row destructuring block. Find:
```js
                    const canEditForEmployee = status === QUOTATION_STATUS_DRAFT;
```

Replace with:
```js
                    const canEditForEmployee = status === QUOTATION_STATUS_DRAFT || status === QUOTATION_STATUS_NEGOTIATING;
```

- [ ] **Step 9: Commit**

```bash
git add src/pages/admin/QuotationListPage.jsx
git commit -m "feat: add post-approval status actions to QuotationListPage"
```

---

## Verification Checklist

After starting both backend and frontend servers:

- [ ] **APPROVED → Sent:** On an APPROVED quotation as employee, click "Mark as Sent" — status badge should change to "Sent to Customer" (blue).
- [ ] **SENT → Accepted:** On a QUOTATION_SENT row, click "Accepted", add optional note, Save — badge shows "Accepted" (green).
- [ ] **SENT → Rejected:** On a QUOTATION_SENT row, click "Rejected", try Submit without notes — button stays disabled. Enter notes, Save — badge shows "Rejected" (red).
- [ ] **SENT → Negotiating:** On a QUOTATION_SENT row, click "Negotiating", try Submit without notes — button stays disabled. Enter notes, Save — badge shows "Negotiating" (orange).
- [ ] **Negotiating → Edit:** On a NEGOTIATING row, click Edit — quotation form opens with existing data. Save changes.
- [ ] **Negotiating → Re-send:** On a NEGOTIATING row, click "Re-send for Approval" — badge changes to "Verification Pending".
- [ ] **Re-approval loop:** Approver approves the re-submitted quotation — badge back to "Approved", employee can "Mark as Sent" again.
- [ ] **Terminal state:** REJECTED and ACCEPTED rows show no action buttons (only Edit is shown but disabled for employee).
- [ ] **Manager visibility:** Log in as Manager — SENT / NEGOTIATING / REJECTED / ACCEPTED rows are all visible with correct badges (read-only).
