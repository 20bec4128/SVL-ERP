import api from "../utils/api";

export async function getBranchWorkflowConfig(branchId) {
  const response = await api.get(`/api/branch-workflow-config/${branchId}`);
  return response?.data || null;
}

export async function saveBranchWorkflowConfig(payload) {
  const response = await api.post("/api/branch-workflow-config", payload);
  return response?.data || null;
}

export async function previewBranchWorkflowConfig(payload) {
  const response = await api.post("/api/branch-workflow-config/preview", payload);
  return response?.data || null;
}
