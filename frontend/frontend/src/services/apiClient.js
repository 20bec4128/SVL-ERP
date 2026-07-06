import logger from "../utils/logger";
import { getAccessToken, setAccessToken } from "../utils/api";

const DEFAULT_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";
let refreshPromise = null;

async function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = fetch(`${DEFAULT_BASE_URL}/api/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: "{}",
    })
      .then(async (response) => {
        const contentType = response.headers.get("content-type") || "";
        const isJson = contentType.includes("application/json");
        const payload = isJson ? await response.json() : await response.text();

        if (!response.ok) {
          const error = new Error(`Token refresh failed: ${response.status}`);
          error.status = response.status;
          error.payload = payload;
          throw error;
        }

        const token = payload?.accessToken || null;
        if (!token) {
          throw new Error("No access token returned during refresh");
        }

        setAccessToken(token);
        return token;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

async function request(path, options = {}, hasRetried = false) {
    const url = `${DEFAULT_BASE_URL}${path}`;
    const startedAt = performance.now();
    const token = getAccessToken();

    try {
      const response = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(options.headers || {}),
        },
        credentials: "include",
        ...options,
      });

    const contentType = response.headers.get("content-type") || "";
    const isJson = contentType.includes("application/json");
    const payload = isJson ? await response.json() : await response.text();

    if (!response.ok) {
      if (response.status === 401 && !hasRetried && !path.includes("/api/auth/refresh")) {
        await refreshAccessToken();
        return request(path, options, true);
      }

      const error = new Error(`API request failed: ${response.status}`);
      error.status = response.status;
      error.payload = payload;
      logger.error("API request failed", {
        path,
        status: response.status,
        payload,
      });
      throw error;
    }

    if (import.meta.env.DEV) {
      logger.info("API request completed", {
        endpoint: path,
        durationMs: Number((performance.now() - startedAt).toFixed(2)),
        status: response.status,
      });
    }

    return payload;
  } catch (error) {
    if (import.meta.env.DEV) {
      logger.warn("API request timing", {
        endpoint: path,
        durationMs: Number((performance.now() - startedAt).toFixed(2)),
        status: error?.status ?? "NETWORK_ERROR",
      });
    }

    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Unknown API error");
  }
}

const apiClient = {
  get(path, options = {}) {
    return request(path, { method: "GET", ...options });
  },
};

export default apiClient;
