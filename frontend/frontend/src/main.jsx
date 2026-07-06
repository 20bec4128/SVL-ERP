import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import { PageAccessProvider } from "./context/PageAccessContext";
import QueryProvider from "./providers/QueryProvider";
import ErrorBoundary from "./components/system/ErrorBoundary";
import ToastProvider from "./components/system/ToastProvider";
import "./styles/loadingSpinner.css";

const markTablerIconsReady = () =>
  document.documentElement.classList.add("tabler-icons-ready");

const waitForTablerIcons = () => {
  if (!document?.fonts?.load) {
    markTablerIconsReady();
    return;
  }
  Promise.race([
    document.fonts.load('1em "tabler-icons"'),
    new Promise((resolve) => setTimeout(resolve, 2000))
  ])
    .then(markTablerIconsReady)
    .catch(markTablerIconsReady);
};

waitForTablerIcons();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <PageAccessProvider>
        <ToastProvider>
          <QueryProvider>
            <ErrorBoundary>
              <BrowserRouter>
                <App />
              </BrowserRouter>
            </ErrorBoundary>
          </QueryProvider>
        </ToastProvider>
      </PageAccessProvider>
    </AuthProvider>
  </React.StrictMode>
);
