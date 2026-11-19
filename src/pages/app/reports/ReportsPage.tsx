import React, { useEffect, useState, useMemo } from "react";
import { useDispatch } from "react-redux";
import { fetchReports } from "../../../store/features/settings/settings.slice";
import { AnimatePresence, motion } from "framer-motion";
import {
  Loader2,
  Mail,
  Calendar,
  ChevronRight,
  AlertCircle,
  X,
  Search,
  RotateCcw,
} from "lucide-react";
import { PageHeader, Panel, EmptyState, Avatar } from "../../../components/ui";
import { day } from "../../../lib/format";

interface ReportItem {
  _id?: string;
  email: string;
  title: string;
  description?: string;
  createdAt?: string;
}

const Reports: React.FC = () => {
  const dispatch = useDispatch();
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<ReportItem | null>(null);

  const loadReports = () => {
    setLoading(true);
    setError("");
    dispatch(fetchReports() as any)
      .unwrap()
      .then((data: ReportItem[]) => {
        setReports(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((err: any) => {
        console.log(err);
        setError("Failed to synchronize reports. Please try again.");
        setLoading(false);
      });
  };

  useEffect(() => {
    loadReports();
  }, [dispatch]);

  const handleOpenModal = (report: ReportItem) => {
    setSelectedReport(report);
    setIsModalOpen(true);
  };

  const filteredReports = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return reports;
    return reports.filter(
      (r) =>
        r.email?.toLowerCase().includes(q) ||
        r.title?.toLowerCase().includes(q) ||
        r.description?.toLowerCase().includes(q),
    );
  }, [reports, searchQuery]);

  return (
    <div className="page space-y-4 sm:space-y-6">
      <PageHeader
        eyebrow="Admin"
        title="Reports"
        highlight="Reports"
        subtitle="Feedback and issues submitted by users. Open any entry to read it and reply."
      />

      {error && (
        <div className="p-4 bg-[var(--color-danger-bg)] border border-[var(--color-card-border)] rounded-2xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-sm font-medium text-[var(--color-danger)]">
            <AlertCircle size={18} className="shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={loadReports}
            className="btn btn-secondary inline-flex items-center gap-1.5 shrink-0"
          >
            <RotateCcw size={14} /> Retry
          </button>
        </div>
      )}

      <Panel
        title={
          loading
            ? "All reports"
            : `All reports (${filteredReports.length}${
                searchQuery.trim() ? ` of ${reports.length}` : ""
              })`
        }
        actions={
          reports.length > 0 ? (
            <div className="relative w-full sm:w-64">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)] pointer-events-none"
              />
              <input
                type="text"
                placeholder="Search sender, title, details…"
                aria-label="Search reports"
                className="form-input w-full !pl-9 !min-h-0 !py-1.5 text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          ) : undefined
        }
      >
        {loading ? (
          <div className="flex flex-col items-center justify-center py-14 gap-3 text-[var(--color-muted)]">
            <Loader2 className="w-7 h-7 animate-spin text-[var(--color-primary)]" />
            <p className="text-xs font-medium">Loading reports…</p>
          </div>
        ) : filteredReports.length === 0 ? (
          <EmptyState
            title={searchQuery.trim() ? "No reports match" : "No reports yet"}
            text={
              searchQuery.trim()
                ? "Try clearing the search filter to see all submitted reports."
                : "Submitted feedback and issues will appear here when received."
            }
          />
        ) : (
          <>
            {/* Mobile card list */}
            <div className="md:hidden divide-y divide-[var(--color-card-border)]">
              {filteredReports.map((report, index) => (
                <div
                  key={report._id || index}
                  onClick={() => handleOpenModal(report)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleOpenModal(report);
                    }
                  }}
                  className="py-3.5 first:pt-1 last:pb-1 space-y-2.5 cursor-pointer group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium text-sm break-words text-[var(--color-primary)]">
                      {report.title || "Untitled report"}
                    </p>
                    <span className="text-xs text-[var(--color-muted)] shrink-0">
                      {report.createdAt ? day(report.createdAt) : "—"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Avatar name={report.email || "?"} size={28} />
                      <div className="min-w-0 leading-tight">
                        <p className="font-medium text-xs sm:text-sm truncate">
                          {report.email}
                        </p>
                        {report.description && (
                          <p className="text-xs text-[var(--color-muted)] truncate mt-0.5">
                            {report.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <ChevronRight
                      size={16}
                      className="text-[var(--color-muted)] group-hover:text-[var(--color-primary)] shrink-0"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop / tablet table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left">
                    <th className="py-2 pr-4">Sender</th>
                    <th className="py-2 px-4">Subject</th>
                    <th className="py-2 px-4">Preview</th>
                    <th className="py-2 px-4 whitespace-nowrap">Date</th>
                    <th className="py-2 pl-4 whitespace-nowrap text-right">
                      Open
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-card-border)]">
                  {filteredReports.map((report, index) => (
                    <tr
                      key={report._id || index}
                      onClick={() => handleOpenModal(report)}
                      className="cursor-pointer group hover:bg-[var(--row-bg)]/60 transition-colors"
                    >
                      <td className="py-3 pr-4">
                        <div className="inline-flex items-center gap-2.5 align-middle">
                          <Avatar name={report.email || "?"} size={26} />
                          <span className="font-medium break-all">
                            {report.email}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-medium">
                        {report.title || "Untitled report"}
                      </td>
                      <td className="py-3 px-4 text-[var(--color-muted)] max-w-[260px] truncate">
                        {report.description || "—"}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-[var(--color-muted)]">
                        {report.createdAt ? day(report.createdAt) : "—"}
                      </td>
                      <td className="py-3 pl-4 whitespace-nowrap text-right">
                        <span className="inline-flex items-center justify-center p-1.5 rounded-lg text-[var(--color-muted)] group-hover:text-[var(--color-primary)] group-hover:bg-[var(--row-bg)] transition-colors">
                          <ChevronRight size={16} />
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Panel>

      {/* Report Details Modal */}
      <AnimatePresence>
        {isModalOpen && selectedReport && (
          <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center p-3 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
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
                  <h3 className="text-base sm:text-lg font-semibold text-[var(--color-primary)] truncate">
                    {selectedReport.title || "Report details"}
                  </h3>
                  <p className="text-xs text-[var(--color-muted)] mt-0.5">
                    Submitted report entry and message details
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  aria-label="Close report details"
                  className="p-2 rounded-xl text-[var(--color-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--row-bg)] transition-colors shrink-0"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="overflow-y-auto flex-1 px-5 sm:px-6 py-4 space-y-4 text-sm">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-2xl bg-[var(--row-bg)] border border-[var(--color-card-border)]">
                    <span className="form-label block mb-1">Sender</span>
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Avatar name={selectedReport.email || "?"} size={24} />
                      <span className="font-medium break-all">
                        {selectedReport.email}
                      </span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-[var(--row-bg)] border border-[var(--color-card-border)]">
                    <span className="form-label block mb-1">Submitted</span>
                    <div className="inline-flex items-center gap-2 font-medium text-[var(--color-primary)]">
                      <Calendar
                        size={14}
                        className="text-[var(--color-muted)] shrink-0"
                      />
                      <span>
                        {selectedReport.createdAt
                          ? new Date(selectedReport.createdAt).toLocaleString()
                          : "—"}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <span className="form-label block mb-1.5">Description</span>
                  <div className="p-4 rounded-2xl bg-[var(--row-bg)] border border-[var(--color-card-border)] max-h-60 overflow-y-auto text-sm leading-relaxed whitespace-pre-wrap break-words text-[var(--color-primary)]">
                    {selectedReport.description || "No description provided."}
                  </div>
                </div>
              </div>

              <div className="px-5 py-4 sm:px-6 border-t border-[var(--color-card-border)] bg-[var(--row-bg)]/50 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn btn-secondary justify-center"
                >
                  Close
                </button>
                {selectedReport.email && (
                  <a
                    href={`mailto:${
                      selectedReport.email
                    }?subject=${encodeURIComponent(
                      `Re: ${selectedReport.title || "Report"}`,
                    )}`}
                    className="btn btn-primary inline-flex items-center justify-center gap-2"
                  >
                    <Mail size={15} /> Reply via Email
                  </a>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Reports;
