import React, { useState, useEffect } from "react";
import "./QADashboard.css";
import DashboardStats from "../components/DashboardStats";
import TableComponent from "../components/TableComponent";
import { useAuth } from "../hooks/useAuth";

const QADashboard: React.FC = () => {
  const { user } = useAuth();
  
  // Set user role to qa_officer when accessing QA dashboard
  useEffect(() => {
    if (user) {
      // Update user metadata to reflect QA officer role
      user.user_metadata = {
        ...user.user_metadata,
        role: 'qa_officer'
      };
    }
  }, [user]);

  const [showLearnerModal, setShowLearnerModal] = useState(false);
  const [selectedLearner, setSelectedLearner] = useState<any>(null);
  const [tableData, setTableData] = useState([
    {
      id: "STU001",
      name: "John Doe",
      host: "ABC Company",
      programme: "ICT Training",
      status: "Under Review",
      submittedOn: "2026-02-15",
      email: "john.doe@example.com",
      phone: "+27 123 456 7890",
      qaScore: "85%",
      complianceStatus: "Compliant",
    },
    {
      id: "STU002",
      name: "Jane Smith",
      host: "XYZ Organization",
      programme: "Business Analysis",
      status: "Pending QA",
      submittedOn: "2026-02-14",
      email: "jane.smith@example.com",
      phone: "+27 987 654 3210",
      qaScore: "92%",
      complianceStatus: "Non-Compliant",
    },
    {
      id: "STU003",
      name: "Mike Johnson",
      host: "Tech Solutions",
      programme: "Software Development",
      status: "QA Approved",
      submittedOn: "2026-02-13",
      email: "mike.j@example.com",
      phone: "+27 555 123 4567",
      qaScore: "78%",
      complianceStatus: "Compliant",
    },
  ]);

  const stats = [
    { label: "TOTAL REVIEWS", value: 45 },
    { label: "PENDING QA", value: 12 },
    { label: "QA APPROVED", value: 28 },
    { label: "COMPLIANCE RATE", value: "87%" },
  ];

  const handleViewLearner = (learner: any) => {
    setSelectedLearner({ ...learner });
    setShowLearnerModal(true);
  };

  const closeModal = () => {
    setShowLearnerModal(false);
    setSelectedLearner(null);
  };

  const handleSubmit = () => {
    if (selectedLearner) {
      setTableData(prev =>
        prev.map(learner =>
          learner.id === selectedLearner.id ? selectedLearner : learner
        )
      );
      alert(`QA Status updated: ${selectedLearner.name} - ${selectedLearner.status}`);
      closeModal();
    }
  };

  return (
    <div className="qa-dashboard-container">
      <div className="dashboard-content">
        <h1 className="dashboard-title">QA Officer Dashboard</h1>

        <div className="dashboard-cards">
          <DashboardStats stats={stats} />
        </div>

        <h3 className="table-title">PENDING QA REVIEWS</h3>

        <TableComponent
          columns={[
            { header: "LEARNER", key: "name" },
            { header: "HOST", key: "host" },
            { header: "PROGRAMME", key: "programme" },
            { header: "QA STATUS", key: "status" },
            { header: "QA SCORE", key: "qaScore" },
            { header: "SUBMITTED ON", key: "submittedOn" },
            { header: "ACTION", key: "action" },
          ]}
          data={tableData.map(learner => ({
            ...learner,
            action: (
              <button
                className="view-action-btn"
                onClick={() => handleViewLearner(learner)}
              >
                Review
              </button>
            ),
          }))}
        />

        {/* Learner Modal */}
        {showLearnerModal && selectedLearner && (
          <div className="learner-modal-overlay" onClick={closeModal}>
            <div
              className="learner-modal-content"
              onClick={e => e.stopPropagation()}
            >
              <div className="modal-header">
                <h2>QA Review Details</h2>
                <button className="modal-close-btn" onClick={closeModal}>
                  ×
                </button>
              </div>

              <div className="modal-body">
                <div className="detail-row">
                  <span className="detail-label">Student ID:</span>
                  <span className="detail-value">{selectedLearner.id}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Full Name:</span>
                  <span className="detail-value">{selectedLearner.name}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Email:</span>
                  <span className="detail-value">{selectedLearner.email}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Phone:</span>
                  <span className="detail-value">{selectedLearner.phone}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Host Company:</span>
                  <span className="detail-value">{selectedLearner.host}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Programme:</span>
                  <span className="detail-value">{selectedLearner.programme}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">QA Score:</span>
                  <span className="detail-value">{selectedLearner.qaScore}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Compliance Status:</span>
                  <span className="detail-value">{selectedLearner.complianceStatus}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">QA Status:</span>
                  <select
                    className="status-dropdown"
                    value={selectedLearner.status}
                    onChange={e =>
                      setSelectedLearner((prev: any) =>
                        prev ? { ...prev, status: e.target.value } : null
                      )
                    }
                  >
                    <option value="Pending QA">Pending QA</option>
                    <option value="Under Review">Under Review</option>
                    <option value="QA Approved">QA Approved</option>
                    <option value="QA Rejected">QA Rejected</option>
                  </select>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Submitted On:</span>
                  <span className="detail-value">{selectedLearner.submittedOn}</span>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  className="modal-action-btn submit-btn"
                  onClick={handleSubmit}
                >
                  Submit Review
                </button>
                <button
                  className="modal-action-btn cancel-btn"
                  onClick={closeModal}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QADashboard;
