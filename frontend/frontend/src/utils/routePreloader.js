const prefetchedRoutes = new Set();
const inFlightRoutes = new Set();
const scheduledRoutes = new Map();

const THROTTLE_MS = 180;

let preloadTimer = null;
let lastPreloadTimestamp = 0;

function runNextPreload() {
  if (preloadTimer || scheduledRoutes.size === 0) {
    return;
  }

  const elapsed = Date.now() - lastPreloadTimestamp;
  const delay = Math.max(0, THROTTLE_MS - elapsed);

  preloadTimer = window.setTimeout(() => {
    preloadTimer = null;

    const nextEntry = scheduledRoutes.entries().next().value;
    if (!nextEntry) {
      return;
    }

    const [routeKey, importer] = nextEntry;
    scheduledRoutes.delete(routeKey);

    if (prefetchedRoutes.has(routeKey) || inFlightRoutes.has(routeKey)) {
      runNextPreload();
      return;
    }

    inFlightRoutes.add(routeKey);

    Promise.resolve()
      .then(() => importer())
      .then(() => {
        prefetchedRoutes.add(routeKey);
      })
      .catch(() => {
        // Keep route retryable if preload fails.
      })
      .finally(() => {
        inFlightRoutes.delete(routeKey);
        lastPreloadTimestamp = Date.now();
        runNextPreload();
      });
  }, delay);
}

export function preloadRoute(routeKey, importer) {
  if (
    !routeKey ||
    typeof importer !== "function" ||
    prefetchedRoutes.has(routeKey) ||
    inFlightRoutes.has(routeKey) ||
    scheduledRoutes.has(routeKey)
  ) {
    return false;
  }

  scheduledRoutes.set(routeKey, importer);
  runNextPreload();
  return true;
}

export function cancelScheduledPreload(routeKey) {
  if (!routeKey || !scheduledRoutes.has(routeKey)) {
    return false;
  }

  scheduledRoutes.delete(routeKey);

  if (scheduledRoutes.size === 0 && preloadTimer) {
    window.clearTimeout(preloadTimer);
    preloadTimer = null;
  }

  return true;
}

export function isRoutePrefetched(routeKey) {
  return prefetchedRoutes.has(routeKey);
}

