import React from "react";
import "./ModalDropdownSubjects.css";

interface ModalDropdownProps {
  children: React.ReactNode;
  onClose: () => void;
}

const ModalDropdown: React.FC<ModalDropdownProps> = ({ children, onClose }) => {
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="close-btn" onClick={onClose}>
          ×
        </button>
        {children}
      </div>
    </div>
  );
};

export default ModalDropdown;
