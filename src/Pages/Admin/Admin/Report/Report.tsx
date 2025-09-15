import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import "./Reports.css";
import { fetchReports } from "../../../../Redux/Settings/SettingsSlice";
import Loader from "../../../../Components/Loader/Loader";
import ModalDropdown from "../../../../Components/Modal/ModalDropdown";

const Reports: React.FC = () => {
  const dispatch = useDispatch();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
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
        console.log("Error fetching reports:", err);
        setError("Something went wrong while loading reports.");
        setLoading(false);
      });
  }, [dispatch]);

  const handleOpenModal = (report: any) => {
    setSelectedReport(report);
    setIsModalOpen(true);
  };

  // const handleCloseModal = () => {
  //   setIsModalOpen(false);
  //   setSelectedReport(null);
  // };

  if (loading) return <Loader />;

  return (
    <div className="reports-container">
      <h2 style={{ margin: 0 }}>Reports Log</h2>
      <p
        style={{
          fontSize: "14px",
          color: "#333",
          marginTop: "8px",
          marginBottom: "36px",
        }}
      >
        Below is a list of all submitted reports, including the sender’s email
        and the title of each report. Click on any report to view its full
        description and respond directly if needed.
      </p>
      {error && <p className="error-text">{error}</p>}
      {reports.length === 0 ? (
        <p>No reports available.</p>
      ) : (
        <div className="table-responsive-container">
          <table className="reports-table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Title</th>
                <th>Description</th>
                <th>Submitted At</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report: any, index: number) => (
                <tr
                  key={index}
                  onClick={() => handleOpenModal(report)}
                  className="report-row"
                >
                  <td data-label="Email">{report.email}</td>
                  <td data-label="Title">{report.title}</td>
                  <td data-label="Description">
                    {report.description.length > 30
                      ? report.description.slice(0, 30) + "..."
                      : report.description}
                  </td>
                  <td data-label="Submitted At">
                    {new Date(report.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen && selectedReport && (
        <ModalDropdown
          onClose={() => {
            setIsModalOpen(false);
            setSelectedReport(null);
          }}
        >
          <div className="">
            <div className="">
              <div className="modal-header">
                <h3
                  style={{
                    background: "#66666621",
                    color: "black",
                    textTransform: "capitalize",
                    padding: "8px 12px",
                    width: "fit-content",
                    fontSize: "16px",
                  }}
                >
                  Title: {selectedReport.title}
                </h3>
                <p
                  style={{
                    fontSize: "12px",
                    backgroundColor: "darkgreen",
                    color: "yellow",
                    textAlign: "left",
                    width: "fit-content",
                    padding: "4px 8px",
                    marginTop: "4px",
                  }}
                >
                  <strong>Sender:</strong> {selectedReport.email}
                </p>
              </div>

              <div className="modal-body" style={{ marginTop: "24px" }}>
                <h4
                  style={{
                    fontSize: "14px",
                    fontWeight: "bold",
                    color: "black",
                    marginBottom: "8px",
                  }}
                >
                  Description:
                </h4>
                <div className="modal-description-scroll">
                  <p
                    style={{
                      fontSize: "12px",
                      color: "black",
                      marginBottom: "24px",
                    }}
                  >
                    {selectedReport.description}
                  </p>
                </div>
              </div>

              <div className="modal-footer">
                <a
                  href={`mailto:${selectedReport.email}`}
                  className="reply-btn"
                  style={{
                    padding: "8px 16px",
                    backgroundColor: `var(--dark-green)`,
                    color: "white",
                    textDecoration: "none",
                    fontSize: "12px",
                    borderRadius: "4px",
                  }}
                >
                  Reply
                </a>
              </div>
            </div>
          </div>
        </ModalDropdown>
      )}
    </div>
  );
};

export default Reports;
