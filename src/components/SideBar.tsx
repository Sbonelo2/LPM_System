import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { supabase } from "../services/supabaseClient";
import NotificationBell from "./NotificationBell";

type UserRole = "admin" | "learner" | "qa_officer" | "programme_coordinator";

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

  // Get role from user metadata, with fallback to path-based detection
  const userRole: UserRole =
    (user?.user_metadata?.role as UserRole) ||
    (() => {
      // Fallback to path-based detection if metadata is missing
      if (location.pathname.startsWith("/admin")) return "admin";
      if (location.pathname.startsWith("/coordinator"))
        return "programme_coordinator";
      if (location.pathname.startsWith("/qa")) return "qa_officer";
      return "learner";
    })();

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("admin-token");
    localStorage.removeItem("coordinator-token");
    navigate("/login");
  };

  const getMenuItemsByRole = (role: UserRole): MenuItem[] => {
    const roleSpecificItems: Record<UserRole, MenuItem[]> = {
      admin: [
        { label: "DASHBOARD", path: "/admin/dashboard" },
        { label: "USER MANAGEMENT", path: "/admin/users" },
        { label: "SYSTEM SETTINGS", path: "/admin/settings" },
        { label: "SYSTEM MONITORING", path: "/admin/monitoring" },
        { label: "MAINTENANCE", path: "/admin/maintenance" },
      ],
      learner: [
        { label: "DASHBOARD", path: "/dashboard" },
        { label: "MY PLACEMENTS", path: "/my-placements" },
        { label: "MY DOCUMENTS", path: "/myDocuments" },
        { label: "PROFILE", path: "/profile" },
        { label: "NOTIFICATIONS", path: "/notifications" },
      ],
      qa_officer: [
        { label: "QA-DASHBOARD", path: "/qa/dashboard" },
        { label: "PLACEMENTS", path: "/placements" },
        { label: "DOCUMENTS", path: "/documents" },
        { label: "HOSTS", path: "/hosts" },
        { label: "REPORTS", path: "/reports" },
        { label: "COMPLIANCE", path: "/compliance" },
      ],
      programme_coordinator: [
        { label: "DASHBOARD", path: "/coordinator/dashboard" },
        { label: "PLACEMENTS", path: "/coordinator/placements" },
        { label: "DOCUMENTS", path: "/coordinator/documents" },
        { label: "HOSTS", path: "/coordinator/hosts" },
        { label: "REPORTS", path: "/coordinator/reports" },
      ],
    };

    return [
      ...roleSpecificItems[role],
      { label: "SIGN OUT", action: handleSignOut, isSignOut: true },
    ];
  };

  const menuItems = getMenuItemsByRole(userRole);

  const isActive = (path?: string) => path && location.pathname === path;

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
            Role: {userRole.replace("_", " ").toUpperCase()}
          </p>
        </div>
      )}
    </div>
  );
};

export default SideBar;
