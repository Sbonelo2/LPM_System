import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { supabase } from './services/supabaseClient';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import SideBar from './components/SideBar';
import { AuthContext } from './contexts/AuthContext';
import { useAuth } from './hooks/useAuth';
import './App.css';

const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<{ id: string; email?: string; user_metadata?: { role?: string } } | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setUser(session?.user || null);
        setLoading(false);
        if (session?.user && (window.location.pathname === '/' || window.location.pathname === '/login')) {
          navigate('/dashboard');
        } else if (!session?.user && window.location.pathname === '/dashboard') {
          navigate('/login');
        }
      }
    );

    const getUserSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
      setLoading(false);
      if (session?.user && (window.location.pathname === '/' || window.location.pathname === '/login')) {
        navigate('/dashboard');
      } else if (!session?.user && window.location.pathname === '/dashboard') {
        navigate('/login');
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

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return <div>Loading authentication...</div>;
  }

  if (!user) {
    navigate('/login');
    return null;
  }

  return <>{children}</>;
};

const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  if (!user) {
    return <>{children}</>;
  }

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <SideBar />
      <main style={{ flex: 1, overflow: 'auto' }}>
        {children}
      </main>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
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
        <Route path="/" element={<Login />} />
       
      </Routes>
    </AuthProvider>
  );
}

export default App;
