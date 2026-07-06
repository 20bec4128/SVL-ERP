import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { attachAdminNavigationHandlers } from "../../utils/adminNavigation";
import { useAuth } from "../../context/AuthContext";
import { usePageAccess } from "../../context/PageAccessContext";
import { adminSidebarSections } from "./adminSidebarConfig";

function hasMatchingRole(role, allowedRoles) {
  if (!Array.isArray(allowedRoles) || allowedRoles.length === 0) {
    return true;
  }
  return allowedRoles.includes(role);
}

function hasExcludedRole(role, excludedRoles) {
  if (!Array.isArray(excludedRoles) || excludedRoles.length === 0) {
    return false;
  }
  return excludedRoles.includes(role);
}

function normalizePath(pathname) {
  return String(pathname || "").replace(/^\/+|\/+$/g, "");
}

function matchesRoute(pathname, href) {
  const current = normalizePath(pathname);
  const target = normalizePath(href);
  if (!current || !target) {
    return false;
  }
  return current === target || current.startsWith(`${target}/`);
}

function makeSubmenuKey(sectionKey, itemLabel) {
  return `${sectionKey}::${itemLabel}`;
}

function hasRouteInTree(item, pathname) {
  if (!item) return false;
  if (matchesRoute(pathname, item.href)) {
    return true;
  }
  return Array.isArray(item.children) && item.children.some((child) => hasRouteInTree(child, pathname));
}

function findOpenSubmenuKey(sections, pathname) {
  for (const section of sections || []) {
    for (const item of section.items || []) {
      if (!Array.isArray(item.children) || item.children.length === 0) {
        continue;
      }
      if (hasRouteInTree(item, pathname)) {
        return makeSubmenuKey(section.key, item.label);
      }
    }
  }
  return null;
}

function formatDisplayName(user) {
  const firstName = String(user?.firstName || "").trim();
  const lastName = String(user?.lastName || "").trim();
  const fullName = [firstName, lastName].filter(Boolean).join(" ").trim();
  return fullName || String(user?.username || "").trim() || "User";
}

function formatRoleLabel(role) {
  const normalized = String(role || "").trim().replace(/_/g, " ");
  if (!normalized) {
    return "Admin";
  }
  return normalized
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function Sidebar() {
  const containerRef = useRef(null);
  const scrollSyncFrameRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { canAccess } = usePageAccess();
  const role = String(user?.role || "").toUpperCase();
  const profilePhotoUrl = user?.profilePhotoUrl || "/assets/img/profiles/avatar-02.jpg";
  const displayName = formatDisplayName(user);
  const roleLabel = formatRoleLabel(user?.role || "Admin");

  const canAccessAny = (...keys) =>
    keys.flat().some((key) => key && canAccess(key));

  const isVisibleItem = (item) => {
    if (!item) return false;
    if (!hasMatchingRole(role, item.rolesAny)) return false;
    if (hasExcludedRole(role, item.excludeRoles)) return false;
    
    if (Array.isArray(item.children) && item.children.length > 0) {
      const visibleChildren = item.children.filter(isVisibleItem);
      return visibleChildren.length > 0;
    }
    
    if (Array.isArray(item.accessAny) && item.accessAny.length > 0) {
      return canAccessAny(item.accessAny);
    }
    return Boolean(item.href);
  };

  const visibleSections = useMemo(
    () =>
      adminSidebarSections
        .filter((section) => hasMatchingRole(role, section.rolesAny))
        .map((section) => {
          let items = (section.items || []).filter(isVisibleItem);
          
          if (section.key === "dashboard" && role !== "SUPER_ADMIN") {
            items = items.map((item) => ({
              ...item,
              label: "Dashboard",
            }));
          }
          
          return {
            ...section,
            items,
          };
        })
        .filter((section) => section.items.length > 0),
    [role, canAccess, user],
  );

  const activeSubmenuKey = useMemo(
    () => findOpenSubmenuKey(visibleSections, location.pathname),
    [visibleSections, location.pathname],
  );
  const [openSubmenuKey, setOpenSubmenuKey] = useState(null);
  const [isActiveMenuClosed, setIsActiveMenuClosed] = useState(false);

  useEffect(() => {
    setIsActiveMenuClosed(false);
    setOpenSubmenuKey(null);
  }, [activeSubmenuKey]);

  useEffect(() => {
    return attachAdminNavigationHandlers(containerRef.current, navigate);
  }, [navigate, visibleSections]);

  useEffect(() => {
    const container = containerRef.current;
    if (!(container instanceof HTMLElement)) {
      return undefined;
    }

    const runScrollSync = () => {
      const scrollContainer = container.querySelector(".sidebar-inner");
      if (!(scrollContainer instanceof HTMLElement)) {
        return;
      }

      const activeLink =
        scrollContainer.querySelector("#sidebar-menu li.active.leaf-active > a") ||
        scrollContainer.querySelector("#sidebar-menu a.active.leaf-link");

      if (!(activeLink instanceof HTMLElement)) {
        return;
      }

      activeLink.scrollIntoView({
        block: "nearest",
        inline: "nearest",
      });
    };

    if (scrollSyncFrameRef.current) {
      cancelAnimationFrame(scrollSyncFrameRef.current);
    }

    scrollSyncFrameRef.current = requestAnimationFrame(() => {
      scrollSyncFrameRef.current = requestAnimationFrame(runScrollSync);
    });

    return () => {
      if (scrollSyncFrameRef.current) {
        cancelAnimationFrame(scrollSyncFrameRef.current);
        scrollSyncFrameRef.current = null;
      }
    };
  }, [location.pathname, visibleSections]);

  const isItemActive = (item) => matchesRoute(location.pathname, item?.href);

  const hasActiveDescendant = (item) => {
    if (!item || !Array.isArray(item.children)) {
      return false;
    }

    return item.children.some((child) =>
      isItemActive(child) || hasActiveDescendant(child),
    );
  };

  const renderItems = (items, sectionKey = "", level = 0) =>
    items.map((item) => {
      const visibleChildren = Array.isArray(item.children)
        ? item.children.filter(isVisibleItem)
        : [];
      const isActive = isItemActive(item);
      const itemKey = visibleChildren.length > 0 ? makeSubmenuKey(sectionKey, item.label) : "";
      const isOpen = visibleChildren.length > 0
        ? (
            level === 0
              ? (itemKey === activeSubmenuKey ? !isActiveMenuClosed : openSubmenuKey === itemKey)
              : hasActiveDescendant(item)
          )
        : false;

      if (visibleChildren.length > 0) {
        const shouldAnimatePanel = level === 0;
        return (
          <li key={item.label} className={`submenu${isOpen ? " parent-active" : ""}`}>
            <a
              href="javascript:void(0);"
              className={`${isOpen ? "subdrop " : ""}${shouldAnimatePanel ? "sidebar-submenu-trigger " : ""}parent-link`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (level !== 0) return;
                if (itemKey === activeSubmenuKey) {
                  setIsActiveMenuClosed((prev) => !prev);
                } else {
                  setOpenSubmenuKey((prev) => (prev === itemKey ? null : itemKey));
                }
              }}
              aria-expanded={isOpen}
            >
              {item.icon ? <i className={item.icon}></i> : null}
              <span>{item.label}</span>
              <span className="menu-arrow"></span>
            </a>
            <ul
              className={shouldAnimatePanel ? `sidebar-submenu-panel${isOpen ? " is-open" : ""}` : ""}
              style={{ display: isOpen ? "block" : "none" }}
              aria-hidden={!isOpen}
            >
              {renderItems(visibleChildren, sectionKey, level + 1)}
            </ul>
          </li>
        );
      }

      return (
        <li key={item.label} className={isActive ? "active leaf-active" : ""}>
          <a
            href={item.href}
            className={isActive ? "active leaf-link" : ""}
          >
            {item.icon ? <i className={item.icon}></i> : null}
            <span>{item.label}</span>
          </a>
        </li>
      );
    });

  return (
    <div ref={containerRef}>
      <div className="sidebar" id="sidebar">
        <div className="sidebar-logo">
          <a href="/admin-dashboard" className="logo logo-normal">
            <img src="/assets/img/logo.svg" alt="Logo" />
          </a>
          <a href="/admin-dashboard" className="logo-small">
            <img src="/assets/img/logo-small.svg" alt="Logo" />
          </a>
          <a href="/admin-dashboard" className="dark-logo">
            <img src="/assets/img/logo-white.svg" alt="Logo" />
          </a>
        </div>

        <div className="modern-profile p-3 pb-0">
          <div className="text-center rounded bg-light p-3 mb-4 user-profile">
            <div className="avatar avatar-lg online mb-3">
              <img
                src={profilePhotoUrl}
                alt={displayName}
                className="img-fluid rounded-circle"
              />
            </div>
            <h6 className="fs-12 fw-normal mb-1">{displayName}</h6>
            <p className="fs-10">{roleLabel}</p>
          </div>
          <div className="sidebar-nav mb-3">
            <ul
              className="nav nav-tabs nav-tabs-solid nav-tabs-rounded nav-justified bg-transparent"
              role="tablist"
            >
              <li className="nav-item">
                <a className="nav-link active border-0" href="#">
                  Menu
                </a>
              </li>
              <li className="nav-item">
                <a className="nav-link border-0" href="/email">
                  Inbox
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="sidebar-header p-3 pb-0 pt-2">
          <div className="text-center rounded bg-light p-2 mb-4 sidebar-profile d-flex align-items-center">
            <div className="avatar avatar-md onlin">
              <img
                src={profilePhotoUrl}
                alt={displayName}
                className="img-fluid rounded-circle"
              />
            </div>
            <div className="text-start sidebar-profile-info ms-2">
              <h6 className="fs-12 fw-normal mb-1">{displayName}</h6>
              <p className="fs-10">{roleLabel}</p>
            </div>
          </div>
          <div className="input-group input-group-flat d-inline-flex mb-4">
            <span className="input-icon-addon">
              <i className="ti ti-search"></i>
            </span>
            <input
              type="text"
              className="form-control"
              placeholder="Search in ERP"
            />
            <span className="input-group-text">
              <kbd>CTRL + / </kbd>
            </span>
          </div>
          <div className="d-flex align-items-center justify-content-between menu-item mb-3">
            <div className="me-3">
              <a href="/calendar" className="btn btn-menubar">
                <i className="ti ti-layout-grid-remove"></i>
              </a>
            </div>
            <div className="me-0">
              <a href="/email" className="btn btn-menubar">
                <i className="ti ti-message"></i>
              </a>
            </div>
          </div>
        </div>
        <div className="sidebar-inner slimscroll">
          <div id="sidebar-menu" className="sidebar-menu">
            <ul>
              {visibleSections.map((section) => (
                <Fragment key={section.key}>
                  <li key={`${section.key}-title`} className="menu-title">
                    <span>{section.title}</span>
                  </li>
                  <li key={`${section.key}-items`}>
                    <ul>{renderItems(section.items, section.key)}</ul>
                  </li>
                </Fragment>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
