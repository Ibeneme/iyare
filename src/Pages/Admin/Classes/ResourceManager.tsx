import React, { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../../../Redux/store";
import {
  UpdateResourcePayload,
  addResource,
  deleteResource,
  getResources,
  updateResource,
} from "../../../Redux/Resource/Resource";
import "./ResourceManager.css";
import { useToast } from "../../../Context/ToastProvider";
import useUserRole from "../../../Hooks/useUserRole";
import Loader from "../../../Components/Loader/Loader";

// Defining the types for resources to ensure type safety
type ResourceType = "assignment" | "note" | "announcement";

interface Resource {
  _id: string;
  type: ResourceType;
  title: string;
  description: string;
  classId: string;
  data?: any[];
  // Add other resource properties if they exist (e.g., fileUrl, createdAt)
}

interface ResourcesPageProps {
  classId: string; // classId is a required prop
}

const ResourcesPage: React.FC<ResourcesPageProps> = ({ classId }) => {
  const [activeType, setActiveType] = useState<ResourceType>("assignment");
  const [resources, setResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // State for modal visibility
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // State for current resource being interacted with (delete/edit)
  const [selectedResourceId, setSelectedResourceId] = useState<string | null>(
    null
  );
  const [currentEditResource, setCurrentEditResource] =
    useState<Resource | null>(null);

  // State for form inputs
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");

  const dispatch = useDispatch<AppDispatch>();
  const { addToast } = useToast();

  // A single function to close all modals and reset form state
  const handleCloseAllModals = () => {
    setShowAddModal(false);
    setShowDeleteModal(false);
    setShowEditModal(false);
    setSelectedResourceId(null);
    setCurrentEditResource(null);
    setNewTitle("");
    setNewDescription("");
  };

  // --- Resource Fetching Logic ---
  const handleFetchResources = async (type: ResourceType) => {
    setLoading(true);
    setError(null);
    try {
      const resultAction = await dispatch(getResources({ type, classId }));
      if (getResources.fulfilled.match(resultAction)) {
        // Reverse the array to put the last item first
        const reversedResources = [...resultAction.payload.data]
        setResources(reversedResources);
      } else if (getResources.rejected.match(resultAction)) {
        const errorMessage =
          (resultAction.payload as any)?.message ||
          resultAction.error.message ||
          "Failed to fetch resources.";
        setError(errorMessage);
        addToast("error", errorMessage);
      }
    } catch (err: any) {
      console.error("Unexpected error fetching resources:", err);
      setError(err.message || "An unexpected error occurred.");
      addToast("error", "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  // Effect hook to fetch resources and close modals on state change
  useEffect(() => {
    handleFetchResources(activeType);
    handleCloseAllModals();
  }, [activeType]);

  // --- Modal Handlers ---
  const handleOpenAddModal = () => {
    handleCloseAllModals(); // Close any other open modals first
    setShowAddModal(true);
  };

  const handleOpenDeleteModal = (id: string) => {
    handleCloseAllModals(); // Close any other open modals first
    setSelectedResourceId(id);
    setShowDeleteModal(true);
  };

  const handleOpenEditModal = (resource: Resource) => {
    handleCloseAllModals(); // Close any other open modals first
    setCurrentEditResource(resource);
    setNewTitle(resource.title);
    setNewDescription(resource.description);
    setShowEditModal(true);
  };

  // --- Redux Dispatch Actions ---
  const handleAddNewResource = async () => {
    console.log("🟡 Starting add resource...");

    if (!newTitle.trim() || !newDescription.trim()) {
      console.warn("❌ Title or description is missing");
      addToast("error", "Title and description are required.");
      return;
    }

    const payload = {
      type: activeType,
      title: newTitle,
      description: newDescription,
      classId,
    };

    console.log("📦 Dispatching addResource with payload:", payload);
    setLoading(true); // Start loading

    try {
      const resultAction = await dispatch(addResource(payload as any));

      console.log("✅ addResource response:", resultAction);

      if (addResource.fulfilled.match(resultAction)) {
        // FIX: Check for the payload directly instead of payload.data
        if (resultAction.payload) {
          console.log("🎯 New resource added:", resultAction.payload);
          // FIX: Add the new resource directly from the payload
          setResources((prev) => [...prev, resultAction.payload]);
          addToast("success", `${activeType} added successfully!`);
          handleCloseAllModals();
        } else {
          console.error("❌ Invalid data returned from addResource");
          addToast("error", "Failed to add resource: Invalid data returned.");
        }
      } else if (addResource.rejected.match(resultAction)) {
        const errorMessage =
          (resultAction.payload as any)?.message ||
          resultAction.error.message ||
          "Failed to add resource.";
        console.error("❌ addResource rejected:", errorMessage);
        addToast("error", errorMessage);
      }
    } catch (err: any) {
      console.error("❌ Unexpected error adding resource:", err);
      addToast("error", err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false); // End loading
    }
  };
  const handleConfirmDelete = async () => {
    if (!selectedResourceId || !activeType) {
      return;
    }

    setLoading(true);
    const payload = { type: activeType, _id: selectedResourceId };
    try {
      const resultAction = await dispatch(deleteResource(payload));
      if (deleteResource.fulfilled.match(resultAction)) {
        setResources((prev) =>
          prev.filter((res) => res._id !== selectedResourceId)
        );
        addToast("success", `${activeType} deleted successfully!`);
        handleCloseAllModals();
      } else if (deleteResource.rejected.match(resultAction)) {
        const errorMessage =
          (resultAction.payload as string) ||
          resultAction.error.message ||
          "Failed to delete resource.";
        addToast("error", errorMessage);
      }
    } catch (err: any) {
      addToast("error", err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateResource = async () => {
    if (!currentEditResource || !newTitle.trim() || !newDescription.trim()) {
      addToast("error", "Title and description are required.");
      return;
    }

    setLoading(true);
    const updatePayload: UpdateResourcePayload = {
      type: activeType,
      _id: currentEditResource._id,
      title: newTitle,
      description: newDescription,
    };

    try {
      const resultAction = await dispatch(updateResource(updatePayload));
      if (updateResource.fulfilled.match(resultAction)) {
        addToast("success", `${activeType} updated successfully!`);
        handleFetchResources(activeType); // Refresh the list
        handleCloseAllModals();
      } else if (updateResource.rejected.match(resultAction)) {
        const errorMessage =
          (resultAction.payload as string) ||
          resultAction.error.message ||
          "Failed to update resource.";
        addToast("error", errorMessage);
      }
    } catch (err: any) {
      addToast("error", err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const resourceTypes: ResourceType[] = ["assignment", "note", "announcement"];

  const { userRole } = useUserRole();

  return (
    <div className="resources-container">
      <div className="resources-toggle-buttons">
        {resourceTypes.map((type) => (
          <button
            key={type}
            className={`resources-toggle-button ${
              activeType === type ? "active" : ""
            }`}
            style={{ padding: `12px 18px`, fontSize: 14 }}
            onClick={() => setActiveType(type)}
          >
            {type.charAt(0).toUpperCase() + type.slice(1)}s
          </button>
        ))}
      </div>

      {userRole && ["admin", "teacher"].includes(userRole) && (
        <button
          onClick={handleOpenAddModal}
          className="resources-add-button add-new-resource-btn"
          style={{
            backgroundColor: "var(--yellow)",
            color: "var(--dark-green)",
            boxShadow: "none",
            width: "fit-content",
            padding: 12,
          }}
        >
          + Add New {activeType.charAt(0).toUpperCase() + activeType.slice(1)}
        </button>
      )}

      {loading ? (
        <Loader />
      ) : error ? (
        <div className="error-state">Error: {error}</div>
      ) : resources.length === 0 ? (
        <div className="empty-state">
          <h2 className="empty-header">
            No {activeType.charAt(0).toUpperCase() + activeType.slice(1)}s yet
            😌
          </h2>
          <p className="empty-description">
            You haven’t added any{" "}
            {activeType.charAt(0).toUpperCase() + activeType.slice(1)}s yet.
            Click the "Add New{" "}
            {activeType.charAt(0).toUpperCase() + activeType.slice(1)}" button
            above to create one.
          </p>
        </div>
      ) : (
        <div className="resources-list">
          {resources.map((res) => (
            <div key={res._id} className="resources-item">
              <h3 className="resources-item-title">{res.title}</h3>
              <p className="resources-item-description">{res.description}</p>
              {userRole && ["admin", "teacher"].includes(userRole) && (
                <div className="resources-item-actions">
                  <button
                    onClick={() => handleOpenEditModal(res)}
                    className="resources-action-button edit-button"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleOpenDeleteModal(res._id)}
                    className="resources-action-button delete-button"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="resource-modal-overlay">
          <div className="resources-modal">
            <h2 className="resources-modal-title">
              Add New {activeType.charAt(0).toUpperCase() + activeType.slice(1)}
            </h2>
            <p className="resources-modal-description">
              Fill in the form below to add a new {activeType}.
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAddNewResource();
              }}
            >
              <input
                type="text"
                placeholder="Title"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="resources-modal-input"
                required
              />
              <textarea
                placeholder="Description"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                rows={12}
                className="resources-modal-textarea"
                style={{ resize: "vertical" }}
                required
              />
              <div className="resources-modal-footer">
                <button
                  type="button"
                  onClick={handleCloseAllModals}
                  className="resources-modal-button resources-cancel-btn"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="resources-modal-button resources-submit-btn"
                >
                  Add {activeType.charAt(0).toUpperCase() + activeType.slice(1)}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && currentEditResource && (
        <div className="resource-modal-overlay">
          <div className="resources-modal">
            <h2 className="resources-modal-title">
              Edit {activeType.charAt(0).toUpperCase() + activeType.slice(1)}
            </h2>
            <p className="resources-modal-description">
              Make the necessary changes to the selected {activeType}.
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleUpdateResource();
              }}
            >
              <input
                type="text"
                placeholder="Title"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="resources-modal-input"
                required
              />
              <textarea
                placeholder="Description"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                rows={12}
                className="resources-modal-textarea"
                style={{ resize: "vertical" }}
                required
              />
              <div className="resources-modal-footer">
                <button
                  type="button"
                  onClick={handleCloseAllModals}
                  className="resources-modal-button resources-cancel-btn"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="resources-modal-button resources-submit-btn"
                >
                  Update{" "}
                  {activeType.charAt(0).toUpperCase() + activeType.slice(1)}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="resource-modal-overlay">
          <div className="resources-modal resources-confirmation-modal">
            <h2 className="resources-modal-title">Confirm Delete</h2>
            <p className="resources-modal-description">
              You are about to permanently remove this {activeType}. This action
              cannot be undone.
            </p>
            <div className="resources-confirmation-buttons">
              <button
                onClick={handleCloseAllModals}
                className="resources-cancel-btn"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="resources-delete-btn"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResourcesPage;
