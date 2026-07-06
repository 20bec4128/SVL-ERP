import api from '../utils/api';

export const getServiceTypes = () =>
  api.get('/api/service-types').then(r => r.data);

function normalizeServiceTypesPage(data) {
  if (Array.isArray(data)) {
    return {
      content: data,
      page: 1,
      size: data.length,
      totalElements: data.length,
      totalPages: 1,
    };
  }

  return {
    content: Array.isArray(data?.content) ? data.content : [],
    page: Number(data?.page ?? data?.number ?? 1) || 1,
    size: Number(data?.size ?? data?.pageSize ?? 10) || 10,
    totalElements: Number(data?.totalElements ?? data?.total ?? 0) || 0,
    totalPages: Number(data?.totalPages ?? data?.pages ?? 1) || 1,
  };
}

export const getServiceTypesPaged = (params = {}) =>
  api.get('/api/service-types', {
    params: params && Object.keys(params).length > 0 ? params : undefined,
  }).then(r => normalizeServiceTypesPage(r.data));

export const createServiceType = (data) =>
  api.post('/api/service-types', {
    name: data.name,
    fieldConfigKey: data.fieldConfigKey,
    categoryId: data.categoryId,
    parentId: data.parentId || null
  }).then(r => r.data);

export const updateServiceType = (id, data) =>
  api.put(`/api/service-types/${id}`, {
    name: data.name,
    fieldConfigKey: data.fieldConfigKey,
    categoryId: data.categoryId,
    parentId: data.parentId || null
  }).then(r => r.data);

export const deleteServiceType = (id) =>
  api.delete(`/api/service-types/${id}`);
