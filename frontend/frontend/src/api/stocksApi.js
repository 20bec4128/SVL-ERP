// HTTP API wrapper for stock categories and items
// calls backend endpoints under /api/stocks
import api from '../utils/api';

function normalizeCategoryPayload(cat = {}) {
  return {
    ...cat,
    fields:
      typeof cat.fields === "string"
        ? cat.fields
        : JSON.stringify(Array.isArray(cat.fields) ? cat.fields : []),
    allowedVendorTypeIds: Array.isArray(cat.allowedVendorTypeIds)
      ? cat.allowedVendorTypeIds
      : cat.allowedVendorTypeIds || [],
  };
}

function parseCategoryFields(fields) {
  if (Array.isArray(fields)) return fields;
  if (typeof fields !== "string" || !fields.trim()) return [];
  try {
    const parsed = JSON.parse(fields);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function normalizeCategoryResponse(row = {}) {
  return {
    ...row,
    fields: parseCategoryFields(row?.fields),
    allowedVendorTypeIds: Array.isArray(row?.allowedVendorTypeIds)
      ? row.allowedVendorTypeIds
      : [],
  };
}

function parseItemValues(values) {
  if (values && typeof values === "object" && !Array.isArray(values)) return values;
  if (typeof values !== "string" || !values.trim()) return {};
  try {
    const parsed = JSON.parse(values);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function normalizeItemPayload(item = {}) {
  return {
    ...item,
    values:
      typeof item.values === "string"
        ? item.values
        : JSON.stringify(item.values && typeof item.values === "object" ? item.values : {}),
  };
}

function normalizeItemResponse(row = {}) {
  return {
    ...row,
    values: parseItemValues(row?.values),
  };
}

function buildQuery(params) {
  const q = new URLSearchParams();
  Object.entries(params || {}).forEach(([k,v]) => {
    if (v !== undefined && v !== null && String(v).trim() !== '') {
      q.set(k, v);
    }
  });
  const out = q.toString();
  return out ? `?${out}` : '';
}

// categories
export async function getStockCategories() {
  const resp = await api.get(`/api/stocks/categories${buildQuery()}`);
  return Array.isArray(resp?.data) ? resp.data.map(normalizeCategoryResponse) : [];
}

export async function createStockCategory(cat) {
  const resp = await api.post('/api/stocks/categories', normalizeCategoryPayload(cat));
  return resp?.data ? normalizeCategoryResponse(resp.data) : null;
}

export async function updateStockCategory(id, cat) {
  const resp = await api.put(`/api/stocks/categories/${id}`, normalizeCategoryPayload(cat));
  return resp?.data ? normalizeCategoryResponse(resp.data) : null;
}

export async function deleteStockCategory(id) {
  const resp = await api.delete(`/api/stocks/categories/${id}`);
  return resp?.data || {};
}

// items
export async function getStockItems() {
  const resp = await api.get(`/api/stocks/items${buildQuery()}`);
  return Array.isArray(resp?.data) ? resp.data.map(normalizeItemResponse) : [];
}

// stock requests
export async function getStockRequests(params = {}) {
  const resp = await api.get(`/api/stock-requests${buildQuery(params)}`);
  return Array.isArray(resp?.data) ? resp.data : [];
}

function normalizeStockRequestPayload(request = {}) {
  const out = { ...request };
  // Only include items when the caller provided it.
  // Otherwise PATCH requests (status-only updates) would overwrite items with "[]".
  if (Object.prototype.hasOwnProperty.call(request, "items")) {
    out.items =
      typeof request.items === "string"
        ? request.items
        : JSON.stringify(Array.isArray(request.items) ? request.items : []);
  }
  return out;
}

export async function getStockRequestById(id) {
  const resp = await api.get(`/api/stock-requests/${id}`);
  return resp?.data || null;
}

export async function getStockRequestLog(id) {
  const resp = await api.get(`/api/stock-requests/${id}/log`);
  return Array.isArray(resp?.data) ? resp.data : [];
}

export async function createStockRequest(request) {
  const resp = await api.post(`/api/stock-requests`, normalizeStockRequestPayload(request));
  return resp?.data || null;
}

export async function updateStockRequest(id, payload) {
  const resp = await api.patch(`/api/stock-requests/${id}`, normalizeStockRequestPayload(payload));
  return resp?.data || null;
}

export async function deleteStockRequest(id) {
  const resp = await api.delete(`/api/stock-requests/${id}`);
  return resp?.data || null;
}

export async function uploadStockRequestBill(id, file, note) {
  const formData = new FormData();
  if (file) formData.append("file", file);
  if (note) formData.append("note", note);
  const resp = await api.post(
    `/api/stock-requests/${id}/bill`,
    formData,
    { headers: { "Content-Type": "multipart/form-data" } },
  );
  return resp?.data || null;
}

export function getStockRequestBillUrl(id) {
  return `/api/stock-requests/${id}/bill`;
}

export async function verifyStockRequestBill(id) {
  const resp = await api.post(`/api/stock-requests/${id}/verify`);
  return resp?.data || null;
}

export async function closeStockRequest(id) {
  const resp = await api.post(`/api/stock-requests/${id}/close`);
  return resp?.data || null;
}

export async function getStockRequestChatMessages(requestId) {
  const resp = await api.get(
    `/api/stock-requests/${requestId}/chat/messages`,
  );
  return Array.isArray(resp?.data) ? resp.data : [];
}

export async function sendStockRequestChatMessage(requestId, payload) {
  const resp = await api.post(
    `/api/stock-requests/${requestId}/chat/messages`,
    payload,
  );
  return resp?.data || null;
}

export async function sendStockRequestChatAttachment(requestId, { message, file }) {
  const formData = new FormData();
  if (message) formData.append("message", message);
  if (file) formData.append("file", file);
  const resp = await api.post(
    `/api/stock-requests/${requestId}/chat/messages/file`,
    formData,
    { headers: { "Content-Type": "multipart/form-data" } },
  );
  return resp?.data || null;
}

export async function downloadStockRequestChatAttachment(requestId, messageId) {
  const resp = await api.get(
    `/api/stock-requests/${requestId}/chat/messages/${messageId}/file`,
    { responseType: "blob" },
  );
  return resp?.data || null;
}

export async function createStockItem(item) {
  const resp = await api.post('/api/stocks/items', normalizeItemPayload(item));
  return resp?.data ? normalizeItemResponse(resp.data) : null;
}

export async function updateStockItem(id, item) {
  const resp = await api.put(`/api/stocks/items/${id}`, normalizeItemPayload(item));
  return resp?.data ? normalizeItemResponse(resp.data) : null;
}

export async function deleteStockItem(id) {
  const resp = await api.delete(`/api/stocks/items/${id}`);
  return resp?.data || {};
}

export async function importStockItems(items) {
  const results = [];
  for (const item of items || []) {
    try {
      const saved = await createStockItem(item);
      results.push({ ok: true, item: saved });
    } catch (error) {
      results.push({ ok: false, item, error });
    }
  }
  return {
    created: results.filter((result) => result.ok).length,
    failed: results.filter((result) => !result.ok).length,
    results,
  };
}
