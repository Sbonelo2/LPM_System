import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const AdminProtectedRoute: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return null;
  }

  const role = user?.user_metadata?.role;
  if (!user || role !== "admin") {
    return <Navigate to="/login" />;
  }

  return <Outlet />;
};

export default AdminProtectedRoute;
