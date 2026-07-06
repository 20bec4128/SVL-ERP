import api from '../utils/api';

function normalizeMaterials(materials) {
  if (Array.isArray(materials)) return materials;
  if (typeof materials === 'string') {
    try {
      const parsed = JSON.parse(materials);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return materials.split(',').map((m) => m.trim()).filter(Boolean);
    }
  }
  return [];
}

function normalizeIds(ids) {
  if (Array.isArray(ids)) return ids;
  if (typeof ids === 'string') {
    if (!ids.trim()) return [];
    try {
      const parsed = JSON.parse(ids);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return ids.split(',').map((id) => Number(id.trim())).filter((id) => !isNaN(id));
    }
  }
  return [];
}

function normalizeVendorResponse(row) {
  if (!row) return row;
  return {
    ...row,
    materialsSupplied: normalizeMaterials(row.materialsSupplied),
    countryCode: row.countryCode || row.country_code || '',
    vendorTypeIds: normalizeIds(row.vendorTypeIds),
    productIds: normalizeIds(row.productIds),
    brandIds: normalizeIds(row.brandIds),
    bankDetails: Array.isArray(row.bankDetails)
      ? row.bankDetails.map((detail) => ({
          bankAccountHolderName: detail?.bankAccountHolderName || '',
          bankName: detail?.bankName || '',
          bankAccountNumber: detail?.bankAccountNumber || '',
          bankIfscCode: detail?.bankIfscCode || '',
          bankBranchName: detail?.bankBranchName || '',
          bankAccountType: detail?.bankAccountType || '',
          upiId: detail?.upiId || '',
          upiNumber: detail?.upiNumber || detail?.upiNo || detail?.upi_number || '',
          upiQrImage: detail?.upiQrImage || '',
        }))
      : [],
  };
}

function normalizeVendorPayload(vendor) {
  const normalizeArrayField = (field) => {
    if (typeof field === 'string') {
      return field;
    }
    return JSON.stringify(Array.isArray(field) ? field : []);
  };

  return {
    ...vendor,
    materialsSupplied:
      typeof vendor.materialsSupplied === 'string'
        ? vendor.materialsSupplied
        : JSON.stringify(Array.isArray(vendor.materialsSupplied) ? vendor.materialsSupplied : []),
    vendorTypeIds: normalizeArrayField(vendor.vendorTypeIds),
    productIds: normalizeArrayField(vendor.productIds),
    brandIds: normalizeArrayField(vendor.brandIds),
    countryCode: vendor.countryCode || '',
    bankDetails: Array.isArray(vendor.bankDetails)
      ? vendor.bankDetails.map((detail) => ({
          bankAccountHolderName: detail?.bankAccountHolderName || '',
          bankName: detail?.bankName || '',
          bankAccountNumber: detail?.bankAccountNumber || '',
          bankIfscCode: detail?.bankIfscCode || '',
          bankBranchName: detail?.bankBranchName || '',
          bankAccountType: detail?.bankAccountType || '',
          upiId: detail?.upiId || '',
          upiNumber: detail?.upiNumber || detail?.upiNo || detail?.upi_number || '',
          upiQrImage: detail?.upiQrImage || '',
        }))
      : [],
  };
}

export async function getVendors() {
  const resp = await api.get('/api/vendors');
  return Array.isArray(resp?.data) ? resp.data.map(normalizeVendorResponse) : [];
}

export async function createVendor(vendor) {
  const resp = await api.post('/api/vendors', normalizeVendorPayload(vendor));
  return resp?.data ? normalizeVendorResponse(resp.data) : null;
}

export async function updateVendor(id, vendor) {
  const resp = await api.put(`/api/vendors/${id}`, normalizeVendorPayload(vendor));
  return resp?.data ? normalizeVendorResponse(resp.data) : null;
}

export async function deleteVendor(id) {
  await api.delete(`/api/vendors/${id}`);
  return {};
}
