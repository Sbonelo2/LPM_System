import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../services/supabaseClient";
import "./QADashboard.css";
import DashboardStats from "../components/DashboardStats";
import TableComponent from "../components/TableComponent";
import ProfileImageUpload from "../components/ProfileImageUpload";
import { useAuth } from "../hooks/useAuth";

const QADashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profileImage, setProfileImage] = useState<string>("");
  const [userName, setUserName] = useState<string>("User");

  useEffect(() => {
    const loadHeaderProfile = async () => {
      if (!user) return;
      try {
        const [{ data: profile }, { data: imageRow }] = await Promise.all([
          supabase.from("profiles").select("full_name").eq("id", user.id).single(),
          supabase
            .from("role_profile_images")
            .select("image_url")
            .eq("user_id", user.id)
            .maybeSingle(),
        ]);

        setUserName(
          profile?.full_name ||
            (user.user_metadata?.full_name as string | undefined) ||
            "User",
        );
        setProfileImage(imageRow?.image_url || "");
      } catch (error) {
        setUserName(
          (user.user_metadata?.full_name as string | undefined) || "User",
        );
        setProfileImage("");
      }
    };

    loadHeaderProfile();
  }, [user]);

  // Keep a merged role for QA + Coordinator capabilities.
  useEffect(() => {
    if (user) {
      user.user_metadata = {
        ...user.user_metadata,
        role: "super_admin",
      };
    }
  }, [user]);

  const [loading, setLoading] = useState(true);
  const [showLearnerModal, setShowLearnerModal] = useState(false);
  const [selectedLearner, setSelectedLearner] = useState<any>(null);
  const [tableData, setTableData] = useState<any[]>([]);
  const [stats, setStats] = useState([
    { label: "TOTAL REVIEWS", value: 0 },
    { label: "PENDING QA", value: 0 },
    { label: "QA APPROVED", value: 0 },
    { label: "COMPLIANCE RATE", value: "0%" },
  ]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // 1. Fetch documents that need QA review
      const { data: docs, error: docsError } = await supabase
        .from("documents")
        .select(`
          id,
          file_name,
          file_url,
          review_status,
          created_at,
          user_id,
          profiles:user_id (full_name, email),
          learner_profiles!inner (learner_name, learner_identifier, programme)
        `)
        .or("review_status.eq.Pending QA,review_status.eq.Under Review")
        .order("created_at", { ascending: false });

      if (docsError) throw docsError;

      const formattedData = (docs || []).map((doc: any) => ({
        id: doc.learner_profiles?.learner_identifier || doc.id.slice(0, 8),
        documentId: doc.id,
        name: doc.learner_profiles?.learner_name || doc.profiles?.full_name || "Unknown",
        host: "See Placement", // Host is in learner_placements, can be added later if needed
        programme: doc.learner_profiles?.programme || "General",
        status: doc.review_status || "Pending QA",
        submittedOn: new Date(doc.created_at).toLocaleDateString(),
        email: doc.profiles?.email || "",
        phone: "N/A",
        qaScore: "N/A",
        complianceStatus: doc.review_status === "QA Approved" ? "Compliant" : "Pending",
        fileUrl: doc.file_url,
        fileName: doc.file_name
      }));

      setTableData(formattedData);

      // 2. Fetch overall stats
      const { data: allDocs, error: statsError } = await supabase
        .from("documents")
        .select("review_status");

      if (statsError) throw statsError;

      const total = allDocs?.length || 0;
      const pending = allDocs?.filter(d => d.review_status === "Pending QA" || d.review_status === "Under Review").length || 0;
      const approved = allDocs?.filter(d => d.review_status === "QA Approved").length || 0;
      const complianceRate = total > 0 ? Math.round((approved / total) * 100) : 0;

      setStats([
        { label: "TOTAL REVIEWS", value: total },
        { label: "PENDING QA", value: pending },
        { label: "QA APPROVED", value: approved },
        { label: "COMPLIANCE RATE", value: `${complianceRate}%` },
      ]);

    } catch (error) {
      console.error("Error fetching QA dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleViewLearner = (learner: any) => {
    setSelectedLearner({ ...learner });
    setShowLearnerModal(true);
  };

  const closeModal = () => {
    setShowLearnerModal(false);
    setSelectedLearner(null);
  };

  const handleSubmit = async () => {
    if (selectedLearner && selectedLearner.documentId) {
      try {
        const { error } = await supabase
          .from("documents")
          .update({ review_status: selectedLearner.status })
          .eq("id", selectedLearner.documentId);

        if (error) throw error;
        
        alert(`QA Status updated for ${selectedLearner.name}`);
        fetchDashboardData(); // Refresh data
        closeModal();
      } catch (error: any) {
        alert(`Error updating status: ${error.message}`);
      }
    }
  };

  return (
    <div className="qa-dashboard-container">
      <div className="dashboard-content">
        <h1 className="dashboard-title">Super Admin</h1>
        <p className="dashboard-subtitle">
          dashbaord for qa officer & coordinator
        </p>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "20px",
            backgroundColor: "#fff",
            borderBottom: "1px solid #e5e7eb",
            marginBottom: "20px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
            <ProfileImageUpload
              currentImage={profileImage}
              onImageChange={() => {}}
              editable={false}
              size={60}
            />
            <div>
              <h2 style={{ margin: 0, fontSize: "20px", fontWeight: 600 }}>
                Welcome, {userName}
              </h2>
              <p style={{ margin: 0, color: "#6b7280", fontSize: "14px" }}>
                {user?.email}
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate("/super-admin/profile")}
            style={{
              padding: "10px 20px",
              backgroundColor: "#3b82f6",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: 500,
              transition: "background-color 0.2s ease",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = "#2563eb";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = "#3b82f6";
            }}
          >
            Edit Profile
          </button>
        </div>

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
          data={tableData.map((learner) => ({
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
              onClick={(e) => e.stopPropagation()}
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
                  <span className="detail-value">
                    {selectedLearner.programme}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">QA Score:</span>
                  <span className="detail-value">
                    {selectedLearner.qaScore}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Compliance Status:</span>
                  <span className="detail-value">
                    {selectedLearner.complianceStatus}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">QA Status:</span>
                  <select
                    className="status-dropdown"
                    value={selectedLearner.status}
                    onChange={(e) =>
                      setSelectedLearner((prev: any) =>
                        prev ? { ...prev, status: e.target.value } : null,
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
                  <span className="detail-value">
                    {selectedLearner.submittedOn}
                  </span>
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
