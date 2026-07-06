import { useCallback, useRef, useState } from "react";
import ConfirmDialog from "./ConfirmDialog";

export default function useConfirmDialog() {
  const [dialog, setDialog] = useState({
    open: false,
    title: "",
    message: "",
    confirmLabel: "Delete",
    cancelLabel: "Cancel",
  });
  const actionRef = useRef(null);

  const handleClose = useCallback(() => {
    actionRef.current = null;
    setDialog((prev) => ({ ...prev, open: false }));
  }, []);

  const handleConfirm = useCallback(() => {
    const action = actionRef.current;
    handleClose();
    if (action) {
      action();
    }
  }, [handleClose]);

  const showConfirm = useCallback((options) => {
    actionRef.current = options.onConfirm;
    setDialog({
      open: true,
      title: options.title || "Are you sure?",
      message: options.message || "This action cannot be undone.",
      confirmLabel: options.confirmLabel || "Delete",
      cancelLabel: options.cancelLabel || "Cancel",
    });
  }, []);

  const confirmDialog = (
    <ConfirmDialog
      open={dialog.open}
      title={dialog.title}
      message={dialog.message}
      confirmLabel={dialog.confirmLabel}
      cancelLabel={dialog.cancelLabel}
      onConfirm={handleConfirm}
      onCancel={handleClose}
    />
  );

  return {
    showConfirm,
    confirmDialog,
  };
}
