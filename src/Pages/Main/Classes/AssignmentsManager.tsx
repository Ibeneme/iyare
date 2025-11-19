// src/pages/AssignmentsManager.tsx
import { useEffect, useState, useMemo } from "react";
import {
  Loader2,
  Search,
  FolderOpen,
  FileText,
  Notebook,
  Megaphone,
  ChevronDown,
  AlertCircle,
  Calendar,
  X,
  User,
  BookOpen,
  Bell,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../../../Redux/store";
import { fetchAllResources } from "../../../Redux/Slices/resources.slice";

interface ResourceData {
  _id: string;
  subjectId: string;
  title: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

interface ResourcesBySubject {
  assignments: ResourceData[];
  notes: ResourceData[];
  announcements: ResourceData[];
}

interface SubjectData {
  subjectId: string;
  code: string;
  name: string;
  resources: ResourcesBySubject;
}

interface ClassData {
  childId: string;
  childName: string;
  data: SubjectData[];
}

interface SelectedResource extends ResourceData {
  type: "Assignment" | "Note" | "Announcement";
  subjectCode: string;
  subjectName: string;
  childName: string;
}

export default function AssignmentsManager() {
  const dispatch = useDispatch<AppDispatch>();

  const [searchQuery, setSearchQuery] = useState<string>("");
  const [openSubjectId, setOpenSubjectId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Record<string, string>>({});
  const [parentData, setParentData] = useState<ClassData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedResource, setSelectedResource] =
    useState<SelectedResource | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    dispatch(fetchAllResources())
      .unwrap()
      .then((res: any) => {
        if (res && res.data && Array.isArray(res.data)) {
          setParentData(res.data);
        } else {
          setParentData([]);
        }
      })
      .catch((err) => {
        const msg = err?.message || "Failed to load updates";
        setError(msg);
        toast.error(msg);
      })
      .finally(() => setLoading(false));
  }, [dispatch]);

  const formatDate = (dateString: string): string =>
    new Date(dateString).toLocaleDateString("en-NG", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  const toggleAccordion = (subjectId: string) => {
    setOpenSubjectId((prev) => (prev === subjectId ? null : subjectId));
    if (openSubjectId !== subjectId) {
      setActiveTab((prev) => ({ ...prev, [subjectId]: "assignments" }));
    }
  };

  const switchTab = (
    subjectId: string,
    tab: "assignments" | "notes" | "announcements"
  ) => {
    setActiveTab((prev) => ({ ...prev, [subjectId]: tab }));
  };

  const openDetails = (
    resource: ResourceData,
    type: "Assignment" | "Note" | "Announcement",
    subject: SubjectData,
    childName: string
  ) => {
    setSelectedResource({
      ...resource,
      type,
      subjectCode: subject.code,
      subjectName: subject.name,
      childName,
    });
  };

  const closeModal = () => setSelectedResource(null);

  const renderResourceCard = (
    res: ResourceData,
    type: "Assignment" | "Note" | "Announcement",
    subject: SubjectData,
    childName: string
  ) => (
    <motion.div
      key={res._id}
      whileHover={{ y: -2 }}
      onClick={() => openDetails(res, type, subject, childName)}
      className="cursor-pointer p-4 bg-white rounded-xl border border-gray-200 hover:border-gray-400 transition"
    >
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-bold text-gray-900 text-base line-clamp-2">
          {res.title}
        </h4>
        <span
          className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
            type === "Assignment"
              ? "bg-orange-100 text-orange-700"
              : type === "Note"
              ? "bg-purple-100 text-purple-700"
              : "bg-teal-100 text-teal-700"
          }`}
        >
          {type}
        </span>
      </div>
      <p className="text-sm text-gray-600 line-clamp-2 mb-2">
        {res.description || "No description."}
      </p>
      <div className="flex items-center gap-1.5 text-xs text-gray-500">
        <Calendar className="w-4 h-4" />
        {formatDate(res.createdAt)}
      </div>
    </motion.div>
  );

  const renderEmpty = (type: string) => (
    <div className="text-center py-12 text-gray-500">
      <FolderOpen className="w-14 h-14 mx-auto mb-3 text-gray-300" />
      <p className="font-medium text-sm">No {type} yet</p>
    </div>
  );

  const hasAnyUpdates = useMemo(
    () =>
      parentData?.some((child) =>
        child.data?.some(
          (subj) =>
            subj.resources.assignments?.length > 0 ||
            subj.resources.notes?.length > 0 ||
            subj.resources.announcements?.length > 0
        )
      ),
    [parentData]
  );

  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return parentData;
    const q = searchQuery.toLowerCase();
    return parentData
      ?.map((child) => ({
        ...child,
        data: child.data
          ?.map((subj) => ({
            ...subj,
            resources: {
              assignments: subj.resources.assignments.filter(
                (r) =>
                  r.title.toLowerCase().includes(q) ||
                  (r.description?.toLowerCase().includes(q) ?? false)
              ),
              notes: subj.resources.notes.filter(
                (r) =>
                  r.title.toLowerCase().includes(q) ||
                  (r.description?.toLowerCase().includes(q) ?? false)
              ),
              announcements: subj.resources.announcements.filter(
                (r) =>
                  r.title.toLowerCase().includes(q) ||
                  (r.description?.toLowerCase().includes(q) ?? false)
              ),
            },
          }))
          .filter((subj) => {
            const subjectMatch = `${subj.code} ${subj.name}`
              .toLowerCase()
              .includes(q);
            const hasResources = Object.values(subj.resources)?.some(
              (arr) => arr?.length > 0
            );
            return subjectMatch || hasResources;
          }),
      }))
      .filter((child) => child.data?.length > 0);
  }, [parentData, searchQuery]);

  const showNoUpdates =
    !loading &&
    !error &&
    parentData?.length > 0 &&
    !hasAnyUpdates &&
    !searchQuery;
  const showNoSearchResults =
    !loading && filteredData?.length === 0 && searchQuery.trim() !== "";

  return (
    <>
      <AnimatePresence>
        {loading ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-[100%] py-48 bg-white flex flex-col items-center justify-center gap-5 z-50"
          >
            <Loader2 className="w-14 h-14 animate-spin text-gray-900" />
            <p className="text-xl font-bold text-gray-900">
              Loading Updates...
            </p>
          </motion.div>
        ) : (
          <>
            <div className="min-h-screen bg-white">
              <div className="max-w-7xl mx-auto px-4 py-8 md:px-6">
                {/* Header */}
                <div className="text-left mb-10">
                  <div className="inline-flex items-center justify-center w-14 h-14 bg-[#ffd000] rounded-full mb-4">
                    <BookOpen className="w-8 h-8 text-gray-900" />
                  </div>
                  <h1 className="text-4xl font-black text-gray-900 mb-2">
                    Class Updates
                  </h1>
                  <p className="text-gray-600">
                    Assignments, notes & announcements
                  </p>
                </div>

                {/* Search */}
                <div className="mb-8 max-w-xl">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input
                      type="text"
                      placeholder="Search updates..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:border-gray-500 focus:outline-none text-sm"
                    />
                  </div>
                </div>

                {/* Error */}
                {error && (
                  <div className="mb-8 p-5 bg-red-50 border border-red-300 rounded-lg flex items-center gap-3">
                    <AlertCircle className="w-8 h-8 text-red-600" />
                    <div>
                      <p className="font-bold text-red-800">Failed to load</p>
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                  </div>
                )}

                {/* No Updates */}
                {showNoUpdates && (
                  <div className="text-center py-20">
                    <Bell className="w-20 h-20 text-gray-300 mx-auto mb-6" />
                    <h2 className="text-2xl font-black text-gray-900 mb-2">
                      No Updates Yet
                    </h2>
                    <p className="text-gray-600">
                      Teachers haven't posted anything.
                    </p>
                  </div>
                )}

                {/* No Search Results */}
                {showNoSearchResults && (
                  <div className="text-center py-20">
                    <FolderOpen className="w-20 h-20 text-gray-300 mx-auto mb-6" />
                    <h2 className="text-2xl font-black text-gray-900 mb-2">
                      No Results
                    </h2>
                    <p className="text-gray-600">Try different keywords.</p>
                  </div>
                )}

                {/* Content */}
                {filteredData?.length > 0 &&
                  !showNoUpdates &&
                  !showNoSearchResults && (
                    <>
                      {/* Mobile */}
                      <div className="md:hidden space-y-6">
                        {filteredData?.map((child) => (
                          <div
                            key={child.childId}
                            className="bg-gray-50 rounded-xl p-5"
                          >
                            <div className="flex items-center gap-3 mb-5">
                              <div className="w-10 h-10 bg-[#ffd000] rounded-full flex items-center justify-center">
                                <User className="w-6 h-6 text-gray-900" />
                              </div>
                              <h3 className="font-bold text-gray-900 text-lg">
                                {child.childName}
                              </h3>
                            </div>

                            <div className="space-y-4">
                              {child.data?.map((subj) => {
                                const total = Object?.values(
                                  subj?.resources
                                )?.flat()?.length;
                                if (total === 0) return null;
                                const currentTab =
                                  activeTab[subj.subjectId] || "assignments";

                                return (
                                  <div
                                    key={subj.subjectId}
                                    className="bg-white rounded-lg border border-gray-200"
                                  >
                                    <button
                                      onClick={() =>
                                        toggleAccordion(subj.subjectId)
                                      }
                                      className="w-full px-5 py-4 flex items-center justify-between text-left"
                                    >
                                      <div>
                                        <span className="inline-block px-2.5 py-1 bg-gray-900 text-white text-xs font-bold rounded mr-2">
                                          {subj.code}
                                        </span>
                                        <span className="font-bold text-gray-900">
                                          {subj.name}
                                        </span>
                                      </div>
                                      <ChevronDown
                                        className={`w-5 h-5 transition-transform ${
                                          openSubjectId === subj.subjectId
                                            ? "rotate-180"
                                            : ""
                                        }`}
                                      />
                                    </button>

                                    {openSubjectId === subj.subjectId && (
                                      <div className="px-5 pb-5">
                                        <div className="flex gap-2 mb-4 bg-gray-100 p-1 rounded-lg">
                                          {[
                                            {
                                              id: "assignments",
                                              label: "Assign",
                                              icon: FileText,
                                              count:
                                                subj.resources.assignments
                                                  ?.length,
                                            },
                                            {
                                              id: "notes",
                                              label: "Notes",
                                              icon: Notebook,
                                              count:
                                                subj.resources.notes?.length,
                                            },
                                            {
                                              id: "announcements",
                                              label: "Announce",
                                              icon: Megaphone,
                                              count:
                                                subj.resources.announcements
                                                  ?.length,
                                            },
                                          ]?.map(
                                            ({
                                              id,
                                              label,
                                              icon: Icon,
                                              count,
                                            }) => (
                                              <button
                                                key={id}
                                                onClick={() =>
                                                  switchTab(
                                                    subj.subjectId,
                                                    id as any
                                                  )
                                                }
                                                className={`flex-1 py-2 text-xs font-medium rounded transition ${
                                                  currentTab === id
                                                    ? "bg-gray-900 text-white"
                                                    : "text-gray-600"
                                                } flex items-center justify-center gap-1`}
                                              >
                                                <Icon className="w-3.5 h-3.5" />
                                                {label}{" "}
                                                {count > 0 && `(${count})`}
                                              </button>
                                            )
                                          )}
                                        </div>

                                        <div className="space-y-3">
                                          {currentTab === "assignments" &&
                                            (subj.resources.assignments
                                              ?.length > 0
                                              ? subj.resources.assignments?.map(
                                                  (r) =>
                                                    renderResourceCard(
                                                      r,
                                                      "Assignment",
                                                      subj,
                                                      child.childName
                                                    )
                                                )
                                              : renderEmpty("assignments"))}
                                          {currentTab === "notes" &&
                                            (subj.resources.notes?.length > 0
                                              ? subj.resources.notes?.map((r) =>
                                                  renderResourceCard(
                                                    r,
                                                    "Note",
                                                    subj,
                                                    child.childName
                                                  )
                                                )
                                              : renderEmpty("notes"))}
                                          {currentTab === "announcements" &&
                                            (subj.resources.announcements
                                              ?.length > 0
                                              ? subj.resources.announcements?.map(
                                                  (r) =>
                                                    renderResourceCard(
                                                      r,
                                                      "Announcement",
                                                      subj,
                                                      child.childName
                                                    )
                                                )
                                              : renderEmpty("announcements"))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Desktop Table */}
                      <div className="hidden md:block rounded-xl border border-gray-200 overflow-hidden">
                        <table className="w-full">
                          <thead className="">
                            <tr>
                              <th className="px-6 py-4 text-left font-bold text-sm">
                                Child
                              </th>
                              <th className="px-6 py-4 text-left font-bold text-sm">
                                Subject
                              </th>
                              <th className="px-6 py-4 text-left font-bold text-sm">
                                Type
                              </th>
                              <th className="px-6 py-4 text-left font-bold text-sm">
                                Title
                              </th>
                              <th className="px-6 py-4 text-left font-bold text-sm">
                                Posted
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {filteredData.flatMap((child) =>
                              child.data.flatMap((subj) =>
                                [
                                  ...subj.resources.assignments?.map((r) => ({
                                    ...r,
                                    type: "Assignment" as const,
                                    subject: subj,
                                  })),
                                  ...subj.resources.notes?.map((r) => ({
                                    ...r,
                                    type: "Note" as const,
                                    subject: subj,
                                  })),
                                  ...subj.resources.announcements?.map((r) => ({
                                    ...r,
                                    type: "Announcement" as const,
                                    subject: subj,
                                  })),
                                ]?.map((item) => (
                                  <tr
                                    key={item._id}
                                    onClick={() =>
                                      openDetails(
                                        item,
                                        item.type,
                                        subj,
                                        child.childName
                                      )
                                    }
                                    className="hover:bg-gray-50 cursor-pointer"
                                  >
                                    <td className="px-6 py-4 font-medium text-gray-900">
                                      {child.childName}
                                    </td>
                                    <td className="px-6 py-4">
                                      <span className="inline-block px-2.5 py-1 bg-gray-900 text-white text-xs font-bold rounded mr-2">
                                        {item.subject.code}
                                      </span>
                                      <span className="font-medium text-gray-900">
                                        {item.subject.name}
                                      </span>
                                    </td>
                                    <td className="px-6 py-4">
                                      <span
                                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                                          item.type === "Assignment"
                                            ? "bg-orange-100 text-orange-700"
                                            : item.type === "Note"
                                            ? "bg-purple-100 text-purple-700"
                                            : "bg-teal-100 text-teal-700"
                                        }`}
                                      >
                                        {item.type === "Assignment" ? (
                                          <FileText className="w-3.5 h-3.5" />
                                        ) : item.type === "Note" ? (
                                          <Notebook className="w-3.5 h-3.5" />
                                        ) : (
                                          <Megaphone className="w-3.5 h-3.5" />
                                        )}
                                        {item.type}
                                      </span>
                                    </td>
                                    <td className="px-6 py-4 font-medium text-gray-900 max-w-lg truncate">
                                      {item.title}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600">
                                      {formatDate(item.createdAt)}
                                    </td>
                                  </tr>
                                ))
                              )
                            )}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}
              </div>
            </div>

            {/* Modal */}
            <AnimatePresence>
              {selectedResource && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={closeModal}
                  className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50"
                >
                  <motion.div
                    initial={{ scale: 0.95 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0.95 }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8"
                  >
                    <div className="flex justify-between items-start mb-6">
                      <h2 className="text-2xl font-black text-gray-900 pr-8">
                        {selectedResource.title}
                      </h2>
                      <button
                        onClick={closeModal}
                        className="p-2 hover:bg-gray-100 rounded-full"
                      >
                        <X className="w-6 h-6" />
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-3 mb-6">
                      <span className="px-4 py-2 bg-gray-900 text-white font-bold rounded-full text-sm">
                        {selectedResource.subjectCode} •{" "}
                        {selectedResource.subjectName}
                      </span>
                      <span
                        className={`px-4 py-2 rounded-full font-bold text-sm ${
                          selectedResource.type === "Assignment"
                            ? "bg-orange-100 text-orange-700"
                            : selectedResource.type === "Note"
                            ? "bg-purple-100 text-purple-700"
                            : "bg-teal-100 text-teal-700"
                        }`}
                      >
                        {selectedResource.type}
                      </span>
                    </div>

                    <p className="text-lg font-bold text-gray-600 mb-3">
                      Student:{" "}
                      <span className="text-gray-900">
                        {selectedResource.childName}
                      </span>
                    </p>

                    <div className="prose max-w-none">
                      <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                        {selectedResource.description || "No details provided."}
                      </p>
                    </div>

                    <div className="mt-8 pt-6 border-t border-gray-200 flex items-center gap-3 text-gray-600">
                      <Calendar className="w-5 h-5" />
                      <span className="font-medium">
                        Posted {formatDate(selectedResource.createdAt)}
                      </span>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
