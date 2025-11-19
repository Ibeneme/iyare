import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { fetchReports } from "../../../../Redux/Slices/SettingsSlice";
import ModalDropdown from "../../../../Components/Modal/ModalDropdown";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2 } from "lucide-react";

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
        console.error("Error fetching reports:", err);
        setError("Failed to load reports. Please try again.");
        setLoading(false);
      });
  }, [dispatch]);

  const handleOpenModal = (report: any) => {
    setSelectedReport(report);
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      {loading ? (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-[100%] py-48 bg-white flex flex-col items-center justify-center gap-5 z-50"
          >
            <Loader2 className="w-14 h-14 animate-spin text-gray-900" />
            <p className="text-xl font-bold text-gray-900">
              Loading Profiles...
            </p>
          </motion.div>
        </AnimatePresence>
      ) : (
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <div className="w-10 h-10 bg-green-700 rounded-full flex items-center justify-center text-yellow-300">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              Reports Log
            </h2>
            <p className="mt-2 text-gray-600 max-w-3xl">
              Below is a list of all submitted reports, including the sender’s
              email and the title of each report. Click on any report to view
              its full description and respond directly if needed.
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Reports Table */}
          {reports.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200">
              <p className="text-gray-500">No reports available.</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Title
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Submitted At
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {reports.map((report: any, index: number) => (
                      <tr
                        key={report._id || index}
                        onClick={() => handleOpenModal(report)}
                        className="hover:bg-gray-50 transition-colors cursor-pointer"
                      >
                        <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                          {report.email}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {report.title}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 max-w-xs">
                          <span className="block truncate">
                            {report.description.length > 50
                              ? `${report.description.slice(0, 50)}...`
                              : report.description}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {new Date(report.createdAt).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Modal */}
          {isModalOpen && selectedReport && (
            <ModalDropdown
              onClose={() => {
                setIsModalOpen(false);
                setSelectedReport(null);
              }}
            >
              <div className="p-6 max-w-2xl mx-auto bg-white rounded-xl">
                {/* Header */}
                <div className="mb-6">
                  <h3 className="inline-block px-4 py-2 bg-gray-100 text-gray-900 font-semibold text-lg rounded-lg capitalize">
                    {selectedReport.title}
                  </h3>
                  <br />
                  <p className="mt-2 inline-block px-3 py-1 bg-green-800 text-yellow-300 text-xs font-medium rounded-full">
                    <strong>Sender:</strong> {selectedReport.email}
                  </p>
                </div>

                {/* Description */}
                <div className="mb-6">
                  <h4 className="text-sm font-bold text-gray-900 mb-2">
                    Description:
                  </h4>
                  <div className="max-h-64 overflow-y-auto p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {selectedReport.description}
                    </p>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end">
                  <a
                    href={`mailto:${
                      selectedReport.email
                    }?subject=Re: ${encodeURIComponent(selectedReport.title)}`}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-700 text-yellow-300 font-medium text-sm rounded-lg hover:bg-green-800 transition-colors"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                    Reply via Email
                  </a>
                </div>
              </div>
            </ModalDropdown>
          )}
        </div>
      )}
    </div>
  );
};

export default Reports;
