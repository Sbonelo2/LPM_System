import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { supabase } from './services/supabaseClient';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import { AuthContext } from './contexts/AuthContext';
import { useAuth } from './hooks/useAuth';
import './App.css';
import AddHostModal from './components/AddHostModal';

const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  // useEffect(() => {
  //   const { data: authListener } = supabase.auth.onAuthStateChange(
  //     async (_event, session) => {
  //       setUser(session?.user || null);
  //       setLoading(false);
  //       if (session?.user && (window.location.pathname === '/' || window.location.pathname === '/login')) {
  //         navigate('/dashboard');
  //       } else if (!session?.user && window.location.pathname === '/dashboard') {
  //         navigate('/login');
  //       }
  //     }
  //   );

  //   // Initial check
  //   const getUserSession = async () => {
  //     const { data: { session } } = await supabase.auth.getSession();
  //     setUser(session?.user || null);
  //     setLoading(false);
  //     if (session?.user && (window.location.pathname === '/' || window.location.pathname === '/login')) {
  //       navigate('/dashboard');
  //     } else if (!session?.user && window.location.pathname === '/dashboard') {
  //       navigate('/login');
  //     }
  //   };
  //   getUserSession();

  //   return () => {
  //     authListener.subscription.unsubscribe();
  //   };
  // }, [navigate]);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

// ProtectedRoute component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return <div>Loading authentication...</div>; // Or a spinner
  }

  if (!user) {
    navigate('/login');
    return null; // Don't render children if not authenticated
  }

  return <>{children}</>;
};

function App() {
  return (
    <AuthProvider>
      <div className="App">
        <AddHostModal open={true} onClose={() => {}}/>
      </div>
    </AuthProvider>
  );
}

export default App;
