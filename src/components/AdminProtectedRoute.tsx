<<<<<<< HEAD
import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

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
=======
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const AdminProtectedRoute: React.FC = () => {
    const token = localStorage.getItem('admin-token');

    return token ? <Outlet /> : <Navigate to="/login" />;
>>>>>>> feat/superAdmin
};

export default AdminProtectedRoute;
