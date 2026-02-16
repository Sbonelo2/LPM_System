import React, { useState, useEffect } from "react";
import "./CoordinatorDashboard.css";
import SideBar from "../components/SideBar";
import DashboardStats from "../components/DashboardStats";
import TableComponent from "../components/TableComponent";
import { useAuth } from "../hooks/useAuth";

const CoordinatorDashboard: React.FC = () => {
  const { user } = useAuth();
  
  // Set user role to programme_coordinator when accessing coordinator dashboard
  useEffect(() => {
    if (user) {
      // Update user metadata to reflect coordinator role
      user.user_metadata = {
        ...user.user_metadata,
        role: 'programme_coordinator'
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
      status: "Approved",
      submittedOn: "2026-02-15",
      email: "john.doe@example.com",
      phone: "+27 123 456 7890",
    },
    {
      id: "STU002",
      name: "Jane Smith",
      host: "XYZ Organization",
      programme: "Business Analysis",
      status: "Pending",
      submittedOn: "2026-02-14",
      email: "jane.smith@example.com",
      phone: "+27 987 654 3210",
    },
  ]);

  const stats = [
    { label: "TOTAL LEARNERS", value: 120 },
    { label: "ACTIVE PLACEMENTS", value: 45 },
    { label: "PENDING APPROVALS", value: 8 },
    { label: "COMPLETION RATE", value: "88%" },
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
      alert(`Status updated: ${selectedLearner.name} - ${selectedLearner.status}`);
      closeModal();
    }
  };

  return (
    <div className="coordinator-dashboard-container">
      <SideBar />

      <div className="dashboard-content">
        <h1 className="dashboard-title">Coordinator Dashboard</h1>

        <div className="dashboard-cards">
          <DashboardStats stats={stats} />
        </div>

        <h3 className="table-title">PENDING APPROVALS</h3>

        <TableComponent
          columns={[
            { header: "LEARNER", key: "name" },
            { header: "HOST", key: "host" },
            { header: "PROGRAMME", key: "programme" },
            { header: "STATUS", key: "status" },
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
                View
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
                <h2>Learner Details</h2>
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
                  <span className="detail-label">Status:</span>
                  <select
                    className="status-dropdown"
                    value={selectedLearner.status}
                    onChange={e =>
                      setSelectedLearner((prev: any) =>
                        prev ? { ...prev, status: e.target.value } : null
                      )
                    }
                  >
                    <option value="Pending">Pending</option>
                    <option value="Approved">Approved</option>
                    <option value="Rejected">Rejected</option>
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
                  Submit
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

export default CoordinatorDashboard;
