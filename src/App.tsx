import React, { useState, useEffect } from "react";
import {
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { supabase } from "./services/supabaseClient";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";

import ProgrammeCoordinatorPlacements from "./pages/ProgrammeCoordinatorPlacements";
import QADashboard from "./pages/QADashboard";
import QADocuments from "./pages/QADocuments";
import MentorDashboard from "./pages/MentorDashboard";
import MentorLearners from "./pages/MentorLearners";
import MentorModuleAssessment from "./pages/MentorModuleAssessment";
import LearnerStatementOfWork from "./pages/LearnerStatementOfWork";
import LearnerModuleAssessment from "./pages/LearnerModuleAssessment";
import SignUp from "./pages/SignUp";
import { AuthContext } from "./contexts/AuthContext";
import { useAuth } from "./hooks/useAuth";
import SideBar from "./components/SideBar";
import Footer from "./components/Footer";
import "./App.css";
import LandingPage from "./pages/LandingPage";
import FacilitatorDashboard from "./pages/AdminDashboard";
import AdminProtectedRoute from "./components/AdminProtectedRoute";
import AdminProfile from "./pages/AdminProfile"; // Updated import
import AdminUserManagement from "./pages/AdminUserManagement"; // Added import
import AdminSystemMonitor from "./pages/AdminSystemMonitor";
import Notifications from "./pages/Notifications";
import Placements from "./pages/Placements";
import Documents from "./pages/Documents";

import SystemSettings from "./pages/SystemSettings";
import CoordinatorHosts from "./pages/CoordinatorHosts";
import CoordinatorDocuments from "./pages/CoordinatorDocuments";
import CoordinatorReports from "./pages/CoordinatorReports";
import QAPlacements from "./pages/QAPlacements";
import QAHosts from "./pages/QAHosts";
import MaintenanceSettings from "./pages/MaintenanceSettings";
import QAReports from "./pages/QAReports";
import QACompliance from "./pages/QACompliance";

const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<{
    id: string;
    email?: string;
    user_metadata?: { role?: string; full_name?: string };
  } | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const navigate = useNavigate();

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

  const normalizeRole = (rawRole?: string): string | undefined => {
    if (!rawRole) return undefined;
    const normalized = rawRole
      .trim()
      .toLowerCase()
      .replace(/[\s-]+/g, "_");
    if (normalized === "superadmin") return "super_admin";
    if (normalized === "program_coordinator") return "programme_coordinator";
    if (normalized === "facilitator") return "facilitator";
    return normalized;
  };

  const getDefaultPathForRole = (role?: string) => {
    // Only 4 roles: learner, mentor, facilitator (admin), super_admin
    if (role === "facilitator" || role === "admin")
      return "/facilitator/dashboard";
    if (role === "mentor") return "/mentor/dashboard";
    if (role === "super_admin") return "/super-admin/dashboard";
    if (role === "learner") return "/learner/dashboard";
    return "/learner/dashboard"; // Default to learner
  };

  const getEffectiveRole = async (sessionUser: {
    id: string;
    email?: string;
    user_metadata?: { role?: string; full_name?: string };
  }) => {
    try {
      // ALWAYS check DB for the absolute source of truth
      const { data, error } = (await withTimeout(
        supabase
          .from("profiles")
          .select("role")
          .eq("id", sessionUser.id)
          .maybeSingle(),
        8000,
        "Load profile role",
      )) as {
        data: { role?: string } | null;
        error: { message: string } | null;
      };

      if (!error && data?.role) return normalizeRole(String(data.role));

      // If no profile exists, create one with metadata role or default
      const metadataRole = normalizeRole(sessionUser.user_metadata?.role);
      const defaultRole = metadataRole ?? "learner";

      // Try to create profile
      await supabase.from("profiles").upsert(
        {
          id: sessionUser.id,
          email: sessionUser.email ?? "",
          full_name:
            sessionUser.user_metadata?.full_name ??
            sessionUser.email?.split("@")[0] ??
            "User",
          role: defaultRole,
        },
        { onConflict: "id" },
      );

      // If role is learner, also create learner profile
      if (defaultRole === "learner") {
        await supabase.from("learner_profiles").upsert(
          {
            user_id: sessionUser.id,
            learner_name:
              sessionUser.user_metadata?.full_name ??
              sessionUser.email?.split("@")[0] ??
              "Learner",
            email: sessionUser.email ?? "",
            programme: "Software Development",
          },
          { onConflict: "user_id" },
        );
      }
      return defaultRole;
    } catch {
      return normalizeRole(sessionUser.user_metadata?.role) ?? "learner";
    }
  };

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        console.log("Auth state changed:", session?.user);

        if (session?.user) {
          localStorage.removeItem("admin-token");
          localStorage.removeItem("super-admin-token");
          localStorage.removeItem("coordinator-token");
          localStorage.removeItem("qa-token");

          setUser(session.user);
          setLoading(false);

          // Only force redirect on login/root OR if they are on a DASHBOARD that doesn't match their role
          const currentPath = window.location.pathname;
          if (
            currentPath === "/" ||
            currentPath === "/login" ||
            currentPath.endsWith("/dashboard")
          ) {
            const effectiveRole = await getEffectiveRole(session.user);
            const targetPath = getDefaultPathForRole(effectiveRole);

            if (currentPath !== targetPath) {
              navigate(targetPath);
            }
          }
        } else {
          // No session - only clear if no dummy tokens
          const hasDummy =
            localStorage.getItem("super-admin-token") ||
            localStorage.getItem("admin-token") ||
            localStorage.getItem("coordinator-token");
          if (!hasDummy) {
            setUser(null);
            setLoading(false);
          }
        }
      },
    );

    const getUserSession = async () => {
      // Check for dummy tokens first
      const superAdminToken = localStorage.getItem("super-admin-token");
      const coordinatorToken = localStorage.getItem("coordinator-token");
      const adminToken = localStorage.getItem("admin-token");
      const qaToken = localStorage.getItem("qa-token");

      if (adminToken && (superAdminToken || coordinatorToken || qaToken)) {
        localStorage.removeItem("super-admin-token");
        localStorage.removeItem("coordinator-token");
        localStorage.removeItem("qa-token");
      }

      if (adminToken) {
        console.log("Found admin token, creating dummy user");
        const dummyUser = {
          id: "admin-123",
          email: "admin@admin.com",
          user_metadata: { role: "facilitator" },
        };
        setUser(dummyUser);
        setLoading(false);

        if (
          window.location.pathname === "/" ||
          window.location.pathname === "/login"
        ) {
          navigate(getDefaultPathForRole("facilitator"));
        }
        return;
      }

      if (superAdminToken || coordinatorToken || qaToken) {
        console.log("Found super admin token, creating dummy user");
        const dummyUser = {
          id: "super-admin-123",
          email: "superadmin@lpm.com",
          user_metadata: { role: "super_admin" },
        };
        setUser(dummyUser);
        setLoading(false);

        if (
          window.location.pathname === "/" ||
          window.location.pathname === "/login"
        ) {
          navigate(getDefaultPathForRole("super_admin"));
        }
        return;
      }

      // If no dummy tokens, check Supabase session
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        setUser(session.user);
        setLoading(false);

        const currentPath = window.location.pathname;
        const effectiveRole = await getEffectiveRole(session.user);
        const targetPath = getDefaultPathForRole(effectiveRole);

        if (
          currentPath === "/" ||
          currentPath === "/login" ||
          (currentPath.endsWith("/dashboard") && currentPath !== targetPath)
        ) {
          navigate(targetPath);
        }
      } else {
        setLoading(false);
      }
    };
    getUserSession();

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [navigate]);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [profileRole, setProfileRole] = useState<string | undefined>(undefined);
  const [profileRoleLoading, setProfileRoleLoading] = useState(false);
  const [maintenanceSnapshot, setMaintenanceSnapshot] = useState<any>(null);

  // Debug: Log the current state
  console.log("ProtectedRoute - user:", user);
  console.log("ProtectedRoute - loading:", loading);

  // Show loading while checking authentication
  if (loading) {
    return <div>Loading authentication...</div>;
  }

  // If no user, show message (no automatic redirect)
  if (!user) {
    return (
      <div
        style={{
          padding: "20px",
          textAlign: "center",
          fontSize: "16px",
          color: "#666",
        }}
      >
        Please log in to access this page.
        <div style={{ marginTop: "10px", fontSize: "12px" }}>
          Debug: User state is null or undefined
        </div>
      </div>
    );
  }

  const normalizeRole = (role?: string) => {
    if (!role) return undefined;
    const normalized = role
      .trim()
      .toLowerCase()
      .replace(/[\s-]+/g, "_");
    if (normalized === "superadmin") return "super_admin";
    if (normalized === "program_coordinator") return "programme_coordinator";
    if (normalized === "facilitator") return "facilitator";
    return normalized;
  };

  const getMaintenanceSnapshot = () => {
    try {
      const raw = localStorage.getItem("maintenance-settings");
      if (!raw) return null;
      return JSON.parse(raw) as {
        status?: "active" | "inactive";
        allowedDuringMaintenance?: {
          mentors?: boolean;
          learners?: boolean;
        };
        allowedUsers?: { email?: string; role?: string; enabled?: boolean }[];
      };
    } catch {
      return null;
    }
  };

  useEffect(() => {
    const loadMaintenance = async () => {
      try {
        const { data, error } = await supabase
          .from("maintenance_settings")
          .select("settings")
          .eq("key", "global")
          .maybeSingle();

        if (error) {
          setMaintenanceSnapshot(getMaintenanceSnapshot());
          return;
        }

        const settings = (data as { settings?: unknown } | null)?.settings;
        if (!settings) {
          setMaintenanceSnapshot(getMaintenanceSnapshot());
          return;
        }

        setMaintenanceSnapshot(settings);
        localStorage.setItem("maintenance-settings", JSON.stringify(settings));
      } catch {
        setMaintenanceSnapshot(getMaintenanceSnapshot());
      }
    };

    void loadMaintenance();
  }, []);

  const maintenance =
    (maintenanceSnapshot as ReturnType<typeof getMaintenanceSnapshot>) ??
    getMaintenanceSnapshot();
  const maintenanceActive = maintenance?.status === "active";
  const metadataRole = normalizeRole(user?.user_metadata?.role);

  useEffect(() => {
    const loadProfileRole = async () => {
      if (!user?.id) return;
      if (metadataRole) return;

      setProfileRoleLoading(true);
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .maybeSingle();

        if (!error) {
          setProfileRole(normalizeRole(data?.role));
        }
      } finally {
        setProfileRoleLoading(false);
      }
    };

    void loadProfileRole();
  }, [user?.id, metadataRole]);

  if (!metadataRole && profileRoleLoading) {
    return <div>Loading authentication...</div>;
  }

  const role = metadataRole ?? profileRole;

  if (maintenanceActive) {
    const allowed = maintenance?.allowedDuringMaintenance ?? {};

    const scheduledStart = (maintenance as any)?.scheduledStart as
      | string
      | undefined;
    const scheduledEnd = (maintenance as any)?.scheduledEnd as
      | string
      | undefined;
    const subject = (maintenance as any)?.subject as string | undefined;
    const message = (maintenance as any)?.message as string | undefined;

    const isSuperAdminRole = role === "super_admin";
    const isAdminRole = role === "admin";
    const isFacilitatorRole = role === "facilitator";
    const isMentorRole = role === "mentor";
    const isLearnerRole = role === "learner";

    const isMaintenanceSettingsPage =
      location.pathname === "/facilitator/maintenance";

    const isAllowedDuringMaintenance =
      isSuperAdminRole ||
      isAdminRole ||
      isFacilitatorRole ||
      (allowed.mentors ? isMentorRole : false) ||
      (allowed.learners ? isLearnerRole : false);

    if (!isAllowedDuringMaintenance && !isMaintenanceSettingsPage) {
      return (
        <div
          style={{
            padding: 24,
            maxWidth: 720,
            margin: "0 auto",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 10 }}>
            System Maintenance
          </div>
          <div style={{ color: "#666", marginBottom: 14 }}>
            The system is currently under maintenance. Your account does not
            have access during this maintenance window.
          </div>
          {(scheduledStart || scheduledEnd) && (
            <div
              style={{
                marginBottom: 12,
                textAlign: "left",
                border: "1px solid #eee",
                borderRadius: 8,
                padding: 12,
                background: "#fff",
              }}
            >
              <div style={{ fontWeight: 700, marginBottom: 6 }}>Schedule</div>
              <div style={{ color: "#444" }}>
                Start: {scheduledStart ? scheduledStart : "Not set"}
              </div>
              <div style={{ color: "#444" }}>
                End: {scheduledEnd ? scheduledEnd : "Not set"}
              </div>
            </div>
          )}
          {(subject || message) && (
            <div
              style={{
                marginBottom: 12,
                textAlign: "left",
                border: "1px solid #eee",
                borderRadius: 8,
                padding: 12,
                background: "#fff",
              }}
            >
              {subject && (
                <div style={{ fontWeight: 700, marginBottom: 6 }}>
                  {subject}
                </div>
              )}
              {message && (
                <div style={{ color: "#444", whiteSpace: "pre-wrap" }}>
                  {message}
                </div>
              )}
            </div>
          )}
          <div
            style={{
              fontFamily: "monospace",
              fontSize: 12,
              whiteSpace: "pre-wrap",
              textAlign: "left",
              border: "1px solid #eee",
              borderRadius: 8,
              padding: 12,
              background: "#fafafa",
            }}
          >
            role: {String(role ?? "unknown")}
          </div>
          <button
            type="button"
            style={{
              marginTop: 16,
              padding: "10px 14px",
              borderRadius: 8,
              border: "1px solid #ddd",
              background: "white",
              cursor: "pointer",
              fontWeight: 600,
            }}
            onClick={async () => {
              localStorage.removeItem("admin-token");
              localStorage.removeItem("super-admin-token");
              localStorage.removeItem("coordinator-token");
              localStorage.removeItem("qa-token");
              localStorage.removeItem("mentor-token");
              try {
                await supabase.auth.signOut({ scope: "local" });
              } finally {
                window.location.assign("/login");
              }
            }}
          >
            Sign out
          </button>
        </div>
      );
    }
  }

  // User is authenticated, render children
  return <>{children}</>;
};

const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();

  const pathname = `${location.pathname}${location.hash}`;
  const forceSidebar =
    pathname.includes("/coordinator") ||
    pathname.includes("/qa") ||
    pathname.includes("/mentor") ||
    pathname.includes("/admin") ||
    pathname.includes("/facilitator") ||
    pathname.includes("/super-admin");

  if (!user && !forceSidebar) {
    return <>{children}</>;
  }

  return (
    <div style={{ display: "flex" }}>
      <SideBar />
      <main style={{ flex: 1, overflow: "auto" }}>{children}</main>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <div style={{ flex: 1 }}>
        {" "}
        {/* Main content areaa */}
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          {/* Legacy redirects */}
          <Route
            path="/dashboard"
            element={<Navigate to="/learner/dashboard" replace />}
          />
          <Route
            path="/profile"
            element={<Navigate to="/learner/profile" replace />}
          />
          <Route
            path="/placements"
            element={<Navigate to="/learner/placements" replace />}
          />
          <Route
            path="/myDocuments"
            element={<Navigate to="/learner/documents" replace />}
          />
          <Route
            path="/my-placements"
            element={<Navigate to="/learner/placements" replace />}
          />
          <Route
            path="/notifications"
            element={<Navigate to="/learner/notifications" replace />}
          />

          {/* Admin/Facilitator redirects */}
          <Route
            path="/admin"
            element={<Navigate to="/facilitator/dashboard" replace />}
          />
          <Route
            path="/admin/profile"
            element={<Navigate to="/facilitator/profile" replace />}
          />

          {/* QA/Coordinator redirects to Super Admin */}
          <Route
            path="/qa/dashboard"
            element={<Navigate to="/super-admin/dashboard" replace />}
          />
          <Route
            path="/qa/placements"
            element={<Navigate to="/super-admin/placements" replace />}
          />
          <Route
            path="/qa/documents"
            element={<Navigate to="/super-admin/documents" replace />}
          />
          <Route
            path="/qa/hosts"
            element={<Navigate to="/super-admin/hosts" replace />}
          />
          <Route
            path="/qa/reports"
            element={<Navigate to="/super-admin/reports" replace />}
          />
          <Route
            path="/qa/compliance"
            element={<Navigate to="/super-admin/compliance" replace />}
          />
          <Route
            path="/coordinator/dashboard"
            element={<Navigate to="/super-admin/dashboard" replace />}
          />
          <Route
            path="/coordinator/placements"
            element={<Navigate to="/super-admin/placements" replace />}
          />
          <Route
            path="/coordinator/hosts"
            element={<Navigate to="/super-admin/hosts" replace />}
          />
          <Route
            path="/coordinator/reports"
            element={<Navigate to="/super-admin/reports" replace />}
          />
          <Route
            path="/learner/dashboard"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <Dashboard />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/learner/profile"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <Profile />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/learner/placements"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <Placements />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/learner/documents"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <Documents />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/learner/statement-of-work"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <LearnerStatementOfWork />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/learner/modules/:moduleId"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <LearnerModuleAssessment />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/learner/notifications"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <Notifications />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/super-admin/documents"
            element={
              <MainLayout>
                <CoordinatorDocuments />
              </MainLayout>
            }
          />
          <Route
            path="/super-admin/placements"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <ProgrammeCoordinatorPlacements />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/super-admin/dashboard"
            element={
              <MainLayout>
                <QADashboard />
              </MainLayout>
            }
          />
          <Route
            path="/super-admin/profile"
            element={
              <MainLayout>
                <AdminProfile />
              </MainLayout>
            }
          />

          <Route
            path="/super-admin/compliance"
            element={
              <MainLayout>
                <QACompliance />
              </MainLayout>
            }
          />
          <Route
            path="/qa/placements"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <QAPlacements />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/coordinator/placements"
            element={
              <MainLayout>
                <ProgrammeCoordinatorPlacements />
              </MainLayout>
            }
          />
          <Route
            path="/qa/documents"
            element={
              <MainLayout>
                <QADocuments />
              </MainLayout>
            }
          />
          <Route
            path="/qa/hosts"
            element={
              <MainLayout>
                <QAHosts />
              </MainLayout>
            }
          />
          <Route
            path="/qa/reports"
            element={
              <MainLayout>
                <QAReports />
              </MainLayout>
            }
          />

          <Route
            path="/mentor/dashboard"
            element={
              <MainLayout>
                <MentorDashboard />
              </MainLayout>
            }
          />
          <Route
            path="/mentor/profile"
            element={
              <MainLayout>
                <AdminProfile />
              </MainLayout>
            }
          />

          <Route
            path="/mentor/learners"
            element={
              <MainLayout>
                <MentorLearners />
              </MainLayout>
            }
          />

          <Route
            path="/mentor/learners/:learnerId"
            element={
              <MainLayout>
                <MentorLearners />
              </MainLayout>
            }
          />

          <Route
            path="/mentor/learners/:learnerId/modules/:moduleId"
            element={
              <MainLayout>
                <MentorModuleAssessment />
              </MainLayout>
            }
          />

          <Route
            path="/mentor/notifications"
            element={
              <MainLayout>
                <Notifications />
              </MainLayout>
            }
          />
          <Route
            path="/mentor/documents"
            element={
              <MainLayout>
                <Documents />
              </MainLayout>
            }
          />
          <Route path="/" element={<Login />} />

          <Route
            path="/facilitator/dashboard"
            element={
              <AdminProtectedRoute>
                <MainLayout>
                  <FacilitatorDashboard />
                </MainLayout>
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/facilitator/profile"
            element={
              <AdminProtectedRoute>
                <MainLayout>
                  <AdminProfile />
                </MainLayout>
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/facilitator/users"
            element={
              <AdminProtectedRoute>
                <MainLayout>
                  <AdminUserManagement />
                </MainLayout>
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/facilitator/settings"
            element={
              <AdminProtectedRoute>
                <MainLayout>
                  <SystemSettings />
                </MainLayout>
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/super-admin/monitoring"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <AdminSystemMonitor />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/facilitator/maintenance"
            element={
              <AdminProtectedRoute>
                <MainLayout>
                  <MaintenanceSettings />
                </MainLayout>
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/facilitator/documents"
            element={
              <AdminProtectedRoute>
                <MainLayout>
                  <Documents />
                </MainLayout>
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/facilitator/notifications"
            element={
              <AdminProtectedRoute>
                <MainLayout>
                  <Notifications />
                </MainLayout>
              </AdminProtectedRoute>
            }
          />
          <Route path="/" element={<Login />} />
          <Route
            path="/qa/dashboard"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <QADashboard />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/coordinator/dashboard"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <QADashboard />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/coordinator/hosts"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <CoordinatorHosts />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/coordinator/reports"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <CoordinatorReports />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/super-admin/hosts"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <CoordinatorHosts />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/super-admin/reports"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <CoordinatorReports />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/super-admin/users"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <AdminUserManagement />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/super-admin/notifications"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <Notifications />
                </MainLayout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>
      <Footer />
    </AuthProvider>
  );
}
//
export default App;
// commenting for debigging purposes
