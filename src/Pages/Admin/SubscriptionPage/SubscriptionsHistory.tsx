import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { BASE_URL } from "../../../Redux/baseurl";
import "./SubscriptionsHistory.css";
import Loader from "../../../Components/Loader/Loader";

interface ClassInfo {
  _id: string;
  title: string;
  [key: string]: any;
}

interface LessonFee {
  _id: string;
  amount?: number;
  studentId: string;
  payerId: string;
  payerModel?: string;
  paid?: {
    timestamp?: string;
  };
  [key: string]: any;
}

interface Student {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  [key: string]: any;
}

interface FeeWithStudent {
  lessonFee: LessonFee;
  student: Student;
  classInfo: ClassInfo;
}

// Function to group payments by month and sort them
const groupAndSortHistory = (history: FeeWithStudent[]) => {
  const grouped: { [key: string]: FeeWithStudent[] } = {};

  // Sort payments in descending order (most recent first)
  const sortedHistory = [...history].sort((a, b) => {
    const dateA = a.lessonFee.paid?.timestamp
      ? new Date(a.lessonFee.paid.timestamp).getTime()
      : 0;
    const dateB = b.lessonFee.paid?.timestamp
      ? new Date(b.lessonFee.paid.timestamp).getTime()
      : 0;
    return dateB - dateA;
  });

  sortedHistory.forEach((item) => {
    if (item.lessonFee.paid?.timestamp) {
      const date = new Date(item.lessonFee.paid.timestamp);
      const monthYear = date.toLocaleString("en-US", {
        month: "long",
        year: "numeric",
      });

      if (!grouped[monthYear]) {
        grouped[monthYear] = [];
      }
      grouped[monthYear].push(item);
    }
  });

  return grouped;
};

const SubscriptionsHistory = ({ payerId }: { payerId: string }) => {
  const [history, setHistory] = useState<FeeWithStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchLessonFees = async () => {
      try {
        const res = await axios.get(
          `${BASE_URL}/api/payment/yare/pay/lesson-fees/history/${payerId}`
        );
        if (res.data.success) {
          setHistory(res.data.data);
          console.log(res.data.data, 'res.data.data')
        }
      } catch (error) {
        console.error("❌ Error fetching lesson fees:", error);
      } finally {
        setLoading(false);
      }
    };

    if (payerId) fetchLessonFees();
  }, [payerId]);

  const handleClassClick = (class_id: string) => {
    navigate(`/class-details/${class_id}`);
  };

  if (loading) return <Loader />

  const groupedHistory = groupAndSortHistory(history);
  const monthKeys = Object.keys(groupedHistory);

  return (
    <div className="subscriptions-history">
      <h2>Lesson Fee Payment History</h2>
      <p>
        View a detailed history of all lesson fee payments, organized by month.
      </p>

      {monthKeys.length === 0 ? (
        <p className="no-payments">No payments found.</p>
      ) : (
        <div className="history-list">
          {monthKeys.map((monthYear) => (
            <div key={monthYear} className="monthly-group">
              <h3>{monthYear}</h3>
              <ul>
                {groupedHistory[monthYear].map(
                  ({ lessonFee, student, classInfo }) => (
                    <div
                      key={lessonFee._id}
                      className="history-item"
                      onClick={() => handleClassClick(classInfo._id)}
                    >
                      <div className="item-details">
                        <p>
                          <strong>Student:</strong> {student?.firstName}{" "}
                          {student?.lastName}
                        </p>
                        <p>
                          <strong>Class:</strong>{" "}
                          <span className="clickable-class-title">
                            {classInfo?.title || "N/A"}
                          </span>
                        </p>
                        <p>
                          <strong>Date Paid:</strong>{" "}
                          {lessonFee.paid?.timestamp
                            ? new Date(
                                lessonFee.paid.timestamp
                              ).toLocaleDateString()
                            : "Not Available"}
                        </p>
                      </div>
                      <div className="item-amount">
                        ₦
                        {lessonFee.amount ? lessonFee.amount.toFixed(2) : "N/A"}
                      </div>
                    </div>
                  )
                )}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SubscriptionsHistory;
