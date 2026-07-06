import { createContext, useContext, useEffect, useMemo, useState } from "react";
import api, {
  attachAuthHandlers,
  clearTokens,
  setAccessToken,
  getAccessToken,
} from "../utils/api";
import { useIdleTimer } from "../hooks/useIdleTimer";
import IdleTimeoutModal from "../components/common/IdleTimeoutModal";
import { resolveMediaUrl } from "../utils/mediaUrl";

export const AuthContext = createContext(null);

function normalizeRole(value) {
  const raw = String(value || "")
    .trim()
    .toUpperCase()
    .replace(/^ROLE_/, "")
    .replace(/[\s-]+/g, "_");
  if (!raw) return "EMPLOYEE";
  if (raw === "SUPERADMIN") return "SUPER_ADMIN";
  return raw;
}

function parseTokenPayload(token) {
  if (!token) return null;
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(normalized));
  } catch {
    return null;
  }
}

function userFromToken(token, fallbackEmail = "", responseData = null) {
  const payload = parseTokenPayload(token);
  const responseUser = responseData?.user || null;
  const email =
    payload?.email ||
    responseUser?.email ||
    responseData?.email ||
    payload?.sub ||
    fallbackEmail ||
    "";
  const emailUsername = String(email || "")
    .trim()
    .split("@")[0] || "";
  const username =
    responseUser?.username ||
    responseData?.username ||
    payload?.username ||
    responseUser?.userName ||
    responseData?.userName ||
    payload?.userName ||
    emailUsername;
  const firstName =
    responseUser?.firstName || responseData?.firstName || payload?.firstName || "";
  const lastName =
    responseUser?.lastName || responseData?.lastName || payload?.lastName || "";
  return {
    id: payload?.userId || responseUser?.id || responseData?.userId || responseData?.id || null,
    email,
    username,
    firstName,
    lastName,
    role: normalizeRole(responseData?.role || payload?.role || "EMPLOYEE"),
    institution: responseData?.institution || "",
    departmentName: responseData?.departmentName || "",
    team: responseData?.team || "",
    forcePasswordChange:
      responseData?.forcePasswordChange !== undefined
        ? Boolean(responseData.forcePasswordChange)
        : Boolean(payload?.forcePasswordChange),
    isProfileIncomplete: Boolean(responseData?.isProfileIncomplete),
    profilePhotoUrl: resolveMediaUrl(
      responseUser?.profilePhotoUrl || responseData?.profilePhotoUrl || "",
    ),
    employeeId: responseUser?.employeeId ?? responseData?.employeeId ?? null,
    sessionTimeout: payload?.sessionTimeout ?? responseData?.sessionTimeout ?? null,
    sessionWarning: payload?.sessionWarning ?? responseData?.sessionWarning ?? null,
  };
}

function mergeProfileIntoUser(currentUser, profileData) {
  if (!profileData) return currentUser;
  return {
    ...(currentUser || {}),
    id: profileData.id ?? currentUser?.id ?? null,
    email: profileData.email ?? currentUser?.email ?? "",
    username: profileData.username ?? currentUser?.username ?? "",
    firstName: profileData.firstName ?? currentUser?.firstName ?? "",
    lastName: profileData.lastName ?? currentUser?.lastName ?? "",
    role: normalizeRole(profileData.role || currentUser?.role || "EMPLOYEE"),
    institution: profileData.institutionName ?? currentUser?.institution ?? "",
    departmentName: profileData.departmentName ?? currentUser?.departmentName ?? "",
    team: profileData.teamName ?? currentUser?.team ?? "",
    forcePasswordChange:
      profileData.forcePasswordChange !== undefined
        ? Boolean(profileData.forcePasswordChange)
        : Boolean(currentUser?.forcePasswordChange),
    isProfileIncomplete:
      profileData.isProfileIncomplete !== undefined
        ? Boolean(profileData.isProfileIncomplete)
        : Boolean(currentUser?.isProfileIncomplete),
    profilePhotoUrl: resolveMediaUrl(
      profileData.profilePhotoUrl ?? currentUser?.profilePhotoUrl ?? "",
    ),
    employeeId: profileData.employeeId ?? currentUser?.employeeId ?? null,
  };
}

function isPublicUnauthenticatedRoute(pathname) {
  return String(pathname || "").startsWith("/employee-form/") || String(pathname || "").startsWith("/activate");
}

export function AuthProvider({ children }) {
  const [accessToken, setAccessTokenState] = useState(() => getAccessToken());
  const [user, setUser] = useState(() => {
    const token = getAccessToken();
    if (token) {
      return userFromToken(token);
    }
    return null;
  });
  const [loading, setLoading] = useState(true);

  const hydrateUserProfile = async () => {
    const response = await api.get("/api/auth/me");
    const profile = response?.data || null;
    if (profile) {
      setUser((currentUser) => mergeProfileIntoUser(currentUser, profile));
    }
    return profile;
  };

  // Attach auth failure/refresh handlers to the api interceptor
  useEffect(() => {
    attachAuthHandlers({
      handleAuthFailure: (error) => {
        // Vendor portal uses its own auth stack; don't force staff logout redirects there.
        if (window.location.pathname.startsWith("/vendor")) {
          return;
        }
        if (isPublicUnauthenticatedRoute(window.location.pathname)) {
          return;
        }
        const status = error?.response?.status;
        // Ignore transient refresh failures; only logout on actual auth expiry.
        if (status !== 401 && status !== 403) {
          return;
        }
        setUser(null);
        setAccessTokenState(null);
        clearTokens();
        if (window.location.pathname !== "/login") {
          window.location.assign("/login");
        }
      },
      handleTokenRefreshed: async (data) => {
        const token = data?.accessToken;
        if (!token) return;
        setAccessToken(token);
        setAccessTokenState(token);
        setUser(userFromToken(token, user?.email || "", data));
        try {
          await hydrateUserProfile();
        } catch {
          // Keep refreshed session resilient even if profile hydration fails.
        }
      },
    });
  }, [user?.email]);

  // Restore session on every page load
  useEffect(() => {
    const restoreSession = async () => {
      // Vendor portal uses a separate refresh endpoint/cookie; don't attempt staff refresh here.
      if (window.location.pathname.startsWith("/vendor")) {
        setLoading(false);
        return;
      }
      if (isPublicUnauthenticatedRoute(window.location.pathname)) {
        setLoading(false);
        return;
      }

      const storedToken = getAccessToken();
      if (storedToken) {
        try {
          const payload = parseTokenPayload(storedToken);
          const isExpired = payload?.exp ? (payload.exp * 1000 < Date.now()) : true;
          if (!isExpired) {
            setUser(userFromToken(storedToken, "", { user: payload }));
            setAccessTokenState(storedToken);
            setLoading(false);
            hydrateUserProfile().catch(() => {});
            return;
          }
        } catch (e) {
          console.debug("[AuthContext] Failed to parse cached token:", e);
        }
      }

      // If we are on the login page and have no stored token, don't attempt to refresh
      if (window.location.pathname === "/login" && !storedToken) {
        setLoading(false);
        return;
      }

      try {
        const response = await api.post("/api/auth/refresh", {});
        const nextAccess = response.data?.accessToken;
        if (!nextAccess) throw new Error("Unable to restore session");
        setAccessToken(nextAccess);
        setAccessTokenState(nextAccess);
        setUser(userFromToken(nextAccess, "", response.data));
        try {
          await hydrateUserProfile();
        } catch {
          // Avoid breaking session restore if profile hydration fails temporarily.
        }
      } catch (error) {
        const status = error?.response?.status;
        const isAuthExpired = status === 401 || status === 403;
        if (isAuthExpired) {
          if (isPublicUnauthenticatedRoute(window.location.pathname)) {
            setLoading(false);
            return;
          }
          console.debug("[AuthContext] Session restore skipped: refresh token expired");
          clearTokens();
          setUser(null);
          setAccessTokenState(null);
          if (window.location.pathname !== "/login") {
            window.location.assign("/login");
          }
        } else {
          console.warn(
            "[AuthContext] Session restore failed:",
            error?.message || "Temporary network/server issue"
          );
        }
      } finally {
        setLoading(false);
      }
    };
    restoreSession();
  }, []);

  const login = async (identifier, password) => {
    const response = await api.post("/api/auth/login", {
      identifier,
      password,
    });
    const nextAccess = response.data?.accessToken;
    if (!nextAccess) throw new Error("Invalid login response");
    setAccessToken(nextAccess);
    setAccessTokenState(nextAccess);
    setUser(userFromToken(nextAccess, identifier, response.data));
    try {
      await hydrateUserProfile();
    } catch {
      // Login can still succeed even if profile hydration is temporarily unavailable.
    }
    return response.data;
  };

  const logout = async () => {
    try {
      await api.post("/api/auth/logout", {});
    } finally {
      clearTokens();
      setUser(null);
      setAccessTokenState(null);
      if (window.location.pathname !== "/login" && !isPublicUnauthenticatedRoute(window.location.pathname)) {
        window.location.assign("/login");
      }
    }
  };

  const isAuthenticated = Boolean(user && accessToken);

  // Auto logout configuration: dynamic timeout and warning before logout seconds configured from sessionSettings claims
  const { showWarning, countdown, resetTimer } = useIdleTimer({
    timeoutMs: (user?.sessionTimeout ?? 15) * 60 * 1000,
    warningMs: (user?.sessionWarning ?? 120) * 1000,
    onTimeout: logout,
    enabled: isAuthenticated && !isPublicUnauthenticatedRoute(window.location.pathname),
  });

  const updateUserProfile = (profileData) => {
    setUser((currentUser) => mergeProfileIntoUser(currentUser, profileData));
  };

  const value = useMemo(
    () => ({
      user,
      accessToken,
      loading,
      isAuthenticated,
      login,
      logout,
      updateUserProfile,
    }),
    [user, accessToken, loading, isAuthenticated],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
      {isAuthenticated && (
        <IdleTimeoutModal
          show={showWarning}
          countdown={countdown}
          onStayLoggedIn={resetTimer}
          onLogout={logout}
        />
      )}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
