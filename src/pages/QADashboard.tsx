import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../services/supabaseClient";
import "./QADashboard.css";
import DashboardStats from "../components/DashboardStats";
import TableComponent from "../components/TableComponent";
import ProfileImageUpload from "../components/ProfileImageUpload";
import { useAuth } from "../hooks/useAuth";
import LoadingSpinner from "../components/LoadingSpinner";

type QAStatus = "pending" | "approved" | "declined";

const normalizeStatus = (value?: string): QAStatus => {
  const normalized = (value || "").toLowerCase();
  if (normalized.startsWith("pending")) return "pending";
  if (normalized === "under review") return "pending";
  if (normalized === "qa approved" || normalized === "approved") return "approved";
  if (
    normalized === "qa rejected" ||
    normalized === "rejected" ||
    normalized === "declined"
  ) {
    return "declined";
  }
  return "pending";
};

const statusLabel = (value?: string): string => {
  const normalized = normalizeStatus(value);
  if (normalized === "approved") return "QA Approved";
  if (normalized === "declined") return "QA Rejected";
  return "Pending QA";
};

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

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showLearnerModal, setShowLearnerModal] = useState(false);
  const [selectedLearner, setSelectedLearner] = useState<any>(null);
  const [tableData, setTableData] = useState<any[]>([]);
  const [stats, setStats] = useState([
    { label: "TOTAL REVIEWS", value: 0 },
    { label: "PENDING QA", value: 0 },
    { label: "QA APPROVED", value: 0 },
    { label: "COMPLIANCE RATE", value: "0%" },
  ]);

  const fetchDashboardData = async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      // 1. Fetch documents that need QA review (no embedded joins)
      const { data: docs, error: docsError } = await supabase
        .from("documents")
        .select(
          `
          id,
          file_name,
          file_url,
          review_status,
          created_at,
          user_id
        `,
        )
        .or("review_status.ilike.pending%,review_status.eq.Under Review")
        .order("created_at", { ascending: false });

      if (docsError) throw docsError;

      const userIds = Array.from(new Set((docs || []).map((d) => d.user_id)));
      let hostMap: Record<string, string> = {};
      let learnerProfileMap: Record<
        string,
        { learner_name?: string; learner_identifier?: string; programme?: string; email?: string }
      > = {};

      if (userIds.length > 0) {
        const [{ data: placements }, { data: learnerProfiles }] = await Promise.all([
          supabase
            .from("learner_placements")
            .select("learner_id, host_name")
            .in("learner_id", userIds),
          supabase
            .from("learner_profiles")
            .select("user_id, learner_name, learner_identifier, programme, email")
            .in("user_id", userIds),
        ]);

        placements?.forEach((p) => {
          hostMap[p.learner_id] = p.host_name;
        });

        learnerProfiles?.forEach((p) => {
          learnerProfileMap[p.user_id] = {
            learner_name: p.learner_name,
            learner_identifier: p.learner_identifier,
            programme: p.programme,
            email: p.email,
          };
        });
      }

      const formattedData = (docs || []).map((doc: any) => {
        const statusValue = normalizeStatus(doc.review_status);
        const learner = learnerProfileMap[doc.user_id] || {};
        return {
          id: learner.learner_identifier || doc.id.slice(0, 8),
          documentId: doc.id,
          name: learner.learner_name || "Unknown",
          host: hostMap[doc.user_id] || "Unassigned",
          programme: learner.programme || "General",
          status: statusValue,
          statusLabel: statusLabel(statusValue),
          submittedOn: new Date(doc.created_at).toLocaleDateString(),
          email: learner.email || "",
          phone: "N/A",
          qaScore: "N/A",
          complianceStatus: statusValue === "approved" ? "Compliant" : "Pending",
          fileUrl: doc.file_url,
          fileName: doc.file_name,
        };
      });

      setTableData(formattedData);

      // 2. Fetch overall stats
      const { data: allDocs, error: statsError } = await supabase
        .from("documents")
        .select("review_status");

      if (statsError) throw statsError;

      const total = allDocs?.length || 0;
      const pending =
        allDocs?.filter(
          (d) =>
            d.review_status?.toLowerCase().startsWith("pending") ||
            d.review_status === "Under Review",
        ).length || 0;
      const approved =
        allDocs?.filter((d) => d.review_status === "approved").length || 0;
      const complianceRate = total > 0 ? Math.round((approved / total) * 100) : 0;

      setStats([
        { label: "TOTAL REVIEWS", value: total },
        { label: "PENDING QA", value: pending },
        { label: "QA APPROVED", value: approved },
        { label: "COMPLIANCE RATE", value: `${complianceRate}%` },
      ]);

    } catch (error: any) {
      console.error("Error fetching QA dashboard data:", error);
      setError(
        error?.message
          ? `Failed to load QA dashboard: ${error.message}`
          : "Failed to load QA dashboard.",
      );
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const channel = supabase
      .channel("qa-dashboard-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "documents" },
        () => {
          fetchDashboardData(true);
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "learner_profiles" },
        () => {
          fetchDashboardData(true);
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "learner_placements" },
        () => {
          fetchDashboardData(true);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleViewLearner = (learner: any) => {
    setSelectedLearner({ ...learner, status: normalizeStatus(learner.status) });
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
          .update({ review_status: normalizeStatus(selectedLearner.status) })
          .eq("id", selectedLearner.documentId);

        if (error) throw error;
        
        alert(`QA Status updated for ${selectedLearner.name}`);
        fetchDashboardData(true); // Refresh data quietly
        closeModal();
      } catch (error: any) {
        alert(`Error updating status: ${error.message}`);
      }
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

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
            { header: "QA STATUS", key: "statusLabel" },
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
                  X
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
                    <option value="pending">Pending QA</option>
                    <option value="approved">QA Approved</option>
                    <option value="declined">QA Rejected</option>
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
