import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "./AuthContext";
import { getMyPageKeys } from "../api/pageAccessApi";
import {
  getRequiredPageKeysForPath,
  isAdminOnlyPath,
  isAlwaysAllowedPath,
  hasEquivalentPageKey,
} from "../constants/pageAccess";

const PageAccessContext = createContext({
  canAccess: () => false,
  canAccessRoute: () => false,
  allowedPages: [],
  role: null,
  loading: true,
});

function normalizePageKeys(keys) {
  return Array.isArray(keys)
    ? keys.map((key) => String(key || "").trim().toLowerCase()).filter(Boolean)
    : [];
}

export function PageAccessProvider({ children }) {
  const { user, loading: authLoading } = useAuth();
  const role = String(user?.role || "").toUpperCase();
  const canUsePermissionControlledAdminRoutes =
    role === "ADMIN" || role === "SUPER_ADMIN" || role === "MANAGER" || role === "TEAM_LEAD" || role === "EMPLOYEE";
  const [visiblePageKeys, setVisiblePageKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const cacheKey = useMemo(() => {
    if (!user) return null;
    const identity = user?.id ?? user?.email ?? user?.username ?? "unknown";
    return `page-visibility:${String(identity)}`;
  }, [user]);

  useEffect(() => {
    let active = true;
    const refreshVisibility = () => {
      if (cacheKey) {
        sessionStorage.removeItem(cacheKey);
      }
      setLoading(true);
      getMyPageKeys()
        .then((keys) => {
          if (!active) return;
          const normalized = normalizePageKeys(keys);
          setVisiblePageKeys(normalized);
          if (cacheKey) {
            sessionStorage.setItem(cacheKey, JSON.stringify(normalized));
          }
        })
        .catch(() => {
          if (!active) return;
          setVisiblePageKeys([]);
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    };

    if (authLoading) {
      setLoading(true);
      return () => {
        active = false;
      };
    }
    if (!user) {
      setVisiblePageKeys([]);
      setLoading(false);
      return () => {
        active = false;
      };
    }
    window.addEventListener("page-access:refresh", refreshVisibility);
    setLoading(true);
    getMyPageKeys()
      .then((keys) => {
        if (!active) return;
        const normalized = normalizePageKeys(keys);
        setVisiblePageKeys(normalized);
        if (cacheKey) {
          sessionStorage.setItem(cacheKey, JSON.stringify(normalized));
        }
      })
      .catch(() => {
        if (!active) return;
        if (cacheKey) {
          try {
            const cached = JSON.parse(sessionStorage.getItem(cacheKey) || "[]");
            setVisiblePageKeys(normalizePageKeys(cached));
            return;
          } catch {
            // ignore and fallback below
          }
        }
        setVisiblePageKeys([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
      window.removeEventListener("page-access:refresh", refreshVisibility);
    };
  }, [user, role, authLoading, cacheKey]);

  const canAccess = useMemo(() => {
    return (pageKey) => {
      if (!user) return false;
      if (role === "SUPER_ADMIN" || role === "ADMIN") {
        if (pageKey === "delivery") return true;
      }
      return hasEquivalentPageKey(visiblePageKeys, pageKey);
    };
  }, [user, role, visiblePageKeys]);

  const canAccessRoute = useMemo(() => {
    return (path) => {
      if (!user) return false;
      const normalizedPath = String(path || "").trim();
      if (/^\/stock-requests(?:\/[^/]+(?:\/status|\/chat)?)?\/?$/.test(normalizedPath)) {
        return (
          role === "EMPLOYEE" ||
          role === "PRODUCTION" ||
          canAccess("production") ||
          canAccess("accounts") ||
          canAccess("stock-requests")
        );
      }
      if (/^\/stock-requests\/[^/]+\/status\/?$/.test(normalizedPath)) {
        return (
          canAccess("production") ||
          canAccess("accounts") ||
          canAccess("stock-requests")
        );
      }
      if (isAdminOnlyPath(path) && !canUsePermissionControlledAdminRoutes) return false;
      if (isAlwaysAllowedPath(path)) return true;
      const requiredKeys = getRequiredPageKeysForPath(path);
      if (!requiredKeys.length) return true;
      return requiredKeys.some((key) => canAccess(key));
    };
  }, [user, role, canAccess, canUsePermissionControlledAdminRoutes]);

  const allowedPages = useMemo(() => {
    if (!user) return [];
    return visiblePageKeys;
  }, [user, role, visiblePageKeys]);

  return (
    <PageAccessContext.Provider value={{ canAccess, canAccessRoute, allowedPages, role, loading }}>
      {children}
    </PageAccessContext.Provider>
  );
}

export function usePageAccess() {
  return useContext(PageAccessContext);
}
