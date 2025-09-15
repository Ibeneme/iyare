import React, { useState, useEffect } from "react";
import "./SettingReport.css";
import { useDispatch } from "react-redux";
import { submitReport } from "../../../../../Redux/Settings/settingsSlice";
import Loader from "../../../../../Components/Loader/Loader";
import { useToast } from "../../../../../Context/ToastProvider";

const SettingReport: React.FC = () => {
  const dispatch = useDispatch();
  const { addToast } = useToast();

  const [reportTitle, setReportTitle] = useState("");
  const [reportDescription, setReportDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("yare@admin.com");

  useEffect(() => {
    const storedEmail = localStorage.getItem("yareemail");
    if (storedEmail && storedEmail.includes("@")) {
      setEmail(storedEmail);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const resultAction = await dispatch(
        submitReport({
          email,
          title: reportTitle,
          description: reportDescription,
        }) as any
      );

      if (submitReport.fulfilled.match(resultAction)) {
        addToast("success", "✅ Report submitted successfully!");
        setReportTitle("");
        setReportDescription("");
      } else {
        throw new Error(resultAction.payload || "❌ Failed to submit report.");
      }
    } catch (err: any) {
      const errorMsg = err.message || "❌ An unexpected error occurred.";
      addToast("error", errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="settings-report-container">
      {loading ? (
        <Loader />
      ) : (
        <>
          <p>
            If you encounter any issues or have a suggestion, please fill out
            the form below.
          </p>

          <form onSubmit={handleSubmit} className="report-form">
            <div className="form-group">
              <label htmlFor="title">Report Title</label>
              <input
                id="title"
                type="text"
                value={reportTitle}
                onChange={(e) => setReportTitle(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                value={reportDescription}
                onChange={(e) => setReportDescription(e.target.value)}
                rows={5}
                required
              />
            </div>
            <button type="submit" className="submit-btn">
              Submit Report
            </button>
          </form>

          <div className="support-info">
            <p>
              Alternatively, you can reach out to our support team directly at:
            </p>
            <a href={`mailto:${email}`}>{email}</a>
          </div>
        </>
      )}
    </div>
  );
};

export default SettingReport;
