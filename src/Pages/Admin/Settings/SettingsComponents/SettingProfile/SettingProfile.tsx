import React, { useState, useEffect } from "react";
import {
  FiEdit3,
  FiTrash2,
  FiMail,
  FiShield,
  FiX,
  FiUser,
} from "react-icons/fi";

import { useToast } from "../../../../../Context/ToastProvider";
import {
  fetchUserById,
  updateUser,
} from "../../../../../Redux/Admin/adminUsers";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../../../../../Redux/store";
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
      // Get the user object from localStorage
      const storedUser = localStorage.getItem("user");
      if (!storedUser) throw new Error("No user found in localStorage.");
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
          userType: userObject.userType, // userType from localStorage
          id: userObject._id,            // user ID from localStorage
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
        <Loader2 className="w-10 h-10 animate-spin text-[#064e3b]" />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#064e3b]">
          Syncing Profile
        </p>
      </div>
    );
  }

  if (error)
    return (
      <div className="p-10 text-red-600 font-black text-left">{error}</div>
    );
  if (!userData)
    return (
      <div className="p-10 text-slate-400 font-black text-left uppercase tracking-widest text-xs">
        No profile found.
      </div>
    );

  return (
    <div className="max-w-4xl text-left">
      {/* Header Section */}
      <div className="mb-10 space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-[#064e3b] rounded-lg text-[10px] font-black uppercase tracking-widest border border-emerald-100">
          <FiUser size={12} /> Personal Identity
        </div>
        <h1 className="text-4xl font-black text-[#064e3b] tracking-tighter">
          Your Profile
        </h1>
        <p className="text-slate-500 font-bold text-sm">
          Review and update your system identity and account credentials.
        </p>
      </div>

      {/* Profile Info Card (Flat) */}
      <div className="bg-[#fcfdfc] border border-slate-100 rounded-[2rem] p-8 md:p-12">
        <div className="flex flex-col md:flex-row gap-10 items-start">
          {/* Avatar Area */}
          <div className="relative group">
            <div className="w-32 h-32 bg-[#064e3b] text-yellow-400 rounded-3xl flex items-center justify-center text-4xl font-black shadow-xl shadow-emerald-900/10">
              {userData.firstName[0]}
              {userData.lastName[0]}
            </div>
            <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-white border-4 border-[#fcfdfc] rounded-full flex items-center justify-center">
              <div className="w-2 h-2 bg-emerald-500 rounded-full" />
            </div>
          </div>

          {/* Details Area */}
          <div className="flex-1 space-y-6">
            <div>
              <span className="text-[10px] font-black text-yellow-600 uppercase tracking-widest block mb-1">
                Full Legal Name
              </span>
              <h2 className="text-3xl font-black text-[#064e3b] tracking-tight">
                {userData.firstName} {userData.lastName}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-2">
                  <FiMail /> Registered Email
                </p>
                <p className="font-bold text-[#064e3b] text-sm truncate">
                  {userData.email}
                </p>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-2">
                  <FiShield /> Access Level
                </p>
                <p className="font-bold text-[#064e3b] text-sm uppercase tracking-wider">
                  {userData.role || adminRole}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-4 pt-6">
              <button
                onClick={() => setShowEditModal(true)}
                className="flex items-center gap-3 px-8 py-4 bg-[#064e3b] text-yellow-400 font-black text-xs uppercase tracking-widest rounded-xl hover:brightness-110 transition-all shadow-lg shadow-emerald-900/10"
              >
                <FiEdit3 /> Edit Profile
              </button>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="flex items-center gap-3 px-8 py-4 bg-red-50 text-red-600 font-black text-xs uppercase tracking-widest rounded-xl hover:bg-red-100 transition-all"
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
              className="absolute inset-0 bg-[#064e3b]/95 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              className="relative bg-white w-full max-w-lg rounded-[2.5rem] p-10 shadow-2xl"
            >
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h2 className="text-3xl font-black text-[#064e3b] tracking-tighter">
                    Modify Data
                  </h2>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                    Updates take effect instantly
                  </p>
                </div>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="p-2 text-slate-300 hover:text-red-500 transition-all"
                >
                  <FiX size={24} />
                </button>
              </div>

              <form onSubmit={handleEditSubmit} className="space-y-6">
                <div className="grid grid-cols-1 gap-6">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">
                      First Name
                    </label>
                    <input
                      type="text"
                      value={editedFirstName}
                      onChange={(e) => setEditedFirstName(e.target.value)}
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-xl font-bold text-[#064e3b] outline-none focus:border-[#064e3b] transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={editedLastName}
                      onChange={(e) => setEditedLastName(e.target.value)}
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-xl font-bold text-[#064e3b] outline-none focus:border-[#064e3b] transition-all"
                      required
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="flex-1 py-4 bg-slate-100 text-slate-400 font-black text-[10px] uppercase tracking-widest rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-4 bg-[#064e3b] text-yellow-400 font-black text-[10px] uppercase tracking-widest rounded-xl shadow-lg shadow-emerald-900/20"
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
              className="absolute inset-0 bg-[#064e3b]/95 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              className="relative bg-white w-full max-w-md rounded-[2.5rem] p-12 text-center"
            >
              <div className="w-20 h-20 mx-auto mb-6 bg-red-50 rounded-3xl flex items-center justify-center">
                <FiTrash2 className="w-10 h-10 text-red-600" />
              </div>
              <h2 className="text-2xl font-black text-[#064e3b] tracking-tighter mb-2">
                Permanent Deletion
              </h2>
              <p className="text-slate-500 font-bold text-sm mb-8 leading-relaxed">
                This action will scrub your identity from the system. Access
                cannot be recovered.
              </p>

              <div className="flex gap-4">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 py-4 bg-slate-100 text-slate-400 font-black text-[10px] uppercase tracking-widest rounded-xl"
                >
                  Keep Account
                </button>
                <button
                  onClick={() =>
                    addToast("error", "Action restricted for administrators.")
                  }
                  className="flex-1 py-4 bg-red-600 text-white font-black text-[10px] uppercase tracking-widest rounded-xl shadow-lg shadow-red-200"
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
