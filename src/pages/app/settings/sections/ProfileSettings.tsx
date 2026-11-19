import { getCookie, } from "../../../../utils/cookies";
import React, { useState, useEffect } from "react";
import {
  FiEdit3,
  FiTrash2,
  FiMail,
  FiShield,
  FiX,
  FiUser,
} from "react-icons/fi";

import { useToast } from "../../../../contexts/ToastContext";
import {
  fetchUserById,
  updateUser,
} from "../../../../store/features/users/users.slice";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../../../../store/index";
import { Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  adminRole: string;
  currentUserId: string;
  userType: string;
}

const SettingProfile: React.FC<Props> = ({
  adminRole,
  currentUserId,
  userType,
}) => {
  const { addToast } = useToast();
  const dispatch = useDispatch<AppDispatch>();

  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editedFirstName, setEditedFirstName] = useState("");
  const [editedLastName, setEditedLastName] = useState("");

  const fetchUserProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await dispatch(
        fetchUserById({ id: currentUserId, userType })
      ).unwrap();
      setUserData(result);
      setEditedFirstName(result.firstName || "");
      setEditedLastName(result.lastName || "");
    } catch (err: any) {
      setError(err.message || "Failed to load profile.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserProfile();
  }, [currentUserId, userType]);

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Get the user object from cookies
      const storedUser = getCookie("user");
      if (!storedUser) throw new Error("No user found in cookies.");
      const userObject = JSON.parse(storedUser);

      const formatName = (name: string) => {
        return name
          .split(" ")
          .map((word) =>
            word
              .split("-")
              .map(
                (part) =>
                  part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
              )
              .join("-")
          )
          .join(" ");
      };

      // Dispatch the updateUser thunk
      await dispatch(
        updateUser({
          userType: userObject.userType, // userType from cookies
          id: userObject._id,            // user ID from cookies
          updateData: {
            firstName: formatName(editedFirstName),
            lastName: formatName(editedLastName),
          },
        })
      ).unwrap();

      addToast("success", "Profile updated successfully!");
      setShowEditModal(false);

      // ✅ Reload the profile data after update
      await fetchUserProfile();
    } catch (err: any) {
      addToast("error", err?.message || "Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };
  if (loading && !userData) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-[var(--color-primary)]" />
        <p className="text-[10px] font-semibold  tracking-[0.3em] text-[var(--color-primary)]">
          Syncing Profile
        </p>
      </div>
    );
  }

  if (error)
    return (
      <div className="p-10 text-[var(--color-danger)] font-semibold text-left">{error}</div>
    );
  if (!userData)
    return (
      <div className="p-10 text-[var(--color-muted)] font-semibold text-left  tracking-tight text-xs">
        No profile found.
      </div>
    );

  return (
    <div className="max-w-4xl text-left">
      {/* Header Section */}
      <div className="mb-10 space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-[var(--color-success-bg)] text-[var(--color-primary)] rounded-lg text-[10px] font-semibold  tracking-tight border border-[var(--color-card-border)]">
          <FiUser size={12} /> Personal Identity
        </div>
        <h1 className="text-4xl font-semibold text-[var(--color-primary)] tracking-tight">
          Your Profile
        </h1>
        <p className="text-[var(--color-muted)] font-semibold text-sm">
          Review and update your system identity and account credentials.
        </p>
      </div>

      {/* Profile Info Card (Flat) */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-card-border)] rounded-3xl p-8 md:p-12">
        <div className="flex flex-col md:flex-row gap-10 items-start">
          {/* Avatar Area */}
          <div className="relative group">
            <div className="w-32 h-32 bg-[#1b2030] text-white rounded-3xl flex items-center justify-center text-4xl font-semibold shadow-[var(--shadow-elevated)]">
              {(userData.firstName || "")[0]}
              {(userData.lastName || "")[0]}
            </div>
            <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-[var(--color-card)] border-4 border-[var(--color-card)] rounded-full flex items-center justify-center">
              <div className="w-2 h-2 bg-[var(--color-brand)] rounded-full" />
            </div>
          </div>

          {/* Details Area */}
          <div className="flex-1 space-y-6">
            <div>
              <span className="text-[10px] font-semibold text-[var(--color-warning)]  tracking-tight block mb-1">
                Full Legal Name
              </span>
              <h2 className="text-3xl font-semibold text-[var(--color-primary)] tracking-tight">
                {userData.firstName} {userData.lastName}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 bg-[var(--color-surface)] rounded-2xl border border-[var(--color-card-border)]">
                <p className="text-[9px] font-semibold text-[var(--color-muted)]  tracking-tight mb-1 flex items-center gap-2">
                  <FiMail /> Registered Email
                </p>
                <p className="font-semibold text-[var(--color-primary)] text-sm truncate">
                  {userData.email}
                </p>
              </div>
              <div className="p-4 bg-[var(--color-surface)] rounded-2xl border border-[var(--color-card-border)]">
                <p className="text-[9px] font-semibold text-[var(--color-muted)]  tracking-tight mb-1 flex items-center gap-2">
                  <FiShield /> Access Level
                </p>
                <p className="font-semibold text-[var(--color-primary)] text-sm  tracking-tight">
                  {userData.role || adminRole}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-4 pt-6">
              <button
                onClick={() => setShowEditModal(true)}
                className="flex items-center gap-3 px-8 py-4 bg-[var(--color-brand)] text-[var(--color-brand-fg)] font-semibold text-xs  tracking-tight rounded-xl hover:brightness-110 transition-all shadow-[var(--shadow-elevated)]"
              >
                <FiEdit3 /> Edit Profile
              </button>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="flex items-center gap-3 px-8 py-4 bg-[var(--color-danger-bg)] text-[var(--color-danger)] font-semibold text-xs  tracking-tight rounded-xl hover:bg-[var(--color-danger-bg)] transition-all"
              >
                <FiTrash2 /> Deactivate
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <AnimatePresence>
        {showEditModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowEditModal(false)}
              className="absolute inset-0 bg-[var(--color-brand)] backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              className="relative bg-[var(--color-card)] w-full max-w-lg rounded-3xl p-10 shadow-[var(--shadow-elevated)]"
            >
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h2 className="text-3xl font-semibold text-[var(--color-primary)] tracking-tight">
                    Modify Data
                  </h2>
                  <p className="text-xs font-semibold text-[var(--color-muted)]  tracking-tight mt-1">
                    Updates take effect instantly
                  </p>
                </div>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="p-2 text-[var(--color-muted)] hover:text-[var(--color-danger)] transition-all"
                >
                  <FiX size={24} />
                </button>
              </div>

              <form onSubmit={handleEditSubmit} className="space-y-6">
                <div className="grid grid-cols-1 gap-6">
                  <div>
                    <label className="text-[10px] font-semibold text-[var(--color-muted)]  tracking-tight mb-2 block">
                      First Name
                    </label>
                    <input
                      type="text"
                      value={editedFirstName}
                      onChange={(e) => setEditedFirstName(e.target.value)}
                      className="w-full px-5 py-4 bg-[var(--color-surface)] border border-[var(--color-card-border)] rounded-xl font-semibold text-[var(--color-primary)] outline-none focus:border-[var(--color-primary)] transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-[var(--color-muted)]  tracking-tight mb-2 block">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={editedLastName}
                      onChange={(e) => setEditedLastName(e.target.value)}
                      className="w-full px-5 py-4 bg-[var(--color-surface)] border border-[var(--color-card-border)] rounded-xl font-semibold text-[var(--color-primary)] outline-none focus:border-[var(--color-primary)] transition-all"
                      required
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="flex-1 py-4 bg-[var(--color-surface-alt)] text-[var(--color-muted)] font-semibold text-[10px]  tracking-tight rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-4 bg-[var(--color-brand)] text-[var(--color-brand-fg)] font-semibold text-[10px]  tracking-tight rounded-full shadow-[var(--shadow-elevated)]"
                  >
                    {loading ? "Syncing..." : "Update Identity"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDeleteModal(false)}
              className="absolute inset-0 bg-[var(--color-brand)] backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              className="relative bg-[var(--color-card)] w-full max-w-md rounded-3xl p-12 text-center"
            >
              <div className="w-20 h-20 mx-auto mb-6 bg-[var(--color-danger-bg)] rounded-3xl flex items-center justify-center">
                <FiTrash2 className="w-10 h-10 text-[var(--color-danger)]" />
              </div>
              <h2 className="text-2xl font-semibold text-[var(--color-primary)] tracking-tight mb-2">
                Permanent Deletion
              </h2>
              <p className="text-[var(--color-muted)] font-semibold text-sm mb-8 leading-relaxed">
                This action will scrub your identity from the system. Access
                cannot be recovered.
              </p>

              <div className="flex gap-4">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 py-4 bg-[var(--color-surface-alt)] text-[var(--color-muted)] font-semibold text-[10px]  tracking-tight rounded-xl"
                >
                  Keep Account
                </button>
                <button
                  onClick={() =>
                    addToast("error", "Action restricted for administrators.")
                  }
                  className="flex-1 py-4 bg-red-600 text-white font-semibold text-[10px]  tracking-tight rounded-xl shadow-[var(--shadow-elevated)]"
                >
                  Yes, Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SettingProfile;
