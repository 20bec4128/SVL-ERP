import axios from "axios";
import logger from "./logger";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8082";

let vendorAccessToken = null;
let onVendorAuthFailure = null;
let onVendorTokenRefreshed = null;

export function setVendorAccessToken(token) {
  vendorAccessToken = token || null;
}

export function getVendorAccessToken() {
  return vendorAccessToken;
}

export function clearVendorTokens() {
  vendorAccessToken = null;
}

export function attachVendorAuthHandlers({ handleAuthFailure, handleTokenRefreshed } = {}) {
  onVendorAuthFailure = handleAuthFailure || null;
  onVendorTokenRefreshed = handleTokenRefreshed || null;
}

const vendorApi = axios.create({
  baseURL: API_BASE,
  withCredentials: true, // send vendor_refresh_token cookie on refresh
});

vendorApi.interceptors.request.use((config) => {
  const token = getVendorAccessToken();
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

vendorApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config || {};
    const status = error.response?.status;
    const url = originalRequest.url || "";

    const isLogin = url.includes("/api/vendor-auth/login");
    const isRefresh = url.includes("/api/vendor-auth/refresh");

    if (status === 401 && !originalRequest._retry && !isLogin && !isRefresh) {
      originalRequest._retry = true;
      try {
        const refreshResponse = await vendorApi.post("/api/vendor-auth/refresh", {});
        const newAccessToken = refreshResponse.data?.accessToken;
        if (!newAccessToken) {
          throw new Error("No access token returned during vendor refresh");
        }

        setVendorAccessToken(newAccessToken);
        if (typeof onVendorTokenRefreshed === "function") {
          onVendorTokenRefreshed(refreshResponse.data);
        }

        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return vendorApi(originalRequest);
      } catch (refreshError) {
        const refreshStatus = refreshError?.response?.status;
        const isAuthExpired = refreshStatus === 401 || refreshStatus === 403;
        if (isAuthExpired) {
          clearVendorTokens();
          if (typeof onVendorAuthFailure === "function") {
            onVendorAuthFailure(refreshError);
          }
        } else {
          logger.warn("[vendorApi] vendor refresh failed transiently", {
            status: refreshStatus,
            message: refreshError?.message,
          });
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

export default vendorApi;
