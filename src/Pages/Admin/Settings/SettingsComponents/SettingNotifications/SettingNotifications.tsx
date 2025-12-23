import React, { useState } from "react";
import "./SettingNotifications.css";

const SettingNotifications: React.FC = () => {
  const [isEmailActive, setIsEmailActive] = useState(true);
  const [isNewsletterActive, setIsNewsletterActive] = useState(false);
  const [isConsoleLogActive, setIsConsoleLogActive] = useState(true);
  console.log(setIsConsoleLogActive)
  const handleToggle = (
    setter: React.Dispatch<React.SetStateAction<boolean>>,
    type: string
  ) => {
    setter((prevState) => {
      const newState = !prevState;
      console.log(`${type} notifications toggled to: ${newState}`);
      return newState;
    });
  };

  return (
    <div className="notifications-container">
      <h2>Notifications</h2>
      <p className="notification-status">
        Notifications are currently{" "}
        {isEmailActive || isNewsletterActive || isConsoleLogActive
          ? "active"
          : "inactive"}
        .
      </p>

      <div className="toggle-item">
        <span>Email Notifications</span>
        <button
          className={`toggle-btn ${isEmailActive ? "active" : ""}`}
          onClick={() => handleToggle(setIsEmailActive, "Email")}
        >
          <span className="toggle-indicator"></span>
        </button>
      </div>

      <br />
      <div className="toggle-item">
        <span>Newsletter</span>
        <button
          className={`toggle-btn ${isNewsletterActive ? "active" : ""}`}
          onClick={() => handleToggle(setIsNewsletterActive, "Newsletter")}
        >
          <span className="toggle-indicator"></span>
        </button>
      </div>
    </div>
  );
};

export default SettingNotifications;
