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
import CoordinatorDashboard from "./pages/CoordinatorDashboard";

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
    user_metadata?: { role?: string };
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

  const getDefaultPathForRole = (role?: string) => {
    if (role === "admin") return "/admin/dashboard";
    if (role === "programme_coordinator") return "/coordinator/documents";
    if (role === "qa_officer") return "/qa/dashboard";
    if (role === "mentor") return "/mentor/dashboard";
    return "/learner/dashboard";
  };

  const getEffectiveRole = async (sessionUser: {
    id: string;
    user_metadata?: { role?: string };
  }) => {
    const metadataRole = sessionUser.user_metadata?.role;
    try {
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

      if (!error && data?.role) return String(data.role);
    } catch {
      // ignore
    }
    return metadataRole;
    console.log("getDefaultPathForRole called with:", role);
    if (role === "admin" || role === "facilitator") {
      console.log("Returning facilitator dashboard path");
      return "/facilitator/dashboard";
    }
    if (role === "programme_coordinator") {
      console.log("Returning coordinator dashboard path");
      return "/coordinator/dashboard";
    }
    if (role === "qa_officer") {
      console.log("Returning qa dashboard path");
      return "/qa/dashboard";
    }
    console.log("Returning default learner dashboard path");
    return "/dashboard";
  };

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        console.log("Auth state changed:", session?.user);

        try {
          if (session?.user) {
            const effectiveRole = await getEffectiveRole(session.user);
            setUser({
              ...session.user,
              user_metadata: {
                ...(session.user.user_metadata ?? {}),
                ...(effectiveRole ? { role: effectiveRole } : {}),
              },
            });
          } else {
            setUser(null);
          }

          if (
            session?.user &&
            (window.location.pathname === "/" ||
              window.location.pathname === "/login")
          ) {
            const effectiveRole = await getEffectiveRole(session.user);
            navigate(getDefaultPathForRole(effectiveRole));
          } else if (
            !session?.user &&
            (window.location.pathname === "/learner/dashboard" ||
              window.location.pathname === "/dashboard")
          ) {
            navigate("/login");
          }
        } catch (e) {
          console.error("Auth state change handler error:", e);
          setUser(session?.user || null);
        } finally {
          setLoading(false);
        }
      },
    );

    const getUserSession = async () => {
      try {
        const {
          data: { session },
        } = await withTimeout(supabase.auth.getSession(), 15000, "Get session");
        console.log("Current session:", session?.user);

        if (session?.user) {
          const effectiveRole = await getEffectiveRole(session.user);
          setUser({
            ...session.user,
            user_metadata: {
              ...(session.user.user_metadata ?? {}),
              ...(effectiveRole ? { role: effectiveRole } : {}),
            },
          });
        } else {
          setUser(null);
        }

        if (
          session?.user &&
          (window.location.pathname === "/" ||
            window.location.pathname === "/login")
        ) {
          const effectiveRole = await getEffectiveRole(session.user);
          navigate(getDefaultPathForRole(effectiveRole));
          const userRole = session.user.user_metadata?.role;
          console.log("Auth state change - user role:", userRole);
          navigate(getDefaultPathForRole(userRole));
        } else if (
          !session?.user &&
          (window.location.pathname === "/learner/dashboard" ||
            window.location.pathname === "/dashboard")
        ) {
          navigate("/login");
        }
      } catch (e) {
        console.error("getSession bootstrap error:", e);
        setUser(null);
      } finally {
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

  const [maintenanceLoading, setMaintenanceLoading] = useState<boolean>(true);
  const [maintenanceActive, setMaintenanceActive] = useState<boolean>(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState<string>(
    "The system is currently under maintenance.",
  );
  const [maintenanceAllowedRoles, setMaintenanceAllowedRoles] = useState<
    Set<string>
  >(new Set(["facilitator"]));

  useEffect(() => {
    const loadMaintenance = async () => {
      setMaintenanceLoading(true);

      try {
        const { data, error } = (await Promise.race([
          supabase
            .from("maintenance_settings")
            .select(
              "status, allow_admins_only, allow_qa_officers, allow_programme_coordinators, allow_learners, subject, message",
            )
            .order("updated_at", { ascending: false })
            .limit(1)
            .maybeSingle(),
          new Promise<never>((_resolve, reject) =>
            setTimeout(
              () => reject(new Error("Load maintenance settings timed out")),
              8000,
            ),
          ),
        ])) as {
          data: {
            status?: string;
            allow_admins_only?: boolean;
            allow_qa_officers?: boolean;
            allow_programme_coordinators?: boolean;
            allow_learners?: boolean;
            subject?: string;
            message?: string;
          } | null;
          error: { message: string } | null;
        };

        if (error) {
          console.error("Failed to load maintenance settings:", error);
          setMaintenanceActive(false);
          setMaintenanceAllowedRoles(new Set(["admin"]));
          return;
      const allowed = new Set<string>(["facilitator"]);
      const facilitatorsOnly = Boolean(data?.allow_admins_only);
      if (!facilitatorsOnly) {
        if (Boolean(data?.allow_qa_officers)) {
          allowed.add("qa_officer");
        }

        const status = String(data?.status ?? "inactive").toLowerCase();
        const active = status === "active";
        setMaintenanceActive(active);

        const msg = String(data?.message ?? "").trim();
        if (msg) {
          setMaintenanceMessage(msg);
        }

        const allowed = new Set<string>(["admin"]);
        const adminsOnly = Boolean(data?.allow_admins_only);
        if (!adminsOnly) {
          if (Boolean(data?.allow_qa_officers)) {
            allowed.add("qa_officer");
          }
          if (Boolean(data?.allow_programme_coordinators)) {
            allowed.add("programme_coordinator");
          }
          if (
            Boolean(
              (data as { allow_learners?: boolean } | null)?.allow_learners,
            )
          ) {
            allowed.add("learner");
          }
        }
        setMaintenanceAllowedRoles(allowed);
      } catch (e) {
        console.error("Maintenance load error:", e);
        setMaintenanceActive(false);
        setMaintenanceAllowedRoles(new Set(["admin"]));
      } finally {
        setMaintenanceLoading(false);
      }
    };

    void loadMaintenance();
  }, []);

  // Debug: Log the current state
  console.log("ProtectedRoute - user:", user);
  console.log("ProtectedRoute - loading:", loading);

  // Show loading while checking authentication
  if (loading || maintenanceLoading) {
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

  const role = user.user_metadata?.role ?? "learner";
  const windowPathWithHash = `${window.location.pathname}${window.location.hash}`;
  const pathWithHash = `${location.pathname}${location.hash}${windowPathWithHash}`;
  const bypassMaintenance =
    pathWithHash.includes("coordinator") ||
    pathWithHash.includes("/qa") ||
    pathWithHash.includes("/admin");

  console.log("ProtectedRoute - pathWithHash:", pathWithHash);
  console.log("ProtectedRoute - bypassMaintenance:", bypassMaintenance);

  if (
    !bypassMaintenance &&
    maintenanceActive &&
    !maintenanceAllowedRoles.has(role)
  ) {
    return (
      <div
        style={{
          padding: "32px",
          textAlign: "center",
          fontSize: "16px",
          color: "#333",
          maxWidth: "680px",
          margin: "0 auto",
        }}
      >
        <h2 style={{ marginBottom: "12px" }}>Maintenance</h2>
        <div style={{ whiteSpace: "pre-wrap" }}>{maintenanceMessage}</div>
      </div>
    );
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
    pathname.includes("/admin");

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
          <Route
            path="/dashboard"
            element={<Navigate to="/learner/dashboard" replace />}
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
            path="/coordinator/documents"
            element={
              <MainLayout>
                <CoordinatorDocuments />
              </MainLayout>
            }
          />
          <Route
            path="/myDocuments"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <Documents />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/placements"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <Placements />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/qa/placements"
            element={
              <MainLayout>
                <QAPlacements />
              </MainLayout>
            }
          />

          <Route
            path="/qa/dashboard"
            element={
              <MainLayout>
                <QADashboard />
              </MainLayout>
            }
          />

          <Route
            path="/qa/compliance"
            element={
              <MainLayout>
                <QACompliance />
              </MainLayout>
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
            path="/mentor/host"
            element={
              <MainLayout>
                <CoordinatorHosts pageTitle="Mentor Hosts" />
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
            path="/my-placements"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <Placements />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <Profile />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <Notifications />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Login />} />
          <Route path="/facilitator/dashboard" element={
            <AdminProtectedRoute>
              <MainLayout>
                <FacilitatorDashboard />
              </MainLayout>
            </AdminProtectedRoute>
          } />
          <Route path="/facilitator/profile" element={
            <AdminProtectedRoute>
              <MainLayout>
                <AdminProfile />
              </MainLayout>
            </AdminProtectedRoute>
          } />
          <Route path="/facilitator/users" element={
            <AdminProtectedRoute>
              <MainLayout>
                <AdminUserManagement />
              </MainLayout>
            </AdminProtectedRoute>
          } />
          <Route path="/facilitator/settings" element={
            <AdminProtectedRoute>
              <MainLayout>
                <SystemSettings />
              </MainLayout>
            </AdminProtectedRoute>
          } />
          <Route path="/facilitator/monitoring" element={
            <AdminProtectedRoute>
              <MainLayout>
                <AdminSystemMonitor />
              </MainLayout>
            </AdminProtectedRoute>
          } />
          <Route path="/facilitator/maintenance" element={
            <AdminProtectedRoute>
              <MainLayout>
                <MaintenanceSettings />
              </MainLayout>
            </AdminProtectedRoute>
          } />
          <Route path="/" element={<Login />} />
          <Route
            path="/coordinator/dashboard"
            element={
              <MainLayout>
                <CoordinatorDashboard />
              </MainLayout>
            }
          />
          <Route
            path="/coordinator/hosts"
            element={
              <MainLayout>
                <CoordinatorHosts />
              </MainLayout>
            }
          />
          <Route
            path="/coordinator/reports"
            element={
              <MainLayout>
                <CoordinatorReports />
              </MainLayout>
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
