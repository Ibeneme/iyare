import { getCookie, } from "../../../utils/cookies";
import { useEffect } from "react";
import SettingsComponent from "./SettingsLayout";

const Settings = () => {
  const userString = getCookie("user");
  const user = userString ? JSON.parse(userString) : null;

  const userType = user?.userType || getCookie("userType");

  const isValidUser =
    user &&
    user.email &&
    user._id &&
    userType
    
    // &&
    // (userType === "superadmin" || userType === "admin");

  useEffect(() => {
    console.log("🔍 Raw user string ", userString);
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