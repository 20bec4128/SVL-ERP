import api from '../utils/api'

function normalizeGroup(row) {
  return {
    id: row?.id,
    name: row?.name || '',
    members: Number(row?.members ?? 0),
    canDelete: Boolean(row?.canDelete),
    headOfficeId: row?.headOfficeId ?? null,
    branchId: row?.branchId ?? null,
    departmentId: row?.departmentId ?? null,
    departmentIds: Array.isArray(row?.departmentIds) ? row.departmentIds : [],
    branchName: row?.branchName || row?.institutionName || '',
    institutionName: row?.institutionName || '',
    departmentName: row?.departmentName || '',
    departmentNames: Array.isArray(row?.departmentNames) ? row.departmentNames : [],
    teamNames: Array.isArray(row?.teamNames) ? row.teamNames : [],
    pageKeys: Array.isArray(row?.pageKeys) ? row.pageKeys : [],
    memberScope: row?.memberScope || 'NONE',
  }
}

export async function getUserGroups() {
  const response = await api.get('/api/user-groups')
  const rows = Array.isArray(response?.data) ? response.data : []
  return rows.map(normalizeGroup)
}

export async function createUserGroup(payload) {
  const response = await api.post('/api/user-groups', {
    name: payload?.name,
    headOfficeId: payload?.headOfficeId ?? null,
    branchId: payload?.branchId ?? null,
    departmentId: payload?.departmentId ?? null,
    departmentIds: Array.isArray(payload?.departmentIds) ? payload.departmentIds : [],
    institutionName: payload?.institutionName || payload?.branchName,
    departmentName: payload?.departmentName,
    teamNames: Array.isArray(payload?.teamNames) ? payload.teamNames : [],
    pageKeys: Array.isArray(payload?.pageKeys) ? payload.pageKeys : [],
    memberScope: payload?.memberScope || 'NONE',
  })
  return normalizeGroup(response?.data || {})
}

export async function updateUserGroup(groupId, payload) {
  const response = await api.put(`/api/user-groups/${groupId}`, {
    name: payload?.name,
    headOfficeId: payload?.headOfficeId ?? null,
    branchId: payload?.branchId ?? null,
    departmentId: payload?.departmentId ?? null,
    departmentIds: Array.isArray(payload?.departmentIds) ? payload.departmentIds : [],
    institutionName: payload?.institutionName || payload?.branchName,
    departmentName: payload?.departmentName,
    teamNames: Array.isArray(payload?.teamNames) ? payload.teamNames : [],
    pageKeys: Array.isArray(payload?.pageKeys) ? payload.pageKeys : [],
    memberScope: payload?.memberScope || 'NONE',
  })
  return normalizeGroup(response?.data || {})
}

export async function deleteUserGroup(groupId) {
  await api.delete(`/api/user-groups/${groupId}`)
  return true
}

export async function getAssignableUsersForGroup({ groupId, teams, institutionName, departmentNames, memberScope } = {}) {
  const params = {}
  if (groupId != null) params.groupId = groupId
  if (Array.isArray(teams) && teams.length > 0) params.teams = teams
  if (institutionName != null) params.institutionName = institutionName
  if (Array.isArray(departmentNames) && departmentNames.length > 0) params.departmentNames = departmentNames
  if (memberScope != null) params.memberScope = memberScope
  const response = await api.get('/api/user-groups/assignable-users', { params })
  const rows = Array.isArray(response?.data) ? response.data : []
  return rows.map((row) => ({
    id: row?.id,
    username: row?.username || '',
    role: row?.role || '',
  }))
}

export async function getAssignableTeamsForGroup(scope = {}) {
  const params = {}
  if (scope?.institutionName || scope?.branchName) {
    params.institutionName = scope.institutionName || scope.branchName
  }
  if (scope?.departmentName) params.departmentName = scope.departmentName
  const response = await api.get('/api/user-groups/assignable-teams', { params })
  const rows = Array.isArray(response?.data) ? response.data : []
  return rows
    .map((row) => String(row?.teamName || '').trim())
    .filter(Boolean)
}

export async function getMyPageVisibility() {
  const response = await api.get('/api/user-groups/my-visibility')
  const rows = Array.isArray(response?.data) ? response.data : []
  return rows.map((row) => String(row || '').trim()).filter(Boolean)
}

export async function getGroupMembers(groupId) {
  const response = await api.get(`/api/user-groups/${groupId}/members`)
  const rows = Array.isArray(response?.data) ? response.data : []
  return rows.map((row) => ({
    userId: row?.userId,
    username: row?.username || '',
    role: row?.role || '',
    pageKeys: Array.isArray(row?.pageKeys) ? row.pageKeys : [],
  }))
}

export async function addGroupMember(groupId, userId) {
  const response = await api.post(`/api/user-groups/${groupId}/members`, null, { params: { userId } })
  const rows = Array.isArray(response?.data) ? response.data : []
  return rows.map((row) => ({
    userId: row?.userId,
    username: row?.username || '',
    role: row?.role || '',
    pageKeys: Array.isArray(row?.pageKeys) ? row.pageKeys : [],
  }))
}

export async function removeGroupMember(groupId, userId) {
  const response = await api.delete(`/api/user-groups/${groupId}/members/${userId}`)
  const rows = Array.isArray(response?.data) ? response.data : []
  return rows.map((row) => ({
    userId: row?.userId,
    username: row?.username || '',
    role: row?.role || '',
    pageKeys: Array.isArray(row?.pageKeys) ? row.pageKeys : [],
  }))
}

export async function updateGroupMemberPages(groupId, userId, pageKeys = []) {
  const response = await api.put(`/api/user-groups/${groupId}/members/${userId}/pages`, {
    pageKeys: Array.isArray(pageKeys) ? pageKeys : [],
  })
  const rows = Array.isArray(response?.data) ? response.data : []
  return rows.map((row) => ({
    userId: row?.userId,
    username: row?.username || '',
    role: row?.role || '',
    pageKeys: Array.isArray(row?.pageKeys) ? row.pageKeys : [],
  }))
}
