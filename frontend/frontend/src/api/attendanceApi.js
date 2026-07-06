import api from '../utils/api'

// ── Employee punch actions ──

export async function checkIn(payload) {
  const response = await api.post('/api/attendance/check-in', payload);
  return response?.data;
}

export async function checkOut(payload) {
  const response = await api.post('/api/attendance/check-out', payload);
  return response?.data;
}

export async function startBreak(payload) {
  const response = await api.post('/api/attendance/break/start', payload);
  return response?.data;
}

export async function endBreak(payload) {
  const response = await api.post('/api/attendance/break/end', payload);
  return response?.data;
}

// ── Employee read ──

export async function getToday() {
  const response = await api.get('/api/attendance/today');
  return response?.data;
}

export async function getHistory(from, to) {
  const response = await api.get(`/api/attendance/history?from=${from}&to=${to}`);
  return response?.data || [];
}

export async function getSummary() {
  const response = await api.get('/api/attendance/summary');
  return response?.data;
}

// ── Admin / Manager ──

export async function getAdminView(date) {
  const response = await api.get(`/api/attendance/admin?date=${date}`);
  return response?.data || [];
}

export async function getAdminRange(from, to) {
  const response = await api.get(`/api/attendance/admin/range?from=${from}&to=${to}`);
  return response?.data || [];
}

// ── Shifts CRUD ──

export async function listShifts() {
  const response = await api.get('/api/attendance/shifts');
  return response?.data || [];
}

export async function createShift(payload) {
  const response = await api.post('/api/attendance/shifts', payload);
  return response?.data;
}

export async function updateShift(id, payload) {
  const response = await api.put(`/api/attendance/shifts/${id}`, payload);
  return response?.data;
}

export async function deleteShift(id) {
  await api.delete(`/api/attendance/shifts/${id}`);
}

// ── Locations CRUD ──

export async function listLocations() {
  const response = await api.get('/api/attendance/locations');
  return response?.data || [];
}

export async function createLocation(payload) {
  const response = await api.post('/api/attendance/locations', payload);
  return response?.data;
}

export async function updateLocation(id, payload) {
  const response = await api.put(`/api/attendance/locations/${id}`, payload);
  return response?.data;
}

export async function deleteLocation(id) {
  await api.delete(`/api/attendance/locations/${id}`);
}

// ── Employee-Shift assignment ──

export async function assignShift(payload) {
  const response = await api.post('/api/attendance/assign-shift', payload);
  return response?.data;
}

export async function listEmployeeShiftAssignments() {
  const response = await api.get('/api/attendance/employee-shifts');
  return response?.data || [];
}

export async function getEmployeeShift(employeeId) {
  const response = await api.get(`/api/attendance/employee-shifts/by-employee/${employeeId}`);
  return response?.data || [];
}

export async function updateAttendanceAdmin(id, payload) {
  const response = await api.put(`/api/attendance/admin/${id}`, payload);
  return response?.data;
}

export async function allowLateCheckin(userId, date) {
  const response = await api.post(`/api/attendance/admin/allow-late-checkin?userId=${userId}&date=${date}`);
  return response?.data;
}
