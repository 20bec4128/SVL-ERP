import api from '../utils/api'

function pickFirstString(source, keys, fallback = '') {
  for (const key of keys) {
    const value = source?.[key]
    if (typeof value === 'string' && value.trim()) {
      return value.trim()
    }
  }
  return fallback
}

function mapRoleToStatus(role, active, activationStatus) {
  const activation = String(activationStatus || '').toUpperCase()
  if (activation === 'PENDING') return 'Awaiting Admin Activation'
  if (!active) return 'Banned'
  const normalized = String(role || '').toUpperCase()
  if (normalized === 'SUPER_ADMIN') return 'Super Admin'
  if (normalized === 'ADMIN') return 'Admin'
  if (normalized === 'MANAGER') return 'Manager'
  if (normalized === 'TEAM_LEAD') return 'Team Lead'
  return 'Employee'
}

function normalizeUser(user) {
  const firstName = pickFirstString(user, ['firstName', 'first_name', 'firstname', 'FirstName'])
  const lastName = pickFirstString(user, ['lastName', 'last_name', 'lastname', 'LastName'])
  return {
    id: user?.id,
    username: user?.username || '',
    email: user?.email || '',
    firstName,
    lastName,
    role: String(user?.role || 'EMPLOYEE').toUpperCase(),
    activationStatus: String(user?.activationStatus || 'ACTIVE').toUpperCase(),
    createdBy: user?.createdBy || '',
    active: Boolean(user?.active),
    status: mapRoleToStatus(user?.role, user?.active, user?.activationStatus),
    registeredAt: user?.createdAt || null,
    lastLoginAt: user?.lastLoginAt || null,
    registeredIp: user?.registeredIp || '',
    lastActiveIp: user?.lastActiveIp || '',
    branch: pickFirstString(user, ['branch', 'institution', 'institutionName']),
    institution: pickFirstString(user, ['institution', 'institutionName', 'branch']),
    departmentName: pickFirstString(user, ['departmentName', 'department_name']),
    team: pickFirstString(user, ['team', 'teamName', 'team_name']),
  }
}

export async function getUsers(page = 0, size = 10) {
  const response = await api.get('/api/users', { params: { page, size } })
  const payload = response?.data || {}
  const content = Array.isArray(payload.content) ? payload.content : []
  return {
    items: content.map(normalizeUser),
    page: Number(payload.number ?? page),
    size: Number(payload.size ?? size),
    totalPages: Number(payload.totalPages ?? 0),
    totalElements: Number(payload.totalElements ?? content.length),
  }
}

export async function getUserById(userId) {
  if (!userId) return null
  try {
    const response = await api.get(`/api/users/${userId}`)
    return normalizeUser(response?.data || {})
  } catch (error) {
    console.error(`Failed to fetch user ${userId}:`, error)
    return null
  }
}

export async function updateUserProfile(userId, payload) {
  const body = {
    username: payload?.username,
    email: payload?.email,
    firstName: payload?.firstName,
    lastName: payload?.lastName,
    teamName: payload?.teamName,
    departmentName: payload?.departmentName,
    institutionName: payload?.institutionName || payload?.branchName,
  }

  const newPassword = String(payload?.newPassword || '').trim()
  const confirmPassword = String(payload?.confirmPassword || '').trim()
  if (newPassword || confirmPassword) {
    body.newPassword = newPassword
    body.confirmPassword = confirmPassword
  }

  const response = await api.put(`/api/users/${userId}/profile`, body)
  return normalizeUser(response?.data || {})
}

export async function changeUserRole(userId, role) {
  const response = await api.patch(`/api/users/${userId}/role`, null, { params: { role } })
  return normalizeUser(response?.data || {})
}

export async function setUserActive(userId, active) {
  const response = await api.patch(`/api/users/${userId}/status`, null, { params: { active } })
  return normalizeUser(response?.data || {})
}

export async function deleteUser(userId) {
  await api.patch(`/api/users/${userId}/delete`)
  return true
}

export async function createUser(payload) {
  const firstName = payload?.firstName ?? ''
  const lastName = payload?.lastName ?? ''
  const response = await api.post('/api/users', {
    employeeId: payload?.employeeId ?? null,
    institution: payload?.institution,
    departmentName: payload?.departmentName,
    team: payload?.team,
    role: payload?.role,
    username: payload?.username,
    firstName,
    lastName,
    email: payload?.email,
    password: payload?.password,
    confirmPassword: payload?.confirmPassword,
  })
  return normalizeUser(response?.data || {})
}

export async function getPendingUsers(page = 0, size = 10) {
  const response = await api.get('/api/users/pending', { params: { page, size } })
  const payload = response?.data || {}
  const content = Array.isArray(payload.content) ? payload.content : []
  return {
    items: content.map(normalizeUser),
    page: Number(payload.number ?? page),
    size: Number(payload.size ?? size),
    totalPages: Number(payload.totalPages ?? 0),
    totalElements: Number(payload.totalElements ?? content.length),
  }
}

export async function getUserSessions(userId) {
  if (!userId) return []
  const response = await api.get(`/api/users/${userId}/sessions`)
  const rows = Array.isArray(response?.data) ? response.data : []
  return rows.map((row) => ({
    id: row?.id,
    username: row?.username || '',
    ipAddress: row?.ipAddress || '',
    persistent: Boolean(row?.persistent),
    lastUpdateAt: row?.lastUpdateAt || null,
    expiresAt: row?.expiresAt || null,
  }))
}

export async function deleteSelectedSessions(userId, sessionIds = []) {
  if (!userId || !Array.isArray(sessionIds) || sessionIds.length === 0) {
    return { message: 'No sessions selected' }
  }
  await api.patch(`/api/users/${userId}/sessions/delete`, sessionIds)
  return { message: 'Selected sessions deleted' }
}

export async function getUserLogs(userId) {
  const response = await api.get(`/api/users/${userId}/logs`)
  const rows = Array.isArray(response?.data) ? response.data : []
  return rows.map((row) => ({
    id: row?.id,
    username: row?.username || '',
    event: row?.event || '',
    eventAt: row?.eventAt || null,
    ipAddress: row?.ipAddress || '',
  }))
}

export async function getUserGroups(userId) {
  if (!userId) return []
  const response = await api.get(`/api/users/${userId}/groups`)
  const rows = Array.isArray(response?.data) ? response.data : []
  return rows.map((row) => ({
    id: row?.id,
    name: row?.name || '',
  }))
}
