import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8082'

let accessToken = null

let onAuthFailure = null
let onTokenRefreshed = null

export function setAccessToken(token) {
  accessToken = token || null
  if (token) {
    localStorage.setItem("accessToken", token)
  } else {
    localStorage.removeItem("accessToken")
  }
}

export function getAccessToken() {
  return accessToken || localStorage.getItem("accessToken")
}

export function clearTokens() {
  accessToken = null
  localStorage.removeItem("accessToken")
}

export function attachAuthHandlers({ handleAuthFailure, handleTokenRefreshed } = {}) {
  onAuthFailure = handleAuthFailure || null
  onTokenRefreshed = handleTokenRefreshed || null
}

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
})

api.interceptors.request.use((config) => {
  const token = getAccessToken()
  if (token) {
    config.headers = config.headers || {}
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config || {}
    const status = error.response?.status
    const url = originalRequest.url || ''
    const isLogin =
      url.includes('/api/auth/login') ||
      url.includes('/auth/login') ||
      url.includes('/api/vendor-auth/login')
    const isRefresh =
      url.includes('/api/auth/refresh') ||
      url.includes('/auth/refresh') ||
      url.includes('/api/vendor-auth/refresh')

    if (status === 401 && !originalRequest._retry && !isLogin && !isRefresh) {
      originalRequest._retry = true
      try {
        const refreshResponse = await api.post('/api/auth/refresh', {})

        const newAccessToken = refreshResponse.data?.accessToken

        if (!newAccessToken) {
          throw new Error('No access token returned during refresh')
        }

        setAccessToken(newAccessToken)

        if (typeof onTokenRefreshed === 'function') {
          onTokenRefreshed(refreshResponse.data)
        }

        originalRequest.headers = originalRequest.headers || {}
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
        return api(originalRequest)
      } catch (refreshError) {
        const refreshStatus = refreshError?.response?.status
        const isAuthExpired = refreshStatus === 401 || refreshStatus === 403

        // Only force logout when refresh token is actually invalid/expired.
        // For transient failures (network/CORS/server down), keep session state.
        if (isAuthExpired) {
          clearTokens()
          if (typeof onAuthFailure === 'function') {
            onAuthFailure(refreshError)
          }
        }
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  },
)

export default api
