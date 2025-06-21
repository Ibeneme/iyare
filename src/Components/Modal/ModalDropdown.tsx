import React from "react";
import "./ModalDropdownSubjects.css";
import { FaTimes } from "react-icons/fa";

interface ModalDropdownProps {
  children: React.ReactNode;
  onClose: () => void;
  hideCloseButton?: boolean; // Optional prop
}

const ModalDropdown: React.FC<ModalDropdownProps> = ({
  children,
  onClose,
  hideCloseButton = false,
}) => {
  return (
    <div className="modal-overlay">
      <div
        style={{
          justifyContent: "center",
          alignItems: "center",
          display: "flex",
          flexDirection: "column",
          maxWidth: 500,
          gap: 16,
        }}
      >
        {!hideCloseButton && (
          <button
            style={{
              backgroundColor: "#fff",
              width: 32,
              height: 32,
              borderRadius: 120,
              fontSize: 16,
              justifyContent: "center",
              alignItems: "center",
              display: "flex",
              padding: 0,
              color: "#666",
            }}
            onClick={onClose}
          >
            <FaTimes fontSize={14} />
          </button>
        )}
        <div className="modal-content">{children}</div>
      </div>
    </div>
  );
};

export default ModalDropdown;