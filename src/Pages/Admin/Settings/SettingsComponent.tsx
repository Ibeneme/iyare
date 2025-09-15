import React, { JSX, useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { fetchAdminById } from "../../../Redux/Admin/Auth";
import {
  FiLock,
  FiInfo,
  FiKey,
  FiAlertCircle,
  FiDollarSign,
  FiGlobe,
  FiUser,
  FiX,
  FiLogOut,
} from "react-icons/fi";
import "./SettingsComponent.css";
import SettingAbout from "./SettingsComponents/SettingAbout/SettingAbout";
import SettingPrivacyPolicy from "./SettingsComponents/SettingPrivacyPolicy/SettingPrivacyPolicy";
import SettingProfile from "./SettingsComponents/SettingProfile/SettingProfile";
import SettingChangePassword from "./SettingsComponents/SettingChangePassword/SettingChangePassword";
import SettingCustomPriceLocal from "./SettingsComponents/SettingCustomPriceLocal/SettingCustomPriceLocal";
import SettingCustomPriceInternational from "./SettingsComponents/SettingCustomPriceInternational/SettingCustomPriceInternational";
import SettingReport from "./SettingsComponents/SettingReport/SettingReport";
import { AppDispatch } from "../../../Redux/store";
import Loader from "../../../Components/Loader/Loader";
import { useNavigate } from "react-router-dom";
import ModalDropdown from "../../../Components/Modal/ModalDropdown";
import { FiPercent } from "react-icons/fi";
import DiscountsManager from "../DiscountsManager/DiscountsManager";

interface Props {
  adminId: string;
  adminEmail: string;
  adminRole: string;
}

interface SettingItem {
  icon: JSX.Element;
  label: string;
  description: string;
  type: "setting";
}

const settingsItems: SettingItem[] = [
  {
    icon: <FiUser />,
    label: "Profile",
    description: "View and edit your profile",
    type: "setting",
  },
  {
    icon: <FiLock />,
    label: "Privacy & Safety",
    description: "Control your privacy and safety settings",
    type: "setting",
  },
  {
    icon: <FiInfo />,
    label: "About",
    description: "Learn more about the platform",
    type: "setting",
  },
  {
    icon: <FiKey />,
    label: "Change Password",
    description: "Update your account password",
    type: "setting",
  },
  {
    icon: <FiAlertCircle />,
    label: "Send a Report",
    description: "Report an issue or concern",
    type: "setting",
  },
  {
    icon: <FiDollarSign />,
    label: "Custom Price (Local - Nigeria) 🇳🇬",
    description: "Set pricing for local users",
    type: "setting",
  },
  {
    icon: <FiGlobe />,
    label: "Custom Price (International)",
    description: "Set pricing for global users",
    type: "setting",
  },
  {
    icon: <FiPercent />,
    label: "Discounts",
    description: "Manage discount offers and codes",
    type: "setting",
  },
  {
    icon: <FiLogOut />,
    label: "Logout",
    description: "Log out from your account",
    type: "setting",
  },
];

const SettingsComponent: React.FC<Props> = ({ adminId, adminRole }) => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [showDetails, setShowDetails] = useState<boolean>(false);
  const [showLogoutModal, setShowLogoutModal] = useState<boolean>(false);

  const isAdmin = adminRole === "admin" || adminRole === "superadmin";

  useEffect(() => {
    const payload = { userType: adminRole, id: adminId };

    dispatch(fetchAdminById(payload))
      .then((res: any) => {
        if (res.payload) {
          setUserData(res.payload);
        } else {
          setError("No user data found.");
        }
        setLoading(false);
      })
      .catch((err: any) => {
        setError("Error fetching user data.");
        console.error("Error:", err);
        setLoading(false);
      });
  }, [adminId, adminRole, dispatch]);

  const filteredSettings = settingsItems.filter((item) => {
    const alwaysVisible = [
      "Profile",
      "Privacy & Safety",
      "About",
      "Change Password",
      "Logout",
    ];

    const adminOnly = [
      "Custom Price (Local - Nigeria) 🇳🇬",
      "Custom Price (International)",
      "Discounts",
    ];

    if (alwaysVisible.includes(item.label)) return true;
    if (isAdmin && adminOnly.includes(item.label)) return true;
    if (!isAdmin && item.label === "Send a Report") return true;

    return false;
  });

  const handleItemClick = (item: SettingItem) => {
    if (item.label === "Logout") {
      setShowLogoutModal(true);
      return;
    }
    setSelectedItem(item);
    setShowDetails(true);
  };

  const handleCloseDetails = () => {
    setShowDetails(false);
    setSelectedItem(null);
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/auth-sign-in");
  };

  const renderDetailsContent = () => {
    if (!selectedItem) return null;

    switch (selectedItem.label) {
      case "Privacy & Safety":
        return <SettingPrivacyPolicy />;
      case "About":
        return <SettingAbout />;
      case "Change Password":
        return <SettingChangePassword />;
      case "Send a Report":
        return <SettingReport />;
      case "Custom Price (Local - Nigeria) 🇳🇬":
        return <SettingCustomPriceLocal />;
      case "Custom Price (International)":
        return <SettingCustomPriceInternational />;
      case "Discounts":
        return <DiscountsManager />;
      case "Profile":
        return (
          <SettingProfile
            currentUserId={adminId}
            adminRole={adminRole}
            userType={adminRole || userData?.role}
          />
        );
      default:
        return <p>Details for {selectedItem.label} will be displayed here.</p>;
    }
  };

  if (loading) return <Loader />;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  return (
    <div>
      <h2 style={{ fontSize: "20px", marginTop: "20px", fontWeight: 900 }}>
        Settings
      </h2>
      <p style={{ fontSize: "14px", marginTop: "6px" }}>
        Manage your account preferences, privacy options, notifications, and
        other settings. Customize your experience to suit your needs.
      </p>
      <br /> <br />
      <div className="settings-container">
        <div className={`settings-list ${showDetails ? "shrunk" : ""}`}>
          {filteredSettings.map((item, index) => {
            const isActive = selectedItem && selectedItem.label === item.label;

            return (
              <div
                key={index}
                className={`settings-item ${isActive ? "active-item" : ""}`}
                onClick={() => handleItemClick(item)}
              >
                <span className="icon-bg">{item.icon}</span>
                <div className="setting-text">
                  <div className="setting-title">{item.label}</div>
                  <div className="setting-desc">{item.description}</div>
                </div>
                <span className="arrow-span">&gt;</span>
              </div>
            );
          })}
        </div>

        {showDetails && selectedItem && (
          <div className="details-panel">
            <span className="details-icon-wrapper">{selectedItem.icon}</span>
            <div className="details-header">
              <div className="details-text-wrapper">
                <h3>{selectedItem.label}</h3>
                <p>{selectedItem.description}</p>
              </div>
              <button className="close-btn" onClick={handleCloseDetails}>
                <FiX size={20} />
              </button>
            </div>
            <div className="details-content">{renderDetailsContent()}</div>
          </div>
        )}
      </div>
      {showLogoutModal && (
        <ModalDropdown onClose={() => setShowLogoutModal(false)}>
          <div>
            <h2 style={{ margin: 0, fontSize: 20 }}>Logout</h2>
            <p style={{ fontSize: "14px" }}>
              Are you sure you want to log out of your account? You will be
              redirected to the sign-in page.
            </p>
            <br />
            <div className="modal-actions" style={{ gap: 12 }}>
              <button
                type="button"
                className="cancel-btn"
                style={{ padding: 12, fontSize: 14 }}
                onClick={() => setShowLogoutModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="confirm-btn"
                style={{
                  marginLeft: 12,
                  padding: 12,
                  fontSize: 14,
                  backgroundColor: "#ff0000",
                  color: "#fff",
                }}
                onClick={handleLogout}
              >
                Logout
              </button>
            </div>
          </div>
        </ModalDropdown>
      )}
    </div>
  );
};

export default SettingsComponent;
