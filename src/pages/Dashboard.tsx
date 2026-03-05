import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { supabase } from "../services/supabaseClient";
import DashboardStats from "../components/DashboardStats";
import TableComponent from "../components/TableComponent";
import Card from "../components/Card";
import ProfileImageUpload from "../components/ProfileImageUpload";
import "./Dashboard.css";

interface PlacementData {
  id: string;
  host: string;
  program: string;
  status: string;
  startDate: string;
  endDate: string;
}

const Dashboard: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [placements, setPlacements] = useState<PlacementData[]>([]);
  const [profileImage, setProfileImage] = useState<string>("");
  const [learnerName, setLearnerName] = useState<string>("");
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    pending: 0,
    profileComplete: false,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      loadLearnerData();
    }
  }, [user]);

  const loadLearnerData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get learner profile
      if (!user) return;

      const { data: profileData, error: profileError } = await supabase
        .from("learner_profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (profileError) {
        console.error("Error fetching profile:", profileError);
      }

      // Set profile data
      if (profileData) {
        setProfileImage(profileData.profile_image_url || "");
        setLearnerName(
          profileData.learner_name || user.email?.split("@")[0] || "Learner",
        );
      } else {
        setLearnerName(user.email?.split("@")[0] || "Learner");
      }

      // Get learner placements with host info
      const { data: placementsData, error: placementsError } = await supabase
        .from("learner_placements")
        .select(
          `
          id,
          program,
          status,
          start_date,
          end_date,
          host_name
        `,
        )
        .eq("learner_id", user.id); // In the placements table it might be learner_id referencing user_id

      if (placementsError) {
        console.warn("Error fetching placements:", placementsError);
      }

      const processedPlacements: PlacementData[] = (placementsData || []).map(
        (p: any) => ({
          id: p.id,
          host: p.host_name || "Unknown Host",
          program: p.program,
          status: p.status,
          startDate: p.start_date
            ? new Date(p.start_date).toLocaleDateString()
            : "Not set",
          endDate: p.end_date
            ? new Date(p.end_date).toLocaleDateString()
            : "Not set",
        }),
      );

      setPlacements(processedPlacements);

      // Calculate stats
      const active = processedPlacements.filter(
        (p) => p.status?.toLowerCase() === "active",
      ).length;
      const pending = processedPlacements.filter(
        (p) => p.status?.toLowerCase() === "pending",
      ).length;
      
      // Profile is complete if they've filled in basic details
      const profileComplete = !!(
        profileData && 
        profileData.learner_name && 
        profileData.learner_address &&
        profileData.learner_identifier
      );

      setStats({
        total: processedPlacements.length,
        active,
        pending,
        profileComplete,
      });
    } catch (err) {
      console.error("Error loading learner data:", err);
      setError("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return <div>Loading dashboard...</div>;
  }

  if (!user) {
    return null;
  }

  const dashboardStats = [
    { label: "MY PLACEMENTS", value: stats.total },
    { label: "ACTIVE PLACEMENTS", value: stats.active },
    { label: "PENDING PLACEMENTS", value: stats.pending },
    {
      label: "PROFILE STATUS",
      value: stats.profileComplete ? "Complete" : "Incomplete",
    },
  ];

  return (
    <div className="dashboard-layout">
      {/* SideBar is provided by MainLayout in App.tsx */}
      <div className="dashboard-content">
        <div
          className="dashboard-header"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "20px",
            backgroundColor: "#fff",
            borderBottom: "1px solid #e5e7eb",
            marginBottom: "20px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
            <ProfileImageUpload
              currentImage={profileImage}
              onImageChange={() => {}}
              editable={false}
              size={60}
            />
            <div>
              <h2 style={{ margin: 0, fontSize: "20px", fontWeight: 600 }}>
                Welcome, {learnerName}
              </h2>
              <p style={{ margin: 0, color: "#6b7280", fontSize: "14px" }}>
                {user.email}
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate("/learner/profile")}
            style={{
              padding: "10px 20px",
              backgroundColor: "#3b82f6",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "14px",
            }}
          >
            Edit Profile
          </button>
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
              data={placements}
              caption={
                placements.length === 0
                  ? "No placements yet. Your placements will appear here once assigned."
                  : "Your current placements"
              }
            />
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
