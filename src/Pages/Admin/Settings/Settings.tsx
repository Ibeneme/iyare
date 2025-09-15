import { useEffect } from "react";
import SettingsComponent from "./SettingsComponent";

const Settings = () => {
  const userString = localStorage.getItem("user");
  const user = userString ? JSON.parse(userString) : null;

  const userType = user?.userType || localStorage.getItem("userType");

  const isValidUser =
    user &&
    user.email &&
    user._id &&
    userType
    
    // &&
    // (userType === "superadmin" || userType === "admin");

  useEffect(() => {
    console.log("🔍 Raw user string from localStorage:", userString);
    console.log("👤 Parsed user object:", user);
    console.log("🧾 Resolved userType:", userType);
    console.log("✅ isValidUser:", isValidUser);
  }, []);

  return (
    <div>
      {isValidUser ? (
        <SettingsComponent
          adminId={user._id}
          adminEmail={user.email}
          adminRole={userType}
        />
      ) : (
        <p>Unauthorized or invalid user session.</p>
      )}
    </div>
  );
};

export default Settings;