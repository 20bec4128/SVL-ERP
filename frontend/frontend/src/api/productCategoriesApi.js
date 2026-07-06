import api from '../utils/api';

export const getProductCategories = () =>
  api.get('/api/product-categories').then(r => r.data);

export const createProductCategory = (data) =>
  api.post('/api/product-categories', {
    name: data.name,
    isActive: data.isActive !== undefined ? data.isActive : true
  }).then(r => r.data);

export const updateProductCategory = (id, data) =>
  api.put(`/api/product-categories/${id}`, {
    name: data.name,
    isActive: data.isActive !== undefined ? data.isActive : true
  }).then(r => r.data);

export const deleteProductCategory = (id) =>
  api.delete(`/api/product-categories/${id}`);
