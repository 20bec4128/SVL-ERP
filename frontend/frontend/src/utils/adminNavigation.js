import $ from "jquery";
import { adminPhpRoutes } from "../adminPhpRoutes";
import { cancelScheduledPreload, preloadRoute } from "./routePreloader";

const adminPageModules = import.meta.glob("../pages/admin/*.jsx");

const routeToComponent = new Map(
  adminPhpRoutes.map((route) => [
    normalizeRoutePath(route.path),
    route.component,
  ]),
);

function normalizeRoutePath(path) {
  return String(path || "")
    .replace(/^\/+/, "")
    .trim();
}

function isSameRoute(currentPath, routePath) {
  if (!currentPath || !routePath) {
    return false;
  }

  return currentPath === routePath || currentPath.endsWith(`/${routePath}`);
}

function isVisibleElement(element) {
  if (!(element instanceof HTMLElement)) {
    return false;
  }

  // Hidden duplicated sidebar trees should not drive active-route sync.
  if (element.getClientRects().length === 0) {
    return false;
  }

  const style = window.getComputedStyle(element);
  return style.display !== "none" && style.visibility !== "hidden";
}

function getSubmenuDepth(link, container) {
  if (!(link instanceof HTMLElement) || !container.contains(link)) {
    return -1;
  }

  let depth = 0;
  let node = link.parentElement;

  while (node && container.contains(node)) {
    if (node.classList.contains("submenu")) {
      depth += 1;
    }
    node = node.parentElement?.closest("li");
  }

  return depth;
}

function resolveRoutePathFromHref(href) {
  if (!href) {
    return null;
  }

  const rawHref = href.trim();
  if (
    !rawHref ||
    rawHref.startsWith("#") ||
    rawHref.startsWith("javascript:") ||
    rawHref.startsWith("mailto:") ||
    rawHref.startsWith("tel:")
  ) {
    return null;
  }

  const normalizeCandidate = (value) => {
    const normalized = normalizeRoutePath(value);
    if (!normalized) {
      return null;
    }
    if (normalized.endsWith(".php")) {
      const withoutPhp = normalized.slice(0, -4);
      if (routeToComponent.has(withoutPhp)) {
        return withoutPhp;
      }
      if (withoutPhp === "dashboard" && routeToComponent.has("admin-dashboard")) {
        return "admin-dashboard";
      }
      return withoutPhp;
    }
    return normalized;
  };

  try {
    const url = new URL(rawHref, window.location.origin);
    return normalizeCandidate(url.pathname);
  } catch {
    return normalizeCandidate(rawHref);
  }
}

function getAdminImporter(routePath) {
  const componentName = routeToComponent.get(routePath);
  if (!componentName) {
    return null;
  }

  return adminPageModules[`../pages/admin/${componentName}.jsx`] || null;
}

export function preloadAdminRouteFromHref(href) {
  const routePath = resolveRoutePathFromHref(href);
  if (!routePath) {
    return null;
  }

  const importer = getAdminImporter(routePath);
  if (!importer) {
    return null;
  }

  preloadRoute(routePath, importer);
  return routePath;
}

export function attachAdminNavigationHandlers(container, navigate, options = {}) {
  if (!container) {
    return () => {};
  }
  const { onLogout } = options;

  const toggleSubmenu = (link) => {
    const submenuItem = link.closest("li.submenu");
    if (!submenuItem || !container.contains(submenuItem)) {
      return false;
    }

    if (submenuItem.closest("#sidebar-menu")) {
      return false;
    }

    const submenu = link.nextElementSibling;
    if (!(submenu instanceof HTMLElement) || submenu.tagName !== "UL") {
      return false;
    }

    const parentList = submenuItem.parentElement;
    const isOpen = link.classList.contains("subdrop");

    if (!isOpen) {
      if (parentList instanceof HTMLElement) {
        parentList
          .querySelectorAll(":scope > li.submenu > a.subdrop")
          .forEach((openLink) => {
            if (!(openLink instanceof HTMLElement) || openLink === link) {
              return;
            }
            openLink.classList.remove("subdrop");
            const siblingMenu = openLink.nextElementSibling;
            if (
              siblingMenu instanceof HTMLElement &&
              siblingMenu.tagName === "UL"
            ) {
              $(siblingMenu).slideUp(350);
            }
          });
      }

      link.classList.add("subdrop");
      $(submenu).slideDown(350);
    } else {
      link.classList.remove("subdrop");
      $(submenu).slideUp(350);
    }

    return true;
  };

  const warmup = (event) => {
    const link = event.target.closest("a[href]");
    if (!link || !container.contains(link)) {
      return;
    }
    preloadAdminRouteFromHref(link.getAttribute("href"));
  };

  const cancelWarmup = (event) => {
    const link = event.target.closest("a[href]");
    if (!link || !container.contains(link)) {
      return;
    }

    const nextElement = event.relatedTarget;
    if (nextElement instanceof Element && link.contains(nextElement)) {
      return;
    }

    const routePath = resolveRoutePathFromHref(link.getAttribute("href"));
    if (!routePath) {
      return;
    }

    cancelScheduledPreload(routePath);
  };

  const navigateWithRouter = (event) => {
    const link = event.target.closest("a[href]");
    if (!link || !container.contains(link)) {
      return;
    }

    if (toggleSubmenu(link)) {
      event.preventDefault();
      return;
    }

    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    const href = link.getAttribute("href") || "";
    if (href.includes("logout.php")) {
      event.preventDefault();
      if (typeof onLogout === "function") {
        onLogout();
      } else {
        navigate("/login");
      }
      return;
    }

    const routePath = preloadAdminRouteFromHref(href);
    if (!routePath) {
      return;
    }

    const currentPath = normalizeRoutePath(window.location.pathname);
    if (isSameRoute(currentPath, routePath)) {
      event.preventDefault();
      return;
    }

    event.preventDefault();
    navigate(`/${routePath}`);
  };

  container.addEventListener("mouseover", warmup);
  container.addEventListener("focusin", warmup);
  container.addEventListener("mouseout", cancelWarmup);
  container.addEventListener("click", navigateWithRouter);

  return () => {
    container.removeEventListener("mouseover", warmup);
    container.removeEventListener("focusin", warmup);
    container.removeEventListener("mouseout", cancelWarmup);
    container.removeEventListener("click", navigateWithRouter);
  };
}
