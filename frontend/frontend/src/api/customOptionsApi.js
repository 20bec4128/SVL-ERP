import api from '../utils/api';

function normalizeSubtypeId(subtypeId) {
  if (subtypeId == null) return null;
  if (subtypeId === '') return null;
  const n = Number(subtypeId);
  return Number.isFinite(n) ? n : null;
}

/**
 * Fetch saved custom options for a given type/subtype/fieldKey scope.
 * Returns an array of { id, typeId, subtypeId, fieldKey, valueRaw, createdAt }.
 */
export function getCustomOptions(typeId, subtypeId, fieldKey) {
  const t = Number(typeId);
  const k = String(fieldKey || '').trim();
  if (!Number.isFinite(t) || !k) return Promise.resolve([]);

  const params = new URLSearchParams({ typeId: String(t), fieldKey: k });
  const st = normalizeSubtypeId(subtypeId);
  if (st != null) params.append('subtypeId', String(st));

  return api.get(`/api/v1/custom-options?${params}`).then((r) => r.data);
}

/**
 * Persist a new custom option (deduplication handled server-side).
 * @param {number} typeId
 * @param {number|null} subtypeId
 * @param {string} fieldKey  e.g. "size"
 * @param {string} valueRaw  e.g. "200 × 150 mm"
 */
export function saveCustomOption(typeId, subtypeId, fieldKey, valueRaw) {
  const t = Number(typeId);
  const st = normalizeSubtypeId(subtypeId);
  const k = String(fieldKey || '').trim();
  const v = String(valueRaw || '').trim();
  if (!Number.isFinite(t) || !k || !v) return Promise.resolve(null);

  return api
    .post('/api/v1/custom-options', { typeId: t, subtypeId: st, fieldKey: k, valueRaw: v })
    .then((r) => r.data);
}

export function deleteCustomOption(id) {
  const optionId = Number(id);
  if (!Number.isFinite(optionId)) return Promise.resolve();
  return api.delete(`/api/v1/custom-options/${optionId}`);
}
