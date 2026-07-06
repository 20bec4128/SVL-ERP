# Design Tab Radio Buttons — Design Spec

**Date:** 2026-04-13  
**Status:** Approved

---

## Context

The Design tab in `RequirementFormModal` currently has a "Customer has design folder" toggle switch. When toggled ON, a folder upload area appears alongside a notes field. When OFF, only notes are visible. This binary toggle doesn't clearly communicate the three distinct workflow modes staff need to capture:

1. Customer wants design work only (no printing yet)
2. Customer has ready design files and just needs printing (Production Only)
3. Customer wants full service — design created by us, then printed (Design + Production)

Replacing the toggle with three explicit radio buttons makes intent unambiguous and maps cleanly to backend `designStatus` field.

---

## Design

### Radio Button Modes

Three mutually exclusive radio buttons replace the toggle:

| Mode | Label | Fields Shown | Meaning |
|------|-------|-------------|---------|
| `design_only` | Design Only | Notes textarea | Customer wants design work, no printing yet |
| `production_only` | Production Only | Folder upload + Notes textarea | Customer has ready files, just needs printing |
| `design_production` | Design + Production | Notes textarea | Full service — we design it, then print it |

### Behavior

- **Design Only**: Shows a single "Note" textarea. No file upload.
- **Production Only**: Shows folder drag-and-drop upload area first, then a "Note" textarea below it. This is identical to the current toggle-ON behavior. Validation still requires at least one file uploaded before proceeding.
- **Design + Production**: Shows a single "Note" textarea. No file upload.
- No default selection — one of the three must be chosen before the user can proceed (same validation gate as existing steps).

### State Changes

- Remove `useDesignFolderUpload` boolean state and the toggle switch UI.
- Add `designMode` state variable with values: `"design_only"`, `"production_only"`, `"design_production"` (default `""`).
- `designMode` value is sent directly as `designStatus` in the submit payload (replaces the current hardcoded `null`).
- Validation: block Next if `designMode === ""`, or if `designMode === "production_only"` and `files.length === 0`.

### API Payload Mapping

| `designMode` | `designStatus` sent |
|---|---|
| `"design_only"` | `"design_only"` |
| `"production_only"` | `"production_only"` |
| `"design_production"` | `"design_production"` |
| `""` (unselected) | blocked — cannot submit |

---

## Files to Modify

- `frontend/frontend/src/pages/admin/RequirementFormModal.jsx`
  - Lines ~917–926: replace `useDesignFolderUpload` state with `designMode` state
  - Lines ~1280–1285: update validation logic
  - Lines ~1305: update error message
  - Lines ~1317–1339: map `designMode` → `designStatus` in submit payload
  - Lines ~1717–1787: replace toggle + conditional upload with radio buttons + conditional panels

---

## Verification

1. Open a requirement form and navigate to the Design tab.
2. Confirm three radio buttons are visible: "Design Only", "Production Only", "Design + Production".
3. Click **Design Only** → only a Notes textarea appears, no upload area.
4. Click **Production Only** → folder upload area and Notes textarea appear; Next button blocked until a file is uploaded.
5. Click **Design + Production** → only a Notes textarea appears, no upload area.
6. Submit a form with each mode; verify `designStatus` is correctly sent in the API payload.
7. Confirm that leaving no radio selected blocks the Next button with an appropriate error message.
