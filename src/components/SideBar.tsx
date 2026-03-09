import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { supabase } from "../services/supabaseClient";
import NotificationBell from "./NotificationBell";

type UserRole =
  | "admin"
  | "learner"
  | "super_admin"
  | "qa_officer"
  | "programme_coordinator"
  | "mentor";

interface MenuItem {
  label: string;
  path?: string;
  action?: () => void;
  isSignOut?: boolean;
}

const SideBar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const roleFromPath: UserRole | null = (() => {
    if (location.pathname.startsWith("/facilitator")) return "admin";
    if (location.pathname.startsWith("/super-admin")) return "super_admin";
    if (location.pathname.startsWith("/mentor")) return "mentor";
    if (location.pathname.startsWith("/learner")) return "learner";
    // Legacy path detection for backward compatibility
    if (location.pathname.startsWith("/admin")) return "admin";
    if (location.pathname.startsWith("/coordinator")) return "super_admin";
    if (location.pathname.startsWith("/qa")) return "super_admin";
    return null;
  })();

  const roleFromMetadata = user?.user_metadata?.role as UserRole | undefined;

  // Prefer path-scoped role so navigation to /qa/* always shows QA menu, etc.
  const userRole: UserRole = roleFromPath ?? roleFromMetadata ?? "learner";

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  const handleSignOut = async () => {
    // Clear local dummy-session tokens first so UI state resets immediately.
    localStorage.removeItem("admin-token");
    localStorage.removeItem("super-admin-token");
    localStorage.removeItem("coordinator-token");
    localStorage.removeItem("qa-token");
    localStorage.removeItem("mentor-token");

    try {
      // Local scope avoids depending on a network round-trip to sign out.
      await supabase.auth.signOut({ scope: "local" });
    } catch (error) {
      console.error("Sign out error:", error);
    } finally {
      navigate("/login", { replace: true });
      window.location.assign("/login");
    }
  };

  const getMenuItemsByRole = (role: UserRole): MenuItem[] => {
    const roleSpecificItems: Record<UserRole, MenuItem[]> = {
      admin: [
        { label: "DASHBOARD", path: "/facilitator/dashboard" },
        { label: "USER MANAGEMENT", path: "/facilitator/users" },
        { label: "MY DOCUMENTS", path: "/myDocuments" },
        { label: "PROFILE", path: "/facilitator/profile" },
        { label: "SYSTEM MONITORING", path: "/facilitator/monitoring" },
        { label: "MAINTENANCE", path: "/facilitator/maintenance" },
        { label: "NOTIFICATIONS", path: "/facilitator/notifications" },
      ],
      learner: [
        { label: "DASHBOARD", path: "/learner/dashboard" },
        { label: "MY PLACEMENTS", path: "/learner/placements" },
        { label: "MY DOCUMENTS", path: "/learner/documents" },
        { label: "PROFILE", path: "/learner/profile" },
        { label: "NOTIFICATIONS", path: "/learner/notifications" },
      ],
      super_admin: [
        { label: "DASHBOARD", path: "/super-admin/dashboard" },
        { label: "PLACEMENTS", path: "/super-admin/placements" },
        { label: "DOCUMENTS", path: "/super-admin/documents" },
        { label: "HOSTS", path: "/super-admin/hosts" },
        { label: "REPORTS", path: "/super-admin/reports" },
        { label: "COMPLIANCE", path: "/super-admin/compliance" },
        { label: "USER MANAGEMENT", path: "/super-admin/users" },
        { label: "SYSTEM SETTINGS", path: "/super-admin/settings" },
        { label: "PROFILE", path: "/super-admin/profile" },
        { label: "NOTIFICATIONS", path: "/super-admin/notifications" },
      ],
      qa_officer: [
        { label: "DASHBOARD", path: "/qa/dashboard" },
        { label: "PLACEMENTS", path: "/qa/placements" },
        { label: "DOCUMENTS", path: "/qa/documents" },
        { label: "HOSTS", path: "/qa/hosts" },
        { label: "REPORTS", path: "/qa/reports" },
        { label: "COMPLIANCE", path: "/qa/compliance" },
      ],
      programme_coordinator: [
        { label: "DASHBOARD", path: "/super-admin/dashboard" },
        { label: "PLACEMENTS", path: "/super-admin/placements" },
        { label: "DOCUMENTS", path: "/super-admin/documents" },
        { label: "HOSTS", path: "/super-admin/hosts" },
        { label: "REPORTS", path: "/super-admin/reports" },
        { label: "COMPLIANCE", path: "/super-admin/compliance" },
        { label: "NOTIFICATIONS", path: "/super-admin/notifications" },
      ],
      mentor: [
        { label: "DASHBOARD", path: "/mentor/dashboard" },
        { label: "HOST", path: "/mentor/host" },
        { label: "MY DOCUMENTS", path: "/myDocuments" },
        { label: "PROFILE", path: "/mentor/profile" },
        { label: "NOTIFICATIONS", path: "/mentor/notifications" },
      ],
    };

    return [
      ...roleSpecificItems[role],
      { label: "SIGN OUT", action: handleSignOut, isSignOut: true },
    ];
  };

  const menuItems = getMenuItemsByRole(userRole);

  const isActive = (path?: string) => path && location.pathname === path;
  const formattedRole =
    userRole === "super_admin"
      ? "SUPER ADMIN"
      : userRole.replace("_", " ").toUpperCase();

  return (
    <div
      style={{
        width: "250px",
        backgroundColor: "#f8f9fa",
        padding: "20px",
        display: "flex",
        flexDirection: "column",
        borderRight: "1px solid #e9ecef",
      }}
    >
      <h2
        style={{
          fontSize: "24px",
          fontWeight: "bold",
          marginBottom: "30px",
          color: "#2c3e50",
          textAlign: "center",
        }}
      >
        LPM System
      </h2>

      <nav style={{ flex: 1 }}>
        {menuItems.map((item, index) => (
          <div key={index} style={{ marginBottom: "10px" }}>
            {item.label === "NOTIFICATIONS" ? (
              <NotificationBell onClick={() => handleNavigation(item.path!)} />
            ) : (
              <button
                onClick={() =>
                  item.action ? item.action() : handleNavigation(item.path!)
                }
                style={{
                  width: "100%",
                  padding: "15px 20px",
                  border: isActive(item.path) ? "2px solid #007bff" : "none",
                  borderRadius: "12px",
                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: 500,
                  color: item.isSignOut ? "#dc3545" : "#2c3e50",
                  textAlign: "left",
                  transition: "all 0.2s ease",
                  outline: "none",
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow =
                    "0 4px 12px rgba(0, 0, 0, 0.15)";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow =
                    "0 2px 8px rgba(0, 0, 0, 0.1)";
                }}
              >
                {item.label}
              </button>
            )}
          </div>
        ))}
      </nav>

      {/* Logged-in user info */}
      {user && (
        <div
          style={{
            marginTop: "auto",
            padding: "15px",
            backgroundColor: "#ffffff",
            borderRadius: "8px",
            boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
            textAlign: "center",
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: "12px",
              color: "#6c757d",
            }}
          >
            Logged in as:
          </p>
          <p
            style={{
              margin: "5px 0 0 0",
              fontSize: "14px",
              fontWeight: "500",
              color: "#2c3e50",
            }}
          >
            {user.email}
          </p>
          <p
            style={{
              margin: "5px 0 0 0",
              fontSize: "11px",
              color: "#007bff",
              fontWeight: "500",
            }}
          >
            Role: {formattedRole}
          </p>
        </div>
      )}
    </div>
  );
};

export default SideBar;
