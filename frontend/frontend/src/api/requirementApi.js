import api from '../utils/api';

/**
 * Create a new requirement (multipart: JSON data + files)
 */
export const createRequirement = async (data, files = []) => {
  const formData = new FormData();
  formData.append('data', JSON.stringify(data));
  if (files && files.length > 0) {
    files.forEach((file) => formData.append('files', file));
  }
  const response = await api.post('/api/v1/requirements', formData);
  return response.data;
};

/**
 * Update an existing requirement (multipart: JSON data + optional new files)
 */
export const updateRequirement = async (id, data, files = []) => {
  const formData = new FormData();
  formData.append('data', JSON.stringify(data));
  if (files && files.length > 0) {
    files.forEach((file) => formData.append('files', file));
  }
  const response = await api.put(`/api/v1/requirements/${id}`, formData);
  return response.data;
};

/**
 * Get all requirements for a lead
 */
export const getRequirementsByLeadId = async (leadId) => {
  const response = await api.get(`/api/v1/requirements/lead/${leadId}`);
  return response.data;
};

/**
 * Get a single requirement by ID
 */
export const getRequirementById = async (id) => {
  const response = await api.get(`/api/v1/requirements/${id}`);
  return response.data;
};

/**
 * Delete a requirement
 */
export const deleteRequirement = async (id) => {
  const response = await api.delete(`/api/v1/requirements/${id}`);
  return response.data;
};

/**
 * Delete a single file from a requirement
 */
export const deleteRequirementFile = async (fileId) => {
  const response = await api.delete(`/api/v1/requirements/files/${fileId}`);
  return response.data;
};
