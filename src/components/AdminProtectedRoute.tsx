import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import SideBar from "./SideBar";

const AdminProtectedRoute: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return null;
  }

  const role = user?.user_metadata?.role;
  if (!user || role !== "admin") {
    return <Navigate to="/login" />;
  }

  return (
    <div style={{ display: "flex" }}>
      <SideBar />
      <main style={{ flex: 1, overflow: "auto" }}>
        <Outlet />
      </main>
    </div>
  );
};

export default AdminProtectedRoute;
