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
import SuperAdminProtectedRoute from "./components/SuperAdminProtectedRoute";
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
    if (role === "admin") return "/facilitator/dashboard";
    if (role === "mentor") return "/mentor/dashboard";
    if (
      role === "super_admin" ||
      role === "programme_coordinator" ||
      role === "qa_officer"
    ) {
      return "/super-admin/dashboard";
    }
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
  };

  const enableDummyAuth =
    (import.meta as { env?: Record<string, string | undefined> }).env
      ?.VITE_ENABLE_DUMMY_AUTH === "true";

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        console.log("Auth state changed:", session?.user);

        // Dummy-token auth is dev-only. In production, always use real Supabase auth.
        const superAdminToken = enableDummyAuth
          ? localStorage.getItem("super-admin-token")
          : null;
        const coordinatorToken = enableDummyAuth
          ? localStorage.getItem("coordinator-token")
          : null;
        const adminToken = enableDummyAuth
          ? localStorage.getItem("admin-token")
          : null;
        const qaToken = enableDummyAuth
          ? localStorage.getItem("qa-token")
          : null;

        if (session?.user) {
          localStorage.removeItem("admin-token");
          localStorage.removeItem("super-admin-token");
          localStorage.removeItem("coordinator-token");
          localStorage.removeItem("qa-token");
        } else if (
          enableDummyAuth &&
          (superAdminToken || coordinatorToken || adminToken || qaToken)
        ) {
          console.log(
            "Dummy token exists, ignoring Supabase auth state change",
          );
          return; // Don't overwrite dummy user
        }

        setUser(session?.user || null);
        setLoading(false);
        if (
          session?.user &&
          (window.location.pathname === "/" ||
            window.location.pathname === "/login")
        ) {
          const effectiveRole = await getEffectiveRole(session.user);
          navigate(getDefaultPathForRole(effectiveRole));
        } else if (
          !session?.user &&
          window.location.pathname === "/dashboard"
        ) {
          navigate("/login");
        }
      },
    );

    const getUserSession = async () => {
      // Check for dummy tokens first (dev-only)
      const superAdminToken = enableDummyAuth
        ? localStorage.getItem("super-admin-token")
        : null;
      const coordinatorToken = enableDummyAuth
        ? localStorage.getItem("coordinator-token")
        : null;
      const adminToken = enableDummyAuth
        ? localStorage.getItem("admin-token")
        : null;
      const qaToken = enableDummyAuth ? localStorage.getItem("qa-token") : null;

      if (adminToken && (superAdminToken || coordinatorToken || qaToken)) {
        localStorage.removeItem("super-admin-token");
        localStorage.removeItem("coordinator-token");
        localStorage.removeItem("qa-token");
      }

      if (enableDummyAuth && adminToken) {
        console.log("Found admin token, creating dummy user");
        const dummyUser = {
          id: "admin-123",
          email: "admin@admin.com",
          user_metadata: { role: "admin" },
        };
        setUser(dummyUser);
        setLoading(false);

        if (
          window.location.pathname === "/" ||
          window.location.pathname === "/login"
        ) {
          navigate(getDefaultPathForRole("admin"));
        }
        return;
      }

      if (enableDummyAuth && (superAdminToken || coordinatorToken || qaToken)) {
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
      console.log("Current session:", session?.user);
      setUser(session?.user || null);
      setLoading(false);
      if (
        session?.user &&
        (window.location.pathname === "/" ||
          window.location.pathname === "/login")
      ) {
        const effectiveRole = await getEffectiveRole(session.user);
        navigate(getDefaultPathForRole(effectiveRole));
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
  const location = useLocation();

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
            path="/super-admin/documents"
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
            path="/super-admin/settings"
            element={
              <SuperAdminProtectedRoute>
                <MainLayout>
                  <SystemSettings />
                </MainLayout>
              </SuperAdminProtectedRoute>
            }
          />

          <Route
            path="/super-admin/system-settings"
            element={
              <SuperAdminProtectedRoute>
                <MainLayout>
                  <SystemSettings />
                </MainLayout>
              </SuperAdminProtectedRoute>
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

          <Route
            path="/admin"
            element={<Navigate to="/facilitator/dashboard" replace />}
          />
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
            path="/facilitator/monitoring"
            element={
              <AdminProtectedRoute>
                <MainLayout>
                  <AdminSystemMonitor />
                </MainLayout>
              </AdminProtectedRoute>
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
              <SuperAdminProtectedRoute>
                <MainLayout>
                  <AdminUserManagement />
                </MainLayout>
              </SuperAdminProtectedRoute>
            }
          />

          <Route
            path="/super-admin/user-management"
            element={
              <SuperAdminProtectedRoute>
                <MainLayout>
                  <AdminUserManagement />
                </MainLayout>
              </SuperAdminProtectedRoute>
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
