// src/pages/ClassesMain.tsx
import { useEffect, useState, useMemo } from "react";
import {
  Loader2,
  Calendar,
  Clock,
  PlusCircle,
  Search,
  Circle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../../../Redux/store";
import { fetchClassesByUser } from "../../../Redux/Slices/class.slice";
import { useNavigate } from "react-router-dom";
// const SUBJECT_COLORS = [
//   "bg-blue-100 text-blue-700",
//   "bg-purple-100 text-purple-700",
//   "bg-pink-100 text-pink-700",
//   "bg-indigo-100 text-indigo-700",
//   "bg-teal-100 text-teal-700",
//   "bg-orange-100 text-orange-700",
//   "bg-emerald-100 text-emerald-700",
//   "bg-rose-100 text-rose-700",
// ];

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
  const navigate = useNavigate();
  /* ---------- Fetch Classes ---------- */
  useEffect(() => {
    setLoading(true);
    setError(null);

    console.log("Initiating fetch for user's classes..." , error);

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
  // const capitalizeFirst = (str: string) =>
  //   str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();

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

  // const getStatusConfig = (status: ClassStatus) => {
  //   switch (status) {
  //     case "upcoming":
  //       return { text: "Upcoming", color: "bg-blue-100 text-blue-700" };
  //     case "ongoing":
  //       return { text: "Ongoing", color: "bg-green-100 text-green-700" };
  //     case "finished":
  //       return { text: "Finished", color: "bg-gray-100 text-gray-700" };
  //   }
  // };

  // const getSubjectColor = (subjectId: string | null) => {
  //   if (!subjectId) return SUBJECT_COLORS[0];
  //   const index =
  //     Math.abs(subjectId.split("").reduce((a, b) => a + b.charCodeAt(0), 0)) %
  //     SUBJECT_COLORS.length;
  //   return SUBJECT_COLORS[index];
  // };

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
    <div className="min-h-screen bg-[#fcfdfc] p-6 md:p-12">
      <AnimatePresence>
        {loading && (
          <motion.div className="fixed inset-0 flex flex-col items-center justify-center bg-white z-[100]">
            <Loader2 className="w-12 h-12 animate-spin text-[#064e3b]" />
            <p className="text-[#064e3b] font-black uppercase tracking-[0.2em] mt-4 text-[10px]">
              Loading Schedule...
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto">
        {/* Header - No light green, just clean white and bold darks */}
        <header className="mb-12">
          <div className="flex items-center gap-4 mb-6">
            <div className="h-14 w-14 bg-[#064e3b] rounded-2xl flex items-center justify-center shadow-xl shadow-emerald-900/20">
              <Calendar className="text-yellow-400" size={28} />
            </div>
            <h1 className="text-5xl font-black text-[#064e3b] tracking-tighter">
              Class Registry
            </h1>
          </div>
          <p className="text-slate-500 font-bold text-lg max-w-xl">
            Access your live sessions and curriculum timeline.
          </p>
        </header>

        {/* Search Bar - Solid borders, no pale backgrounds */}
        <div className="flex flex-col md:flex-row gap-6 mb-12">
          <div className="relative flex-1 group">
            <Search
              className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#064e3b] transition-colors"
              size={20}
            />
            <input
              type="text"
              placeholder="Search by subject or topic..."
              className="w-full pl-14 pr-6 py-5 bg-white border-2 border-slate-100 rounded-[1.5rem] focus:border-[#064e3b] outline-none font-bold text-slate-800 transition-all shadow-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex bg-slate-100 p-1.5 rounded-[1.5rem] h-fit self-center">
            {["all", "upcoming", "ongoing", "finished"].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status as any)}
                className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  statusFilter === status
                    ? "bg-[#064e3b] text-yellow-400 shadow-lg"
                    : "text-slate-500 hover:text-[#064e3b]"
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Grid - Cards use white/emerald/yellow contrast */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredClasses.map((cls) => {
            const status = getClassStatus(cls);
            return (
              <motion.div
                key={cls._id}
                className="bg-white border-2 border-slate-50 rounded-[2.5rem] p-8 hover:border-yellow-400 transition-all group shadow-sm hover:shadow-2xl hover:shadow-emerald-900/5 relative overflow-hidden"
              >
                {/* Status Badge */}
                <div className="flex justify-between items-start mb-8">
                  <div className="px-4 py-1.5 bg-slate-900 text-yellow-400 rounded-lg text-[9px] font-black uppercase tracking-widest">
                    {cls.subjectId?.code || "GEN"}
                  </div>
                  <div
                    className={`flex items-center gap-2 px-3 py-1 rounded-full text-[9px] font-black uppercase border-2 ${
                      status === "ongoing"
                        ? "border-yellow-400 bg-yellow-400 text-[#064e3b] animate-pulse"
                        : "border-slate-100 text-slate-400"
                    }`}
                  >
                    <Circle size={8} className="fill-current" /> {status}
                  </div>
                </div>

                <h3 className="text-2xl font-black text-[#064e3b] mb-2 leading-tight group-hover:text-black transition-colors">
                  {cls.title}
                </h3>
                <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mb-8">
                  {cls.subjectId?.name}
                </p>

                <div className="space-y-4 pt-6 border-t border-slate-50 mb-8">
                  <div className="flex items-center gap-3 text-slate-600 font-bold text-sm">
                    <Calendar size={18} className="text-[#064e3b]" />
                    {new Date(cls.date).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-3 text-slate-600 font-bold text-sm">
                    <Clock size={18} className="text-[#064e3b]" />
                    {cls.time}{" "}
                    <span className="text-slate-300">({cls.duration}m)</span>
                  </div>
                </div>

                <button
                  onClick={() =>
                    navigate(
                      `/webrtc/${cls._id}/${encodeURIComponent(cls.title)}/${
                        cls.subjectId?.name
                      }`
                    )
                  }
                  disabled={status === "finished"}
                  className={`w-full py-4 rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] transition-all flex items-center justify-center gap-2 ${
                    status === "finished"
                      ? "bg-slate-100 text-slate-300 cursor-not-allowed"
                      : "bg-[#064e3b] text-yellow-400 hover:bg-slate-900 shadow-xl shadow-emerald-900/10"
                  }`}
                >
                  <PlusCircle size={16} />{" "}
                  {status === "ongoing" ? "Join Now" : "Enter Room"}
                </button>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
