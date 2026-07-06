import api from '../utils/api'

function normalizePayload(data) {
  return {
    disallowedUsernames: Array.isArray(data?.disallowedUsernames) ? data.disallowedUsernames : [],
    bannedIps: Array.isArray(data?.bannedIps) ? data.bannedIps : [],
  }
}

export async function getSecuritySettings() {
  const response = await api.get('/api/security-settings')
  return normalizePayload(response?.data || {})
}

export async function addDisallowedUsername(username) {
  const response = await api.post('/api/security-settings/disallowed-usernames/add', { username })
  return normalizePayload(response?.data || {})
}

export async function removeDisallowedUsernames(usernames) {
  const response = await api.post('/api/security-settings/disallowed-usernames/remove', { usernames })
  return normalizePayload(response?.data || {})
}

export async function addBannedIp(ipAddress) {
  const response = await api.post('/api/security-settings/banned-ips/add', { ipAddress })
  return normalizePayload(response?.data || {})
}

export async function removeBannedIps(ipAddresses) {
  const response = await api.post('/api/security-settings/banned-ips/remove', { ipAddresses })
  return normalizePayload(response?.data || {})
}
