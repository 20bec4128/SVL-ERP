import { useEffect, useRef, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getVendorSession, clearVendorSession } from "../../utils/vendorSession";
import { logoutVendor } from "../../api/vendorAuthApi";
import * as attendanceApi from "../../api/attendanceApi";
import "./BottomNav.css";

export default function BottomNav() {
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const vendorSession = getVendorSession();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [attendanceToday, setAttendanceToday] = useState(null);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const profileMenuRef = useRef(null);

  const isCustomer = location.pathname.startsWith("/portal") || location.pathname.startsWith("/customer") || user?.role === "CUSTOMER";
  const isVendor = location.pathname.startsWith("/vendor") || !!vendorSession?.vendorId;
  const isAdmin = !isCustomer && !isVendor && isAuthenticated;

  useEffect(() => {
    function handleClickOutside(event) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    }

    if (showProfileMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showProfileMenu]);

  useEffect(() => {
    if (!isAdmin) {
      setAttendanceToday(null);
      setAttendanceLoading(false);
      return undefined;
    }

    let isMounted = true;
    const loadAttendanceToday = async () => {
      setAttendanceLoading(true);
      try {
        const data = await attendanceApi.getToday().catch(() => null);
        if (!isMounted) return;
        setAttendanceToday(data || null);
      } finally {
        if (isMounted) setAttendanceLoading(false);
      }
    };

    loadAttendanceToday();
    return () => {
      isMounted = false;
    };
  }, [isAdmin]);

  if (!isAuthenticated && !vendorSession?.vendorId) {
    return null;
  }

  const attendanceStatus = String(attendanceToday?.status || "").toUpperCase();
  const shouldShowCheckIn =
    !attendanceToday ||
    attendanceStatus === "CHECKED_OUT" ||
    attendanceStatus === "AUTO_CHECKOUT";

  const centerItem = attendanceLoading
    ? {
        label: "Loading",
        icon: "ti ti-loader-2",
        to: "#",
        disabled: true,
        attendance: false,
      }
    : shouldShowCheckIn
      ? {
          label: "Check In",
          icon: "ti ti-fingerprint",
          to: "/attendance-employee",
          disabled: false,
          attendance: true,
        }
      : {
          label: "Create",
          icon: "ti ti-plus",
          to: "/leads?create=true",
          disabled: false,
          attendance: false,
        };

  const handleLogout = async () => {
    setShowProfileMenu(false);
    if (isVendor) {
      try {
        await logoutVendor();
      } finally {
        clearVendorSession();
        navigate("/login", { replace: true });
      }
    } else {
      try {
        await logout();
      } finally {
        navigate("/login", { replace: true });
      }
    }
  };

  let navItems = [];

  if (isCustomer) {
    navItems = [
      {
        to: "/portal/chat",
        label: "Chat",
        icon: "ti ti-message",
      },
      {
        to: "/portal/status",
        label: "Status",
        icon: "ti ti-checklist",
      },
    ];
  } else if (isVendor) {
    navItems = [
      {
        to: "/vendor",
        label: "All Orders",
        icon: "ti ti-clipboard-list",
        exact: true,
      },
      {
        to: "/vendor/new-orders",
        label: "New",
        icon: "ti ti-bell",
      },
      {
        to: "/vendor/pending-orders",
        label: "Pending",
        icon: "ti ti-loader-2",
      },
      {
        to: "/vendor/delivered-orders",
        label: "Delivered",
        icon: "ti ti-truck-delivery",
      },
    ];
  } else if (isAdmin) {
    navItems = [
      {
        to: "/admin-dashboard",
        label: "Dashboard",
        icon: "ti ti-layout-dashboard",
      },
      {
        to: "/leads",
        label: "Leads",
        icon: "ti ti-users",
        exact: true,
      },
      {
        to: "/attendance-employee",
        label: "Attendance",
        icon: "ti ti-calendar-user",
      },
      {
        to: "/profile",
        label: "Profile",
        icon: "ti ti-user",
        isProfile: true,
      },
    ];
  }

  if (navItems.length === 0) {
    return null;
  }

  const renderCenterAction = () => {
    const className = [
      "bottom-nav-bar__item",
      "bottom-nav-bar__item--special",
      centerItem.attendance ? "bottom-nav-bar__item--attendance" : "",
    ]
      .filter(Boolean)
      .join(" ");

    const content = (
      <>
        <div className="bottom-nav-bar__icon-wrap">
          <i className={`${centerItem.icon} bottom-nav-bar__icon`}></i>
        </div>
        <span className="bottom-nav-bar__label">{centerItem.label}</span>
      </>
    );

    if (centerItem.disabled) {
      return (
        <button
          type="button"
          className={className}
          disabled
          style={{ background: "none", border: "none" }}
        >
          {content}
        </button>
      );
    }

    return (
      <NavLink to={centerItem.to} className={({ isActive }) => `${className}${isActive ? " is-active" : ""}`}>
        {content}
      </NavLink>
    );
  };

  const renderNavItem = (item) => {
    if (item.isProfile) {
      const isProfileActive = location.pathname === "/profile";
      return (
        <div className="bottom-nav-bar__profile-wrapper" ref={profileMenuRef}>
          <button
            type="button"
            className={`bottom-nav-bar__item${isProfileActive ? " is-active" : ""}`}
            onClick={() => setShowProfileMenu((prev) => !prev)}
            style={{ background: "none", border: "none" }}
          >
            <div className="bottom-nav-bar__icon-wrap">
              <i className={`${item.icon} bottom-nav-bar__icon`}></i>
            </div>
            <span className="bottom-nav-bar__label">{item.label}</span>
          </button>
          {showProfileMenu && (
            <div className="bottom-nav-bar__profile-menu">
              <NavLink
                to="/profile"
                className="bottom-nav-bar__profile-item"
                onClick={() => setShowProfileMenu(false)}
              >
                <i className="ti ti-user"></i>
                <span>My Profile</span>
              </NavLink>
              <button
                type="button"
                className="bottom-nav-bar__profile-item bottom-nav-bar__profile-item--danger"
                onClick={handleLogout}
              >
                <i className="ti ti-logout"></i>
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      );
    }

    return (
      <NavLink
        to={item.to}
        end={item.exact}
        className={({ isActive }) =>
          `bottom-nav-bar__item${isActive ? " is-active" : ""}`
        }
      >
        <div className="bottom-nav-bar__icon-wrap">
          <i className={`${item.icon} bottom-nav-bar__icon`}></i>
        </div>
        <span className="bottom-nav-bar__label">{item.label}</span>
      </NavLink>
    );
  };

  return (
    <div className="bottom-nav-bar d-lg-none">
      <div className="bottom-nav-bar__container">
        {navItems.map((item, index) => (
          <div key={item.to} className="bottom-nav-bar__slot">
            {renderNavItem(item)}
            {isAdmin && index === 1 ? renderCenterAction() : null}
          </div>
        ))}
      </div>
    </div>
  );
}
