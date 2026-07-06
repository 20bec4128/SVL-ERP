import { useEffect } from "react";
import { useLocation } from "react-router-dom";

let bootstrapLoadPromise = null;

function loadBootstrapBundle() {
  if (window.bootstrap?.Dropdown) {
    return Promise.resolve(window.bootstrap);
  }

  if (bootstrapLoadPromise) {
    return bootstrapLoadPromise;
  }

  bootstrapLoadPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-bootstrap-bundle="true"]');
    if (existing) {
      existing.addEventListener("load", () => resolve(window.bootstrap));
      existing.addEventListener("error", reject);
      return;
    }

    const script = document.createElement("script");
    script.src = "/assets/js/bootstrap.bundle.min.js";
    script.async = true;
    script.setAttribute("data-bootstrap-bundle", "true");
    script.onload = () => resolve(window.bootstrap);
    script.onerror = reject;
    document.body.appendChild(script);
  });

  return bootstrapLoadPromise;
}

function initBootstrapUi() {
  const bootstrap = window.bootstrap;
  if (!bootstrap?.Dropdown) {
    return;
  }

  document.querySelectorAll('[data-bs-toggle="dropdown"]').forEach((element) => {
    bootstrap.Dropdown.getOrCreateInstance(element);
  });
}

export default function BootstrapInitializer() {
  const location = useLocation();

  useEffect(() => {
    let isMounted = true;

    loadBootstrapBundle()
      .then(() => {
        if (!isMounted) {
          return;
        }

        // Run after render commit so newly mounted route nodes are available.
        requestAnimationFrame(() => {
          if (isMounted) {
            initBootstrapUi();
          }
        });
      })
      .catch(() => {
        // No-op: page still renders without dropdown JS.
      });

    return () => {
      isMounted = false;
    };
  }, [location.pathname]);

  return null;
}
