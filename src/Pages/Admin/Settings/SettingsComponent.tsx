import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { fetchAdminById } from "../../../Redux/Admin/Auth";
import {
  FiLock,
  FiInfo,
  FiKey,
  FiAlertCircle,
  FiUser,
  FiX,
  FiLogOut,
  FiArrowLeft,
  FiChevronRight,
} from "react-icons/fi";
import SettingAbout from "./SettingsComponents/SettingAbout/SettingAbout";
import SettingPrivacyPolicy from "./SettingsComponents/SettingPrivacyPolicy/SettingPrivacyPolicy";
import SettingProfile from "./SettingsComponents/SettingProfile/SettingProfile";
import SettingChangePassword from "./SettingsComponents/SettingChangePassword/SettingChangePassword";
import SettingReport from "./SettingsComponents/SettingReport/SettingReport";
import { AppDispatch } from "../../../Redux/store";
import { useNavigate } from "react-router-dom";
import ModalDropdown from "../../../Components/Modal/ModalDropdown";
import { Loader2, Shield } from "lucide-react";
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

const iconSize = "w-5 h-5";

// HIDDEN: Custom Price items removed from the main array to clean up the UI
const settingsItems: SettingItem[] = [
  {
    icon: <FiUser className={iconSize} />,
    label: "Profile",
    description: "Identity and personal data",
    type: "setting",
  },
  {
    icon: <FiLock className={iconSize} />,
    label: "Privacy & Safety",
    description: "Security protocols and privacy",
    type: "setting",
  },
  {
    icon: <FiInfo className={iconSize} />,
    label: "About",
    description: "Institutional information",
    type: "setting",
  },
  {
    icon: <FiKey className={iconSize} />,
    label: "Change Password",
    description: "Credential management",
    type: "setting",
  },
  {
    icon: <FiAlertCircle className={iconSize} />,
    label: "Send a Report",
    description: "Submit feedback or issues",
    type: "setting",
  },
  {
    icon: <FiLogOut className={iconSize} />,
    label: "Logout",
    description: "Terminate session",
    type: "setting",
  },
];

const SettingsComponent: React.FC<Props> = ({ adminId, adminRole }) => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedItem, setSelectedItem] = useState<SettingItem | null>(
    settingsItems[0]
  );
  const [showDetails, setShowDetails] = useState<boolean>(false);
  const [showLogoutModal, setShowLogoutModal] = useState<boolean>(false);

  const isAdmin = adminRole === "admin" || adminRole === "superadmin";

  useEffect(() => {
    const payload = { userType: adminRole, id: adminId };
    dispatch(fetchAdminById(payload))
      .then((res: any) => {
        if (res.payload) setUserData(res.payload);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [adminId, adminRole, dispatch]);

  // Clean filter logic: No Pricing items
  const filteredSettings = settingsItems.filter((item) => {
    const always = [
      "Profile",
      "Privacy & Safety",
      "About",
      "Change Password",
      "Logout",
    ];
    const nonAdminOnly = ["Send a Report"];

    if (always.includes(item.label)) return true;
    if (!isAdmin && nonAdminOnly.includes(item.label)) return true;
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
      case "Profile":
        return (
          <SettingProfile
            currentUserId={adminId}
            adminRole={adminRole}
            userType={adminRole || userData?.role}
          />
        );
      default:
        return null;
    }
  };

  if (loading)
    return (
      <div className="fixed inset-0 bg-[#fcfdfc] flex flex-col items-center justify-center gap-6 z-50">
        <div className="relative">
          <Loader2 className="w-16 h-16 animate-spin text-[#064e3b] opacity-20" />
          <Shield className="absolute inset-0 m-auto w-6 h-6 text-[#064e3b] animate-pulse" />
        </div>
        <div className="text-center space-y-1">
          <p className="text-[11px] font-black uppercase tracking-[0.5em] text-[#064e3b]">
            Syncing Preferences
          </p>
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
            Yare Security Protocol
          </p>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-[#fcfdfc] py-10 px-4 sm:px-8 lg:px-12 selection:bg-emerald-100 selection:text-[#064e3b]">
      <div className="max-w-7xl mx-auto">
        {/* Header Area */}
        <header className="mb-16 space-y-4">
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 rounded-lg text-[#064e3b] text-[10px] font-black uppercase tracking-widest border border-emerald-100"
          >
            <Shield size={12} className="text-yellow-600" /> Administrative
            Access
          </motion.div>
          <h1 className="text-5xl md:text-6xl font-black text-[#064e3b] tracking-tighter leading-none">
            System <br className="md:hidden" /> Settings
          </h1>
          <p className="text-slate-500 font-bold max-w-xl leading-relaxed text-sm md:text-base">
            Manage your digital identity, security credentials, and review the
            institutional framework of the Yare platform.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Navigation Sidebar */}
          <nav
            className={`lg:col-span-4 space-y-3 ${
              showDetails ? "hidden lg:block" : "block"
            }`}
          >
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-6 px-2">
              Primary Directory
            </p>
            {filteredSettings.map((item, idx) => {
              const active = selectedItem?.label === item.label;
              return (
                <motion.div
                  key={idx}
                  whileHover={{ x: 6 }}
                  onClick={() => handleItemClick(item)}
                  className={`group flex items-center gap-5 p-5 rounded-[1.8rem] transition-all cursor-pointer border-2
                    ${
                      active
                        ? "bg-[#064e3b] border-[#064e3b] shadow-2xl shadow-emerald-900/20"
                        : "bg-white border-transparent hover:border-emerald-100 shadow-sm"
                    }`}
                >
                  <div
                    className={`p-3.5 rounded-2xl transition-all duration-300 ${
                      active
                        ? "bg-yellow-400 text-[#064e3b] rotate-[10deg]"
                        : "bg-emerald-50 text-[#064e3b]"
                    }`}
                  >
                    {item.icon}
                  </div>
                  <div className="flex-1">
                    <h3
                      className={`text-[15px] font-black tracking-tight italic ${
                        active ? "text-yellow-400" : "text-[#064e3b]"
                      }`}
                    >
                      {item.label}
                    </h3>
                    <p
                      className={`text-[10px] font-bold uppercase tracking-wider ${
                        active ? "text-emerald-50/60" : "text-slate-400"
                      }`}
                    >
                      {item.description}
                    </p>
                  </div>
                  <FiChevronRight
                    className={`${
                      active
                        ? "text-yellow-400 translate-x-1"
                        : "text-slate-200 group-hover:text-emerald-400"
                    } transition-all`}
                  />
                </motion.div>
              );
            })}
          </nav>

          {/* Details Content Panel */}
          <main
            className={`lg:col-span-8 bg-white rounded-[3rem] border border-slate-100 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.05)] overflow-hidden min-h-[700px] flex flex-col ${
              !showDetails ? "hidden lg:flex" : "flex"
            }`}
          >
            {/* Panel Header */}
            <div className="p-8 md:p-10 border-b border-slate-50 flex items-center justify-between bg-[#fafafa]">
              <div className="flex items-center gap-5">
                <button
                  onClick={() => setShowDetails(false)}
                  className="lg:hidden p-3 bg-white rounded-2xl text-[#064e3b] shadow-sm border border-slate-100"
                >
                  <FiArrowLeft size={20} />
                </button>
                <div className="hidden md:flex p-4 bg-[#064e3b] rounded-[1.2rem] text-yellow-400 shadow-lg shadow-emerald-900/20">
                  {selectedItem?.icon}
                </div>
                <div>
                  <h2 className="text-2xl font-black text-[#064e3b] tracking-tighter italic leading-none">
                    {selectedItem?.label}
                  </h2>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mt-1">
                    Node Configuration & Metadata
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowDetails(false)}
                className="hidden lg:flex w-10 h-10 items-center justify-center rounded-full text-slate-300 hover:bg-red-50 hover:text-red-500 transition-all"
              >
                <FiX size={20} />
              </button>
            </div>

            {/* Panel Content Area */}
            <div className="p-8 md:p-16 flex-1 overflow-y-auto">
              <AnimatePresence mode="wait">
                <motion.div
                  key={selectedItem?.label}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                >
                  {renderDetailsContent()}
                </motion.div>
              </AnimatePresence>
            </div>
          </main>
        </div>

        {/* Logout Modal */}
        <AnimatePresence>
          {showLogoutModal && (
            <ModalDropdown onClose={() => setShowLogoutModal(false)}>
              <div className="p-12 text-center space-y-8">
                <div className="relative w-24 h-24 mx-auto bg-red-50 rounded-[2rem] flex items-center justify-center group">
                  <FiLogOut className="w-10 h-10 text-red-600 group-hover:scale-110 transition-transform" />
                </div>
                <div className="space-y-3">
                  <h3 className="text-3xl font-black text-[#064e3b] tracking-tighter">
                    Terminate Session?
                  </h3>
                  <p className="text-slate-500 font-bold text-sm max-w-[250px] mx-auto leading-relaxed">
                    You are about to securely close your administrative access.
                  </p>
                </div>
                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => {
                      localStorage.clear();
                      navigate("/auth-sign-in");
                    }}
                    className="w-full py-5 bg-red-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl shadow-red-200 hover:brightness-110 transition-all"
                  >
                    Confirm Logout
                  </button>
                  <button
                    onClick={() => setShowLogoutModal(false)}
                    className="w-full py-5 bg-slate-100 text-slate-400 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-slate-200 transition-all"
                  >
                    Maintain Access
                  </button>
                </div>
              </div>
            </ModalDropdown>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default SettingsComponent;
