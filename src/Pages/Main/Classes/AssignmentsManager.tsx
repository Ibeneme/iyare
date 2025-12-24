import { useEffect, useState, useMemo } from "react";
import {
  Loader2,
  Search,
  FileText,
  Notebook,
  Megaphone,
  ChevronRight,

  X,

  BookOpen,

} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../../../Redux/store";
import { fetchAllResources } from "../../../Redux/Slices/resources.slice";

export default function AssignmentsManager() {
  const dispatch = useDispatch<AppDispatch>();
  const [searchQuery, setSearchQuery] = useState("");
  const [parentData, setParentData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedResource, setSelectedResource] = useState<any>(null);

  useEffect(() => {
    dispatch(fetchAllResources())
      .unwrap()
      .then((res: any) => setParentData(res?.data || []))
      .catch((err) => setError(err?.message || "Sync Failed"))
      .finally(() => setLoading(false));
  }, [dispatch]);

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("en-NG", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
    console.log(error)
  const filteredSubjects = useMemo(() => {
    const allSubjects = parentData.flatMap((admin) => admin.data || []);
    if (!searchQuery.trim()) return allSubjects;
    const q = searchQuery.toLowerCase();
    return allSubjects.filter(
      (subj) =>
        subj.name.toLowerCase().includes(q) ||
        subj.code.toLowerCase().includes(q) ||
        Object.values(subj.resources).some((arr: any) =>
          arr.some((r: any) => r.title.toLowerCase().includes(q))
        )
    );
  }, [parentData, searchQuery]);

  // Helper to render a group of resources
  const ResourceSection = ({
    title,
    items,
    icon: Icon,
    colorClass,
    subj,
  }: any) => {
    if (!items || items.length === 0) return null;
    return (
      <div className="space-y-3 pt-4">
        <div className="flex items-center gap-2 mb-2">
          <Icon size={14} className={colorClass} />
          <h3
            className={`text-[10px] font-black uppercase tracking-[0.2em] ${colorClass}`}
          >
            {title} ({items.length})
          </h3>
        </div>
        <div className="space-y-2">
          {items.map((item: any) => (
            <button
              key={item._id}
              onClick={() =>
                setSelectedResource({
                  ...item,
                  type: title,
                  subjectName: subj.name,
                  subjectCode: subj.code,
                })
              }
              className="w-full flex items-center justify-between p-4 rounded-2xl bg-white border border-slate-100 hover:border-[#064e3b] hover:bg-emerald-50/30 transition-all text-left group"
            >
              <div className="flex-1 min-w-0">
                <h4 className="font-black text-sm text-[#064e3b] tracking-tight truncate">
                  {item.title}
                </h4>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                  Posted {formatDate(item.createdAt)}
                </p>
              </div>
              <ChevronRight
                size={16}
                className="text-slate-300 group-hover:text-[#064e3b] group-hover:translate-x-1 transition-all"
              />
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#fcfdfc] py-12 px-4 md:px-10 text-left">
      <div className="max-w-7xl mx-auto">
        {/* Header - Aligned Left */}
        <header className="mb-12 space-y-4 text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-[#064e3b] rounded-lg text-[10px] font-black uppercase tracking-widest border border-emerald-100">
            <BookOpen size={12} /> Academic Repository
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-[#064e3b] tracking-tighter">
            Curriculum Updates
          </h1>
          <div className="max-w-md relative">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Search subjects or materials..."
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl outline-none font-bold text-[#064e3b] focus:border-[#064e3b] transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </header>

        {loading ? (
          <div className="flex justify-start py-20">
            <Loader2 className="w-10 h-10 animate-spin text-[#064e3b]" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredSubjects.map((subj) => {
              const hasContent = Object.values(subj.resources).some(
                (arr: any) => arr.length > 0
              );
              if (!hasContent) return null;

              return (
                <div
                  key={subj.subjectId}
                  className="bg-slate-50/50 rounded-[2rem] p-6 border border-slate-100 flex flex-col h-full"
                >
                  {/* Subject Header */}
                  <div className="mb-6 border-b border-slate-100 pb-4">
                    <span className="text-[10px] font-black text-yellow-600 uppercase tracking-widest block mb-1">
                      {subj.code}
                    </span>
                    <h2 className="text-xl font-black text-[#064e3b] tracking-tight">
                      {subj.name}
                    </h2>
                  </div>

                  {/* Grouped Resource Content */}
                  <div className="space-y-6 divide-y divide-slate-100">
                    <ResourceSection
                      title="Assignments"
                      items={subj.resources.assignments}
                      icon={FileText}
                      colorClass="text-orange-600"
                      subj={subj}
                    />
                    <ResourceSection
                      title="Academic Notes"
                      items={subj.resources.notes}
                      icon={Notebook}
                      colorClass="text-purple-600"
                      subj={subj}
                    />
                    <ResourceSection
                      title="Announcements"
                      items={subj.resources.announcements}
                      icon={Megaphone}
                      colorClass="text-teal-600"
                      subj={subj}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal - Aligned Content Left */}
      <AnimatePresence>
        {selectedResource && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedResource(null)}
              className="absolute inset-0 bg-[#064e3b]/65 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              className="relative bg-white w-full max-w-xl rounded-[2.5rem] overflow-hidden"
            >
              <div className="p-8 md:p-10 text-left">
                <div className="flex justify-between items-start mb-6">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black text-yellow-600 uppercase tracking-widest">
                      {selectedResource.type} Entry
                    </span>
                    <h2 className="text-3xl font-black text-[#064e3b] tracking-tighter">
                      {selectedResource.title}
                    </h2>
                  </div>
                  <button
                    onClick={() => setSelectedResource(null)}
                    className="p-2 text-slate-300 hover:text-red-500 transition-all"
                  >
                    <X size={24} />
                  </button>
                </div>

                <div className="flex gap-10 mb-8 text-left">
                  <div>
                    <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">
                      Subject
                    </p>
                    <p className="text-sm font-black text-[#064e3b]">
                      {selectedResource.subjectName}
                    </p>
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">
                      Date
                    </p>
                    <p className="text-sm font-black text-[#064e3b]">
                      {formatDate(selectedResource.createdAt)}
                    </p>
                  </div>
                </div>

                <div className="space-y-3 text-left">
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                    Description
                  </p>
                  <div className="text-slate-700 font-bold leading-relaxed bg-slate-50 p-6 rounded-2xl border border-slate-100 whitespace-pre-wrap max-h-60 overflow-y-auto">
                    {selectedResource.description}
                  </div>
                </div>

                <button
                  onClick={() => setSelectedResource(null)}
                  className="w-full mt-8 py-5 bg-[#064e3b] text-yellow-400 rounded-xl font-black uppercase tracking-widest text-xs"
                >
                  Close Document
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
