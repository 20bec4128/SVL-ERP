import { Outlet, useLocation, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Preloader from "../components/layout/Preloader";
import Topbar from "../components/layout/Topbar";
import TopbarAttendanceAction from "../components/layout/TopbarAttendanceAction";
import Sidebar from "../components/layout/Sidebar";
import Footer from "../components/layout/Footer";
import BottomNav from "../components/layout/BottomNav";
import { useAuth } from "../context/AuthContext";
import "../styles/wizardFormShell.css";

export default function AdminLayout() {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Redirection guard for Customer role to keep them strictly inside the customer portal
  const normalizedRole = String(user?.role || "").toUpperCase();
  if (isAuthenticated && normalizedRole === "CUSTOMER") {
    return <Navigate to="/portal/invoice" replace />;
  }

  useEffect(() => {
    setIsMobileSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 992) {
        setIsMobileSidebarOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const htmlElement = document.documentElement;
    const overlayElements = Array.from(
      document.querySelectorAll(".sidebar-overlay"),
    );

    htmlElement.classList.toggle("menu-opened", isMobileSidebarOpen);
    overlayElements.forEach((overlay) => {
      overlay.classList.toggle("opened", isMobileSidebarOpen);
    });

    const handleOverlayClick = () => {
      setIsMobileSidebarOpen(false);
    };

    overlayElements.forEach((overlay) => {
      overlay.addEventListener("click", handleOverlayClick);
    });

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setIsMobileSidebarOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscape);

    return () => {
      overlayElements.forEach((overlay) => {
        overlay.classList.remove("opened");
        overlay.removeEventListener("click", handleOverlayClick);
      });
      htmlElement.classList.remove("menu-opened");
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isMobileSidebarOpen]);

  return (
    <>
      <Preloader />

      <div className={`main-wrapper${isMobileSidebarOpen ? " slide-nav" : ""}`}>
        <Topbar
          isMobileSidebarOpen={isMobileSidebarOpen}
          onMobileSidebarToggle={() =>
            setIsMobileSidebarOpen((previous) => !previous)
          }
        />
        <TopbarAttendanceAction />
        <Sidebar />

        <div className="page-wrapper">
          <div className="content">
            <Outlet />
          </div>
          <Footer />
        </div>

        <BottomNav />
      </div>
    </>
  );
}
