import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import SideBar from "./SideBar";

const AdminProtectedRoute: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user, loading } = useAuth();

  if (loading) {
    return null;
  }

  const role = user?.user_metadata?.role;
  if (!user || (role !== "facilitator" && role !== "admin")) {
    return <Navigate to="/login" />;
  }

  return <>{children}</>;
};

export default AdminProtectedRoute;
