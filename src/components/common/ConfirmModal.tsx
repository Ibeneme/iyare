import React, { useEffect, useRef } from "react";
import Portal from "./Portal";
import "./Modal.css";
import "./ConfirmModal.css";

export interface ConfirmModalOptions {
  title?: string;
  message: React.ReactNode;
  confirmLabel?: string;
  /** Omit to render as a single-button notice (replaces window.alert()). */
  cancelLabel?: string;
  danger?: boolean;
}

interface ConfirmModalProps extends ConfirmModalOptions {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * The one confirmation/notice dialog for the whole app. Nothing in the codebase should call
 * window.confirm() or window.alert() directly — those block the main thread, can't be styled,
 * and read as a browser dialog instead of part of the product. Use the useConfirm() hook,
 * which renders this through a portal instead.
 */
const ConfirmModal: React.FC<ConfirmModalProps> = ({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel,
  danger = false,
  onConfirm,
  onCancel,
}) => {
  const confirmRef = useRef<HTMLButtonElement>(null);
  const isNotice = !cancelLabel;

  useEffect(() => {
    if (!open) return;
    confirmRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
      if (e.key === "Enter") onConfirm();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onConfirm, onCancel]);

  if (!open) return null;

  return (
    <Portal>
      <div className="modal-overlay confirm-modal-overlay" role="alertdialog" aria-modal="true">
        <div className="confirm-modal-card">
          {title && <h3 className="confirm-modal-title">{title}</h3>}
          <div className="confirm-modal-message">{message}</div>
          <div className="confirm-modal-actions">
            {!isNotice && (
              <button type="button" className="btn btn-secondary" onClick={onCancel}>
                {cancelLabel}
              </button>
            )}
            <button
              ref={confirmRef}
              type="button"
              className={danger ? "btn btn-danger" : "btn btn-primary"}
              onClick={onConfirm}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </Portal>
  );
};

export default ConfirmModal;
