import api from '../utils/api';

function safeJsonParse(value, fallback) {
  if (value == null) return fallback;
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  if (!trimmed) return fallback;
  try {
    return JSON.parse(trimmed);
  } catch {
    return fallback;
  }
}

function normalizePriceEntry(entry) {
  const e = entry || {};
  return {
    ...e,
    variantFields: safeJsonParse(e.variantFields, {}),
    quantitySlabs: safeJsonParse(e.quantitySlabs, []),
  };
}

export function normalizePriceListPage(data) {
  if (Array.isArray(data)) {
    return {
      content: data.map(normalizePriceEntry),
      page: 1,
      size: data.length,
      totalElements: data.length,
      totalPages: 1,
    };
  }

  const content = Array.isArray(data?.content) ? data.content.map(normalizePriceEntry) : [];

  return {
    content,
    page: Number(data?.page ?? data?.number ?? 1) || 1,
    size: Number(data?.size ?? data?.pageSize ?? 10) || 10,
    totalElements: Number(data?.totalElements ?? data?.total ?? content.length) || 0,
    totalPages: Number(data?.totalPages ?? data?.pages ?? 1) || 1,
  };
}

export function normalizePriceListEntries(data) {
  return normalizePriceListPage(data).content;
}

export function getPriceList(params = {}) {
  return api.get('/api/price-list', {
    params: params && Object.keys(params).length > 0 ? params : undefined,
  }).then((r) => normalizePriceListPage(r.data));
}

export function getPriceListSummary(params = {}) {
  return api.get('/api/price-list/summary', {
    params: params && Object.keys(params).length > 0 ? params : undefined,
  }).then((r) => r.data || { typeCounts: [], subtypeCounts: [] });
}

export function savePriceEntry(entry) {
  const payload = {
    ...entry,
    variantFields:
      entry?.variantFields == null
        ? null
        : typeof entry.variantFields === 'string'
          ? entry.variantFields
          : JSON.stringify(entry.variantFields),
    quantitySlabs:
      entry?.quantitySlabs == null
        ? null
        : typeof entry.quantitySlabs === 'string'
          ? entry.quantitySlabs
          : JSON.stringify(entry.quantitySlabs),
  };

  if (entry.id) {
    return api.put(`/api/price-list/${entry.id}`, payload).then((r) => normalizePriceEntry(r.data));
  } else {
    return api.post('/api/price-list', payload).then((r) => normalizePriceEntry(r.data));
  }
}

export function deletePriceEntry(id) {
  return api.delete(`/api/price-list/${id}`);
}

export async function importPriceEntries(entries) {
  const results = [];
  for (const entry of entries || []) {
    try {
      const saved = await savePriceEntry(entry);
      results.push({ ok: true, entry: saved });
    } catch (error) {
      results.push({ ok: false, entry, error });
    }
  }
  return {
    created: results.filter((result) => result.ok).length,
    failed: results.filter((result) => !result.ok).length,
    results,
  };
}
