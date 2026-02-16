import React from "react";
import AdminTopBar from "../components/AdminTopBar";
import DashboardStats from "../components/DashboardStats";
import Card from "../components/Card";
import TableComponent from "../components/TableComponent"; // Import TableComponent
import "./Dashboard.css"; // Reusing the Dashboard CSS for consistent styling
import "./AdminDashboard.css"; // Import AdminDashboard specific styles

const AdminDashboard: React.FC = () => {
  // Placeholder data for Admin DashboardStats
  const adminDashboardStats = [
    { label: "ACTIVE LEARNERS", value: 150 },
    { label: "ACTIVE PLACEMENTS", value: 75 },
    { label: "PENDING ISSUES", value: 12 },
    { label: "COMPLIANCE STATUS", value: "95%" },
  ];

  // Placeholder data for Users Table
  interface UserData {
    fullName: string;
    email: string;
    role: string;
    createdDate: string;
  }

  const userColumns: { key: keyof UserData; header: string }[] = [
    { key: "fullName", header: "Full Name" },
    { key: "email", header: "Email" },
    { key: "role", header: "Role" },
    { key: "createdDate", header: "Created Date" },
  ];

  const userData: UserData[] = [
    {
      fullName: "Sine Mathebula",
      email: "sine@example.com",
      role: "Learner",
      createdDate: "2023-01-15",
    },
    {
      fullName: "Jane Doe",
      email: "jane.doe@example.com",
      role: "QA Officer",
      createdDate: "2022-11-01",
    },
    {
      fullName: "John Smith",
      email: "john.smith@example.com",
      role: "Programme Coordinator",
      createdDate: "2023-03-20",
    },
    {
      fullName: "Admin User",
      email: "test@admin.com",
      role: "Admin",
      createdDate: "2023-02-10",
    },
  ];

  return (
    <div className="dashboard-layout">
      <div className="dashboard-content">
        <div className="dashboard-topbar">
          <AdminTopBar
            subtitle="Admin"
            userName="Dwayne"
            profilePath="/admin/profile"
          />
        </div>

        <div className="dashboard-stats-container">
          <DashboardStats stats={adminDashboardStats} />
        </div>

        <div className="dashboard-my-placements-container">
          <h3>USERS</h3>
          <Card>
            <TableComponent
              columns={userColumns}
              data={userData}
              caption=" Active System Users"
            />
          </Card>
        </div>

        <div style={{ marginTop: "20px", textAlign: "center" }}></div>
      </div>
    </div>
  );
};

export default AdminDashboard;
