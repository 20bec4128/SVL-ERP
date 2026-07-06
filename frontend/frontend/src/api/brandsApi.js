import api from '../utils/api';

function normalizeBrandResponse(row) {
  if (!row) return row;
  return {
    ...row,
    // ensure categoryName is available
    categoryName: row.categoryName || '',
  };
}

export async function getBrands() {
  try {
    const resp = await api.get('/api/brands');
    return Array.isArray(resp?.data) ? resp.data.map(normalizeBrandResponse) : [];
  } catch (err) {
    // If backend doesn't implement brands yet (or is misrouted), treat as empty list (no UI error).
    const status = err?.response?.status;
    if (status === 404 || status === 500) {
      return [];
    }
    throw err;
  }
}

export async function createBrand(brand) {
  const resp = await api.post('/api/brands', {
    stockCategoryId:
      brand.stockCategoryId === '' || brand.stockCategoryId == null
        ? null
        : Number(brand.stockCategoryId),
    brandName: brand.brandName,
  });
  return resp?.data ? normalizeBrandResponse(resp.data) : null;
}

export async function updateBrand(id, brand) {
  const resp = await api.put(`/api/brands/${id}`, {
    stockCategoryId:
      brand.stockCategoryId === '' || brand.stockCategoryId == null
        ? null
        : Number(brand.stockCategoryId),
    brandName: brand.brandName,
  });
  return resp?.data ? normalizeBrandResponse(resp.data) : null;
}

export async function deleteBrand(id) {
  await api.delete(`/api/brands/${id}`);
  return {};
}
