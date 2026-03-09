import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../services/supabaseClient";
import { useAuth } from "../hooks/useAuth";
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
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profileImage, setProfileImage] = useState<string>("");
  const [userName, setUserName] = useState<string>("User");
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
          `Failed to load dashboard data: ${err.message}. Please let me know if you need to run a SQL command to create the 'compliance_issues' table.`,
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
            onClick={() => navigate("/facilitator/profile")}
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
