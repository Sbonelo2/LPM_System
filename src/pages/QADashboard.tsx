import React, { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import "./QADashboard.css";
import DashboardStats from "../components/DashboardStats";
import TableComponent from "../components/TableComponent";
import LoadingSpinner from "../components/LoadingSpinner";
import ProfileImageUpload from "../components/ProfileImageUpload";
import { supabase } from "../services/supabaseClient";

const QADashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profileImage, setProfileImage] = useState<string>("");
  const [userName, setUserName] = useState<string>("");
  
  type QaIssueStatus =
    | "Pending QA"
    | "Under Review"
    | "QA Approved"
    | "QA Rejected";

  type QaIssueRow = {
    id: string;
    title: string | null;
    description: string | null;
    status: QaIssueStatus;
    created_at: string;
    severity: string | null;
  };

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [stats, setStats] = useState<
    { label: string; value: string | number }[]
  >([]);
  const [issues, setIssues] = useState<QaIssueRow[]>([]);

  const [showLearnerModal, setShowLearnerModal] = useState(false);
  const [selectedLearner, setSelectedLearner] = useState<QaIssueRow | null>(
    null,
  );

  const withTimeout = async <T,>(
    promise: PromiseLike<T>,
    ms: number,
    label: string,
  ): Promise<T> => {
    return await Promise.race([
      Promise.resolve(promise),
      new Promise<T>((_resolve, reject) =>
        setTimeout(() => reject(new Error(`${label} timed out`)), ms),
      ),
    ]);
  };

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      setError("");

      try {
        const results = await Promise.allSettled([
          withTimeout(
            supabase
              .from("qa_issues")
              .select("id", { count: "exact", head: true }),
            10000,
            "Load total issues",
          ),
          withTimeout(
            supabase
              .from("qa_issues")
              .select("id", { count: "exact", head: true })
              .in("status", ["Pending QA", "Under Review"]),
            10000,
            "Load pending issues",
          ),
          withTimeout(
            supabase
              .from("qa_issues")
              .select("id", { count: "exact", head: true })
              .eq("status", "QA Approved"),
            10000,
            "Load approved issues",
          ),
          withTimeout(
            supabase
              .from("qa_issues")
              .select("id, title, description, status, created_at, severity")
              .in("status", ["Pending QA", "Under Review"])
              .order("created_at", { ascending: false })
              .limit(50),
            10000,
            "Load latest pending issues",
          ),
        ]);

        const totalRes = results[0];
        const pendingRes = results[1];
        const approvedRes = results[2];
        const issuesRes = results[3];

        const errors: string[] = [];
        if (totalRes.status === "rejected") {
          errors.push(
            totalRes.reason instanceof Error
              ? totalRes.reason.message
              : "Load total issues failed",
          );
        } else if (totalRes.value.error) {
          errors.push(totalRes.value.error.message);
        }

        if (pendingRes.status === "rejected") {
          errors.push(
            pendingRes.reason instanceof Error
              ? pendingRes.reason.message
              : "Load pending issues failed",
          );
        } else if (pendingRes.value.error) {
          errors.push(pendingRes.value.error.message);
        }

        if (approvedRes.status === "rejected") {
          errors.push(
            approvedRes.reason instanceof Error
              ? approvedRes.reason.message
              : "Load approved issues failed",
          );
        } else if (approvedRes.value.error) {
          errors.push(approvedRes.value.error.message);
        }

        const total =
          totalRes.status === "fulfilled" && !totalRes.value.error
            ? (totalRes.value.count ?? 0)
            : 0;
        const pending =
          pendingRes.status === "fulfilled" && !pendingRes.value.error
            ? (pendingRes.value.count ?? 0)
            : 0;
        const approved =
          approvedRes.status === "fulfilled" && !approvedRes.value.error
            ? (approvedRes.value.count ?? 0)
            : 0;

        const complianceRate =
          total > 0 ? `${Math.round((approved / total) * 100)}%` : "N/A";

        if (issuesRes.status === "fulfilled") {
          if (issuesRes.value.error) {
            throw new Error(issuesRes.value.error.message);
          }
          setIssues((issuesRes.value.data ?? []) as QaIssueRow[]);
        } else {
          throw new Error(
            issuesRes.reason instanceof Error
              ? issuesRes.reason.message
              : "Load latest pending issues failed",
          );
        }

        if (errors.length > 0) {
          setError(errors.join(" | "));
        }

        setStats([
          { label: "TOTAL REVIEWS", value: total },
          { label: "PENDING QA", value: pending },
          { label: "QA APPROVED", value: approved },
          { label: "COMPLIANCE RATE", value: complianceRate },
        ]);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  // Load user data for profile display
  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user]);

  const loadUserData = async () => {
    if (!user) return;
    
    try {
      // Get user profile data
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, profile_image_url')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error loading user data:', error);
        // Fallback to email or default
        setUserName(user.email?.split('@')[0] || 'User');
      } else {
        setUserName(data?.full_name || user.email?.split('@')[0] || 'User');
        setProfileImage(data?.profile_image_url || '');
      }
    } catch (error) {
      console.error('Error:', error);
      setUserName(user?.email?.split('@')[0] || 'User');
    }
  };

  const handleViewLearner = (issue: QaIssueRow) => {
    setSelectedLearner({ ...issue });
    setShowLearnerModal(true);
  };

  const closeModal = () => {
    setShowLearnerModal(false);
    setSelectedLearner(null);
  };

  const handleSubmit = () => {
    if (!selectedLearner) return;

    const save = async () => {
      try {
        const { error: updateError } = (await withTimeout(
          supabase
            .from("qa_issues")
            .update({ status: selectedLearner.status })
            .eq("id", selectedLearner.id),
          10000,
          "Update QA issue",
        )) as { error: { message: string } | null };

        if (updateError) {
          throw new Error(updateError.message);
        }

        setIssues((prev) =>
          prev.map((i) => (i.id === selectedLearner.id ? selectedLearner : i)),
        );
        closeModal();
      } catch (e: unknown) {
        alert(
          `Update failed: ${e instanceof Error ? e.message : "Unknown error"}`,
        );
      }
    };

    void save();
  };

  const tableData = useMemo(() => {
    return issues.map((issue) => ({
      ...issue,
      submittedOn: issue.created_at ? issue.created_at.slice(0, 10) : "",
      action: (
        <button
          className="view-action-btn"
          onClick={() => handleViewLearner(issue)}
        >
          Review
        </button>
      ),
    }));
  }, [issues]);

  return (
    <div className="qa-dashboard-container">
      <div className="dashboard-content">
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "20px",
          backgroundColor: "#fff",
          borderBottom: "1px solid #e5e7eb",
          marginBottom: "20px",
        }}>
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
          {loading ? <LoadingSpinner /> : <DashboardStats stats={stats} />}
        </div>

        {error ? (
          <div style={{ color: "#dc3545", padding: "12px 0" }}>{error}</div>
        ) : null}

        <h3 className="table-title">PENDING QA REVIEWS</h3>

        <TableComponent
          columns={[
            { header: "TITLE", key: "title" },
            { header: "SEVERITY", key: "severity" },
            { header: "QA STATUS", key: "status" },
            { header: "SUBMITTED ON", key: "submittedOn" },
            { header: "ACTION", key: "action" },
          ]}
          data={tableData}
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
                  <span className="detail-label">Issue ID:</span>
                  <span className="detail-value">{selectedLearner.id}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Title:</span>
                  <span className="detail-value">{selectedLearner.title}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Severity:</span>
                  <span className="detail-value">
                    {selectedLearner.severity}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Description:</span>
                  <span className="detail-value">
                    {selectedLearner.description}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">QA Status:</span>
                  <select
                    className="status-dropdown"
                    value={selectedLearner.status}
                    onChange={(e) =>
                      setSelectedLearner((prev) =>
                        prev
                          ? {
                              ...prev,
                              status: e.target.value as QaIssueStatus,
                            }
                          : null,
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
                    {selectedLearner.created_at
                      ? selectedLearner.created_at.slice(0, 10)
                      : ""}
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
