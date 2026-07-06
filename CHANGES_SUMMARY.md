# Backend Changes Summary - Deal Edit Page, Production & Design

## Overview
You've implemented a complete **Design Workflow System** for the Deals module with file management, draft tracking, and sales feedback handling. The Production features are integrated through Production Requirements and assigned to deals based on deal status transitions.

---

## 1. DEAL ENTITY CHANGES (`Deal.java`)

### New Design Workflow Fields Added:
```
- design_assigned_to_user_id (BIGINT)
  → Assigns design requests to specific employees via round-robin

- design_request_status (VARCHAR 50)
  → Tracks states: PENDING, WORK_STARTED, DRAFT_READY, FEEDBACK_SENT, 
                   FINAL_APPROVED, FINAL_UPLOADED

- design_draft_file_name (VARCHAR 255)
  → Stores original filename of draft submission

- design_draft_file_path (VARCHAR 500)
  → Server path to uploaded draft file

- design_draft_count (INT, default 0)
  → Counter for number of draft submissions

- design_sales_feedback (TEXT)
  → Accumulated feedback messages from sales team (appends with delimiters)

- design_final_file_name (VARCHAR 255)
  → Stores original filename of final approved design

- design_final_file_path (VARCHAR 500)
  → Server path to final approved design file

- requirement_type (VARCHAR 100)
- requirement_notes (TEXT)
- requirement_file_name (VARCHAR 255)
  → General requirement tracking (supports Design & Production)
```

### Database Indices Created:
- `idx_deals_design_assigned` - For filtering deals by assigned employee
- `idx_deals_design_req_status` - For filtering by design request status

---

## 2. DEAL CONTROLLER ENDPOINTS (`DealController.java`)

### New Design Workflow Endpoints:

```java
// Design Request Management
GET  /api/v1/deals/design-requests
     → Lists all design requests (filtered by user role)

GET  /api/v1/deals/production-requests
     → Lists all production requests (filtered by user role)

// Design Workflow Operations
POST /api/v1/deals/{id}/design/start-work
     → Changes status to WORK_STARTED

POST /api/v1/deals/{id}/design/upload-draft
     → Uploads draft file, increments draft count, changes status to DRAFT_READY
     → Parameters: file (MultipartFile)

POST /api/v1/deals/{id}/design/send-feedback
     → Appends sales feedback, changes status to FEEDBACK_SENT
     → Body: { "message": "feedback text" }

POST /api/v1/deals/{id}/design/upload-final
     → Uploads final approved design file, changes status to FINAL_UPLOADED
     → Parameters: file (MultipartFile)

POST /api/v1/deals/{id}/design/approve-final
     → Approves final design, changes status to FINAL_APPROVED
```

### Existing Endpoints Enhanced:

```java
PATCH /api/v1/deals/{id}
      → Now supports updating deal details via the DealEditPage

DELETE /api/v1/deals/{id}
       → Soft delete functionality for deals
```

---

## 3. DEAL SERVICE LOGIC (`DealService.java`)

### Key Business Logic:

#### A. Design Request Assignment (Round-Robin)
```java
assignDesignRequest(Long sourceLeadId)
  - Triggered when lead status changes to "Design"
  - Looks up deal flow configuration for "Design" status
  - Gets member list from configured user group, sorted alphabetically
  - Finds last assigned employee and moves to next in round-robin
  - Assigns to first employee if no previous assignment
  - Sets designRequestStatus to "PENDING"
```

#### B. Design Request Queries
```java
listDesignRequests(String actorPrincipal)
  - EMPLOYEES: Only see deals assigned to them
  - ADMINS/MANAGERS/SUPER_ADMINS: See all design requests
  - Filters by status = "Design" only

listProductionRequests(String actorPrincipal)
  - EMPLOYEES: Only see deals assigned to them (via lead.productionOwnerId)
  - ADMINS/MANAGERS: See all production requests
  - Filters by status = "Production" only
```

#### C. Design Workflow Status Transitions
```
1. start-work:          PENDING → WORK_STARTED
2. upload-draft:        WORK_STARTED → DRAFT_READY (increments draft count)
3. send-feedback:       DRAFT_READY → FEEDBACK_SENT (appends feedback message)
4. upload-final:        (any) → FINAL_UPLOADED
5. approve-final:       FINAL_UPLOADED → FINAL_APPROVED
```

#### D. Invoice & Payment Sync
```java
syncLeadStatusToDeal()
  - When lead status changes to "payment", deal status is synced
  - Auto-assigns payment verification to deal owner user

syncInvoiceDataToDeals()
  - When lead invoice data changes, updates all related deals
  - Keeps total_amount, paid_amount, cgst%, sgst% synchronized
```

#### E. Deal Conversion from Lead
```java
createOrUpdateFromLead(Lead lead)
  - Called when a lead is converted to deal
  - Snapshots all lead fields into deal (name, email, owner, amount, etc.)
  - Sets initial deal status to "Payment"
  - Records conversion timestamp
```

---

## 4. DATABASE MIGRATIONS

### V121__add_design_request_fields_to_deals.sql
```sql
- Added design_assigned_to_user_id BIGINT
- Added design_request_status VARCHAR(50)
- Created indices for performance
```

### V123__add_design_workflow_tracking_fields.sql
```sql
- design_draft_file_name VARCHAR(255)
- design_draft_file_path VARCHAR(500)
- design_draft_count INT DEFAULT 0
- design_sales_feedback TEXT
- design_final_file_name VARCHAR(255)
- design_final_file_path VARCHAR(500)
```

---

## 5. DESIGN REQUIREMENTS SERVICE (`DesignRequirementService.java`)

### Purpose
Manages detailed design specifications/briefs associated with deals.

### Operations
```java
saveDesignRequirement(DesignRequirementRequest, userId)
  - Creates or updates design brief for a lead
  - Maps: product type, size, orientation, pages, description, purpose
  - Maps: target audience, style preference, brand colors, fonts
  - Stores brand guidelines file reference

getDesignRequirement(leadId)
  - Retrieves full design brief specifications

deleteDesignRequirement(leadId)
  - Removes design requirement entry

existsForLead(leadId)
  - Checks if design brief exists
```

### Design Fields Captured
- Product Type (Business Card, Brochure, etc.)
- Size & Orientation
- Number of Pages
- Description & Purpose
- Target Audience
- Style Preferences
- Brand Colors & Fonts
- Brand Guidelines File

---

## 6. PRODUCTION REQUIREMENTS SERVICE (`ProductionRequirementService.java`)

### Purpose
Manages production specifications (print/manufacturing details) for deals.

### Operations
```java
saveProductionRequirement(ProductionRequirementRequest, userId)
  - Creates or updates production specs for a lead
  - Maps: product type, quantity, page count
  - Maps: paper size, custom sizes, paper type, GSM weight
  - Maps: color type, print sides (single/double)

getProductionRequirement(leadId)
  - Retrieves production specifications

deleteProductionRequirement(leadId)
  - Removes production requirement entry

existsForLead(leadId)
  - Checks if production requirement exists
```

### Production Fields Captured
- Product Type (Flyers, Brochures, etc.)
- Custom Product Type
- Quantity & Page Count
- Paper Size (A4, A3, Custom)
- Custom Width/Height/Unit
- Paper Type & GSM Weight
- Color Type (CMYK, RGB, BW)
- Print Sides

---

## 7. FRONTEND INTEGRATION (`DealEditPage.jsx`)

### API Calls Made
```javascript
// Design workflow operations
startDesignWork(dealId)
uploadDesignDraft(dealId, file)
sendDesignFeedback(dealId, message)
uploadFinalDesign(dealId, file)
approveFinalDesign(dealId)

// Requirement retrieval
getDesignRequirement(leadId)
getProductionRequirements(leadId)

// Lead & Deal operations
getLeadById(leadId)
getDealById(dealId)
updateDealStatus(dealId, newStatus)
updateLeadDetails(leadId, updates)
```

### Key Features
- Deal detail display with all design workflow fields
- Status indicators for design requests
- File upload handlers for drafts and final designs
- Sales feedback input & display
- Design brief form
- Production specifications form
- Invoice data display

---

## 8. DATA FLOW & WORKFLOW

```
Lead Created
    ↓
Lead Status → "Design"
    ↓
Deal Created/Updated from Lead
    ↓
Design Request Auto-Assigned (Round-Robin)
    ↓
Employee: Takes Work → Uploads Draft → Reviews Feedback
    ↓
Sales: Sends Feedback (appended with ---)
    ↓
Employee: Uploads Final Design
    ↓
Sales: Approves Final Design
    ↓
Status: FINAL_APPROVED
    ↓
Deal Status → "Production"
    ↓
Lead/Deal: productionOwnerId assigned
    ↓
Production team handles manufacturing
```

---

## 9. KEY ARCHITECTURAL DECISIONS

### 1. Round-Robin Assignment System
- Distributes design work evenly across team members
- Based on Deal Flow configuration per status
- Alphabetical ordering for deterministic results
- No ownership change to original deal owner

### 2. Draft Count Tracking
- Prevents infinite revisions
- Helps track design iteration history
- Supports SLA metrics

### 3. Feedback Accumulation
- Appends feedback with "---" separator
- Creates audit trail of all feedback
- Maintains chronological record

### 4. Soft Delete Pattern
- Sets is_deleted flag instead of hard delete
- Preserves data integrity and audit trails
- Shows in list queries with `findByDeletedFalse` filters

### 5. Role-Based Access
- EMPLOYEES: See only their assigned work
- MANAGERS/ADMINS: See team/all work
- SUPER_ADMIN: Full system access

### 6. File Storage
- Design drafts: `/uploads/design-drafts/{UUID}_{originalName}`
- Final designs: `/uploads/design-finals/{UUID}_{originalName}`
- Uses UUID to prevent conflicts
- Preserves original filenames for user reference

---

## 10. STATUS ENUM VALUES

### Deal Statuses (in lead/deal status tracking)
- Payment
- Design
- Production
- Complete
- Cancelled

### Design Request Statuses
- PENDING: Waiting for employee to start
- WORK_STARTED: Employee began work
- DRAFT_READY: Draft uploaded
- FEEDBACK_SENT: Sales feedback sent
- FINAL_APPROVED: Final design approved
- FINAL_UPLOADED: Final file uploaded

---

## 11. SECURITY & VALIDATION

### Access Control
```java
assertAccess(principal)
  - Validates user exists and is not deleted
  - Blocks unauthenticated requests
  - Resolves user by username or email
```

### Role-Based Authorization
- Deal deletion: ADMIN & SUPER_ADMIN only
- Design assignment: Automatic via workflow
- Access to design requests: Filtered by role

### File Validation
- Cleans file paths to prevent directory traversal
- Uses UUID to prevent filename collisions
- Creates upload directories if missing
- Handles IO exceptions gracefully

---

## 12. ERROR HANDLING

All endpoints return:
- **404 NOT_FOUND**: Deal/Lead not found
- **403 FORBIDDEN**: Insufficient permissions
- **400 BAD_REQUEST**: Invalid input (e.g., missing status)
- **200 OK**: Successful operation with DealResponse DTO

File upload failures are logged but don't block status updates (degraded mode).

---

## Summary of Changes

| Component | Change Type | Impact |
|-----------|------------|--------|
| Deal Entity | +8 columns | Design workflow tracking |
| Controller | +6 endpoints | Design workflow operations |
| Service | +5 methods | Round-robin assignment, status transitions |
| Database | +2 migrations | Schema updates with indices |
| Frontend | Enhanced | UI for design workflow |
| Requirements | New services | Design & Production specifications |

