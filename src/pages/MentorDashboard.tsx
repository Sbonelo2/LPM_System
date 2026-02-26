import React, { useMemo, useState } from "react";
import Card from "../components/Card";
import "./MentorDashboard.css";

type Learner = {
  id: string;
  name: string;
  weekLabel: string;
  attendanceSummary: string;
  approved: boolean;
};

const MentorDashboard: React.FC = () => {
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
      <div className="mentor-header">
        <h1 className="mentor-title">Mentor Overview</h1>
        <p className="mentor-subtitle">
          Manage your learners and approve timesheets
        </p>
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
