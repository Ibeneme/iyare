import React from "react";
import suspendImage from "../../../../../../assets/images/admin/suspend.png";
import removeImage from "../../../../../../assets/images/admin/removeImage.png";
import {
  Grade,
  ConfirmModalType,
  UserDetails,
} from "../../UserDetailsTypes/userDetailsTypes";
import ModalDropdown from "../../../../../../Components/Modal/ModalDropdown";
import "./EditGeneralUserModal.css";

interface ConfirmationModalProps {
  confirmModal: ConfirmModalType;
  userType: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  confirmModal,
  userType,
  onConfirm,
  onCancel,
}) => {
  const actionLabel =
    confirmModal.type === "suspend"
      ? "suspend"
      : confirmModal.type === "unsuspend"
      ? "unsuspend"
      : "delete";

  const imageSrc = confirmModal.type === "remove" ? removeImage : suspendImage;

  return (
    <ModalDropdown onClose={onCancel}>
      <div className="user-modal-confirm">
        <h2 className="user_moda_h2">
          {confirmModal.type === "suspend"
            ? "Confirm Suspension"
            : confirmModal.type === "unsuspend"
            ? "Confirm Unsuspension"
            : "Confirm Deletion"}
        </h2>
        <p className="user_moda_p">
          Are you sure you want to <strong>{actionLabel}</strong> this{" "}
          {userType}?
        </p>
        <img
          src={imageSrc}
          alt="Confirm Action"
          className="user-modal__image"
        />
        <div className="user-modal__actions">
          <button
            style={{
              backgroundColor: "red",
              color: "#fff",
            }}
            className="user-modal__actions-danger"
            onClick={onConfirm}
          >
            Yes, {actionLabel}
          </button>

          <button onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </ModalDropdown>
  );
};

interface EditGradeModalProps {
  userType: string;
  data: { title: string; description: string };
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  onClose: () => void;
  onSave: () => void;
}

export const EditGradeModal: React.FC<EditGradeModalProps> = ({
  userType,
  data,
  onChange,
  onClose,
  onSave,
}) => {
  return (
    <ModalDropdown onClose={onClose}>
      <div className="user-modal edit-grade">
        <h2 className="user_moda_h2">
          Edit {userType.charAt(0).toUpperCase() + userType.slice(1)}
        </h2>
        
        <label>
          Title:
          <input
            type="text"
            name="title"
            value={data.title}
            onChange={onChange}
          />
        </label>
        <label>
          Description:
          <textarea
            name="description"
            value={data.description}
            onChange={onChange}
            rows={4}
          />
        </label>
        <div className="user-modal__actions">
          <button onClick={onClose}>Cancel</button>
          <button onClick={onSave} className="primary">
            Save Changes
          </button>
        </div>
      </div>
    </ModalDropdown>
  );
};

interface EditStudentGradeModalProps {
  user: UserDetails | any;
  allGrades: Grade[];
  selectedGrade: Grade | null;
  onSelect: (grade: Grade | null) => void;
  onClose: () => void;
  onSave: () => void;
}

export const EditStudentGradeModal: React.FC<EditStudentGradeModalProps> = ({
  user,
  allGrades,
  selectedGrade,
  onSelect,
  onClose,
  onSave,
}) => {
  return (
    <ModalDropdown onClose={onClose}>
      <div className="user-modal edit-student-grade">
        <h2 className="user_moda_h2">
          Edit Grade for {user.firstName} {user.lastName}
        </h2>
        <label>
          Select a Grade - Current Grade is {user.gradeTitle}
          <select
            value={selectedGrade?._id || ""}
            onChange={(e) => {
              const selectedId = e.target.value;
              const grade = allGrades.find((g) => g._id === selectedId) || null;
              onSelect(grade);
            }}
          >
            <option value="">-- Select Grade --</option>
            {allGrades.map((grade) => (
              <option key={grade._id} value={grade._id}>
                {grade.title}
              </option>
            ))}
          </select>
        </label>
        <div className="user-modal__actions">
          <button onClick={onClose}>Cancel</button>
          <button
            className="success"
            onClick={onSave}
            disabled={!selectedGrade}
          >
            Save Changes
          </button>
        </div>
      </div>
    </ModalDropdown>
  );
};
