import api from "../utils/api";

/**
 * Save design requirement (create or update)
 * POST /api/v1/design-requirements
 */
export const saveDesignRequirement = async (designRequirementData) => {
  const response = await api.post("/api/v1/design-requirements", designRequirementData);
  return response.data;
};

/**
 * Get design requirement for a specific lead
 * GET /api/v1/design-requirements/lead/{leadId}
 */
export const getDesignRequirement = async (leadId) => {
  try {
    const response = await api.get(`/api/v1/design-requirements/lead/${leadId}`);
    return response.data || null;
  } catch (err) {
    if (err?.response?.status === 404 || err?.response?.status === 204) {
      return null;
    }
    throw err;
  }
};

/**
 * Check if design requirement exists for a lead
 * GET /api/v1/design-requirements/exists/{leadId}
 */
export const checkDesignRequirementExists = async (leadId) => {
  const response = await api.get(`/api/v1/design-requirements/exists/${leadId}`);
  return response.data;
};

/**
 * Delete design requirement for a lead
 * DELETE /api/v1/design-requirements/lead/{leadId}
 */
export const deleteDesignRequirement = async (leadId) => {
  const response = await api.delete(`/api/v1/design-requirements/lead/${leadId}`);
  return response.data;
};
