import { useEffect, useState, useMemo } from "react";
import {
  Loader2,
  Search,
  FileText,
  Notebook,
  Megaphone,
  ChevronRight,
  X,
  Calendar,
  AlertCircle,
  RotateCcw,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../../../store/index";
import { fetchAllResources } from "../../../store/features/resources/resources.slice";
import { PageHeader, Panel, EmptyState } from "../../../components/ui";
import { day } from "../../../lib/format";

type CategoryFilter = "all" | "assignments" | "notes" | "announcements";

interface ResourceItem {
  _id: string;
  title: string;
  description?: string;
  createdAt: string;
  type?: string;
  subjectName?: string;
  subjectCode?: string;
}

interface SubjectBucket {
  subjectId: string;
  name: string;
  code: string;
  resources: {
    assignments?: ResourceItem[];
    notes?: ResourceItem[];
    announcements?: ResourceItem[];
    [key: string]: ResourceItem[] | undefined;
  };
}

const CATEGORIES: {
  key: CategoryFilter;
  label: string;
  icon: typeof FileText;
}[] = [
  { key: "all", label: "All", icon: FileText },
  { key: "assignments", label: "Assignments", icon: FileText },
  { key: "notes", label: "Notes", icon: Notebook },
  { key: "announcements", label: "Announcements", icon: Megaphone },
];

export default function AssignmentsManager() {
  const dispatch = useDispatch<AppDispatch>();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>("all");
  const [parentData, setParentData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedResource, setSelectedResource] = useState<ResourceItem | null>(
    null,
  );

  const loadData = () => {
    setLoading(true);
    setError(null);
    dispatch(fetchAllResources())
      .unwrap()
      .then((res: any) => setParentData(res?.data || []))
      .catch((err) =>
        setError(err?.message || "Failed to sync study materials"),
      )
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, [dispatch]);

  const allSubjects: SubjectBucket[] = useMemo(
    () => parentData.flatMap((admin) => admin.data || []),
    [parentData],
  );

  const filteredSubjects = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return allSubjects
      .map((subj) => {
        const resObj = subj.resources || {};
        const matchesSubject =
          !q ||
          subj.name?.toLowerCase().includes(q) ||
          subj.code?.toLowerCase().includes(q);

        const filterList = (list: ResourceItem[] = []) =>
          !q || matchesSubject
            ? list
            : list.filter(
                (r) =>
                  r.title?.toLowerCase().includes(q) ||
                  r.description?.toLowerCase().includes(q),
              );

        const assignments =
          activeCategory === "all" || activeCategory === "assignments"
            ? filterList(resObj.assignments)
            : [];
        const notes =
          activeCategory === "all" || activeCategory === "notes"
            ? filterList(resObj.notes)
            : [];
        const announcements =
          activeCategory === "all" || activeCategory === "announcements"
            ? filterList(resObj.announcements)
            : [];

        const totalMatching =
          assignments.length + notes.length + announcements.length;

        return {
          ...subj,
          visibleResources: { assignments, notes, announcements },
          totalMatching,
        };
      })
      .filter((subj) => subj.totalMatching > 0);
  }, [allSubjects, searchQuery, activeCategory]);

  const totals = useMemo(() => {
    let assignments = 0;
    let notes = 0;
    let announcements = 0;
    for (const s of allSubjects) {
      assignments += s.resources?.assignments?.length || 0;
      notes += s.resources?.notes?.length || 0;
      announcements += s.resources?.announcements?.length || 0;
    }
    return {
      all: assignments + notes + announcements,
      assignments,
      notes,
      announcements,
    };
  }, [allSubjects]);

  const renderGroup = (
    title: string,
    items: ResourceItem[] | undefined,
    Icon: typeof FileText,
    subj: SubjectBucket,
  ) => {
    if (!items || items.length === 0) return null;

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-medium text-[var(--color-muted)]">
          <span className="inline-flex items-center gap-1.5">
            <Icon size={13} />
            <span>{title}</span>
          </span>
          <span>{items.length}</span>
        </div>

        <div className="divide-y divide-[var(--color-card-border)] rounded-2xl bg-[var(--row-bg)] border border-[var(--color-card-border)] px-3.5">
          {items.map((item) => (
            <button
              key={item._id}
              type="button"
              onClick={() =>
                setSelectedResource({
                  ...item,
                  type: title,
                  subjectName: subj.name,
                  subjectCode: subj.code,
                })
              }
              className="w-full py-3 flex items-center justify-between gap-3 text-left group hover:opacity-90 transition-opacity"
            >
              <div className="min-w-0 flex-1">
                <h4 className="font-medium text-sm text-[var(--color-primary)] truncate">
                  {item.title}
                </h4>
                <p className="text-xs text-[var(--color-muted)] mt-0.5 flex items-center gap-1.5">
                  <Calendar size={12} className="shrink-0" />
                  <span>{item.createdAt ? day(item.createdAt) : "—"}</span>
                </p>
              </div>
              <ChevronRight
                size={16}
                className="text-[var(--color-muted)] group-hover:text-[var(--color-primary)] group-hover:translate-x-0.5 transition-all shrink-0"
              />
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="page space-y-4 sm:space-y-6">
      <PageHeader
        eyebrow="Curriculum"
        title="Assignments & notes"
        highlight="notes"
        subtitle="Browse homework tasks, class notes, and announcements across subjects."
      />

      {error && !loading && (
        <div className="p-4 bg-[var(--color-danger-bg)] border border-[var(--color-card-border)] rounded-2xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-sm font-medium text-[var(--color-danger)]">
            <AlertCircle size={18} className="shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={loadData}
            className="btn btn-secondary inline-flex items-center gap-1.5 shrink-0"
          >
            <RotateCcw size={14} /> Retry
          </button>
        </div>
      )}

      <Panel
        title={
          loading
            ? "Study materials"
            : `Study materials (${filteredSubjects.length} ${
                filteredSubjects.length === 1 ? "subject" : "subjects"
              })`
        }
        actions={
          <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2.5 w-full sm:w-auto">
            <div className="relative w-full sm:w-60">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)] pointer-events-none"
              />
              <input
                type="text"
                placeholder="Search subject or topic…"
                aria-label="Search assignments and notes"
                className="form-input w-full !pl-9 !min-h-0 !py-1.5 text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto">
              {CATEGORIES.map(({ key, label }) => {
                const active = activeCategory === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setActiveCategory(key)}
                    className={`btn !min-h-0 !py-1.5 !px-3 text-xs whitespace-nowrap ${
                      active ? "btn-primary" : "btn-secondary"
                    }`}
                  >
                    <span>{label}</span>
                    <span className="opacity-75">({totals[key]})</span>
                  </button>
                );
              })}
            </div>
          </div>
        }
      >
        {loading ? (
          <div className="flex flex-col items-center justify-center py-14 gap-3 text-[var(--color-muted)]">
            <Loader2 className="w-7 h-7 animate-spin text-[var(--color-primary)]" />
            <p className="text-xs font-medium">Loading study materials…</p>
          </div>
        ) : filteredSubjects.length === 0 ? (
          <EmptyState
            title="No materials match"
            text={
              searchQuery.trim() || activeCategory !== "all"
                ? "Try clearing your search or switching back to All."
                : "No assignments, notes, or announcements have been posted yet."
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 items-start">
            {filteredSubjects.map((subj) => {
              const { assignments, notes, announcements } =
                subj.visibleResources;

              return (
                <div
                  key={subj.subjectId}
                  className="rounded-2xl border border-[var(--color-card-border)] bg-[var(--color-card)] p-4 space-y-4"
                >
                  <div className="flex items-start justify-between gap-2 pb-3 border-b border-[var(--color-card-border)]">
                    <div className="min-w-0">
                      {subj.code && (
                        <span className="text-[11px] uppercase tracking-wide px-2 py-0.5 rounded-full bg-[var(--row-bg)] text-[var(--color-muted)] inline-block mb-1">
                          {subj.code}
                        </span>
                      )}
                      <h3 className="font-semibold text-sm sm:text-base text-[var(--color-primary)] truncate">
                        {subj.name}
                      </h3>
                    </div>
                    <span className="text-xs text-[var(--color-muted)] shrink-0">
                      {subj.totalMatching}{" "}
                      {subj.totalMatching === 1 ? "item" : "items"}
                    </span>
                  </div>

                  <div className="space-y-4">
                    {renderGroup("Assignments", assignments, FileText, subj)}
                    {renderGroup("Notes", notes, Notebook, subj)}
                    {renderGroup(
                      "Announcements",
                      announcements,
                      Megaphone,
                      subj,
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Panel>

      {/* Material Reader Modal */}
      <AnimatePresence>
        {selectedResource && (
          <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center p-3 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedResource(null)}
              className="fixed inset-0 bg-black/45 backdrop-blur-xs"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.98, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 12 }}
              transition={{ duration: 0.16, ease: "easeOut" }}
              className="relative bg-[var(--color-card)] border border-[var(--color-card-border)] rounded-t-3xl sm:rounded-3xl shadow-[var(--shadow-elevated)] w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
            >
              <div className="px-5 py-4 sm:px-6 sm:py-5 border-b border-[var(--color-card-border)] flex items-center justify-between gap-4 shrink-0">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base sm:text-lg font-semibold text-[var(--color-primary)] truncate">
                      {selectedResource.title}
                    </h3>
                    {selectedResource.type && (
                      <span className="text-[11px] uppercase tracking-wide px-2 py-0.5 rounded-full bg-[var(--row-bg)] text-[var(--color-muted)] shrink-0">
                        {selectedResource.type}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[var(--color-muted)] mt-0.5">
                    {selectedResource.subjectName}
                    {selectedResource.subjectCode
                      ? ` (${selectedResource.subjectCode})`
                      : ""}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedResource(null)}
                  aria-label="Close material details"
                  className="p-2 rounded-xl text-[var(--color-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--row-bg)] transition-colors shrink-0"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="overflow-y-auto flex-1 px-5 sm:px-6 py-4 space-y-4 text-sm">
                <div className="p-3.5 rounded-2xl bg-[var(--row-bg)] border border-[var(--color-card-border)] flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div>
                    <span className="form-label block mb-0.5">Subject</span>
                    <span className="font-medium text-sm text-[var(--color-primary)]">
                      {selectedResource.subjectName}
                    </span>
                  </div>
                  <div>
                    <span className="form-label block mb-0.5">Posted</span>
                    <span className="inline-flex items-center gap-1.5 font-medium text-sm text-[var(--color-primary)]">
                      <Calendar
                        size={14}
                        className="text-[var(--color-muted)] shrink-0"
                      />
                      <span>
                        {selectedResource.createdAt
                          ? new Date(
                              selectedResource.createdAt,
                            ).toLocaleString()
                          : "—"}
                      </span>
                    </span>
                  </div>
                </div>

                <div>
                  <span className="form-label block mb-1.5">Details</span>
                  <div className="p-4 rounded-2xl bg-[var(--row-bg)] border border-[var(--color-card-border)] max-h-60 overflow-y-auto text-sm leading-relaxed whitespace-pre-wrap break-words text-[var(--color-primary)]">
                    {selectedResource.description ||
                      "No additional details provided."}
                  </div>
                </div>
              </div>

              <div className="px-5 py-4 sm:px-6 border-t border-[var(--color-card-border)] bg-[var(--row-bg)]/50 flex justify-end shrink-0">
                <button
                  type="button"
                  onClick={() => setSelectedResource(null)}
                  className="btn btn-primary w-full sm:w-auto justify-center"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
