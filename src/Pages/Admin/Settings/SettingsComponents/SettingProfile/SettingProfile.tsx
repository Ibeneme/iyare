import React, { useState, useEffect } from "react";
import { FiUser, FiEdit3, FiTrash2 } from "react-icons/fi";
import "./SettingProfile.css";
import ModalDropdown from "../../../../../Components/Modal/ModalDropdown";
import { useUserActions } from "../../../../../Hooks/useUsers";
import { useToast } from "../../../../../Context/ToastProvider";
import { fetchUserById } from "../../../../../Redux/Admin/adminUsers";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../../../../../Redux/store";
import Loader from "../../../../../Components/Loader/Loader";

interface Props {
  // We're removing userData from props as the component will fetch it.
  adminRole: string;
  currentUserId: any;
  userType: any;
}

const SettingProfile: React.FC<Props> = ({
  adminRole,
  currentUserId,
  userType,
}) => {
  const { editUser } = useUserActions();
  const { addToast } = useToast();

  // State for user data, loading, and errors
  const [userData, setUserData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editedFirstName, setEditedFirstName] = useState("");
  const [editedLastName, setEditedLastName] = useState("");
  const dispatch = useDispatch<AppDispatch>();

  // Function to fetch the user data
  const fetchUserProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const resultAction = await dispatch(
        fetchUserById({ id: currentUserId, userType: userType })
      );

      if (fetchUserById.fulfilled.match(resultAction)) {
        const fetchedUser = resultAction.payload;

        console.log(fetchedUser, "fetchedUser");
        setUserData(fetchedUser);
        setEditedFirstName(fetchedUser.firstName || "");
        setEditedLastName(fetchedUser.lastName || "");
      } else {
        setError("Failed to load user profile.");
        console.error("❌ Fetch failed:", resultAction);
      }
    } catch (err) {
      console.error("❌ Fetch error:", err);
      setError("An error occurred while fetching user data.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch user data when the component mounts
  useEffect(() => {
    fetchUserProfile();
  }, []);

  const handleEditProfile = () => {
    setShowEditModal(true);
  };

  const handleDeleteAccount = () => {
    setShowDeleteModal(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = {
        firstName: editedFirstName,
        lastName: editedLastName,
      };

      if (!userData?._id) {
        addToast("error", "User ID not found.");
        return;
      }

      const response = await editUser(adminRole, userData._id, formData);

      if (response.success) {
        const fullName = `${editedFirstName} ${editedLastName}`;
        addToast("success", `${fullName} updated successfully`);
        setShowEditModal(false);
        // Re-fetch the user profile to refresh the UI with the latest data
        fetchUserProfile();
      } else {
        addToast("error", response.error || "Update failed");
      }
    } catch (err) {
      addToast("error", "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConfirm = () => {
    console.log("Account deletion confirmed for user:", userData?.email);
    // Add your account deletion logic here
    setShowDeleteModal(false);
  };

  // --- Render UI based on state ---
  if (loading) {
    return <div className="settings-profile-container"><Loader /></div>;
  }

  if (error) {
    return (
      <div className="settings-profile-container error-message">{error}</div>
    );
  }

  if (!userData) {
    return (
      <div className="settings-profile-container">No user data available.</div>
    );
  }

  return (
    <div className="settings-profile-container">
      <h2>Your Profile</h2>
      <div className="settings-profile-card">
        <FiUser size={50} />
        <div className="settings-profile-details">
          <h3>
            {userData.firstName} {userData.lastName}
          </h3>
          <p>
            <strong>Email:</strong> {userData.email}
          </p>
          <p>
            <strong>Role:</strong> {userData.role || adminRole}
          </p>
        </div>
      </div>
      {/* ... (rest of the component remains the same) ... */}
      <div className="settings-profile-actions">
        <button className="settings-profile-btn" onClick={handleEditProfile}>
          <FiEdit3 /> Edit Profile
        </button>
        <button
          className="settings-profile-btn delete"
          onClick={handleDeleteAccount}
        >
          <FiTrash2 /> Delete Account
        </button>
      </div>

      {showEditModal && (
        <ModalDropdown onClose={() => setShowEditModal(false)}>
          <div>
            <div>
              <h2 style={{ fontSize: "20px", margin: 0 }}>Edit Profile</h2>
              <p style={{ fontSize: "14px", marginTop: "4px" }}>
                Update your personal details, such as name, email, or profile
                picture.
              </p>
            </div>{" "}
            <br />
            <form onSubmit={handleEditSubmit}>
              <div className="form-group">
                <label htmlFor="firstName">First Name</label>
                <input
                  id="firstName"
                  type="text"
                  value={editedFirstName}
                  onChange={(e) => setEditedFirstName(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label htmlFor="lastName">Last Name</label>
                <input
                  id="lastName"
                  type="text"
                  value={editedLastName}
                  onChange={(e) => setEditedLastName(e.target.value)}
                />
              </div>
              <br />
              <div className="modal-actions">
                <button
                  style={{
                    padding: 12,
                    fontSize: 14,
                  }}
                  type="button"
                  className="cancel-btn"
                  onClick={() => setShowEditModal(false)}
                >
                  Cancel
                </button>
                <button
                  style={{
                    marginLeft: 12,
                    padding: 12,
                    fontSize: 14,
                  }}
                  type="submit"
                  className="save-btn"
                  disabled={loading}
                >
                  {loading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </ModalDropdown>
      )}

      {showDeleteModal && (
        <ModalDropdown onClose={() => setShowDeleteModal(false)}>
          <div>
            <div>
              <h2 style={{ margin: 0, fontSize: 20 }}>Delete Account</h2>
            </div>
            <p style={{ fontSize: "14px" }}>
              Are you sure you want to permanently delete your account? This
              action cannot be undone.
            </p>
            <br />
            <div className="modal-actions" style={{ gap: 12 }}>
              <button
                type="button"
                className="cancel-btn"
                style={{
                  padding: 12,
                  fontSize: 14,
                }}
                onClick={() => setShowDeleteModal(false)}
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
                }}
                onClick={handleDeleteConfirm}
              >
                Delete
              </button>
            </div>
          </div>
        </ModalDropdown>
      )}
    </div>
  );
};

export default SettingProfile;
