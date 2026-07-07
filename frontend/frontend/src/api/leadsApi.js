import api from '../utils/api'

function buildQuery(params) {
  const query = new URLSearchParams()
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      query.set(key, value)
    }
  })
  const out = query.toString()
  return out ? `?${out}` : ''
}

export async function getLeads(params = {}) {
  const response = await api.get(`/api/v1/leads${buildQuery(params)}`)
  return Array.isArray(response?.data) ? response.data : []
}

export async function getLeadById(id) {
  const response = await api.get(`/api/v1/leads/${id}`)
  return response?.data || null
}

export async function getLeadByCustomerUserId(userId) {
  const response = await api.get(`/api/v1/leads/customer/${userId}`)
  return response?.data || null
}

export async function getLeadFilters() {
  const response = await api.get('/api/v1/leads/filters')
  return response?.data || {}
}

export async function getAssignableLeadGroups() {
  const response = await api.get('/api/v1/leads/assignable-groups')
  const rows = Array.isArray(response?.data) ? response.data : []
  const toPageKeys = (value) => {
    if (Array.isArray(value)) return value.map((v) => String(v || '').trim()).filter(Boolean)
    if (typeof value === 'string') {
      return value
        .split(',')
        .map((v) => v.trim())
        .filter(Boolean)
    }
    return []
  }
  return rows
    .map((row) => ({
      id: row?.id,
      name: row?.name || '',
      pageKeys: toPageKeys(
        row?.pageKeys ??
          row?.page_keys ??
          row?.pages ??
          row?.pageVisibility ??
          row?.visibilityPages,
      ),
      institutionName: row?.institutionName || '',
      departmentName: row?.departmentName || '',
      teamNames: Array.isArray(row?.teamNames) ? row.teamNames : [],
    }))
    .filter((row) => row.id != null && row.name)
}

export async function createLead(payload) {
  const response = await api.post('/api/v1/leads', payload)
  return response?.data || {}
}

export async function updateLeadRowStatus(id, status, nextGroupId = null) {
  const payload = { status }
  if (nextGroupId !== undefined && nextGroupId !== null) {
    payload.nextGroupId = nextGroupId
  }
  const response = await api.patch(`/api/v1/leads/${id}/status`, payload)
  return response?.data || {}
}

export async function getAssignableAllocators(leadId, params = {}) {
  const response = await api.get(
    `/api/v1/leads/${leadId}/assignable-allocators${buildQuery(params)}`,
  )
  return Array.isArray(response?.data) ? response.data : []
}

export async function updateLeadAllocator(leadId, ownerUserId, targetGroupId) {
  const payload = { ownerUserId }
  if (targetGroupId !== undefined && targetGroupId !== null) {
    payload.targetGroupId = targetGroupId
  }
  const response = await api.patch(`/api/v1/leads/${leadId}/allocator`, payload)
  return response?.data || {}
}

export async function updateLeadType(leadId, leadType) {
  try {
    const response = await api.patch(`/api/v1/leads/${leadId}/details`, { leadType })
    return response?.data || {}
  } catch (error) {
    const response = await api.patch(`/api/v1/leads/${leadId}/type`, { leadType })
    return response?.data || {}
  }
}

export async function updateLeadDetails(leadId, payload = {}) {
  const response = await api.patch(`/api/v1/leads/${leadId}/details`, payload)
  return response?.data || {}
}

export async function uploadLeadPaymentProof(leadId, file) {
  const formData = new FormData()
  formData.append("file", file)
  const response = await api.post(`/api/v1/leads/${leadId}/payment-proof`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  })
  return response?.data || {}
}

export async function uploadLeadLogFile(leadId, file) {
  const formData = new FormData()
  formData.append("file", file)
  const response = await api.post(`/api/v1/leads/${leadId}/log-file`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  })
  return response?.data || {}
}

export async function getLeadInvoiceItems(leadId) {
  const response = await api.get(`/api/v1/leads/${leadId}/invoice-items`)
  return Array.isArray(response?.data) ? response.data : []
}

export async function saveLeadInvoiceItems(leadId, items, cgstPercent, sgstPercent) {
  const response = await api.post(`/api/v1/leads/${leadId}/invoice-items`, {
    items,
    cgstPercent: cgstPercent ?? 0,
    sgstPercent: sgstPercent ?? 0,
  })
  return Array.isArray(response?.data) ? response.data : []
}

export async function deleteLead(leadId) {
  const response = await api.patch(`/api/v1/leads/${leadId}/delete`)
  return response?.data || {}
}

export async function getLeadLog(leadId) {
  const response = await api.get(`/api/v1/leads/${leadId}/log`)
  return Array.isArray(response?.data) ? response.data : []
}

export async function getLeadChatMessages(leadId, threadType) {
  const response = await api.get(
    `/api/v1/leads/${leadId}/chat/messages?threadType=${encodeURIComponent(threadType)}`,
  )
  return Array.isArray(response?.data) ? response.data : []
}

export async function sendLeadChatMessage(leadId, payload) {
  const response = await api.post(`/api/v1/leads/${leadId}/chat/messages`, payload)
  return response?.data || null
}

export async function sendLeadChatAttachment(leadId, { threadType, message, file }) {
  const formData = new FormData()
  if (threadType) formData.append("threadType", threadType)
  if (message) formData.append("message", message)
  if (file) formData.append("file", file)
  const response = await api.post(`/api/v1/leads/${leadId}/chat/messages/file`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  })
  return response?.data || null
}

export async function downloadLeadChatAttachment(leadId, messageId) {
  const response = await api.get(`/api/v1/leads/${leadId}/chat/messages/${messageId}/file`, {
    responseType: "blob",
  })
  return response?.data || null
}

export async function getLeadChatNotifications(since) {
  const query = since ? `?since=${encodeURIComponent(since)}` : ""
  const response = await api.get(`/api/v1/leads/chat/notifications${query}`)
  return Array.isArray(response?.data) ? response.data : []
}

export async function recordLeadPayment(leadId, { amount, type }) {
  const response = await api.post(`/api/v1/leads/${leadId}/payment`, { amount, type })
  return response?.data || {}
}

export async function getLeadPaymentSummary(leadId) {
  const response = await api.get(`/api/v1/leads/${leadId}/payment`)
  return response?.data || {}
}

export async function downloadLeadRequirementFile(leadId) {
  const response = await api.get(`/api/v1/leads/${leadId}/requirement-file`, {
    responseType: "blob",
  })
  return {
    blob: response?.data || null,
    contentDisposition: response?.headers?.["content-disposition"] || "",
  }
}

export async function downloadLeadPaymentProofFile(leadId) {
  const response = await api.get(`/api/v1/leads/${leadId}/payment-proof-file`, {
    responseType: "blob",
  })
  return {
    blob: response?.data || null,
    contentDisposition: response?.headers?.["content-disposition"] || "",
  }
}

export async function getImportableEmployees() {
  const response = await api.get('/api/v1/leads/importable-employees')
  return Array.isArray(response?.data) ? response.data : []
}

export async function bulkCreateLeads(leads, institutionName) {
  const response = await api.post('/api/v1/leads/bulk', {
    leads,
    ...(institutionName ? { institutionName } : {}),
  })
  return response?.data || {}
}

export async function rejectBudgetVerification(leadId, rejectionReason) {
  const response = await api.patch(`/api/v1/leads/${leadId}/details`, {
    budgetVerificationStatus: "REJECTED",
    budgetVerificationRejectionReason: rejectionReason,
  })
  return response?.data || {}
}

export async function approveBudgetVerification(
  leadId,
  items,
  totals,
  cgstPercent,
  sgstPercent,
  invoiceDataJson,
  extraPayload = {},
) {
  const mappedItems = items.map(it => ({
    description: it.description,
    hsn: it.hsn || "",
    quantity: Number(it.quantity) || 0,
    unitPrice: Number(it.unitPrice) || 0,
  }))
  await api.post(`/api/v1/leads/${leadId}/invoice-items`, {
    items: mappedItems,
    cgstPercent: cgstPercent ?? 0,
    sgstPercent: sgstPercent ?? 0,
  })
  const response = await api.patch(`/api/v1/leads/${leadId}/details`, {
    budgetVerificationStatus: "APPROVED",
    invoiceData: invoiceDataJson,
    invoiceCgstPercent: cgstPercent ?? 0,
    invoiceSgstPercent: sgstPercent ?? 0,
    ...extraPayload,
  })
  return response?.data || {}
}

// ── Duplicate detection ──────────────────────────────────────────────────────

/**
 * Check a list of {mobile, email} contacts against existing leads.
 * Returns an array of matches: [{ mobile, email, matchedLeadId, matchedLeadRef, matchedLeadName }]
 */
export async function checkDuplicateLeads(contacts) {
  const response = await api.post('/api/v1/leads/check-duplicates', { contacts })
  return Array.isArray(response?.data) ? response.data : []
}

/**
 * Fetch all duplicate leads for the current user scope.
 */
export async function getDuplicateLeads(params = {}) {
  const response = await api.get(`/api/v1/leads/duplicates${buildQuery(params)}`)
  return Array.isArray(response?.data) ? response.data : []
}

/**
 * Convert a duplicate lead into a real lead.
export async function updateLeadType(leadId, leadType) {
  try {
    const response = await api.patch(`/api/v1/leads/${leadId}/details`, { leadType })
    return response?.data || {}
  } catch (error) {
    const response = await api.patch(`/api/v1/leads/${leadId}/type`, { leadType })
    return response?.data || {}
  }
}

export async function updateLeadDetails(leadId, payload = {}) {
  const response = await api.patch(`/api/v1/leads/${leadId}/details`, payload)
  return response?.data || {}
}

export async function uploadLeadPaymentProof(leadId, file) {
  const formData = new FormData()
  formData.append("file", file)
  const response = await api.post(`/api/v1/leads/${leadId}/payment-proof`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  })
  return response?.data || {}
}

export async function uploadLeadLogFile(leadId, file) {
  const formData = new FormData()
  formData.append("file", file)
  const response = await api.post(`/api/v1/leads/${leadId}/log-file`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  })
  return response?.data || {}
}

export async function getLeadInvoiceItems(leadId) {
  const response = await api.get(`/api/v1/leads/${leadId}/invoice-items`)
  return Array.isArray(response?.data) ? response.data : []
}

export async function saveLeadInvoiceItems(leadId, items, cgstPercent, sgstPercent) {
  const response = await api.post(`/api/v1/leads/${leadId}/invoice-items`, {
    items,
    cgstPercent: cgstPercent ?? 0,
    sgstPercent: sgstPercent ?? 0,
  })
  return Array.isArray(response?.data) ? response.data : []
}

export async function deleteLead(leadId) {
  const response = await api.patch(`/api/v1/leads/${leadId}/delete`)
  return response?.data || {}
}

export async function getLeadLog(leadId) {
  const response = await api.get(`/api/v1/leads/${leadId}/log`)
  return Array.isArray(response?.data) ? response.data : []
}

export async function getLeadChatMessages(leadId, threadType) {
  const response = await api.get(
    `/api/v1/leads/${leadId}/chat/messages?threadType=${encodeURIComponent(threadType)}`,
  )
  return Array.isArray(response?.data) ? response.data : []
}

export async function sendLeadChatMessage(leadId, payload) {
  const response = await api.post(`/api/v1/leads/${leadId}/chat/messages`, payload)
  return response?.data || null
}

export async function sendLeadChatAttachment(leadId, { threadType, message, file }) {
  const formData = new FormData()
  if (threadType) formData.append("threadType", threadType)
  if (message) formData.append("message", message)
  if (file) formData.append("file", file)
  const response = await api.post(`/api/v1/leads/${leadId}/chat/messages/file`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  })
  return response?.data || null
}

export async function downloadLeadChatAttachment(leadId, messageId) {
  const response = await api.get(`/api/v1/leads/${leadId}/chat/messages/${messageId}/file`, {
    responseType: "blob",
  })
  return response?.data || null
}

export async function getLeadChatNotifications(since) {
  const query = since ? `?since=${encodeURIComponent(since)}` : ""
  const response = await api.get(`/api/v1/leads/chat/notifications${query}`)
  return Array.isArray(response?.data) ? response.data : []
}

export async function recordLeadPayment(leadId, { amount, type }) {
  const response = await api.post(`/api/v1/leads/${leadId}/payment`, { amount, type })
  return response?.data || {}
}

export async function getLeadPaymentSummary(leadId) {
  const response = await api.get(`/api/v1/leads/${leadId}/payment`)
  return response?.data || {}
}

export async function downloadLeadRequirementFile(leadId) {
  const response = await api.get(`/api/v1/leads/${leadId}/requirement-file`, {
    responseType: "blob",
  })
  return {
    blob: response?.data || null,
    contentDisposition: response?.headers?.["content-disposition"] || "",
  }
}

export async function downloadLeadPaymentProofFile(leadId) {
  const response = await api.get(`/api/v1/leads/${leadId}/payment-proof-file`, {
    responseType: "blob",
  })
  return {
    blob: response?.data || null,
    contentDisposition: response?.headers?.["content-disposition"] || "",
  }
}

export async function getImportableEmployees() {
  const response = await api.get('/api/v1/leads/importable-employees')
  return Array.isArray(response?.data) ? response.data : []
}

export async function bulkCreateLeads(leads, institutionName) {
  const response = await api.post('/api/v1/leads/bulk', {
    leads,
    ...(institutionName ? { institutionName } : {}),
  })
  return response?.data || {}
}

export async function rejectBudgetVerification(leadId, rejectionReason) {
  const response = await api.patch(`/api/v1/leads/${leadId}/details`, {
    budgetVerificationStatus: "REJECTED",
    budgetVerificationRejectionReason: rejectionReason,
  })
  return response?.data || {}
}

export async function approveBudgetVerification(
  leadId,
  items,
  totals,
  cgstPercent,
  sgstPercent,
  invoiceDataJson,
  extraPayload = {},
) {
  const mappedItems = items.map(it => ({
    description: it.description,
    hsn: it.hsn || "",
    quantity: Number(it.quantity) || 0,
    unitPrice: Number(it.unitPrice) || 0,
  }))
  await api.post(`/api/v1/leads/${leadId}/invoice-items`, {
    items: mappedItems,
    cgstPercent: cgstPercent ?? 0,
    sgstPercent: sgstPercent ?? 0,
  })
  const response = await api.patch(`/api/v1/leads/${leadId}/details`, {
    budgetVerificationStatus: "APPROVED",
    invoiceData: invoiceDataJson,
    invoiceCgstPercent: cgstPercent ?? 0,
    invoiceSgstPercent: sgstPercent ?? 0,
    ...extraPayload,
  })
  return response?.data || {}
}

// ── Duplicate detection ──────────────────────────────────────────────────────



/**
 * Convert a duplicate lead into a real lead.
 * The backend re-checks for duplicates; if still a match it returns
 * { stillDuplicate: true, matchedLeadRef, matchedLeadName } so the
 * frontend can warn the user before forcing through.
 * Pass force=true to convert regardless of remaining matches.
 */
export async function convertDuplicateLead(leadId, force = false) {
  const response = await api.patch(`/api/v1/leads/${leadId}/convert-duplicate`, { force })
  return response?.data || {}
}

// ── ERP Downstream Flow Helpers ──────────────────────────────────────────────
export async function getSalesOrders() {
  const response = await api.get('/api/v1/erp/sales-orders')
  return Array.isArray(response?.data) ? response.data : []
}

export async function getSalesOrderById(id) {
  const response = await api.get(`/api/v1/erp/sales-orders/${id}`)
  return response?.data || null
}

export async function recordPayment(paymentData) {
  const response = await api.post('/api/v1/erp/payments', paymentData)
  return response?.data || {}
}

export async function createRazorpayOrder(orderData) {
  const response = await api.post('/api/payments/create-order', orderData)
  return response?.data || {}
}

export async function verifyRazorpayPayment(verificationData) {
  const response = await api.post('/api/payments/verify', verificationData)
  return response?.data || {}
}


export async function getPaymentsForOrder(orderId) {
  const response = await api.get(`/api/v1/erp/payments/sales-order/${orderId}`)
  return Array.isArray(response?.data) ? response.data : []
}

export async function verifyPayment(paymentId, status) {
  const response = await api.patch(`/api/v1/erp/payments/${paymentId}/verify?status=${status}`)
  return response?.data || {}
}

export async function getJobForOrder(soId) {
  const response = await api.get(`/api/v1/erp/jobs/sales-order/${soId}`)
  return response?.data || null
}

export async function getJobTasks(jobId) {
  const response = await api.get(`/api/v1/erp/job-tasks/${jobId}`)
  return Array.isArray(response?.data) ? response.data : []
}

export async function updateJobTaskStatus(taskId, status) {
  const response = await api.patch(`/api/v1/erp/job-tasks/${taskId}/status?status=${status}`)
  return response?.data || {}
}

export async function assignTaskOperator(taskId, userId) {
  const response = await api.patch(`/api/v1/erp/job-tasks/${taskId}/assign?userId=${userId}`)
  return response?.data || {}
}

export async function submitTaskProof(taskId, file) {
  const response = await api.patch(`/api/v1/erp/job-tasks/${taskId}/proof?file=${encodeURIComponent(file)}`)
  return response?.data || {}
}
