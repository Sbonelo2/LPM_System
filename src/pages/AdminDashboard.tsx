import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardStats from "../components/DashboardStats";
import ProfileImageUpload from "../components/ProfileImageUpload";
import Card from "../components/Card";
import TableComponent, { type TableColumn } from "../components/TableComponent"; // Import TableComponent and TableColumn type
import LoadingSpinner from "../components/LoadingSpinner";
import { supabase } from "../services/supabaseClient";
import "./Dashboard.css"; // Reusing the Dashboard CSS for consistent styling
import "./AdminDashboard.css"; // Import AdminDashboard specific styles

const FacilitatorDashboard: React.FC = () => {
  const navigate = useNavigate();
  console.log("FacilitatorDashboard component rendering");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [activeLearnersCount, setActiveLearnersCount] = useState<number>(0);
  const [activePlacementsCount, setActivePlacementsCount] = useState<number>(0);
  const [pendingIssuesCount, setPendingIssuesCount] = useState<number>(0);
  const [complianceStatus, setComplianceStatus] = useState<string>("N/A");

  // Debug logging
  useEffect(() => {
    console.log("FacilitatorDashboard state:", { loading, error });
  }, [loading, error]);

  interface ProfileRow {
    id: string;
    full_name: string | null;
    email: string | null;
    role: string;
    created_at: string;
  }

  const [profiles, setProfiles] = useState<ProfileRow[]>([]);

  interface UserData {
    fullName: string;
    email: string;
    role: string;
    createdDate: string;
  }

  const userColumns: TableColumn<UserData>[] = [
    { key: "fullName", header: "Full Name" },
    { key: "email", header: "Email" },
    { key: "role", header: "Role" },
    { key: "createdDate", header: "Created Date" },
  ];

  const userData: UserData[] = useMemo(() => {
    return profiles.map((p) => ({
      fullName: p.full_name ?? "",
      email: p.email ?? "",
      role: p.role,
      createdDate: p.created_at ? p.created_at.slice(0, 10) : "",
    }));
  }, [profiles]);

  const facilitatorDashboardStats = useMemo(
    () => [
      { label: "ACTIVE LEARNERS", value: activeLearnersCount },
      { label: "ACTIVE PLACEMENTS", value: activePlacementsCount },
      { label: "PENDING ISSUES", value: pendingIssuesCount },
      { label: "COMPLIANCE STATUS", value: complianceStatus },
    ],
    [
      activeLearnersCount,
      activePlacementsCount,
      pendingIssuesCount,
      complianceStatus,
    ],
  );

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      setError("");

      try {
        const results = await Promise.allSettled([
          supabase
            .from("profiles")
            .select("id", { count: "exact", head: true })
            .eq("role", "learner")
            .eq("is_active", true),
          supabase
            .from("profiles")
            .select("id, full_name, email, role, created_at")
            .order("created_at", { ascending: false })
            .limit(10),
          supabase
            .from("placements")
            .select("id", { count: "exact", head: true })
            .eq("status", "Active"),
          supabase
            .from("qa_issues")
            .select("id", { count: "exact", head: true })
            .eq("status", "Open"),
          supabase
            .from("document_verifications")
            .select("id", { count: "exact", head: true }),
          supabase
            .from("document_verifications")
            .select("id", { count: "exact", head: true })
            .eq("status", "Approved"),
        ]);

        const learnerCountRes = results[0];
        if (learnerCountRes.status === "fulfilled") {
          const { count, error: countError } = learnerCountRes.value;
          if (!countError) {
            setActiveLearnersCount(count ?? 0);
          }
        }

        const profilesRes = results[1];
        if (profilesRes.status === "fulfilled") {
          const { data, error: profilesError } = profilesRes.value;
          if (!profilesError) {
            setProfiles((data ?? []) as ProfileRow[]);
          }
        }

        const placementsRes = results[2];
        if (placementsRes.status === "fulfilled") {
          const { count, error: placementsError } = placementsRes.value;
          if (!placementsError) {
            setActivePlacementsCount(count ?? 0);
          }
        }

        const issuesRes = results[3];
        if (issuesRes.status === "fulfilled") {
          const { count, error: issuesError } = issuesRes.value;
          if (!issuesError) {
            setPendingIssuesCount(count ?? 0);
          }
        }

        const totalVerRes = results[4];
        const approvedVerRes = results[5];
        if (
          totalVerRes.status === "fulfilled" &&
          approvedVerRes.status === "fulfilled"
        ) {
          const { count: totalCount, error: totalError } = totalVerRes.value;
          const { count: approvedCount, error: approvedError } =
            approvedVerRes.value;

          if (!totalError && !approvedError && (totalCount ?? 0) > 0) {
            const pct = Math.round(
              ((approvedCount ?? 0) / (totalCount ?? 1)) * 100,
            );
            setComplianceStatus(`${pct}%`);
          } else {
            setComplianceStatus("N/A");
          }
        }
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  return (
    <>
      <div className="dashboard-content">
      <div className="dashboard-header">
        <h2>FACILITATOR DASHBOARD</h2>
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <p style={{ margin: 0, fontWeight: "bold" }}>Logged in as FACILITATOR</p>
          <div
            onClick={() => navigate("/facilitator/profile")}
            style={{ cursor: "pointer" }}
            className="facilitator-profile-icon"
          >
              <ProfileImageUpload editable={false} size={30} />
            </div>
          </div>
        </div>

        {loading ? (
          <LoadingSpinner message="Loading dashboard..." />
        ) : (
          <>
            {error && (
              <p style={{ marginTop: 12, color: "var(--secondary-color)" }}>
                {error}
              </p>
            )}

            <div className="dashboard-stats-container">
              <DashboardStats stats={facilitatorDashboardStats} />
            </div>

            <div className="dashboard-my-placements-container">
              <h3>USERS</h3>
              <Card>
                <TableComponent
                  columns={userColumns}
                  data={userData}
                  caption=" Active System Users"
                  onRowClick={() => navigate("/facilitator/users")}
                />
              </Card>
            </div>
          </>
        )}

        <div style={{ marginTop: "20px", textAlign: "center" }}></div>
      </div>
    </>
  );
};

export default FacilitatorDashboard;
