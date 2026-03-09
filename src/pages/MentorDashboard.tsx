import React, { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import Card from "../components/Card";
import ProfileImageUpload from "../components/ProfileImageUpload";
import { supabase } from "../services/supabaseClient";
import "./MentorDashboard.css";

type Learner = {
  id: string;
  name: string;
  weekLabel: string;
  attendanceSummary: string;
  approved: boolean;
};

const MentorDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profileImage, setProfileImage] = useState<string>("");
  const [userName, setUserName] = useState<string>("");
  const [selectedLearnerId, setSelectedLearnerId] = useState<string | null>(null);

  const [learners, setLearners] = useState<Learner[]>([
    {
      id: "LRN001",
      name: "Alice Lee",
      weekLabel: "Week 12 Timesheet",
      attendanceSummary: "Present: 4/5 days",
      approved: true,
    },
    {
      id: "LRN002",
      name: "Brian Moore",
      weekLabel: "Week 12 Timesheet",
      attendanceSummary: "Present: 5/5 days",
      approved: true,
    },
    {
      id: "LRN003",
      name: "Clara Smith",
      weekLabel: "Week 12 Timesheet",
      attendanceSummary: "Present: 3/5 days",
      approved: true,
    },
    {
      id: "LRN004",
      name: "Daniel Johnson",
      weekLabel: "Week 12 Timesheet",
      attendanceSummary: "Present: 4/5 days",
      approved: true,
    },
    {
      id: "LRN005",
      name: "Emma Stone",
      weekLabel: "Week 12 Timesheet",
      attendanceSummary: "Present: 5/5 days",
      approved: true,
    },
  ]);

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

  const selectedLearner = useMemo(
    () => learners.find((l) => l.id === selectedLearnerId) ?? null,
    [learners, selectedLearnerId],
  );

  const initials = (fullName: string) => {
    const parts = fullName.trim().split(/\s+/);
    return `${parts[0]?.[0] ?? ""}${parts[1]?.[0] ?? ""}`.toUpperCase();
  };

  const handleApproveToggle = (learnerId: string) => {
    setLearners((prev) =>
      prev.map((l) =>
        l.id === learnerId
          ? {
              ...l,
              approved: !l.approved,
            }
          : l,
      ),
    );
  };

  return (
    <div className="mentor-dashboard">
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
          onClick={() => navigate("/mentor/profile")}
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

      <div className="mentor-stats">
        <Card className="mentor-stat-card">
          <div className="mentor-stat-label">Qualifications</div>
          <div className="mentor-stat-value">BCom Degree</div>
        </Card>
        <Card className="mentor-stat-card">
          <div className="mentor-stat-label">Maximum Students</div>
          <div className="mentor-stat-value">10</div>
        </Card>
        <Card className="mentor-stat-card">
          <div className="mentor-stat-label">Current Students</div>
          <div className="mentor-stat-value">7 / 10</div>
        </Card>
      </div>

      <div className="mentor-grid">
        <Card className="mentor-panel">
          <div className="mentor-panel-title">
            Learners for Timesheet Approval
          </div>

          <div className="mentor-learner-list">
            {learners.map((learner) => (
              <button
                key={learner.id}
                type="button"
                className={`mentor-learner-row ${
                  selectedLearnerId === learner.id
                    ? "mentor-learner-row--active"
                    : ""
                }`}
                onClick={() => setSelectedLearnerId(learner.id)}
              >
                <div className="mentor-avatar">{initials(learner.name)}</div>
                <div className="mentor-learner-meta">
                  <div className="mentor-learner-name">{learner.name}</div>
                  <div className="mentor-learner-week">{learner.weekLabel}</div>
                </div>
                <span
                  role="button"
                  tabIndex={0}
                  aria-label={
                    learner.approved
                      ? "Unapprove timesheet"
                      : "Approve timesheet"
                  }
                  className={`mentor-approve ${
                    learner.approved
                      ? "mentor-approve--approved"
                      : "mentor-approve--pending"
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleApproveToggle(learner.id);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      e.stopPropagation();
                      handleApproveToggle(learner.id);
                    }
                  }}
                >
                  <span className="mentor-approve-icon">✓</span>
                </span>
              </button>
            ))}
          </div>
        </Card>

        <Card className="mentor-panel mentor-panel--details">
          <div className="mentor-panel-title">Digital Attendance Details</div>
          {!selectedLearner ? (
            <div className="mentor-empty">
              Select a learner from the list to view their digital attendance.
            </div>
          ) : (
            <div className="mentor-details">
              <div className="mentor-details-row">
                <div className="mentor-details-label">Learner</div>
                <div className="mentor-details-value">
                  {selectedLearner.name}
                </div>
              </div>
              <div className="mentor-details-row">
                <div className="mentor-details-label">Timesheet</div>
                <div className="mentor-details-value">
                  {selectedLearner.weekLabel}
                </div>
              </div>
              <div className="mentor-details-row">
                <div className="mentor-details-label">Summary</div>
                <div className="mentor-details-value">
                  {selectedLearner.attendanceSummary}
                </div>
              </div>
              <div className="mentor-details-row">
                <div className="mentor-details-label">Status</div>
                <div className="mentor-details-value">
                  {selectedLearner.approved ? "Approved" : "Pending"}
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default MentorDashboard;
