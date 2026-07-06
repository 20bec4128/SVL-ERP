import api from '../utils/api';

/**
 * Create a new production requirement for a lead
 * @param {number} leadId - Lead ID
 * @param {object} productionData - Production requirement data
 * @returns {Promise} Production requirement response
 */
export const createProductionRequirement = async (leadId, productionData) => {
const response = await api.post(`/api/v1/production-requirements`, productionData);
  return response.data;
};

/**
 * Get production requirements for a lead
 * @param {number} leadId - Lead ID
 * @returns {Promise} Array of production requirements
 */
export const getProductionRequirements = async (leadId) => {
  try {
    const response = await api.get(`/api/v1/production-requirements/lead/${leadId}`);
    const data = response.data;
    // Backend returns a single object; wrap in array for consistent usage
    if (!data) return [];
    return Array.isArray(data) ? data : [data];
  } catch (err) {
    // 404 means no production requirement exists yet for this lead — not an error
    if (err?.response?.status === 404) return [];
    throw err;
  }
};

/**
 * Get a specific production requirement
 * @param {number} leadId - Lead ID
 * @param {number} requirementId - Production requirement ID
 * @returns {Promise} Production requirement details
 */
export const getProductionRequirementById = async (leadId, requirementId) => {
const response = await api.get(`/api/v1/production-requirements/${requirementId}`);
  return response.data;
};

/**
 * Update a production requirement
 * @param {number} leadId - Lead ID
 * @param {number} requirementId - Production requirement ID
 * @param {object} productionData - Updated production data
 * @returns {Promise} Updated production requirement
 */
export const updateProductionRequirement = async (leadId, requirementId, productionData) => {
const response = await api.put(`/api/v1/production-requirements/${requirementId}`, productionData);
  return response.data;
};

/**
 * Delete a production requirement
 * @param {number} leadId - Lead ID
 * @param {number} requirementId - Production requirement ID
 * @returns {Promise} Response
 */
export const deleteProductionRequirement = async (leadId, requirementId) => {
const response = await api.delete(`/api/v1/production-requirements/lead/${requirementId}`);
  return response.data;
};

// Legacy exports for backward compatibility
export const saveProductionRequirement = async (productionRequirementData) => {
  const response = await api.post(
    `/api/v1/production-requirements`,
    productionRequirementData
  );
  return response.data;
};

export const getProductionRequirement = async (leadId) => {
  return getProductionRequirements(leadId);
};

export const checkProductionRequirementExists = async (leadId) => {
  const response = await api.get(
    `/api/v1/production-requirements/exists/${leadId}`
  );
  return response.data;
};
