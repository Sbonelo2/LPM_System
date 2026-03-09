import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../services/supabaseClient";
import DashboardStats from "../components/DashboardStats";
import ProfileImageUpload from "../components/ProfileImageUpload";
import Card from "../components/Card";
import TableComponent, { type TableColumn } from "../components/TableComponent";
import LoadingSpinner from "../components/LoadingSpinner";
import "./Dashboard.css";
import "./AdminDashboard.css";

interface UserData {
  fullName: string;
  email: string;
  role: string;
  createdDate: string;
}

const FacilitatorDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>({
    activeLearners: 0,
    activePlacements: 0,
    pendingIssues: 0,
    complianceStatus: "0%",
  });
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [
          { count: activeLearners, error: learnersError },
          { count: activePlacements, error: placementsError },
          { count: pendingIssues, error: issuesError },
          { data: documents, error: documentsError },
          { data: profiles, error: profilesError },
        ] = await Promise.all([
          supabase
            .from("learner_profiles")
            .select("*", { count: "exact", head: true }),
          supabase
            .from("learner_placements")
            .select("*", { count: "exact", head: true })
            .eq("status", "active"),
          supabase
            .from("compliance_issues")
            .select("*", { count: "exact", head: true })
            .eq("status", "Open"),
          supabase.from("documents").select("review_status"),
          supabase
            .from("profiles")
            .select("full_name, email, role, created_at")
            .order("created_at", { ascending: false }),
        ]);

        if (learnersError) throw learnersError;
        if (placementsError) throw placementsError;
        if (issuesError) {
          if (!issuesError.message.includes("not found")) throw issuesError;
        }
        if (documentsError) throw documentsError;
        if (profilesError) throw profilesError;

        const approvedDocs =
          documents?.filter((d) => d.review_status === "approved").length || 0;
        const totalDocs = documents?.length || 0;
        const compliancePercentage =
          totalDocs > 0 ? Math.round((approvedDocs / totalDocs) * 100) : 0;

        setStats({
          activeLearners: activeLearners || 0,
          activePlacements: activePlacements || 0,
          pendingIssues: pendingIssues || 0,
          complianceStatus: `${compliancePercentage}%`,
        });

        const formattedUsers: UserData[] =
          profiles?.map((p: any) => ({
            fullName: p.full_name,
            email: p.email,
            role: p.role,
            createdDate: new Date(p.created_at).toLocaleDateString(),
          })) || [];
        setUsers(formattedUsers);
      } catch (err: any) {
        setError(
          `Failed to load dashboard data: ${err.message}. Please let me know if you need to run a SQL command to create the 'compliance_issues' table.`
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const adminDashboardStats = [
    { label: "ACTIVE LEARNERS", value: stats.activeLearners },
    { label: "ACTIVE PLACEMENTS", value: stats.activePlacements },
    { label: "PENDING ISSUES", value: stats.pendingIssues },
    { label: "COMPLIANCE STATUS", value: stats.complianceStatus },
  ];

  const userColumns: TableColumn<UserData>[] = [
    { key: "fullName", header: "Full Name" },
    { key: "email", header: "Email" },
    { key: "role", header: "Role" },
    { key: "createdDate", header: "Created Date" },
  ];

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <>
      <div className="facilitator-dashboard-content">
        <div className="dashboard-header">
          <h2>FACILITATOR DASHBOARD</h2>
          <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
            <p style={{ margin: 0, fontWeight: "bold" }}>
              Logged in as FACILITATOR
            </p>
            <div
              onClick={() => navigate("/facilitator/profile")}
              style={{ cursor: "pointer" }}
              className="facilitator-profile-icon"
            >
              <ProfileImageUpload editable={false} size={30} />
            </div>
          </div>
        </div>

        <div className="dashboard-stats-container">
          <DashboardStats stats={adminDashboardStats} />
        </div>
        <div className="dashboard-my-placements-container">
          <h3>USERS</h3>
          <Card>
            <TableComponent
              columns={userColumns}
              data={users}
              caption="Active System Users"
            />
          </Card>
        </div>

        <div style={{ marginTop: "20px", textAlign: "center" }}></div>
      </div>
    </>
  );
};

export default FacilitatorDashboard;
