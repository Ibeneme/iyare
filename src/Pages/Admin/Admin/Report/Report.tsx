import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { fetchReports } from "../../../../Redux/Slices/SettingsSlice";
import { AnimatePresence, motion } from "framer-motion";
import {
  Loader2,
  Mail,
  FileText,
  Calendar,
  ChevronRight,
  AlertCircle,
  Inbox,
} from "lucide-react";

const Reports: React.FC = () => {
  const dispatch = useDispatch();
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<any>(null);

  useEffect(() => {
    setLoading(true);
    dispatch(fetchReports() as any)
      .unwrap()
      .then((data: any) => {
        setReports(data);
        setLoading(false);
      })
      .catch((err: any) => {
        console.log(err);
        setError("Failed to synchronize reports. Please try again.");
        setLoading(false);
      });
  }, [dispatch]);

  const handleOpenModal = (report: any) => {
    setSelectedReport(report);
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#fcfdfc] py-8 px-4 sm:px-6 lg:px-10">
      {loading ? (
        <div className="fixed inset-0 flex flex-col items-center justify-center bg-white/90 backdrop-blur-md z-[100]">
          <Loader2 className="w-16 h-16 animate-spin text-[#064e3b]" />
          <p className="mt-6 text-[10px] font-black uppercase tracking-[0.4em] text-[#064e3b]">
            Fetching Intelligence...
          </p>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mt-10">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 rounded-lg text-[#064e3b] text-[10px] font-black uppercase tracking-widest border border-emerald-100">
                <FileText size={12} className="text-yellow-600" />{" "}
                Administrative Audit
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-[#064e3b] tracking-tighter">
                Reports Log
              </h1>
              <p className="text-slate-500 font-bold max-w-xl leading-relaxed">
                Review submitted institutional reports. Click any entry to view
                full details and initiate a formal response.
              </p>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-5 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3"
            >
              <AlertCircle className="text-red-600" size={20} />
              <p className="text-xs font-black uppercase tracking-widest text-red-600">
                {error}
              </p>
            </motion.div>
          )}

          {/* Reports Content */}
          {reports.length === 0 ? (
            <div className="text-center py-24 bg-white rounded-[3rem] border border-slate-100 shadow-sm">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Inbox size={32} className="text-slate-200" />
              </div>
              <h2 className="text-xl font-black text-[#064e3b] tracking-tighter">
                No Reports Found
              </h2>
              <p className="text-slate-400 font-bold text-sm uppercase tracking-widest mt-2">
                Database is currently empty
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-100">
                      <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Sender Email
                      </th>
                      <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Subject Title
                      </th>
                      <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Preview
                      </th>
                      <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Timestamp
                      </th>
                      <th className="px-8 py-6 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {reports.map((report: any, index: number) => (
                      <tr
                        key={report._id || index}
                        onClick={() => handleOpenModal(report)}
                        className="group hover:bg-emerald-50/30 transition-all cursor-pointer"
                      >
                        <td className="px-8 py-5">
                          <span className="font-black text-[#064e3b] text-sm tracking-tight">
                            {report.email}
                          </span>
                        </td>
                        <td className="px-8 py-5">
                          <span className="inline-flex px-3 py-1 bg-yellow-400 text-[#064e3b] text-[10px] font-black uppercase tracking-widest rounded-lg">
                            {report.title}
                          </span>
                        </td>
                        <td className="px-8 py-5">
                          <p className="text-slate-500 font-bold text-sm truncate max-w-[200px]">
                            {report.description}
                          </p>
                        </td>
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-2 text-slate-400 font-black text-[10px] uppercase tracking-widest">
                            <Calendar size={12} />
                            {new Date(report.createdAt).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-8 py-5 text-right">
                          <div className="inline-flex p-3 rounded-xl text-[#064e3b] group-hover:bg-yellow-400 transition-all">
                            <ChevronRight size={18} />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Modal System */}
          <AnimatePresence>
            {isModalOpen && selectedReport && (
              <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsModalOpen(false)}
                  className="fixed inset-0 bg-[#064e3b]/15 backdrop-blur-sm"
                />
                <motion.div
                  initial={{ scale: 0.95, y: 30 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.95, y: 30 }}
                  className="relative bg-white rounded-[3rem] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col"
                >
                  {/* Modal Header */}
                  <div className="bg-[#064e3b] p-10 md:p-12 text-white">
                    <div className="flex justify-between items-start mb-6">
                      <div className="space-y-2">
                        <p className="text-yellow-400 font-black text-[10px] uppercase tracking-[0.3em]">
                          Official Report Detail
                        </p>
                        <h3 className="text-3xl font-black tracking-tighter leading-none">
                          {selectedReport.title}
                        </h3>
                      </div>
                      <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
                        <FileText className="text-yellow-400" />
                      </div>
                    </div>
                    <div className="flex items-center gap-3 px-4 py-2 bg-white/5 rounded-xl border border-white/10 w-fit">
                      <Mail size={14} className="text-yellow-400" />
                      <span className="text-sm font-bold text-emerald-50">
                        {selectedReport.email}
                      </span>
                    </div>
                  </div>

                  {/* Modal Body */}
                  <div className="p-10 md:p-12 space-y-8">
                    <div className="space-y-4">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full" />
                        Report Narrative
                      </h4>
                      <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100 max-h-72 overflow-y-auto custom-scrollbar">
                        <p className="text-slate-700 font-bold leading-relaxed whitespace-pre-wrap">
                          {selectedReport.description}
                        </p>
                      </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex flex-col md:flex-row gap-4 pt-6">
                      <a
                        href={`mailto:${
                          selectedReport.email
                        }?subject=Formal Response: ${encodeURIComponent(
                          selectedReport.title
                        )}`}
                        className="flex-[2] inline-flex items-center justify-center gap-3 bg-[#064e3b] text-yellow-400 py-6 rounded-3xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-emerald-900/20 hover:bg-emerald-800 transition-all"
                      >
                        <Mail size={18} />
                        Initiate Email Response
                      </a>
                      <button
                        onClick={() => setIsModalOpen(false)}
                        className="flex-1 bg-slate-100 text-slate-400 py-6 rounded-3xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default Reports;
