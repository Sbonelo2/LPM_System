import React, { useState, useEffect } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import { supabase } from "./services/supabaseClient";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";

import ProgrammeCoordinatorPlacements from "./pages/ProgrammeCoordinatorPlacements";
import QADashboard from "./pages/QADashboard";
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
import EditUserAdmin from "./pages/EditUserAdmin";
import CoordinatorDashboard from "./pages/CoordinatorDashboard";

import SystemSettings from "./pages/SystemSettings";
import CoordinatorHosts from "./pages/CoordinatorHosts";
import CoordinatorDocuments from "./pages/CoordinatorDocuments";
import CoordinatorReports from "./pages/CoordinatorReports";
import QAPlacements from "./pages/QAPlacements";
import MaintenanceSettings from "./pages/MaintenanceSettings";

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

        // Check if we have a dummy token - if so, don't overwrite with Supabase session
        const coordinatorToken = localStorage.getItem("coordinator-token");
        const adminToken = localStorage.getItem("admin-token");
        const qaToken = localStorage.getItem("qa-token");

        if (session?.user) {
          localStorage.removeItem("admin-token");
          localStorage.removeItem("coordinator-token");
          localStorage.removeItem("qa-token");
        } else if (coordinatorToken || adminToken || qaToken) {
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
      // Check for dummy tokens first
      const coordinatorToken = localStorage.getItem("coordinator-token");
      const adminToken = localStorage.getItem("admin-token");
      const qaToken = localStorage.getItem("qa-token");

      if (adminToken && (coordinatorToken || qaToken)) {
        localStorage.removeItem("coordinator-token");
        localStorage.removeItem("qa-token");
      }

      if (adminToken) {
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

      if (coordinatorToken) {
        console.log("Found coordinator token, creating dummy user");
        const dummyUser = {
          id: "coordinator-123",
          email: "coordinator@gmail.com",
          user_metadata: { role: "programme_coordinator" },
        };
        setUser(dummyUser);
        setLoading(false);

        if (
          window.location.pathname === "/" ||
          window.location.pathname === "/login"
        ) {
          navigate(getDefaultPathForRole("programme_coordinator"));
        }
        return;
      }

      if (qaToken) {
        console.log("Found QA token, creating dummy user");
        const dummyUser = {
          id: "qa-123",
          email: "test@qa.com",
          user_metadata: { role: "qa_officer" },
        };
        setUser(dummyUser);
        setLoading(false);

        if (
          window.location.pathname === "/" ||
          window.location.pathname === "/login"
        ) {
          navigate(getDefaultPathForRole("qa_officer"));
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
          <Route path="/coordinator/reports" element={
            <MainLayout>
              <CoordinatorReports />
            </MainLayout>
          } />
        </Routes>
      </div>
      <Footer />
    </AuthProvider>
  );
}
//
export default App;
// commenting for debigging purposes
