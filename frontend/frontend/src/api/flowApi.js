import api from "../utils/api";

function buildScopeQuery(scope = {}) {
  const params = new URLSearchParams();
  if (scope?.branchId != null && String(scope.branchId).trim()) params.set("branchId", scope.branchId);
  if (scope?.institutionName) params.set("institutionName", scope.institutionName);
  const query = params.toString();
  return query ? `?${query}` : "";
}

export async function getLeadFlow(scope = {}) {
  const response = await api.get(`/api/flow${buildScopeQuery(scope)}`);
  return response?.data || {};
}

export async function getFlowGroups() {
  const response = await api.get("/api/flow/groups");
  return Array.isArray(response?.data) ? response.data : [];
}

export async function updateLeadFlow(payload, scope = {}) {
  const response = await api.put("/api/flow", {
    ...payload,
    branchId: scope?.branchId ?? payload?.branchId ?? null,
    institutionName: scope?.institutionName || payload?.institutionName || null,
  });
  return response?.data || {};
}

export async function getDealFlow() {
  const response = await api.get("/api/deal-flow");
  return response?.data || {};
}

export async function updateDealFlow(payload) {
  const response = await api.put("/api/deal-flow", payload);
  return response?.data || {};
}
