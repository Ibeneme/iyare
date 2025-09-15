import React from "react";
import "./SettingChangePassword.css";

const SettingChangePassword: React.FC = () => {
  const handleSendRequest = () => {
    console.log("Password change request sent!");
    alert("A request to change your password has been sent.");
  };

  return (
    <div className="change-password-container">
      <p style={{ textAlign: "left" }}>
        For security reasons, we require a request to change your password.
        Click the button below to send a password change request to our support
        team.
      </p>
      <button className="request-btn" onClick={handleSendRequest}>
        Send Request
      </button>
    </div>
  );
};

export default SettingChangePassword;
