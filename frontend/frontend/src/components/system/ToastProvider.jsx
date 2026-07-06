import { createContext, useCallback, useContext, useMemo, useState } from "react";

const ToastContext = createContext(null);

let notifyBridge = null;

function nextToastId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function notifySuccess(message, options = {}) {
  notifyBridge?.("success", message, options);
}

export function notifyError(message, options = {}) {
  notifyBridge?.("error", message, options);
}

export default function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const pushToast = useCallback((type, message, options = {}) => {
    const id = nextToastId();
    const duration = options.duration ?? 4000;
    const title =
      options.title ?? (type === "success" ? "Success" : "Something went wrong");

    setToasts((prev) => [...prev, { id, type, title, message }]);

    window.setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, duration);
  }, []);

  const showSuccess = useCallback(
    (message, options = {}) => pushToast("success", message, options),
    [pushToast]
  );

  const showError = useCallback(
    (message, options = {}) => pushToast("error", message, options),
    [pushToast]
  );

  notifyBridge = pushToast;

  const contextValue = useMemo(
    () => ({
      showSuccess,
      showError,
      removeToast,
    }),
    [showSuccess, showError, removeToast]
  );

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <div
        className="toast-container app-toast-container position-fixed top-0 start-50 translate-middle-x p-3 d-flex flex-column align-items-center"
        style={{ zIndex: 3000, marginTop: "1rem" }}
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`toast app-toast show align-items-center border-0 text-white mb-2 ${
              toast.type === "success" ? "bg-success" : "bg-danger"
            }`}
            role="alert"
            aria-live="assertive"
            aria-atomic="true"
          >
            <div className="d-flex">
              <div className="toast-body">
                <div className="fw-semibold">{toast.title}</div>
                <div>{toast.message}</div>
              </div>
              <button
                type="button"
                className="btn-close btn-close-white me-2 m-auto"
                aria-label="Close"
                onClick={() => removeToast(toast.id)}
              />
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}
