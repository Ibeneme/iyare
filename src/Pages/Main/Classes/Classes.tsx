// src/pages/ClassesMain.tsx
import { useEffect, useState, useMemo } from "react";
import {
  Loader2,
  Calendar,
  Clock,
  BookOpen,
  AlertCircle,
  PlusCircle,
  Search,
  Circle,
  User,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../../../Redux/store";
import { fetchClassesByUser } from "../../../Redux/Slices/class.slice";
import { useNavigate } from "react-router-dom";
const SUBJECT_COLORS = [
  "bg-blue-100 text-blue-700",
  "bg-purple-100 text-purple-700",
  "bg-pink-100 text-pink-700",
  "bg-indigo-100 text-indigo-700",
  "bg-teal-100 text-teal-700",
  "bg-orange-100 text-orange-700",
  "bg-emerald-100 text-emerald-700",
  "bg-rose-100 text-rose-700",
];

interface ClassModel {
  _id: string;
  title: string;
  subjectId: {
    _id: string;
    name: string;
    code: string;
  } | null;
  teacherId: {
    _id: string;
    firstName: string;
    lastName: string;
  } | null;
  date: string;
  time: string;
  duration: number;
  createdAt: string;
  updatedAt: string;
}

type ClassStatus = "upcoming" | "ongoing" | "finished";
type FilterStatus = ClassStatus | "all";

export default function ClassesMain() {
  const dispatch = useDispatch<AppDispatch>();

  const [classes, setClasses] = useState<ClassModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("all");
const navigate = useNavigate()
  /* ---------- Fetch Classes ---------- */
  useEffect(() => {
    setLoading(true);
    setError(null);

    console.log("Initiating fetch for user's classes...");

    dispatch(fetchClassesByUser())
      .unwrap()
      .then((data: any[]) => {
        console.log("Classes fetched successfully:", data);
        setClasses(data);
        setLoading(false);
      })
      .catch((err: any) => {
        const msg = err?.message || err || "Failed to load classes";
        console.log("Error fetching classes:", { error: msg });
        setError(msg);
        toast.error(msg);
        setLoading(false);
      });
  }, [dispatch]);

  /* ---------- Helpers ---------- */
  const capitalizeFirst = (str: string) =>
    str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();

  const getClassStatus = (cls: ClassModel): ClassStatus => {
    const now = new Date();
    const [hours, minutes] = cls.time.split(":").map(Number);
    const classDate = new Date(cls.date);
    classDate.setHours(hours, minutes, 0, 0);
    const endTime = new Date(classDate.getTime() + cls.duration * 60 * 1000);

    if (now < classDate) return "upcoming";
    if (now >= classDate && now <= endTime) return "ongoing";
    return "finished";
  };

  const getStatusConfig = (status: ClassStatus) => {
    switch (status) {
      case "upcoming":
        return { text: "Upcoming", color: "bg-blue-100 text-blue-700" };
      case "ongoing":
        return { text: "Ongoing", color: "bg-green-100 text-green-700" };
      case "finished":
        return { text: "Finished", color: "bg-gray-100 text-gray-700" };
    }
  };

  const getSubjectColor = (subjectId: string | null) => {
    if (!subjectId) return SUBJECT_COLORS[0];
    const index =
      Math.abs(subjectId.split("").reduce((a, b) => a + b.charCodeAt(0), 0)) %
      SUBJECT_COLORS.length;
    return SUBJECT_COLORS[index];
  };

  /* ---------- Search + Status Filter ---------- */
  const filteredClasses = useMemo(() => {
    let filtered = classes;

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((cls) => {
        const title = cls.title.toLowerCase();
        const subject = cls.subjectId?.name?.toLowerCase() || "";
        const code = cls.subjectId?.code?.toLowerCase() || "";
        const teacher = cls.teacherId
          ? `${cls.teacherId.firstName} ${cls.teacherId.lastName}`.toLowerCase()
          : "";
        return (
          title.includes(query) ||
          subject.includes(query) ||
          code.includes(query) ||
          teacher.includes(query)
        );
      });
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((cls) => getClassStatus(cls) === statusFilter);
    }

    return filtered;
  }, [classes, searchQuery, statusFilter]);

  return (
    <>
      {/* Full Page Loader */}
      <AnimatePresence>
        {loading && (
          <div className="flex py-48 flex-col min-h-[100%] items-center justify-center bg-white/70 backdrop-blur-sm z-50">
            <Loader2 className="w-14 h-14 animate-spin text-green-700" />
            <p className="mt-4 text-green-700 text-[14px] font-semibold">
              Loading...
            </p>
          </div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      {!loading && (
        <div className="min-h-screen bg-gray-50 p-4 md:p-6">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8 mt-12">
              <div className="bg-yellow-200 rounded-full p-4 mb-4 inline-flex items-center justify-center">
                <BookOpen className="w-8 h-8 text-yellow-900" />
              </div>
              <h1 className="text-4xl font-black text-black">My Classes</h1>
              <p className="text-gray-600 mt-1">
                View and join your scheduled classes. Search by title, subject,
                or teacher.
              </p>
            </div>

            {/* Search Input */}
            <div className="mb-4">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search classes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent transition"
                />
              </div>
            </div>

            {/* Status Toggle – BELOW SEARCH */}
            <div className="mb-8">
              <div className="flex gap-2 bg-white p-1 rounded-lg border border-gray-300 w-fit">
                {(["all", "upcoming", "ongoing", "finished"] as const).map(
                  (status) => {
                    const isActive = statusFilter === status;
                    const label =
                      status === "all" ? "All" : capitalizeFirst(status);
                    return (
                      <button
                        key={status}
                        onClick={() => setStatusFilter(status)}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                          isActive
                            ? "bg-gray-700 text-white"
                            : "text-gray-600 hover:bg-gray-100"
                        }`}
                      >
                        {label}
                      </button>
                    );
                  }
                )}
              </div>
            </div>

            {/* Error State */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mb-6 p-4 bg-red-50 border border-red-300 rounded-lg flex items-start gap-3 text-red-700"
                >
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium">{error}</p>
                    <button
                      onClick={() => window.location.reload()}
                      className="text-sm underline font-medium mt-2 hover:text-red-800"
                    >
                      Retry
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Classes Grid */}
            {filteredClasses.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center py-24 text-center"
              >
                <div className="mb-8">
                  <BookOpen className="w-24 h-24 text-gray-400" />
                </div>
                <h2 className="text-3xl font-black text-black mb-3">
                  {searchQuery || statusFilter !== "all"
                    ? "No Results Found"
                    : "No Classes Found"}
                </h2>
                <p className="text-gray-600 max-w-md">
                  {searchQuery || statusFilter !== "all"
                    ? `No classes match your filters. Try adjusting search or status.`
                    : "You are not enrolled in any classes yet. Ask your admin to assign you."}
                </p>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredClasses.map((cls, index) => {
                  const status = getClassStatus(cls);
                  const { text: statusText, color: statusColor } =
                    getStatusConfig(status);
                  const subjectColor = getSubjectColor(
                    cls.subjectId?._id ?? null
                  );

                  return (
                    <motion.div
                      key={cls._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm hover:shadow transition-shadow"
                    >
                      {/* Top: Subject Code + Status */}
                      <div className="flex justify-between items-start mb-4">
                        <span
                          className={`inline-block px-3 py-1 ${subjectColor} text-xs font-medium rounded-full`}
                        >
                          {cls.subjectId?.code ?? "—"}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 ${statusColor} text-xs font-medium rounded-full`}
                        >
                          <Circle className="w-2 h-2 fill-current" />
                          {statusText}
                        </span>
                      </div>

                      {/* Title – First letter capitalized */}
                      <h3 className="text-lg font-bold text-black mb-2">
                        {capitalizeFirst(cls.title)}
                      </h3>

                      {/* Subject Name */}
                      <p className="text-sm text-gray-700 mb-4">
                        {cls.subjectId?.name ?? "—"}
                      </p>

                      {/* Info Rows – Only show teacher if exists */}
                      <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>
                            {new Date(cls.date).toLocaleDateString("en-NG")}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span>
                            {cls.time} ({cls.duration} mins)
                          </span>
                        </div>
                        {cls.teacherId && (
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4" />
                            <span>
                              {cls.teacherId.firstName} {cls.teacherId.lastName}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Only Join Button */}
                      <div className="mt-6">
                        <button
                          onClick={() => {
                            console.log(cls, "cls");

                            const storedUser = JSON.parse(
                              localStorage.getItem("user") || "{}"
                            );

                            if (!storedUser?._id) {
                              console.error("User not found in localStorage");
                              return;
                            }

                            const classId = cls._id;
                            const classTitle = encodeURIComponent(cls.title);
                      

                            navigate(
                              `/webrtc/${classId}/${classTitle}`
                            );
                          }}
                          disabled={status === "finished"}
                          className={`w-full flex items-center justify-center gap-2 py-2 rounded-lg font-medium transition text-sm ${
                            status === "finished"
                              ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                              : "bg-gray-700 text-white hover:bg-gray-800"
                          }`}
                        >
                          <PlusCircle className="w-4 h-4" />
                          Join Class
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
