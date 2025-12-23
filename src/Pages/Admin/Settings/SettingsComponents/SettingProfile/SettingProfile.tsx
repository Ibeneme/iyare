import React, { useState, useEffect } from "react";
import {
  // FiUser,
  FiEdit3,
  FiTrash2,
  FiMail,
  FiShield,
  FiX,
} from "react-icons/fi";
import { useUserActions } from "../../../../../Hooks/useUsers";
import { useToast } from "../../../../../Context/ToastProvider";
import { fetchUserById } from "../../../../../Redux/Admin/adminUsers";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../../../../../Redux/store";
import Loader from "../../../../../Components/Loader/Loader";

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
  const { editUser } = useUserActions();
  const { addToast } = useToast();
  const dispatch = useDispatch<AppDispatch>();

  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editedFirstName, setEditedFirstName] = useState("");
  const [editedLastName, setEditedLastName] = useState("");

  /* ========================================
     FETCH USER PROFILE
  ======================================== */
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

  /* ========================================
     EDIT SUBMIT
  ======================================== */
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await editUser(adminRole, currentUserId, {
        name: `${editedFirstName} ${editedLastName}`,
      });

      if (response.success) {
        addToast("success", "Profile updated successfully!");
        setShowEditModal(false);
        fetchUserProfile();
      } else {
        addToast("error", response.error || "Update failed");
      }
    } catch {
      addToast("error", "An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConfirm = () => {
    addToast("error", "Account deletion is not yet implemented.");
    setShowDeleteModal(false);
  };

  /* ========================================
     RENDER STATES
  ======================================== */
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center text-gray-800 bg-gray-100 rounded-xl">
        {error}
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="p-6 text-center text-gray-600">
        No profile data found.
      </div>
    );
  }

  return (
    <>
      <div className="max-w-4xl mx-auto p-6 space-y-8 bg-white">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-black">Your Profile</h1>
          <span className="px-4 py-1 text-sm font-medium text-gray-800 bg-gray-200 rounded-full">
            {adminRole || "Member"}
          </span>
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            {/* Avatar */}
            <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center text-3xl font-bold text-gray-800">
              {userData.firstName[0]}
              {userData.lastName[0]}
            </div>

            <div className="flex-1 text-center sm:text-left">
              <h2 className="text-2xl font-bold text-black">
                {userData.firstName} {userData.lastName}
              </h2>
              <div className="mt-3 space-y-2 text-gray-700">
                <p className="flex items-center justify-center sm:justify-start gap-2">
                  <FiMail className="w-5 h-5" />
                  {userData.email}
                </p>
                <p className="flex items-center justify-center sm:justify-start gap-2">
                  <FiShield className="w-5 h-5" />
                  {userData.role || adminRole}
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 mt-8">
            <button
              onClick={() => setShowEditModal(true)}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-lg transition"
            >
              <FiEdit3 />
              Edit Profile
            </button>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-lg transition"
            >
              <FiTrash2 />
              Delete Account
            </button>
          </div>
        </div>
      </div>

      {/* ========================================
         EDIT MODAL — WITH BLUR
      ======================================== */}
      {showEditModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto"
          onClick={(e) =>
            e.target === e.currentTarget && setShowEditModal(false)
          }
        >
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6 relative max-h-screen overflow-y-auto">
            <button
              onClick={() => setShowEditModal(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 z-10"
            >
              <FiX className="w-6 h-6" />
            </button>

            <h2 className="text-2xl font-bold text-black mb-2 pr-10">
              Edit Profile
            </h2>
            <p className="text-sm text-gray-600 mb-6">
              Update your personal information below.
            </p>

            <form onSubmit={handleEditSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-2">
                  First Name
                </label>
                <input
                  type="text"
                  value={editedFirstName}
                  onChange={(e) => setEditedFirstName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 transition bg-white text-black"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-800 mb-2">
                  Last Name
                </label>
                <input
                  type="text"
                  value={editedLastName}
                  onChange={(e) => setEditedLastName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 transition bg-white text-black"
                  required
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-5 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-5 py-3 bg-gray-300 hover:bg-gray-400 disabled:opacity-50 text-gray-800 font-medium rounded-lg transition"
                >
                  {loading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================
         DELETE MODAL — WITH BLUR
      ======================================== */}
      {showDeleteModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto"
          onClick={(e) =>
            e.target === e.currentTarget && setShowDeleteModal(false)
          }
        >
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6 text-center relative max-h-screen overflow-y-auto">
            <button
              onClick={() => setShowDeleteModal(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 z-10"
            >
              <FiX className="w-6 h-6" />
            </button>

            <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center">
              <FiTrash2 className="w-8 h-8 text-gray-800" />
            </div>

            <h2 className="text-2xl font-bold text-black mb-3">
              Delete Account?
            </h2>
            <p className="text-gray-600 mb-6">
              This action <strong>cannot be undone</strong>. All your data will
              be permanently removed.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-5 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="flex-1 px-5 py-3 bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium rounded-lg transition"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SettingProfile;
