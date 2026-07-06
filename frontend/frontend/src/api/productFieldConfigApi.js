import api from '../utils/api';

export const getFieldsByServiceType = (serviceTypeId) =>
  api.get(`/api/service-types/${serviceTypeId}/fields`).then(r => r.data);

export const createProductField = (serviceTypeId, data) =>
  api.post(`/api/service-types/${serviceTypeId}/fields`, data).then(r => r.data);

export const updateProductField = (serviceTypeId, fieldId, data) =>
  api.put(`/api/service-types/${serviceTypeId}/fields/${fieldId}`, data).then(r => r.data);

export const deleteProductField = (serviceTypeId, fieldId) =>
  api.delete(`/api/service-types/${serviceTypeId}/fields/${fieldId}`);

export const reorderProductFields = (serviceTypeId, orderedIds) =>
  api.put(`/api/service-types/${serviceTypeId}/fields/reorder`, orderedIds);

export async function getDimensionMasters() {
  const response = await api.get('/api/dimension-masters');
  return Array.isArray(response?.data) ? response.data : [];
}

export async function addDimensionMaster(name) {
  const response = await api.post('/api/dimension-masters', { name });
  return response?.data || {};
}

export async function deleteDimensionMaster(id) {
  await api.delete(`/api/dimension-masters/${id}`);
}

export async function getUnitMasters() {
  const response = await api.get('/api/unit-masters');
  return Array.isArray(response?.data) ? response.data : [];
}

export async function addUnitMaster(name) {
  const response = await api.post('/api/unit-masters', { name });
  return response?.data || {};
}

export async function deleteUnitMaster(id) {
  await api.delete(`/api/unit-masters/${id}`);
}
