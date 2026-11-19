import { logout } from "../../../utils/auth";
import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { fetchAdminById } from "../../../store/features/auth/auth.slice";
import {
  FiLock,
  FiInfo,
  FiKey,
  FiAlertCircle,
  FiUser,
  FiLogOut,
  FiArrowLeft,
  FiChevronRight,
} from "react-icons/fi";
import SettingAbout from "./sections/AboutSettings";
import SettingPrivacyPolicy from "./sections/PrivacySettings";
import SettingProfile from "./sections/ProfileSettings";
import SettingReport from "./sections/ReportSettings";
import { AppDispatch } from "../../../store/index";
import { useNavigate } from "react-router-dom";
import ModalDropdown from "../../../components/common/Modal";
import { Loader2, } from "lucide-react";
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
  to?: string;
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
    to: "/app/account",
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
    settingsItems[0],
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
    if (item.to) {
      navigate(item.to);
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
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--color-muted)]" />
        <p className="text-sm text-[var(--color-muted)]">
          Loading your settings…
        </p>
      </div>
    );

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="page-title">Settings</h1>
            <span className="badge-green capitalize">{adminRole}</span>
          </div>
          <p className="page-subtitle max-w-xl">
            Manage your profile, password and privacy preferences.
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Menu */}
        <nav
          aria-label="Settings sections"
          className={`lg:col-span-4 card p-2 ${showDetails ? "hidden lg:block" : "block"}`}
        >
          {filteredSettings.map((item) => {
            const active = selectedItem?.label === item.label && !item.to;
            const isLogout = item.label === "Logout";
            return (
              <button
                key={item.label}
                type="button"
                onClick={() => handleItemClick(item)}
                className={`w-full flex items-center gap-4 px-3 py-3 rounded-2xl text-left transition-colors ${
                  active && !isLogout
                    ? "bg-[var(--color-surface)]"
                    : "hover:bg-[var(--color-surface)]"
                }`}
              >
                <span
                  className={`w-10 h-10 rounded-xl grid place-items-center shrink-0 ${
                    isLogout
                      ? "bg-[var(--color-danger-bg)] text-[var(--color-danger)]"
                      : "bg-[var(--color-surface-alt)] text-[var(--color-primary)]"
                  }`}
                >
                  {item.icon}
                </span>
                <span className="flex-1 min-w-0">
                  <span
                    className={`block text-sm font-semibold ${
                      isLogout
                        ? "text-[var(--color-danger)]"
                        : "text-[var(--color-primary)]"
                    }`}
                  >
                    {item.label}
                  </span>
                  <span className="block text-xs text-[var(--color-muted)] truncate">
                    {item.description}
                  </span>
                </span>
                <FiChevronRight className="text-[var(--color-subtle)] shrink-0" />
              </button>
            );
          })}
        </nav>

        {/* Details */}
        <main
          className={`lg:col-span-8 card overflow-hidden min-h-[480px] flex-col ${
            !showDetails ? "hidden lg:flex" : "flex"
          }`}
        >
          <div className="px-5 sm:px-8 py-5 flex items-center justify-between gap-3 border-b border-[var(--color-card-border)]">
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => setShowDetails(false)}
                aria-label="Back to settings menu"
                className="btn-icon lg:hidden"
              >
                <FiArrowLeft size={18} />
              </button>
              <span className="hidden sm:grid w-10 h-10 rounded-xl bg-[var(--color-surface-alt)] text-[var(--color-primary)] place-items-center">
                {selectedItem?.icon}
              </span>
              <div className="min-w-0">
                <h2 className="text-xl font-semibold tracking-tight text-[var(--color-primary)] truncate">
                  {selectedItem?.label}
                </h2>
                <p className="text-xs text-[var(--color-muted)]">
                  {selectedItem?.description}
                </p>
              </div>
            </div>
          </div>

          <div className="p-5 sm:p-8 flex-1 overflow-y-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedItem?.label}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                {renderDetailsContent()}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>

      {/* Logout confirmation */}
      <AnimatePresence>
        {showLogoutModal && (
          <ModalDropdown onClose={() => setShowLogoutModal(false)}>
            <div className="p-8 sm:p-10 text-center space-y-6 max-w-sm mx-auto">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-[var(--color-danger-bg)] grid place-items-center">
                <FiLogOut className="w-7 h-7 text-[var(--color-danger)]" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-semibold tracking-tight text-[var(--color-primary)]">
                  Sign out?
                </h3>
                <p className="text-sm text-[var(--color-muted)]">
                  You'll be taken back to the sign-in page.
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <button onClick={() => logout()} className="btn-primary w-full">
                  Sign out
                </button>
                <button
                  onClick={() => setShowLogoutModal(false)}
                  className="btn-secondary w-full"
                >
                  Stay signed in
                </button>
              </div>
            </div>
          </ModalDropdown>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SettingsComponent;
