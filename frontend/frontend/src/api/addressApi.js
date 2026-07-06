/**
 * Address API functions for managing lead addresses
 * Supports creating, updating, retrieving, and deleting addresses
 */

import api from '../utils/api'

/**
 * Get all addresses for a lead
 */
export async function getAddressesbyLeadId(leadId) {
  const url = `/api/v1/leads/${leadId}/addresses`;
  const response = await api.get(url);
  return response?.data || [];
}

/**
 * Get addresses by lead ID and type (BILLING or SHIPPING)
 */
export async function getAddressesByLeadIdAndType(leadId, type) {
  const url = `/api/v1/leads/${leadId}/addresses?type=${type}`;
  const response = await api.get(url);
  return response?.data || [];
}

/**
 * Get a specific address by ID
 */
export async function getAddressById(leadId, addressId) {
  const url = `/api/v1/leads/${leadId}/addresses/${addressId}`;
  const response = await api.get(url);
  return response?.data;
}

/**
 * Create a new address for a lead
 * @param {number} leadId - The lead ID
 * @param {Object} payload - Address data (contact_person_name, company_name, gstin, phone, email, address_line1, address_line2, city, state, pincode, country, type, is_primary)
 */
export async function createAddress(leadId, payload) {
  const url = `/api/v1/leads/${leadId}/addresses`;
  const response = await api.post(url, payload);
  return response?.data;
}

/**
 * Update an existing address
 * @param {number} leadId - The lead ID
 * @param {number} addressId - The address ID
 * @param {Object} payload - Updated address data
 */
export async function updateAddress(leadId, addressId, payload) {
  const url = `/api/v1/leads/${leadId}/addresses/${addressId}`;
  const response = await api.patch(url, payload);
  return response?.data;
}

/**
 * Delete an address (soft delete)
 * @param {number} leadId - The lead ID
 * @param {number} addressId - The address ID
 */
export async function deleteAddress(leadId, addressId) {
  const url = `/api/v1/leads/${leadId}/addresses/${addressId}`;
  const response = await api.delete(url);
  return response?.data;
}
