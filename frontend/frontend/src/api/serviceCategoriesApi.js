import api from '../utils/api';

export const getServiceCategories = () =>
  api.get('/api/service-categories').then(r => r.data);

function normalizeServiceCategoriesPage(data) {
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

export const getServiceCategoriesPaged = (params = {}) =>
  api.get('/api/service-categories', {
    params: params && Object.keys(params).length > 0 ? params : undefined,
  }).then(r => normalizeServiceCategoriesPage(r.data));

export const createServiceCategory = (data) =>
  api.post('/api/service-categories', {
    name: data.name,
    isActive: data.isActive !== undefined ? data.isActive : true
  }).then(r => r.data);

export const updateServiceCategory = (id, data) =>
  api.put(`/api/service-categories/${id}`, {
    name: data.name,
    isActive: data.isActive !== undefined ? data.isActive : true
  }).then(r => r.data);

export const deleteServiceCategory = (id) =>
  api.delete(`/api/service-categories/${id}`);
