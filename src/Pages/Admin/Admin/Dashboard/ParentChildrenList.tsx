import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { ThunkDispatch } from "@reduxjs/toolkit";
import { AnyAction } from "redux";
import {
  StudentChild,
  fetchParentChildren,
} from "../../../../Redux/Admin/parentChildrenSlice";
import "./ParentChildrenList.css";
import Loader from "../../../../Components/Loader/Loader";
import { useNavigate } from "react-router-dom";
import useUserRole from "../../../../Hooks/useUserRole";

type AppDispatch = ThunkDispatch<any, any, AnyAction>;

export const ParentChildrenList = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [children, setChildren] = useState<StudentChild[] | null>(null);
  const [parentName, setParentName] = useState<string | null>(null);
  const { userRole } = useUserRole();

  useEffect(() => {
    setLoading(true);
    dispatch(fetchParentChildren())
      .then((action) => {
        if (fetchParentChildren.fulfilled.match(action)) {
          const childrenList = action.payload.children;
          setChildren(childrenList);
          setParentName(action.payload.parentName);
          setError(null);

          const hasUnpaid = childrenList.some(
            (child: StudentChild) => !child.isPay
          );
          localStorage.setItem("paymentDue", hasUnpaid ? "true" : "false");
        }
      })
      .catch((action) => {
        if (fetchParentChildren.rejected.match(action)) {
          setError(action.payload || "An unknown error occurred.");
          setChildren(null);
          setParentName(null);
          localStorage.removeItem("paymentDue");
        }
      })
      .finally(() => setLoading(false));
  }, [dispatch]);

  const handlePayClick = (childId: string) => {
    navigate(`/subscriptions/${childId}`);
  };

  const handleUserDetailsClick = (id: string) => {
    navigate(`/user-details/student/${id}`);
  };

  const handleClassDetailsClick = (classId: string) => {
    navigate(`/class-details/${classId}`);
  };

  if (loading) return <Loader />;

  if (error) {
    return (
      <div className="empty-state">
        <h2 className="empty-header">No data found yet 😌</h2>
        <p className="empty-description">{error}</p>
      </div>
    );
  }

  if (!children || children.length === 0) {
    return (
      <div className="parentschildpage-status-message">
        No children found for {parentName || "this parent"}.
      </div>
    );
  }

  return (
    <div className="parentschildpage-container">
      {userRole === "parent" && (
        <>
          <h2 className="parentschildpage-title" style={{ fontWeight: 900 }}>
            Child or Ward of {parentName}
          </h2>
          <p className="parentschildpage-description">
            Below is a list of your registered children, including their courses
            and associated class details. You can view each child's enrollment
            information and upcoming classes here.
          </p>
        </>
      )}

      {userRole === "student" && (
        <>
          <h2 className="parentschildpage-title" style={{ fontWeight: 900 }}>
            You are enrolled in
          </h2>
          <p className="parentschildpage-description">
            Here’s a summary of your current class enrollments, course
            information, and upcoming lessons.
          </p>
        </>
      )}

      <ul className="parentschildpage-children-list">
        {children.map((child) => (
          <li key={child._id} className="parentschildpage-child-card">
            <div className="parentschildpage-child-header">
              <div className="parentschildpage-badges">
                <span
                  className={`parentschildpage-badge ${
                    child.isPay ? "paid" : "unpaid"
                  }`}
                >
                  {child.isPay ? "Paid" : "Yet to Pay"}
                </span>
              </div>

              <h3
                className="parentschildpage-user-name"
                onClick={() => handleUserDetailsClick(child._id)}
                style={{ cursor: "pointer", textDecoration: "underline" }}
              >
                {child.firstName} {child.lastName}
              </h3>
              <p
                onClick={() => handleUserDetailsClick(child._id)}
                style={{
                  fontSize: 11,
                  marginBottom: 24,
                  backgroundColor: "#66666621",
                  color: "#666",
                  padding: `4px 10px`,
                  borderRadius: 48,
                  width: "fit-content",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                View Profile
              </p>
              <p>Email: {child.email}</p>

              <div className="parentschildpage-courses">
                <p className="parentschildpage-label">Enrolled Courses:</p>
                {child.courseDetails?.length ? (
                  <ul className="parentschildpage-course-list">
                    {child.courseDetails.map((course) => (
                      <li
                        key={course._id}
                        className="parentschildpage-course-item"
                      >
                        {course.title}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="parentschildpage-no-course">
                    No courses found.
                  </p>
                )}
              </div>
            </div>

            {child.classes?.length ? (
              <div className="parentschildpage-class-section">
                <p className="parentschildpage-class-title">Enrolled Classes</p>
                <ul className="parentschildpage-class-list">
                  {child.classes.map((cls) => (
                    <li
                      key={cls._id}
                      className="parentschildpage-class-item"
                      onClick={() => handleClassDetailsClick(cls._id)}
                      style={{
                        cursor: "pointer",
                        backgroundColor: "#f7f7f7",
                        padding: "8px",
                        marginBottom: "6px",
                        borderRadius: "8px",
                      }}
                    >
                      <h4>{cls.title}</h4>
                      <p>
                        Time: <strong>{cls.time}</strong>
                      </p>
                      <p>
                        Duration: <strong>{cls.duration} mins</strong>
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="parentschildpage-no-class">
                No enrolled classes found.
              </p>
            )}

            <div className="parentschildpage-badges">
              {child.isPay ? (
                <span className="parentschildpage-badge paid">Paid</span>
              ) : (
                <button
                  className="parentschildpage-pay-button"
                  onClick={() => handlePayClick(child._id)}
                >
                  Pay Now
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};
