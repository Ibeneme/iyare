import React, { useEffect, useState } from "react";
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
  //FiPercent,
  FiArrowLeft,
} from "react-icons/fi";
import SettingAbout from "./SettingsComponents/SettingAbout/SettingAbout";
import SettingPrivacyPolicy from "./SettingsComponents/SettingPrivacyPolicy/SettingPrivacyPolicy";
import SettingProfile from "./SettingsComponents/SettingProfile/SettingProfile";
import SettingChangePassword from "./SettingsComponents/SettingChangePassword/SettingChangePassword";
import SettingCustomPriceLocal from "./SettingsComponents/SettingCustomPriceLocal/SettingCustomPriceLocal";
import SettingCustomPriceInternational from "./SettingsComponents/SettingCustomPriceInternational/SettingCustomPriceInternational";
import SettingReport from "./SettingsComponents/SettingReport/SettingReport";
import { AppDispatch } from "../../../Redux/store";
//import Loader from "../../../Components/Loader/Loader";
import { useNavigate } from "react-router-dom";
import ModalDropdown from "../../../Components/Modal/ModalDropdown";
import DiscountsManager from "../DiscountsManager/DiscountsManager";
import { Loader2, Settings } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

interface Props {
  adminId: string;
  adminEmail: string;
  adminRole: string;
}

interface SettingItem {
  icon: React.ReactNode;
  label: string;
  description: string;
  type: "setting";
}

/* ---------- ICONS WITH FIXED SIZE ---------- */
const iconSize = "w-5 h-5";

const settingsItems: SettingItem[] = [
  {
    icon: <FiUser className={iconSize} />,
    label: "Profile",
    description: "View and edit your profile",
    type: "setting",
  },
  {
    icon: <FiLock className={iconSize} />,
    label: "Privacy & Safety",
    description: "Control your privacy and safety settings",
    type: "setting",
  },
  {
    icon: <FiInfo className={iconSize} />,
    label: "About",
    description: "Learn more about the platform",
    type: "setting",
  },
  {
    icon: <FiKey className={iconSize} />,
    label: "Change Password",
    description: "Update your account password",
    type: "setting",
  },
  {
    icon: <FiAlertCircle className={iconSize} />,
    label: "Send a Report",
    description: "Report an issue or concern",
    type: "setting",
  },
  {
    icon: <FiDollarSign className={iconSize} />,
    label: "Custom Price (Local - Nigeria)",
    description: "Set pricing for local users",
    type: "setting",
  },
  {
    icon: <FiGlobe className={iconSize} />,
    label: "Custom Price (International)",
    description: "Set pricing for global users",
    type: "setting",
  },
  // {
  //   icon: <FiPercent className={iconSize} />,
  //   label: "Discounts",
  //   description: "Manage discount offers and codes",
  //   type: "setting",
  // },
  {
    icon: <FiLogOut className={iconSize} />,
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
  const [selectedItem, setSelectedItem] = useState<SettingItem | null>(null);
  const [showDetails, setShowDetails] = useState<boolean>(false);
  const [showLogoutModal, setShowLogoutModal] = useState<boolean>(false);

  const isAdmin = adminRole === "admin" || adminRole === "superadmin";

  /* ---------- FETCH USER ---------- */
  useEffect(() => {
    const payload = { userType: adminRole, id: adminId };
    dispatch(fetchAdminById(payload))
      .then((res: any) => {
        if (res.payload) setUserData(res.payload);
        else setError("No user data found.");
        setLoading(false);
      })
      .catch((err: any) => {
        setError("Error fetching user data.");
        console.error(err);
        setLoading(false);
      });
  }, [adminId, adminRole, dispatch]);

  /* ---------- FILTER SETTINGS ---------- */
  const filteredSettings = settingsItems.filter((item) => {
    const always = [
      "Profile",
      "Privacy & Safety",
      "About",
      "Change Password",
      "Logout",
    ];
    const adminOnly = [
      "Custom Price (Local - Nigeria)",
      "Custom Price (International)",
      "Discounts",
    ];
    const nonAdminOnly = ["Send a Report"];

    if (always.includes(item.label)) return true;
    if (isAdmin && adminOnly.includes(item.label)) return true;
    if (!isAdmin && nonAdminOnly.includes(item.label)) return true;
    return false;
  });

  /* ---------- HANDLERS ---------- */
  const handleItemClick = (item: SettingItem) => {
    if (item.label === "Logout") {
      setShowLogoutModal(true);
      return;
    }
    setSelectedItem(item);
    setShowDetails(true); // show details panel
  };

  const handleBack = () => {
    setShowDetails(false);
    setSelectedItem(null);
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/auth-sign-in");
  };

  /* ---------- RENDER DETAIL CONTENT ---------- */
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
      case "Custom Price (Local - Nigeria)":
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
        return <p className="text-gray-500">No content available.</p>;
    }
  };

  if (error) return <p className="text-red-600 font-medium">{error}</p>;

  /* ---------- RENDER ---------- */
  return (
    <div className="min-h-[100%] bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      {loading ? (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-[100%] py-48 bg-white flex flex-col items-center justify-center gap-5 z-50"
          >
            <Loader2 className="w-14 h-14 animate-spin text-gray-900" />
            <p className="text-xl font-bold text-gray-900">
              Loading Profiles...
            </p>
          </motion.div>
        </AnimatePresence>
      ) : (
        <div className="max-w-7xl mx-auto">
          {/* ---------- HEADER ---------- */}

          <div className="mb-8 mt-12">
            <div className="bg-yellow-100 rounded-full p-4 mb-4 inline-flex items-center justify-center w-fit">
              <Settings className="w-8 h-8 text-yellow-700" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900">Settings</h2>
            <p className="mt-2 text-gray-600 max-w-3xl">
              Manage your account preferences, privacy options, notifications,
              and other settings.
            </p>
          </div>

          {/* ---------- MAIN GRID ---------- */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* ---------- LIST (hidden on mobile when details shown) ---------- */}
            <div
              className={`space-y-3 transition-all ${
                showDetails ? "hidden lg:block lg:col-span-1" : "lg:col-span-3"
              }`}
            >
              {filteredSettings.map((item, idx) => {
                const active = selectedItem?.label === item.label;
                return (
                  <div
                    key={idx}
                    onClick={() => handleItemClick(item)}
                    className={`group flex items-center gap-4 p-4 rounded-xl border transition-all cursor-pointer
                    ${
                      active
                        ? "bg-gray-900 text-yellow-300  shadow-lg"
                        : "bg-white text-gray-700 border-gray-200 hover:border-yellow-700 hover:bg-yellow-50"
                    }`}
                  >
                    <div
                      className={`p-3 rounded-full transition-colors ${
                        active
                          ? "bg-yellow-300 text-yellow-700"
                          : "bg-yellow-100 text-yellow-700 group-hover:bg-yellow-200"
                      }`}
                    >
                      {item.icon}
                    </div>
                    <div className="flex-1">
                      <h3
                        className={`font-semibold ${
                          active ? "text-yellow-300" : "text-gray-900"
                        }`}
                      >
                        {item.label}
                      </h3>
                      <p
                        className={`text-sm ${
                          active ? "text-yellow-200" : "text-gray-500"
                        }`}
                      >
                        {item.description}
                      </p>
                    </div>
                    <span
                      className={`text-lg font-bold transition-colors ${
                        active
                          ? "text-yellow-300"
                          : "text-gray-400 group-hover:text-yellow-700"
                      }`}
                    >
                      ›
                    </span>
                  </div>
                );
              })}
            </div>

            {/* ---------- DETAILS PANEL (full-width on mobile) ---------- */}
            {showDetails && selectedItem && (
              <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200">
                {/* Header with Back button (mobile) & Close X (desktop) */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                  <button
                    onClick={handleBack}
                    className="flex items-center gap-2 text-yellow-700 font-medium lg:hidden"
                  >
                    <FiArrowLeft className="w-5 h-5" />
                    Back
                  </button>

                  <div className="flex items-center gap-3 flex-1 lg:flex-none">
                    <div className="p-2 rounded-full bg-yellow-100 text-yellow-700">
                      {selectedItem.icon}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">
                        {selectedItem.label}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {selectedItem.description}
                      </p>
                    </div>
                  </div>

                  {/* Close X – visible only on desktop */}
                  <button
                    onClick={handleBack}
                    className="p-2 rounded-lg hover:bg-gray-100 hidden lg:block"
                  >
                    <FiX className="w-5 h-5 text-gray-500" />
                  </button>
                </div>

                {/* Content */}
                <div className="p-6">{renderDetailsContent()}</div>
              </div>
            )}
          </div>

          {/* ---------- LOGOUT MODAL ---------- */}
          {showLogoutModal && (
            <ModalDropdown onClose={() => setShowLogoutModal(false)}>
              <div className="p-6 max-w-sm mx-auto text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                  <FiLogOut className="w-8 h-8 text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Logout</h3>
                <p className="text-gray-600 mb-6">
                  Are you sure you want to log out? You will be redirected to
                  the sign-in page.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowLogoutModal(false)}
                    className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleLogout}
                    className="flex-1 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </ModalDropdown>
          )}
        </div>
      )}
    </div>
  );
};

export default SettingsComponent;
