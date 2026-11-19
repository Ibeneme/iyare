import React, { useEffect } from "react";
import "./Modal.css";
import { X } from "lucide-react";

interface ModalDropdownProps {
  children: React.ReactNode;
  onClose: () => void;
  hideCloseButton?: boolean; // Optional prop
}

/** Floating white dialog on a soft overlay; slides up as a sheet on phones. */
const ModalDropdown: React.FC<ModalDropdownProps> = ({
  children,
  onClose,
  hideCloseButton = false,
}) => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal-stack">
        {!hideCloseButton && (
          <button className="modal-close" onClick={onClose} aria-label="Close dialog">
            <X size={16} />
          </button>
        )}
        <div className="modal-content">{children}</div>
      </div>
    </div>
  );
};

export default ModalDropdown;
