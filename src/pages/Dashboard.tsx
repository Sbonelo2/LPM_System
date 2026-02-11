import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import DashboardStats from "../components/DashboardStats";
import AddHostModal from "../components/AddHostModal";
import TableComponent from "../components/TableComponent";
import Card from "../components/Card"; // Import Card component
import "./Dashboard.css"; // Import Dashboard CSS

const Dashboard: React.FC = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [addHostOpen, setAddHostOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  if (loading) {
    return <div>Loading dashboard...</div>;
  }

  if (!user) {
    return null; // Should be redirected by ProtectedRoute
  }

  // Placeholder data for DashboardStats (adjusted for empty state)
  const dashboardStats = [
    { label: "MY PLACEMENTS", value: 0 },
    { label: "ACTIVE PLACEMENTS", value: 0 },
    { label: "PENDING PLACEMENTS", value: 0 },
    { label: "PROFILE STATUS", value: "Incomplete" },
  ];

  return (
    <div className="dashboard-layout">
      {/* SideBar is provided by MainLayout in App.tsx */}
      <div className="dashboard-content">
        <div className="dashboard-header">
          <h2>Dashboard</h2>
          {message && <p>{message}</p>}
          {/* Buttons removed as per user request */}
        </div>

        <div className="dashboard-stats-container">
          <DashboardStats stats={dashboardStats} />
        </div>

        {/* MY PLACEMENTS Section */}
        <div className="dashboard-my-placements-container">
          <h3>MY PLACEMENTS</h3>
          <Card>
            <TableComponent
              columns={[
                { key: "host", header: "Host" },
                { key: "program", header: "Program" },
                { key: "status", header: "Status" },
                { key: "startDate", header: "Start Date" },
                { key: "endDate", header: "End Date" },
              ]}
              data={[]} // Empty data for now
              caption="Your specific placements will be listed here."
            />
          </Card>
        </div>

        <AddHostModal
          open={addHostOpen}
          onClose={() => setAddHostOpen(false)}
          onCreate={(payload) => {
            console.log("Create host:", payload);
          }}
        />
      </div>
    </div>
  );
};

export default Dashboard;
