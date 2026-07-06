import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { getBranches } from "../../api/branchesApi";
import { getUserDesignations } from "../../api/userPermissionsApi";
import {
  getBranchWorkflowConfig,
  saveBranchWorkflowConfig,
  previewBranchWorkflowConfig,
} from "../../api/branchWorkflowConfigApi";
import { extractApiErrorMessage } from "../../utils/errorMessage";
import { useToast } from "../../components/system/ToastProvider";

const initialForm = {
  leadDesignationId: "",
  designDesignationId: "",
  productionDesignationId: "",
};

export default function WorkflowTeamsPage() {
  const [branches, setBranches] = useState([]);
  const [branchId, setBranchId] = useState("");
  const [designations, setDesignations] = useState([]); // all designations for filtering
  const [form, setForm] = useState(initialForm);

  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [distinctError, setDistinctError] = useState("");

  const { showSuccess, showError } = useToast();

  // 1. Fetch Branches and Designations on Load
  useEffect(() => {
    (async () => {
      try {
        const branchData = await getBranches();
        setBranches(Array.isArray(branchData) ? branchData.filter((b) => b.status === "ACTIVE" && !b.deleted) : []);

        const desigData = await getUserDesignations();
        setDesignations(Array.isArray(desigData) ? desigData : []);
      } catch (e) {
        showError("Failed to load initial configuration data.");
      }
    })();
  }, []);

  // Filter designations belonging to the selected branch
  const branchDesignations = designations.filter(
    (d) => Number(d.branchId) === Number(branchId)
  ).sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));

  // 2. Fetch config when branch changes
  useEffect(() => {
    if (!branchId) {
      setForm(initialForm);
      setPreview(null);
      setDistinctError("");
      return;
    }

    (async () => {
      setLoading(true);
      try {
        const config = await getBranchWorkflowConfig(Number(branchId));
        const updatedForm = {
          leadDesignationId: config?.leadDesignationId ? String(config.leadDesignationId) : "",
          designDesignationId: config?.designDesignationId ? String(config.designDesignationId) : "",
          productionDesignationId: config?.productionDesignationId ? String(config.productionDesignationId) : "",
        };
        setForm(updatedForm);
        // Trigger initial preview for these loaded settings
        await fetchPreview(updatedForm);
      } catch (e) {
        showError(extractApiErrorMessage(e, "Failed to load branch configuration"));
      } finally {
        setLoading(false);
      }
    })();
  }, [branchId]);

  // 3. Validation and Preview Trigger
  const handleDesignationChange = async (field, value) => {
    const updatedForm = { ...form, [field]: value };
    setForm(updatedForm);

    // Validate distinct selections
    const selectedIds = [
      updatedForm.leadDesignationId,
      updatedForm.designDesignationId,
      updatedForm.productionDesignationId,
    ].filter(Boolean);

    const hasDuplicates = new Set(selectedIds).size !== selectedIds.length;
    if (hasDuplicates) {
      setDistinctError("Designations configured for Lead, Design, and Production teams must be distinct.");
      setPreview(null); // Clear preview since input is invalid
      return;
    }

    setDistinctError("");
    await fetchPreview(updatedForm);
  };

  const fetchPreview = async (formState) => {
    if (!branchId) return;

    try {
      const payload = {
        branchId: Number(branchId),
        leadDesignationId: formState.leadDesignationId ? Number(formState.leadDesignationId) : null,
        designDesignationId: formState.designDesignationId ? Number(formState.designDesignationId) : null,
        productionDesignationId: formState.productionDesignationId ? Number(formState.productionDesignationId) : null,
      };
      const res = await previewBranchWorkflowConfig(payload);
      setPreview(res);
    } catch (e) {
      // preview endpoint failure
      setPreview(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!branchId) {
      showError("Please select a branch.");
      return;
    }
    if (distinctError) {
      showError(distinctError);
      return;
    }
    if (preview && !preview.valid) {
      showError(preview.generalMessage || "One or more designations do not have a valid team lead resolved.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        branchId: Number(branchId),
        leadDesignationId: form.leadDesignationId ? Number(form.leadDesignationId) : null,
        designDesignationId: form.designDesignationId ? Number(form.designDesignationId) : null,
        productionDesignationId: form.productionDesignationId ? Number(form.productionDesignationId) : null,
      };
      await saveBranchWorkflowConfig(payload);
      showSuccess("Workflow Teams configuration saved successfully.");
      // Reload current configuration state
      const config = await getBranchWorkflowConfig(Number(branchId));
      setForm({
        leadDesignationId: config?.leadDesignationId ? String(config.leadDesignationId) : "",
        designDesignationId: config?.designDesignationId ? String(config.designDesignationId) : "",
        productionDesignationId: config?.productionDesignationId ? String(config.productionDesignationId) : "",
      });
    } catch (err) {
      showError(extractApiErrorMessage(err, "Failed to save configuration"));
    } finally {
      setSaving(false);
    }
  };

  // Helper to render preview status label
  const renderPreviewStatus = (categoryPreview) => {
    if (!categoryPreview) return null;
    const { status, message, fullName, userName } = categoryPreview;

    switch (status) {
      case "RESOLVED":
        return fullName ? (
          <div className="text-success small mt-1 d-flex align-items-center">
            <i className="ti ti-circle-check-filled me-1"></i>
            Resolved: <strong>{fullName} ({userName})</strong>
          </div>
        ) : (
          <div className="text-muted small mt-1 d-flex align-items-center">
            <i className="ti ti-info-circle me-1"></i>
            {message}
          </div>
        );
      case "MULTIPLE":
        return (
          <div className="text-warning small mt-1 d-flex align-items-center">
            <i className="ti ti-alert-triangle-filled me-1"></i>
            {message}
          </div>
        );
      case "NOT_FOUND":
        return (
          <div className="text-danger small mt-1 d-flex align-items-center">
            <i className="ti ti-circle-x-filled me-1"></i>
            {message}
          </div>
        );
      default:
        return null;
    }
  };

  const isSaveDisabled =
    !branchId ||
    saving ||
    loading ||
    !!distinctError ||
    (preview && !preview.valid);

  return (
    <div className="content">
      <div className="d-md-flex d-block align-items-center justify-content-between page-breadcrumb mb-3">
        <div className="my-auto mb-2">
          <h2 className="mb-1">Workflow Teams Configuration</h2>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <Link to="/admin-dashboard">
                  <i className="ti ti-smart-home"></i>
                </Link>
              </li>
              <li className="breadcrumb-item">Settings</li>
              <li className="breadcrumb-item active">Workflow Teams</li>
            </ol>
          </nav>
        </div>
      </div>

      <div className="card shadow-sm border-0">
        <div className="card-header bg-transparent border-bottom">
          <h5 className="mb-0 text-dark fw-semibold">Branch Workflow Configuration</h5>
        </div>

        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="row">
              {/* Branch Selector */}
              <div className="col-md-6 mb-4">
                <label className="form-label fw-semibold">Select Branch</label>
                <select
                  className="form-select border-2"
                  style={{ borderRadius: "8px" }}
                  value={branchId}
                  onChange={(e) => setBranchId(e.target.value)}
                >
                  <option value="">Choose Branch...</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {!branchId ? (
              <div
                className="alert alert-light text-center py-5 border"
                style={{ borderRadius: "12px", borderStyle: "dashed" }}
              >
                <i className="ti ti-info-circle display-5 text-muted mb-2"></i>
                <h5 className="text-muted">Please select a branch to configure settings</h5>
              </div>
            ) : loading ? (
              <div className="text-center py-5">
                <LoadingSpinner size="page" label="Loading workflow teams" />
              </div>
            ) : (
              <>
                <div className="row g-4 mb-4">
                  {/* Lead Team Designation */}
                  <div className="col-md-4">
                    <div className="p-3 border rounded-3 bg-light bg-opacity-25 h-100">
                      <label className="form-label fw-bold text-primary">Lead Team Designation</label>
                      <select
                        className="form-select mb-2"
                        value={form.leadDesignationId}
                        onChange={(e) => handleDesignationChange("leadDesignationId", e.target.value)}
                      >
                        <option value="">Select Designation...</option>
                        {branchDesignations.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name}
                          </option>
                        ))}
                      </select>
                      {renderPreviewStatus(preview?.leadTeamLead)}
                    </div>
                  </div>

                  {/* Design Team Designation */}
                  <div className="col-md-4">
                    <div className="p-3 border rounded-3 bg-light bg-opacity-25 h-100">
                      <label className="form-label fw-bold text-primary">Design Team Designation</label>
                      <select
                        className="form-select mb-2"
                        value={form.designDesignationId}
                        onChange={(e) => handleDesignationChange("designDesignationId", e.target.value)}
                      >
                        <option value="">Select Designation...</option>
                        {branchDesignations.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name}
                          </option>
                        ))}
                      </select>
                      {renderPreviewStatus(preview?.designTeamLead)}
                    </div>
                  </div>

                  {/* Production Team Designation */}
                  <div className="col-md-4">
                    <div className="p-3 border rounded-3 bg-light bg-opacity-25 h-100">
                      <label className="form-label fw-bold text-primary">Production Team Designation</label>
                      <select
                        className="form-select mb-2"
                        value={form.productionDesignationId}
                        onChange={(e) => handleDesignationChange("productionDesignationId", e.target.value)}
                      >
                        <option value="">Select Designation...</option>
                        {branchDesignations.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name}
                          </option>
                        ))}
                      </select>
                      {renderPreviewStatus(preview?.productionTeamLead)}
                    </div>
                  </div>
                </div>

                {/* Validation and Info Alerts */}
                {distinctError && (
                  <div className="alert alert-danger d-flex align-items-center mb-4" role="alert">
                    <i className="ti ti-circle-x-filled me-2 fs-5"></i>
                    <div>{distinctError}</div>
                  </div>
                )}

                {preview && !preview.valid && !distinctError && (
                  <div className="alert alert-danger d-flex align-items-center mb-4" role="alert">
                    <i className="ti ti-circle-x-filled me-2 fs-5"></i>
                    <div>{preview.generalMessage || "Please resolve missing team leads before saving."}</div>
                  </div>
                )}

                {preview?.valid && (
                  <div className="alert alert-success d-flex align-items-center mb-4" role="alert">
                    <i className="ti ti-circle-check-filled me-2 fs-5"></i>
                    <div>Configuration checks passed. Ready to save!</div>
                  </div>
                )}

                <div className="d-flex justify-content-end gap-2 border-top pt-4">
                  <button
                    type="button"
                    className="btn btn-light"
                    onClick={() => {
                      setBranchId("");
                    }}
                    disabled={saving}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary px-4"
                    disabled={isSaveDisabled}
                  >
                    {saving ? "Saving..." : "Save Workflow Configuration"}
                  </button>
                </div>
              </>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
