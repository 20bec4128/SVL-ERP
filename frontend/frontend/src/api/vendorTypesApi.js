import api from '../utils/api';

export async function getVendorTypes() {
  try {
    const resp = await api.get('/api/vendor-types');
    return Array.isArray(resp?.data) ? resp.data : [];
  } catch (err) {
    // If backend doesn't implement vendor types yet (or is misrouted), treat as empty list (no UI error).
    const status = err?.response?.status;
    if (status === 404 || status === 500) {
      return [];
    }
    throw err;
  }
}

export async function createVendorType(type) {
  const resp = await api.post('/api/vendor-types', { typeName: type.typeName });
  return resp?.data || null;
}

export async function updateVendorType(id, type) {
  const resp = await api.put(`/api/vendor-types/${id}`, { typeName: type.typeName });
  return resp?.data || null;
}

export async function deleteVendorType(id) {
  await api.delete(`/api/vendor-types/${id}`);
  return {};
}
