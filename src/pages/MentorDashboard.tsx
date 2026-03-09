import React, { useMemo, useState, useEffect } from "react";
import Card from "../components/Card";
import { supabase } from "../services/supabaseClient";
import { useAuth } from "../hooks/useAuth";
import LoadingSpinner from "../components/LoadingSpinner";
import Snackbar from "../components/Snackbar";
import "./MentorDashboard.css";

type Learner = {
  id: string;
  name: string;
  weekLabel: string;
  attendanceSummary: string;
  approved: boolean;
  email: string;
};

const MentorDashboard: React.FC = () => {
  const { user } = useAuth();
  const [selectedLearnerId, setSelectedLearnerId] = useState<string | null>(null);
  const [learners, setLearners] = useState<Learner[]>([]);
  const [loading, setLoading] = useState(true);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [userName, setUserName] = useState<string>('User');
  const [profileImage, setProfileImage] = useState<string>('');
  const [stats, setStats] = useState({
    qualifications: "BCom Degree",
    maxStudents: 10,
    currentStudents: 0
  });

  useEffect(() => {
    if (user) {
      fetchMentorData();
    }
  }, [user]);

  const fetchMentorData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Mentor Profile for stats
      const { data: profile, error: profileErr } = await supabase
        .from("profiles")
        .select("full_name, role")
        .eq("id", user?.id)
        .single();

      // 2. Fetch assigned learners
      const { data: learnerData, error: learnerErr } = await supabase
        .from("learner_profiles")
        .select("user_id, learner_name, email")
        .eq("mentor_id", user?.id);

      if (learnerErr) throw learnerErr;

      // 3. Fetch documents for these learners to see "pending" status (mocking timesheet approval for now)
      const formattedLearners: Learner[] = (learnerData || []).map(l => ({
        id: l.user_id,
        name: l.learner_name,
        email: l.email,
        weekLabel: "Current Timesheet",
        attendanceSummary: "Pending review",
        approved: false
      }));

      setLearners(formattedLearners);
      setStats(prev => ({
        ...prev,
        currentStudents: formattedLearners.length
      }));

    } catch (err: any) {
      setSnackbarMessage(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

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
    return `${parts[0]?.[0] ?? ""}${parts[parts.length - 1]?.[0] ?? ""}`.toUpperCase();
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
    setSnackbarMessage(`Timesheet ${!selectedLearner?.approved ? 'approved' : 'unapproved'} for ${selectedLearner?.name}`);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="mentor-dashboard">
      <Snackbar message={snackbarMessage} onClose={() => setSnackbarMessage("")} />
      <div className="mentor-header">
        <h1 className="mentor-title">Mentor Overview</h1>
        <p className="mentor-subtitle">
          Manage your learners and approve timesheets
        </p>
      </div>

      <div className="mentor-stats">
        <Card className="mentor-stat-card">
          <div className="mentor-stat-label">Qualifications</div>
          <div className="mentor-stat-value">{stats.qualifications}</div>
        </Card>
        <Card className="mentor-stat-card">
          <div className="mentor-stat-label">Maximum Students</div>
          <div className="mentor-stat-value">{stats.maxStudents}</div>
        </Card>
        <Card className="mentor-stat-card">
          <div className="mentor-stat-label">Current Students</div>
          <div className="mentor-stat-value">{stats.currentStudents} / {stats.maxStudents}</div>
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
            {learners.length === 0 && <p className="mentor-empty">No learners assigned to you.</p>}
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
                <div className="mentor-details-label">Email</div>
                <div className="mentor-details-value">
                  {selectedLearner.email}
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

