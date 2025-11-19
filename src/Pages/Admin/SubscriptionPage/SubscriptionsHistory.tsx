/* ─────────────────────────────────────────────────────────────────────────────
   SubscriptionsHistory.tsx – FINAL (Green Theme Version)
   ───────────────────────────────────────────────────────────────────────────── */
import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { BASE_URL } from "../../../Redux/baseurl";
import {
  Calendar,
  User,
  AlertCircle,
  ChevronRight,
  Search,
} from "lucide-react";

/* ──────────────────────── Types ──────────────────────── */
interface FeeItem {
  lessonFee: {
    _id: string;
    amount?: number;
    paid?: { timestamp?: string };
  };
  student: { firstName?: string; lastName?: string } | null;
  classInfo: { _id: string; title?: string } | null;
}

/* ──────────────────────── Helpers ──────────────────────── */
const formatCurrency = (amount?: number): string => {
  if (!amount) return "₦0.00";
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
  }).format(amount);
};

const formatDate = (dateStr?: string): string => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const groupByMonth = (items: FeeItem[]) => {
  const grouped: Record<string, FeeItem[]> = {};
  items
    .sort((a, b) => {
      const dateA = a.lessonFee.paid?.timestamp || "";
      const dateB = b.lessonFee.paid?.timestamp || "";
      return dateB.localeCompare(dateA);
    })
    .forEach((item) => {
      const date = item.lessonFee.paid?.timestamp;
      if (!date) return;
      const monthYear = new Date(date).toLocaleString("en-US", {
        month: "long",
        year: "numeric",
      });
      grouped[monthYear] ??= [];
      grouped[monthYear].push(item);
    });
  return grouped;
};

/* ──────────────────────── Custom Spinner Loader ──────────────────────── */
const SpinnerLoader = () => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/70 backdrop-blur-sm">
    <div className="flex flex-col items-center space-y-4">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-gray-200 rounded-full"></div>
        <div className="absolute top-0 left-0 w-16 h-16 border-4 border-green-700 rounded-full border-t-transparent animate-spin"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-green-700 rounded-full"></div>
      </div>
      <p className="text-sm font-medium text-gray-700">Loading payments...</p>
    </div>
  </div>
);

/* ──────────────────────── Main Component ──────────────────────── */
const SubscriptionsHistory = ({ payerId }: { payerId: string }) => {
  const [history, setHistory] = useState<FeeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const { data } = await axios.get(
          `${BASE_URL}/api/payment/yare/pay/lesson-fees/history/${payerId}`
        );
        if (data.success && Array.isArray(data.data)) {
          setHistory(data.data);
        }
      } catch (err) {
        console.error("Failed to load payment history:", err);
      } finally {
        setLoading(false);
      }
    };
    if (payerId) fetchHistory();
  }, [payerId]);

  const filteredHistory = useMemo(() => {
    if (!searchQuery.trim()) return history;
    const query = searchQuery.toLowerCase();
    return history.filter((item) => {
      const studentName = `${item.student?.firstName || ""} ${
        item.student?.lastName || ""
      }`.toLowerCase();
      const classTitle = item.classInfo?.title?.toLowerCase() || "";
      return studentName.includes(query) || classTitle.includes(query);
    });
  }, [history, searchQuery]);

  const grouped = groupByMonth(filteredHistory);
  const months = Object.keys(grouped);

  return (
    <div className="relative min-h-screen bg-gray-50 py-6 pt-24 px-4 sm:px-6">
      {loading && <SpinnerLoader />}

      <div className="mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-green-700" />
            Payment History
          </h1>
          <p className="text-sm text-gray-600 mt-1">All lesson fee payments</p>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by student or class..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-700 focus:border-transparent transition-all"
            />
          </div>
        </div>

        {/* Empty / No Results */}
        {searchQuery && months.length === 0 && (
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">
              No payments match your search.
            </p>
          </div>
        )}

        {months.length === 0 && !searchQuery && (
          <div className="text-center py-12">
            <div className="bg-gray-200 border-2 border-dashed rounded-xl w-16 h-16 mx-auto mb-4" />
            <p className="text-gray-500 text-sm">No payments yet</p>
          </div>
        )}

        {/* Payment Cards */}
        <div className="space-y-6">
          {months.map((month) => (
            <section
              key={month}
              className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
            >
              {/* Month Header */}
              <div className="bg-gradient-to-r from-gray-100 to-gray-200 px-5 py-3 border-b border-gray-300">
                <h2 className="text-sm font-semibold text-gray-700 text-right tracking-wide">
                  {month}
                </h2>
              </div>
              {/* Cards */}
              <div className="p-2 space-y-2">
                {grouped[month].map(({ lessonFee, student, classInfo }) => {
                  const hasStudent = student && student.firstName;
                  const hasClass = classInfo && classInfo.title;

                  return (
                    <div
                      key={lessonFee._id}
                      onClick={() =>
                        hasClass && navigate(`/class-details/${classInfo._id}`)
                      }
                      className={`
                           group grid grid-cols-12 gap-3 p-4 rounded-lg transition-all
                           ${
                             hasClass
                               ? "cursor-pointer bg-white"
                               : ""
                           }
                         `}
                    >
                      {/* Student */}
                      <div className="col-span-5 flex items-center gap-3">
                        <div
                          className={`p-2 rounded-full ${
                            hasStudent ? "bg-[#023009]" : "bg-[#023009]"
                          }`}
                        >
                          {hasStudent ? (
                            <User className="w-4 h-4 text-white" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-white" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs text-gray-600 font-medium">
                            Student
                          </p>
                          <p className="text-sm font-semibold text-gray-900 truncate">
                            {hasStudent
                              ? `${student.firstName} ${
                                  student.lastName || ""
                                }`.trim()
                              : "Not Available"}
                          </p>
                        </div>
                      </div>

                      {/* Class */}
                      <div className="col-span-4 flex items-center">
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-gray-600 font-medium">
                            Class
                          </p>
                          <p className="text-sm font-semibold text-gray-900 truncate">
                            {hasClass ? classInfo.title : "Unknown"}
                          </p>
                        </div>
                      </div>

                      {/* Date + Amount */}
                      <div className="col-span-3 flex items-center justify-end gap-3">
                        <div className="text-right">
                          <p className="text-xs text-gray-500">
                            {formatDate(lessonFee.paid?.timestamp)}
                          </p>
                          <p className="text-sm font-bold text-green-700">
                            {formatCurrency(lessonFee.amount)}
                          </p>
                        </div>
                        {hasClass && (
                          <ChevronRight className="w-4 h-4 text-green-700 opacity-0 group-hover:opacity-100 transition-opacity" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
};

/* ──────────────────────── Page Wrapper ──────────────────────── */
const SubscriptionsHistoryPage = () => {
  const [payerId, setPayerId] = useState("");

  useEffect(() => {
    const userJson = localStorage.getItem("user");
    if (userJson) {
      try {
        const user = JSON.parse(userJson);
        if (user?._id) setPayerId(user._id);
      } catch {
        console.error("Invalid user in localStorage");
      }
    }
  }, []);

  return payerId ? <SubscriptionsHistory payerId={payerId} /> : null;
};

export default SubscriptionsHistoryPage;
