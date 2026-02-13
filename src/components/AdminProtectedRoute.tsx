import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const AdminProtectedRoute: React.FC = () => {
    const token = localStorage.getItem('admin-token');

    return token ? <Outlet /> : <Navigate to="/login" />;
};

export default AdminProtectedRoute;
