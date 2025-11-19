import React, { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../../../Redux/store";
import {
  ResourceData,
  UpdateResourcePayload,
  addResource,
  deleteResource,
  getResources,
  updateResource,
} from "../../../Redux/Resource/Resource";
import { useToast } from "../../../Context/ToastProvider";
import useUserRole from "../../../Hooks/useUserRole";
import Loader from "../../../Components/Loader/Loader";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaBookOpen,
  FaBullhorn,
  FaFileAlt,
} from "react-icons/fa";

type ResourceType = "assignment" | "note" | "announcement";

interface Resource {
  _id: string;
  type: ResourceType;
  title: string;
  description: string;
  classId: string;
}

interface ResourcesPageProps {
  classId: string;
}

const ResourcesPage: React.FC<ResourcesPageProps> = ({ classId }) => {
  const [activeType, setActiveType] = useState<ResourceType>("assignment");
  const [resources, setResources] = useState<ResourceData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedResourceId, setSelectedResourceId] = useState<string | null>(
    null
  );
  const [currentEditResource, setCurrentEditResource] =
    useState<Resource | null>(null);

  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");

  const dispatch = useDispatch<AppDispatch>();
  const { addToast } = useToast();
  const { userRole } = useUserRole();

  const handleCloseAllModals = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    setShowDeleteModal(false);
    setSelectedResourceId(null);
    setCurrentEditResource(null);
    setNewTitle("");
    setNewDescription("");
  };

  const handleFetchResources = async (type: ResourceType) => {
    setLoading(true);
    setError(null);
    try {
      const result = await dispatch(getResources({ type, classId }));
      if (getResources.fulfilled.match(result)) {
        setResources(result.payload.data || []);
      } else {
        setError("Failed to load resources.");
        addToast("error", "Failed to load resources.");
      }
    } catch {
      setError("Network error.");
      addToast("error", "Network error.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleFetchResources(activeType);
    handleCloseAllModals();
  }, [activeType]);

  const handleAddNewResource = async () => {
    if (!newTitle.trim() || !newDescription.trim()) {
      addToast("error", "Title and description required.");
      return;
    }

    setLoading(true);
    const payload = {
      type: activeType,
      title: newTitle,
      description: newDescription,
      classId,
    };
    try {
      const result = await dispatch(addResource(payload as any));
      if (addResource.fulfilled.match(result)) {
        setResources((prev) => [result.payload, ...prev]);
        addToast("success", `${activeType} added!`);
        handleCloseAllModals();
      } else {
        addToast("error", "Failed to add.");
      }
    } catch {
      addToast("error", "Error adding resource.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateResource = async () => {
    if (!currentEditResource || !newTitle.trim() || !newDescription.trim())
      return;

    setLoading(true);
    const payload: UpdateResourcePayload = {
      type: activeType,
      _id: currentEditResource._id,
      title: newTitle,
      description: newDescription,
    };
    try {
      const result = await dispatch(updateResource(payload));
      if (updateResource.fulfilled.match(result)) {
        addToast("success", `${activeType} updated!`);
        handleFetchResources(activeType);
        handleCloseAllModals();
      } else {
        addToast("error", "Update failed.");
      }
    } catch {
      addToast("error", "Error updating.");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedResourceId) return;
    setLoading(true);
    try {
      const result = await dispatch(
        deleteResource({ type: activeType, _id: selectedResourceId })
      );
      if (deleteResource.fulfilled.match(result)) {
        setResources((prev) =>
          prev.filter((r) => r._id !== selectedResourceId)
        );
        addToast("success", `${activeType} deleted!`);
        handleCloseAllModals();
      } else {
        addToast("error", "Delete failed.");
      }
    } catch {
      addToast("error", "Error deleting.");
    } finally {
      setLoading(false);
    }
  };

  const resourceTypes: ResourceType[] = ["assignment", "note", "announcement"];
  const isAdminOrTeacher = userRole && ["admin", "teacher"].includes(userRole);

  const getIcon = (type: ResourceType) => {
    switch (type) {
      case "assignment":
        return <FaFileAlt className="w-5 h-5" />;
      case "note":
        return <FaBookOpen className="w-5 h-5" />;
      case "announcement":
        return <FaBullhorn className="w-5 h-5" />;
    }
  };

  const getColor = (type: ResourceType) => {
    switch (type) {
      case "assignment":
        return "from-orange-400 to-orange-600";
      case "note":
        return "from-blue-400 to-blue-600";
      case "announcement":
        return "from-emerald-400 to-emerald-600";
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6">
      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-200">
        {resourceTypes.map((type) => (
          <motion.button
            key={type}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveType(type)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-t-lg font-medium text-sm transition-all ${
              activeType === type
                ? `bg-gradient-to-r ${getColor(type)} text-white`
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {getIcon(type)}
            {type.charAt(0).toUpperCase() + type.slice(1)}s
          </motion.button>
        ))}
      </div>

      {/* Add Button */}
      {isAdminOrTeacher && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowAddModal(true)}
          className="mb-6 flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 rounded-xl font-medium text-sm hover:from-yellow-500 hover:to-yellow-600 transition shadow-md"
        >
          <FaPlus className="w-4 h-4" />
          Add New {activeType.charAt(0).toUpperCase() + activeType.slice(1)}
        </motion.button>
      )}

      {/* Loading / Error / Empty */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader />
        </div>
      ) : error ? (
        <p className="text-center text-red-600 py-8">{error}</p>
      ) : resources.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-16 bg-gray-50 rounded-2xl"
        >
          <div className="w-24 h-24 mx-auto mb-4 bg-gray-200 border-2 border-dashed rounded-xl flex items-center justify-center">
            {getIcon(activeType)}
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            No {activeType}s yet
          </h2>
          <p className="text-gray-600 max-w-md mx-auto">
            {isAdminOrTeacher
              ? `Click "Add New ${activeType}" to create your first one.`
              : "Check back later for updates."}
          </p>
        </motion.div>
      ) : (
        <div className="space-y-4">
          {resources.map((res) => (
            <motion.div
              key={res._id}
              whileHover={{ y: -2 }}
              className="bg-white rounded-xl border border-gray-200 p-5 hover:border-gray-300 transition"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {res.title}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {res.description}
                  </p>
                </div>
                {isAdminOrTeacher && (
                  <div className="flex gap-2 ml-4">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => {
                        setCurrentEditResource(res as any);
                        setNewTitle(res.title);
                        setNewDescription(res.description);
                        setShowEditModal(true);
                      }}
                      className="p-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition"
                    >
                      <FaEdit className="w-4 h-4" />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => {
                        setSelectedResourceId(res._id);
                        setShowDeleteModal(true);
                      }}
                      className="p-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition"
                    >
                      <FaTrash className="w-4 h-4" />
                    </motion.button>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      <AnimatePresence>
        {(showAddModal || showEditModal) && (
          <ModalOverlay onClose={handleCloseAllModals}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="bg-white/95 backdrop-blur-xl rounded-3xl p-6 md:p-8 max-w-lg w-full mx-4 border border-white/20 w-[400px]"
            >
              <div
                className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${getColor(
                  activeType
                )} rounded-t-3xl`}
              />
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                {showEditModal ? "Edit" : "Add New"}{" "}
                {activeType.charAt(0).toUpperCase() + activeType.slice(1)}
              </h2>
              <p className="text-sm text-gray-600 mb-6">
                {showEditModal
                  ? "Update the details below."
                  : "Fill in the form to create a new resource."}
              </p>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  showEditModal
                    ? handleUpdateResource()
                    : handleAddNewResource();
                }}
                className="space-y-5"
              >
                <div className="relative">
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    required
                    className="peer w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 placeholder-transparent focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                    placeholder="Title"
                  />
                  <label className="absolute left-4 -top-2.5 bg-white px-2 text-xs font-medium text-emerald-600 transition-all peer-placeholder-shown:text-sm peer-placeholder-shown:text-gray-400 peer-placeholder-shown:top-3.5 peer-focus:-top-2.5 peer-focus:text-xs peer-focus:text-emerald-600">
                    Title
                  </label>
                </div>

                <div className="relative">
                  <textarea
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    rows={6}
                    required
                    className="peer w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 placeholder-transparent focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition resize-none"
                    placeholder="Description"
                  />
                  <label className="absolute left-4 -top-2.5 bg-white px-2 text-xs font-medium text-emerald-600 transition-all peer-placeholder-shown:text-sm peer-placeholder-shown:text-gray-400 peer-placeholder-shown:top-3.5 peer-focus:-top-2.5 peer-focus:text-xs peer-focus:text-emerald-600">
                    Description
                  </label>
                </div>

                <div className="flex justify-end gap-3 mt-8">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    onClick={handleCloseAllModals}
                    className="px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="submit"
                    className={`px-6 py-3 text-sm font-medium text-white bg-gradient-to-r ${getColor(
                      activeType
                    )} rounded-xl hover:shadow-lg transition`}
                  >
                    {showEditModal ? "Update" : "Add"}{" "}
                    {activeType.charAt(0).toUpperCase() + activeType.slice(1)}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </ModalOverlay>
        )}
      </AnimatePresence>

      {/* Delete Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <ModalOverlay onClose={handleCloseAllModals}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white/95 backdrop-blur-xl rounded-3xl p-8 max-w-md w-full mx-4 text-center border border-white/20"
            >
              <div className="w-20 h-20 mx-auto mb-5 bg-red-100 rounded-full flex items-center justify-center">
                <FaTrash className="w-10 h-10 text-red-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                Delete {activeType}?
              </h2>
              <p className="text-sm text-gray-600 mb-6">
                This action{" "}
                <span className="font-semibold text-red-600">
                  cannot be undone
                </span>
                .
              </p>
              <div className="flex justify-center gap-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleCloseAllModals}
                  className="px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleConfirmDelete}
                  className="px-6 py-3 text-sm font-medium text-white bg-gradient-to-r from-red-500 to-red-600 rounded-xl hover:from-red-600 hover:to-red-700 transition shadow-lg"
                >
                  Yes, Delete
                </motion.button>
              </div>
            </motion.div>
          </ModalOverlay>
        )}
      </AnimatePresence>
    </div>
  );
};

// Reusable Modal Overlay
const ModalOverlay: React.FC<{
  children: React.ReactNode;
  onClose: () => void;
}> = ({ children, onClose }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    onClick={onClose}
    className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
  >
    <div onClick={(e) => e.stopPropagation()}>{children}</div>
  </motion.div>
);

export default ResourcesPage;
