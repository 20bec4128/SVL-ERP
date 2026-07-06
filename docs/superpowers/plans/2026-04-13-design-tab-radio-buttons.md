# Design Tab Radio Buttons Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the "Customer has design folder" toggle in the Design tab of `RequirementFormModal` with three radio buttons: Design Only, Production Only, and Design + Production.

**Architecture:** Single-file change in `RequirementFormModal.jsx`. Replace `useDesignFolderUpload` boolean state with `designMode` string state. Update validation, error messages, submit payload, and the Design tab JSX in one coherent pass.

**Tech Stack:** React, Bootstrap 5 (form-check radio inputs)

---

## Files

- Modify: `frontend/frontend/src/pages/admin/RequirementFormModal.jsx`
  - Line 925: replace `useDesignFolderUpload` state with `designMode`
  - Line 1282: update `canProceed` validation
  - Line 1305: update error message
  - Line 1329: update `designStatus` in submit payload
  - Lines 1695–1787: replace dead `{false && ...}` block + toggle + upload with radio buttons + conditional panels

---

### Task 1: Replace state variable

**Files:**
- Modify: `frontend/frontend/src/pages/admin/RequirementFormModal.jsx:925`

- [ ] **Step 1: Replace `useDesignFolderUpload` state with `designMode`**

Find this block (around line 917):
```js
  // Design section
  const designStatus = "full_design";
  const setDesignStatus = () => {};
  const [designNotes, setDesignNotes] = useState("");
  const [stylePreference, setStylePreference] = useState("");
  const [colourPreference, setColourPreference] = useState("");
  const [referenceNotes, setReferenceNotes] = useState("");
  const [brandColours, setBrandColours] = useState("");
  const [useDesignFolderUpload, setUseDesignFolderUpload] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);
```

Replace with:
```js
  // Design section
  const [designMode, setDesignMode] = useState(""); // "design_only" | "production_only" | "design_production"
  const [designNotes, setDesignNotes] = useState("");
  const [stylePreference, setStylePreference] = useState("");
  const [colourPreference, setColourPreference] = useState("");
  const [referenceNotes, setReferenceNotes] = useState("");
  const [brandColours, setBrandColours] = useState("");
  const [isDragActive, setIsDragActive] = useState(false);
```

- [ ] **Step 2: Verify the file saves without syntax errors**

Open the file and confirm no red squiggles or console parse errors. The variables `designStatus`, `setDesignStatus`, and `useDesignFolderUpload` will now show as undefined — that's expected; we fix those in the next tasks.

---

### Task 2: Update validation logic

**Files:**
- Modify: `frontend/frontend/src/pages/admin/RequirementFormModal.jsx:1281`

- [ ] **Step 1: Update `canProceed` for the design step**

Find (around line 1281):
```js
    if (s === designStep) {
      return !useDesignFolderUpload || files.length > 0;
    }
```

Replace with:
```js
    if (s === designStep) {
      if (!designMode) return false;
      if (designMode === "production_only") return files.length > 0;
      return true;
    }
```

- [ ] **Step 2: Update the error message for the design step**

Find (around line 1305):
```js
      } else if (step === designStep) setError("Please upload at least one design file before proceeding");
```

Replace with:
```js
      } else if (step === designStep) {
        if (!designMode) setError("Please select a design mode before proceeding");
        else setError("Please upload at least one design file before proceeding");
      }
```

---

### Task 3: Update submit payload

**Files:**
- Modify: `frontend/frontend/src/pages/admin/RequirementFormModal.jsx:1329`

- [ ] **Step 1: Send `designMode` as `designStatus`**

Find (around line 1329):
```js
        designStatus: null,
```

Replace with:
```js
        designStatus: designMode || null,
```

---

### Task 4: Replace Design tab JSX

**Files:**
- Modify: `frontend/frontend/src/pages/admin/RequirementFormModal.jsx:1695–1803`

- [ ] **Step 1: Remove the dead `{false && ...}` block, the toggle switch, and the conditional upload area**

Find and remove this entire block (lines 1695–1787):
```jsx
                        {false && (<div className="col-12">
                          <label className="form-label fw-semibold">
                            Design Status <span className="text-danger">*</span>
                          </label>
                          <div className="d-flex flex-wrap gap-2 mb-3">
                            {[
                              { value: "full_design", label: "Customer has full design ready" },
                              { value: "logo_only", label: "Customer has logo only — we design the rest" },
                              { value: "no_design", label: "No design — we design everything" },
                            ].map((opt) => (
                              <button
                                key={opt.value}
                                type="button"
                                className={`btn btn-sm ${designStatus === opt.value ? "btn-primary" : "btn-outline-secondary"}`}
                                onClick={() => setDesignStatus(opt.value)}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        </div>)}

                        <div className="col-12">
                          <div className="form-check form-switch">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              role="switch"
                              id="designFolderUploadSwitch"
                              checked={useDesignFolderUpload}
                              onChange={(e) => setUseDesignFolderUpload(e.target.checked)}
                            />
                            <label className="form-check-label" htmlFor="designFolderUploadSwitch">
                              Customer has design folder
                            </label>
                          </div>
                          <small className="text-muted">
                            Turn this on to upload all design files together as a folder.
                          </small>
                        </div>

                        {useDesignFolderUpload && (
                          <div className="col-12">
                            <label className="form-label fw-semibold">Design Folder</label>
                            <label
                              className={`w-100 rounded-3 p-4 text-center ${isDragActive ? "border border-primary bg-light" : "border border-secondary-subtle"}`}
                              onDragOver={handleDragOver}
                              onDragLeave={handleDragLeave}
                              onDrop={handleDrop}
                              style={{ cursor: "pointer", borderStyle: "dashed" }}
                            >
                              <input
                                type="file"
                                className="d-none"
                                multiple
                                webkitdirectory=""
                                directory=""
                                onChange={handleFileChange}
                              />
                              <div className="fw-semibold mb-1">
                                Drag and drop the design folder here
                              </div>
                              <small className="text-muted">
                                or click this area to choose the folder
                              </small>
                            </label>
                            {files.length > 0 && (
                              <div className="mt-2">
                                {files.map((f, i) => (
                                  <div
                                    key={`${f.name}-${i}`}
                                    className="d-flex align-items-center gap-2 py-1"
                                  >
                                    <i className="ti ti-folder text-muted" />
                                    <span className="text-truncate" style={{ maxWidth: 320 }}>
                                      {f.name}
                                    </span>
                                    <small className="text-muted">
                                      ({(f.size / 1024).toFixed(1)} KB)
                                    </small>
                                    <button
                                      type="button"
                                      className="btn btn-sm btn-outline-danger ms-auto"
                                      onClick={() => removeFile(i)}
                                    >
                                      <i className="ti ti-x" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Option A: Full design */}
                        {designStatus === "full_design" && (
                          <>
                            <div className="col-12">
                              <label className="form-label">Note</label>
                              <textarea
                                className="form-control"
                                rows={3}
                                value={designNotes}
                                onChange={(e) => setDesignNotes(e.target.value)}
                                placeholder="Any instructions from customer about the file"
                              />
                            </div>
                          </>
                        )}
```

- [ ] **Step 2: Insert the radio buttons + conditional panels in their place**

Insert the following JSX at the same location (inside the `<motion.div className="row g-3 lead-wizard-step-panel">`, before the `{/* Option B: Logo only */}` block):

```jsx
                        {/* Design Mode radio buttons */}
                        <div className="col-12">
                          <label className="form-label fw-semibold">
                            Design Mode <span className="text-danger">*</span>
                          </label>
                          <div className="d-flex flex-wrap gap-2">
                            {[
                              { value: "design_only", label: "Design Only" },
                              { value: "production_only", label: "Production Only" },
                              { value: "design_production", label: "Design + Production" },
                            ].map((opt) => (
                              <div key={opt.value} className="form-check">
                                <input
                                  className="form-check-input"
                                  type="radio"
                                  name="designMode"
                                  id={`designMode-${opt.value}`}
                                  value={opt.value}
                                  checked={designMode === opt.value}
                                  onChange={() => { setDesignMode(opt.value); setFiles([]); }}
                                />
                                <label className="form-check-label" htmlFor={`designMode-${opt.value}`}>
                                  {opt.label}
                                </label>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Production Only: folder upload */}
                        {designMode === "production_only" && (
                          <div className="col-12">
                            <label className="form-label fw-semibold">Design Folder</label>
                            <label
                              className={`w-100 rounded-3 p-4 text-center ${isDragActive ? "border border-primary bg-light" : "border border-secondary-subtle"}`}
                              onDragOver={handleDragOver}
                              onDragLeave={handleDragLeave}
                              onDrop={handleDrop}
                              style={{ cursor: "pointer", borderStyle: "dashed" }}
                            >
                              <input
                                type="file"
                                className="d-none"
                                multiple
                                webkitdirectory=""
                                directory=""
                                onChange={handleFileChange}
                              />
                              <div className="fw-semibold mb-1">
                                Drag and drop the design folder here
                              </div>
                              <small className="text-muted">
                                or click this area to choose the folder
                              </small>
                            </label>
                            {files.length > 0 && (
                              <div className="mt-2">
                                {files.map((f, i) => (
                                  <div
                                    key={`${f.name}-${i}`}
                                    className="d-flex align-items-center gap-2 py-1"
                                  >
                                    <i className="ti ti-folder text-muted" />
                                    <span className="text-truncate" style={{ maxWidth: 320 }}>
                                      {f.name}
                                    </span>
                                    <small className="text-muted">
                                      ({(f.size / 1024).toFixed(1)} KB)
                                    </small>
                                    <button
                                      type="button"
                                      className="btn btn-sm btn-outline-danger ms-auto"
                                      onClick={() => removeFile(i)}
                                    >
                                      <i className="ti ti-x" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Notes field for all modes */}
                        {designMode && (
                          <div className="col-12">
                            <label className="form-label">Note</label>
                            <textarea
                              className="form-control"
                              rows={3}
                              value={designNotes}
                              onChange={(e) => setDesignNotes(e.target.value)}
                              placeholder="Any instructions from customer about the design"
                            />
                          </div>
                        )}
```

- [ ] **Step 3: Remove the now-unused Option B and Option C blocks**

Find and delete these two blocks that remain after the insertion point (they were previously gated on the old `designStatus` state which no longer exists):

```jsx
                        {/* Option B: Logo only */}
                        {designStatus === "logo_only" && (
                          <>
                            ...
                          </>
                        )}

                        {/* Option C: No design */}
                        {designStatus === "no_design" && (
                          <>
                            ...
                          </>
                        )}
```

These blocks span approximately lines 1805–1876 in the original file. Delete them entirely.

---

### Task 5: Manual verification

- [ ] **Step 1: Start the frontend dev server**

```bash
cd frontend/frontend
npm run dev
```

- [ ] **Step 2: Open a requirement form and go to the Design tab**

Confirm:
- Three radio buttons appear: "Design Only", "Production Only", "Design + Production"
- No toggle switch visible
- No upload area visible until "Production Only" is selected

- [ ] **Step 3: Test Design Only**

Click "Design Only" → only a "Note" textarea appears. Next button should be enabled (no file required).

- [ ] **Step 4: Test Production Only**

Click "Production Only" → folder upload area and "Note" textarea appear. Next button should be blocked until at least one file is uploaded.

- [ ] **Step 5: Test Design + Production**

Click "Design + Production" → only a "Note" textarea appears. Next button should be enabled.

- [ ] **Step 6: Verify switching modes clears uploaded files**

Upload a file in Production Only mode, then switch to Design Only — the file list should clear.

- [ ] **Step 7: Verify submit payload**

Submit a form with each mode and check the network request in DevTools. `designStatus` should be `"design_only"`, `"production_only"`, or `"design_production"` respectively (not `null`).

- [ ] **Step 8: Commit**

```bash
git add frontend/frontend/src/pages/admin/RequirementFormModal.jsx
git commit -m "feat: replace design folder toggle with Design Only / Production Only / Design + Production radio buttons"
```
