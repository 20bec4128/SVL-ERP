// Routes that don't require page-level access checks
const UNGUARDED_ROUTES = ["/login", "/unauthorized", "/", "/403", "/404", "/activate"];

/**
 * Returns the route key (path) used for page-access checks,
 * or null for routes that are always open (login, error pages, etc.).
 */
export function getPageKeyForRoute(pathname) {
  if (!pathname) return null;
  // Normalize: strip trailing slash unless it's root
  const normalized = pathname.length > 1 ? pathname.replace(/\/$/, "") : pathname;
  if (UNGUARDED_ROUTES.includes(normalized)) return null;
  return normalized;
}
