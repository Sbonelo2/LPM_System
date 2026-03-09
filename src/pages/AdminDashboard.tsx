import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import DashboardStats from "../components/DashboardStats";
import ProfileImageUpload from "../components/ProfileImageUpload";
import Card from "../components/Card";
import TableComponent, { type TableColumn } from "../components/TableComponent"; // Import TableComponent and TableColumn type
import LoadingSpinner from "../components/LoadingSpinner";
import { supabase } from "../services/supabaseClient";
import "./Dashboard.css"; // Reusing the Dashboard CSS for consistent styling
import "./AdminDashboard.css"; // Import AdminDashboard specific styles

const FacilitatorDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profileImage, setProfileImage] = useState<string>("");
  const [userName, setUserName] = useState<string>("");
  console.log("FacilitatorDashboard component rendering");

  // Placeholder data for Users Table
  interface UserData {
    fullName: string;
    email: string;
    role: string;
    createdDate: string;
  }

  interface ProfileRow {
    id: string;
    full_name: string | null;
    email: string | null;
    role: string;
    is_active: boolean | null;
    created_at: string;
  }

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [stats, setStats] = useState<
    { label: string; value: string | number }[]
  >([]);
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);

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
              .from("profiles")
              .select("id", { count: "exact", head: true })
              .eq("role", "learner")
              .eq("is_active", true),
            8000,
            "Load learner count",
          ),
          withTimeout(
            supabase
              .from("placements")
              .select("id", { count: "exact", head: true })
              .eq("status", "Active"),
            8000,
            "Load active placements count",
          ),
          withTimeout(
            supabase
              .from("qa_issues")
              .select("id", { count: "exact", head: true })
              .eq("status", "Open"),
            8000,
            "Load open issues count",
          ),
          withTimeout(
            supabase
              .from("profiles")
              .select("id, full_name, email, role, is_active, created_at")
              .order("created_at", { ascending: false })
              .limit(10),
            8000,
            "Load latest users",
          ),
        ]);

        const learnerCountRes = results[0];
        const placementsRes = results[1];
        const issuesRes = results[2];
        const profilesRes = results[3];

        const learnerCount =
          learnerCountRes.status === "fulfilled" && !learnerCountRes.value.error
            ? (learnerCountRes.value.count ?? 0)
            : 0;

        const placementsCount =
          placementsRes.status === "fulfilled" && !placementsRes.value.error
            ? (placementsRes.value.count ?? 0)
            : 0;

        const openIssuesCount =
          issuesRes.status === "fulfilled" && !issuesRes.value.error
            ? (issuesRes.value.count ?? 0)
            : 0;

        if (profilesRes.status === "fulfilled" && !profilesRes.value.error) {
          setProfiles((profilesRes.value.data ?? []) as ProfileRow[]);
        }

        setStats([
          { label: "ACTIVE LEARNERS", value: learnerCount },
          { label: "ACTIVE PLACEMENTS", value: placementsCount },
          { label: "PENDING ISSUES", value: openIssuesCount },
          { label: "COMPLIANCE STATUS", value: "N/A" },
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
      role: p.role ?? "",
      createdDate: p.created_at ? p.created_at.slice(0, 10) : "",
    }));
  }, [profiles]);

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
          {loading ? <LoadingSpinner /> : <DashboardStats stats={stats} />}
        </div>
        <div className="dashboard-my-placements-container">
          <h3>USERS</h3>
          {error ? (
            <div style={{ color: "#dc3545", padding: "12px 0" }}>{error}</div>
          ) : null}
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
    </>
  );
};

export default FacilitatorDashboard;
