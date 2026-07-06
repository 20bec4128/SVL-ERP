const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8082";

export function resolveMediaUrl(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) return raw;

  let normalized = raw.startsWith("/") ? raw : `/${raw}`;
  if (normalized.startsWith("/uploads/")) {
    normalized = `/api${normalized}`;
  }
  return `${API_BASE}${normalized}`;
}
