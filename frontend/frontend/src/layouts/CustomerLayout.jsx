import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getCustomerLead } from "../api/customerApi";
import { getCustomerChatNotifications } from "../api/customerChatApi";
import BottomNav from "../components/layout/BottomNav";

export default function CustomerLayout() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  
  // Debug: Log customer auth info
  useEffect(() => {
    console.log('[CustomerLayout] User auth info:', {
      id: user?.id,
      email: user?.email,
      role: user?.role,
      isCustomer: user?.role?.toUpperCase() === 'CUSTOMER',
    });
  }, [user]);
  const [leadName, setLeadName] = useState("");
  const [notice, setNotice] = useState("");
  const [notifyCount, setNotifyCount] = useState(0);
  const [notifyItems, setNotifyItems] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });
  const lastSeenRef = useRef(new Date().toISOString());

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  useEffect(() => {
    let active = true;
    const loadLead = async () => {
      try {
        const lead = await getCustomerLead();
        if (!active) return;
        const name =
          lead?.name ||
          lead?.enquiryName ||
          lead?.leadName ||
          lead?.projectName ||
          "";
        setLeadName(name);
      } catch (error) {
        if (!active) return;
        // 401 means token is invalid - should logout and redirect
        if (error?.response?.status === 401) {
          console.error("[CustomerLayout] Customer auth failed (401), logging out and redirecting to login");
          logout();
          navigate("/login", { replace: true });
        } else {
          console.debug("Failed to load lead:", error?.message);
          setLeadName("");
        }
      }
    };
    loadLead();
    return () => {
      active = false;
    };
  }, [logout, navigate]);

  useEffect(() => {
    let active = true;
    const poll = async () => {
      try {
        const rows = await getCustomerChatNotifications(lastSeenRef.current);
        if (!active) return;
        if (rows.length > 0) {
          const latest = rows[0];
          setNotice(latest?.message ? `New message: ${latest.message.slice(0, 80)}` : "New message received");
          setTimeout(() => setNotice(""), 3000);
          setNotifyCount((prev) => prev + rows.length);
          setNotifyItems((prev) => {
            const seen = new Set(prev.map((item) => item.messageId));
            const next = [...prev];
            rows.forEach((row) => {
              if (!seen.has(row.messageId)) {
                next.unshift(row);
              }
            });
            return next.slice(0, 20);
          });
          const maxCreated = rows
            .map((row) => row?.createdAt)
            .filter(Boolean)
            .map((value) => new Date(value))
            .reduce((acc, date) => (date > acc ? date : acc), new Date(lastSeenRef.current));
          lastSeenRef.current = maxCreated.toISOString();
        }
      } catch (error) {
        // 401 means customer's session is invalid
        if (error?.response?.status === 401) {
          console.warn("[CustomerLayout] Polling detected 401 - customer session invalid");
          // Don't logout here, let the initial loadLead handle it
          // This is just a background poll, not critical
        } else if (error?.response?.status === 403) {
          console.debug("Chat notifications forbidden (403) - may be normal for some states");
        } else if (error?.message !== 'canceled') {
          // Silently ignore network errors and abort errors
          console.debug("Chat notification poll error:", error?.message);
        }
      }
    };
    poll();
    const interval = setInterval(poll, 10000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const handleOutside = () => setShowDropdown(false);
    if (showDropdown) {
      window.addEventListener("click", handleOutside);
    }
    return () => window.removeEventListener("click", handleOutside);
  }, [showDropdown]);

  return (
    <div className="main-wrapper customer-layout">
      <div className="header customer-topbar">
        <div className="main-header customer-topbar__inner">
          <div className="header-left customer-topbar__brand">
            <a href="/portal/invoice" className="logo customer-topbar__logo">
              <img src="/assets/img/logo.svg" alt="Logo" />
            </a>
          </div>
          <div className="header-user ms-auto d-flex align-items-center justify-content-end">
            <div className="customer-topbar__profile">
              <button
                className="customer-topbar__bell"
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  const rect = event.currentTarget.getBoundingClientRect();
                  setDropdownPos({ top: rect.bottom + 8, left: rect.right - 280 });
                  setNotifyCount(0);
                  setShowDropdown((prev) => !prev);
                }}
              >
                <i className="ti ti-bell" />
                {notifyCount > 0 ? (
                  <span className="chat-notify-badge">{notifyCount}</span>
                ) : null}
              </button>
              <div className="customer-topbar__name">
                {leadName || user?.firstName || user?.username || "Customer"}
              </div>
              <button className="btn btn-sm btn-outline-secondary" onClick={handleLogout}>
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {notice ? <div className="chat-notice">{notice}</div> : null}
      {showDropdown ? (
        <div
          className="chat-notify-dropdown"
          style={{ top: dropdownPos.top, left: dropdownPos.left }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="chat-notify-dropdown__header">
            <span>Notifications</span>
            <button type="button" onClick={() => setShowDropdown(false)}>
              <i className="ti ti-x" />
            </button>
          </div>
          <div className="chat-notify-dropdown__list">
            {notifyItems.length === 0 ? (
              <div className="chat-notify-dropdown__empty">No notifications</div>
            ) : (
              notifyItems.map((item) => (
                <button
                  key={item.messageId || `${item.leadId}-${item.createdAt}`}
                  className="chat-notify-dropdown__item"
                  onClick={() => {
                    setShowDropdown(false);
                    window.location.href = "/portal/chat";
                  }}
                >
                  <div className="chat-notify-dropdown__title">
                    Support Message
                  </div>
                  <div className="chat-notify-dropdown__message">
                    {item.message || "New message"}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      ) : null}
      <div className="sidebar customer-sidebar" id="sidebar">
        <div className="sidebar-logo customer-sidebar__logo">
          <a href="/portal/invoice" className="logo logo-normal">
            <img alt="Logo" src="/assets/img/logo-white.svg" />
          </a>
        </div>
        <div className="sidebar-inner slimscroll">
          <div id="sidebar-menu" className="sidebar-menu">
            <ul>
              <li className="menu-title">
                <span>CUSTOMER</span>
              </li>
              <li>
                <NavLink to="/portal/chat" className="">
                  <i className="ti ti-message" />
                  <span>Chat</span>
                </NavLink>
              </li>
              <li>
                <NavLink to="/portal/status" className="">
                  <i className="ti ti-checklist" />
                  <span>Status</span>
                </NavLink>
              </li>
              <li>
                <NavLink to="/portal/invoice" className="">
                  <i className="ti ti-file-text" />
                  <span>Invoice</span>
                </NavLink>
              </li>
              <li>
                <NavLink to="/portal/payment" className="">
                  <i className="ti ti-credit-card" />
                  <span>Make Payment</span>
                </NavLink>
              </li>
              <li>
                <NavLink to="/portal/payment-history" className="">
                  <i className="ti ti-history" />
                  <span>Payment History</span>
                </NavLink>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="page-wrapper">
        <div className="content">
          <Outlet />
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
