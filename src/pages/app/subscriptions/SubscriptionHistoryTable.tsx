import { getCookie,} from "../../../utils/cookies";
/* ─────────────────────────────────────────────────────────────────────────────
   SubscriptionsHistory.tsx – FINAL (Green Theme Version)
   ───────────────────────────────────────────────────────────────────────────── */
import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { BASE_URL } from "../../../lib/baseUrl";
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
        <div className="w-16 h-16 border-4 border-[var(--color-card-border)] rounded-full"></div>
        <div className="absolute top-0 left-0 w-16 h-16 border-4 border-green-700 rounded-full border-t-transparent animate-spin"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-green-700 rounded-full"></div>
      </div>
      <p className="text-sm font-medium text-secondary">Loading payments...</p>
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

  const total = filteredHistory.reduce((sum, h: any) => sum + (Number(h.lessonFee?.amount) || 0), 0);

  return (
    <div className="page">
      {loading && <SpinnerLoader />}

      <header className="page-header">
        <div>
          <h1 className="page-title">Payment history</h1>
          <p className="page-subtitle">All lesson fee payments</p>
        </div>
      </header>

      <section className="card p-5 sm:p-6 grid grid-cols-2 gap-4">
        <div>
          <p className="stat-label">Payments</p>
          <p className="stat-value mt-1">{filteredHistory.length}</p>
        </div>
        <div>
          <p className="stat-label">Total paid</p>
          <p className="stat-value mt-1">{formatCurrency(total)}</p>
        </div>
      </section>

      <div className="relative w-full max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-subtle pointer-events-none" />
        <input
          type="text"
          placeholder="Search by student or class"
          aria-label="Search payments"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input bg-card"
        />
      </div>

      {searchQuery && months.length === 0 && (
        <div className="card text-center py-14">
          <AlertCircle className="w-10 h-10 text-subtle mx-auto mb-3" />
          <p className="text-muted text-sm">No payments match your search.</p>
        </div>
      )}

      {months.length === 0 && !searchQuery && !loading && (
        <div className="card text-center py-14">
          <Calendar className="w-10 h-10 text-subtle mx-auto mb-3" />
          <p className="text-muted text-sm">No payments yet</p>
        </div>
      )}

      <div className="space-y-6">
        {months.map((month) => (
          <section key={month} className="card p-2 sm:p-4">
            <h2 className="px-3 pt-2 pb-3 text-sm font-medium text-muted">{month}</h2>
            <div>
              {grouped[month].map(({ lessonFee, student, classInfo }) => {
                const hasStudent = student && student.firstName;
                const hasClass = classInfo && classInfo.title;

                return (
                  <div
                    key={lessonFee._id}
                    onClick={() => hasClass && navigate(`/app/classes/${classInfo._id}`)}
                    className={`group grid grid-cols-12 gap-3 px-3 py-4 rounded-2xl items-center transition-colors border-t border-[var(--color-card-border)] first:border-t-0 ${
                      hasClass ? "cursor-pointer hover:bg-surface" : ""
                    }`}
                  >
                    <div className="col-span-12 sm:col-span-5 flex items-center gap-3 min-w-0">
                      <span className="w-9 h-9 rounded-full bg-surface text-muted grid place-items-center shrink-0">
                        {hasStudent ? <User className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                      </span>
                      <div className="min-w-0">
                        <p className="stat-label">Student</p>
                        <p className="text-sm font-medium text-primary truncate">
                          {hasStudent ? `${student.firstName} ${student.lastName || ""}`.trim() : "Not available"}
                        </p>
                      </div>
                    </div>

                    <div className="col-span-7 sm:col-span-4 min-w-0">
                      <p className="stat-label">Class</p>
                      <p className="text-sm font-medium text-primary truncate">{hasClass ? classInfo.title : "Unknown"}</p>
                    </div>

                    <div className="col-span-5 sm:col-span-3 flex items-center justify-end gap-3">
                      <div className="text-right">
                        <p className="text-xs text-muted">{formatDate(lessonFee.paid?.timestamp)}</p>
                        <p className="text-sm font-semibold text-primary">{formatCurrency(lessonFee.amount)}</p>
                      </div>
                      <span className="badge-green hidden lg:inline-flex">Paid</span>
                      {hasClass && (
                        <ChevronRight className="w-4 h-4 text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
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
  );
};

/* ──────────────────────── Page Wrapper ──────────────────────── */
const SubscriptionsHistoryPage = () => {
  const [payerId, setPayerId] = useState("");

  useEffect(() => {
    const userJson = getCookie("user");
    if (userJson) {
      try {
        const user = JSON.parse(userJson);
        if (user?._id) setPayerId(user._id);
      } catch {
        console.error("Invalid user in cookies");
      }
    }
  }, []);

  return payerId ? <SubscriptionsHistory payerId={payerId} /> : null;
};

export default SubscriptionsHistoryPage;
