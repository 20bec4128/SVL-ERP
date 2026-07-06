import api from "../utils/api";

function normalizePage(payload, fallbackPage, fallbackSize) {
  const content = Array.isArray(payload?.content) ? payload.content : [];
  return {
    items: content.map((row) => ({
      id: row?.id,
      action: row?.action || row?.event || row?.message || "",
      actor: row?.actor || row?.username || "",
      ipAddress: row?.ipAddress || "",
      createdAt: row?.createdAt || row?.timestamp || null,
    })),
    page: Number(payload?.number ?? fallbackPage),
    size: Number(payload?.size ?? fallbackSize),
    totalPages: Number(payload?.totalPages ?? 0),
    totalElements: Number(payload?.totalElements ?? content.length),
  };
}

export async function getAuditLogs(page = 0, size = 20) {
  const response = await api.get("/api/users/audit-logs", {
    params: { page, size },
  });
  return normalizePage(response?.data || {}, page, size);
}

export async function deleteAllAuditLogs() {
  const response = await api.delete("/api/users/audit-logs");
  return response?.data || {};
}

export async function deleteAuditLogsOlderThan(days = 30) {
  const response = await api.delete("/api/users/audit-logs/older-than", {
    params: { days },
  });
  return response?.data || {};
}
