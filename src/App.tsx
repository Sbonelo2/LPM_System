import React, { useState, useEffect } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import { supabase } from "./services/supabaseClient";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";

import ProgrammeCoordinatorPlacements from "./pages/ProgrammeCoordinatorPlacements";
import QADashboard from "./pages/QADashboard";
import QADocuments from "./pages/QADocuments";
import SignUp from "./pages/SignUp";
import { AuthContext } from "./contexts/AuthContext";
import { useAuth } from "./hooks/useAuth";
import SideBar from "./components/SideBar";
import Footer from "./components/Footer";
import "./App.css";
import LandingPage from "./pages/LandingPage";
import AdminDashboard from "./pages/AdminDashboard";
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

  const getDefaultPathForRole = (role?: string) => {
    if (role === "admin") return "/admin/dashboard";
    if (role === "programme_coordinator") return "/coordinator/dashboard";
    if (role === "qa_officer") return "/qa/dashboard";
    return "/dashboard";
  };

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        console.log("Auth state changed:", session?.user);

        setUser(session?.user || null);
        setLoading(false);
        if (
          session?.user &&
          (window.location.pathname === "/" ||
            window.location.pathname === "/login")
        ) {
          navigate(getDefaultPathForRole(session.user.user_metadata?.role));
        } else if (
          !session?.user &&
          window.location.pathname === "/dashboard"
        ) {
          navigate("/login");
        }
      },
    );

    const getUserSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      console.log("Current session:", session?.user);
      setUser(session?.user || null);
      setLoading(false);
      if (
        session?.user &&
        (window.location.pathname === "/" ||
          window.location.pathname === "/login")
      ) {
        navigate(getDefaultPathForRole(session.user.user_metadata?.role));
      } else if (!session?.user && window.location.pathname === "/dashboard") {
        navigate("/login");
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

  const [maintenanceLoading, setMaintenanceLoading] = useState<boolean>(true);
  const [maintenanceActive, setMaintenanceActive] = useState<boolean>(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState<string>(
    "The system is currently under maintenance.",
  );
  const [maintenanceAllowedRoles, setMaintenanceAllowedRoles] = useState<
    Set<string>
  >(new Set(["admin"]));

  useEffect(() => {
    const loadMaintenance = async () => {
      setMaintenanceLoading(true);
      const { data } = await supabase
        .from("maintenance_settings")
        .select(
          "status, allow_admins_only, allow_qa_officers, allow_programme_coordinators, allow_learners, subject, message",
        )
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

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
          Boolean((data as { allow_learners?: boolean } | null)?.allow_learners)
        ) {
          allowed.add("learner");
        }
      }
      setMaintenanceAllowedRoles(allowed);
      setMaintenanceLoading(false);
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
  if (maintenanceActive && !maintenanceAllowedRoles.has(role)) {
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

  if (!user) {
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
              <ProtectedRoute>
                <MainLayout>
                  <CoordinatorDocuments />
                </MainLayout>
              </ProtectedRoute>
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
              <ProtectedRoute>
                <MainLayout>
                  <QAPlacements />
                </MainLayout>
              </ProtectedRoute>
            }
          />

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
            path="/qa/compliance"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <QACompliance />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/coordinator/placements"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <ProgrammeCoordinatorPlacements />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/qa/documents"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <QADocuments />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/qa/hosts"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <QAHosts />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/qa/reports"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <QAReports />
                </MainLayout>
              </ProtectedRoute>
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
          <Route path="/admin/dashboard" element={<AdminProtectedRoute />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
          </Route>
          <Route path="/admin/profile" element={<AdminProtectedRoute />}>
            <Route path="/admin/profile" element={<AdminProfile />} />
          </Route>
          <Route path="/admin/users" element={<AdminProtectedRoute />}>
            <Route path="/admin/users" element={<AdminUserManagement />} />
          </Route>
          <Route path="/admin/settings" element={<AdminProtectedRoute />}>
            <Route path="/admin/settings" element={<SystemSettings />} />
          </Route>
          <Route path="/admin/monitoring" element={<AdminProtectedRoute />}>
            <Route path="/admin/monitoring" element={<AdminSystemMonitor />} />
          </Route>
          <Route path="/admin/maintenance" element={<AdminProtectedRoute />}>
            <Route
              path="/admin/maintenance"
              element={<MaintenanceSettings />}
            />
          </Route>
          <Route path="/" element={<Login />} />
          <Route
            path="coordinator/dashboard"
            element={<CoordinatorDashboard />}
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
