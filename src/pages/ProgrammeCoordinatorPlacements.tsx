import React, { useState } from "react";
import "./ProgrammeCoordinatorPlacements.css";

interface Placement {
  id: string;
  learner: string;
  host: string;
  program: string;
  status: "Active" | "Inactive" | "Pending" | "Suspended" | "Cancelled";
  startDate: string;
  endDate: string;
}

const ProgrammeCoordinatorPlacements: React.FC = () => {
  const [placements] = useState<Placement[]>([
    {
      id: "1",
      learner: "John Smith",
      host: "Tech Solutions Inc.",
      program: "Software Development",
      status: "Active",
      startDate: "2024-01-15",
      endDate: "2024-06-15",
    },
    {
      id: "2",
      learner: "Sarah Johnson",
      host: "Digital Agency",
      program: "Web Development",
      status: "Pending",
      startDate: "2024-02-01",
      endDate: "2024-04-01",
    },
    {
      id: "3",
      learner: "Mike Davis",
      host: "Creative Studios",
      program: "Data Science",
      status: "Suspended",
      startDate: "2023-12-01",
      endDate: "2024-01-15",
    },
    {
      id: "4",
      learner: "Emily Brown",
      host: "Innovation Labs",
      program: "Mobile Development",
      status: "Cancelled",
      startDate: "2023-10-01",
      endDate: "2023-12-31",
    },
  ]);

  const handleAction = (placementId: string, action: string) => {
    console.log(`Placement ${placementId}: ${action}`);
    // Here you would typically make an API call to update the placement status
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "#16A34A";
      case "Inactive":
        return "#6B7280";
      case "Pending":
        return "#F59E0B";
      case "Suspended":
        return "#EF4444";
      case "Cancelled":
        return "#DC2626";
      default:
        return "#6B7280";
    }
  };

  return (
    <div className="programme-coordinator-page">
      <div className="page-header">
        <h1 className="page-title">Programme Coordinator - Placements</h1>
        <div className="design-badge">Programme Coordinator - Design</div>
      </div>

      <div className="placements-table-container">
        <table className="placements-table">
          <thead>
            <tr>
              <th>Learner</th>
              <th>Host</th>
              <th>Program</th>
              <th>Status</th>
              <th>Start Date</th>
              <th>End Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {placements.map((placement) => (
              <tr key={placement.id}>
                <td>{placement.learner}</td>
                <td>{placement.host}</td>
                <td>{placement.program}</td>
                <td>
                  <span
                    className="status-badge"
                    style={{ backgroundColor: getStatusColor(placement.status) }}
                  >
                    {placement.status}
                  </span>
                </td>
                <td>{placement.startDate}</td>
                <td>{placement.endDate}</td>
                <td>
                  <select
                    className="action-select"
                    onChange={(e) => handleAction(placement.id, e.target.value)}
                    defaultValue=""
                  >
                    <option value="">Select Action</option>
                    <option value="pending">Pending</option>
                    <option value="suspended">Suspended</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="active">Active</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProgrammeCoordinatorPlacements;
