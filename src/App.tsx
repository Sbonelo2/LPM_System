import React, { useState, useEffect, createContext, useContext } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { supabase } from './services/supabaseClient';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import './App.css';

// Define a type for the user object, or use `any` for simplicity for now
interface AuthContextType {
  user: any; // Supabase user object
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Custom hook to use the AuthContext
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any>(null);
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

    // Initial check
    const getUserSession = async () => {
      const { data: { session }, error: _error } = await supabase.auth.getSession();
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
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Login />} /> {/* Default route */}
        </Routes>
      </div>
    </AuthProvider>
  );
}

export default App;
