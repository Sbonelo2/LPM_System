import React, { useEffect, useState } from "react";
import { supabase } from "../services/supabaseClient";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth"; // Import useAuth
import UploadDocument from "../components/UploadDocuments";
import DocumentList from "../components/DocumentsList";

import AddHostModal from "../components/AddHostModal";
// import DocumentList from '../components/DocumentList'; // Placeholder
// import PdfViewer from '../components/PdfViewer'; // Placeholder

const Dashboard: React.FC = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [message, setMessage] = useState("");
  const [addHostOpen, setAddHostOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  const handleLogout = async () => {
    setMessage("");
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setMessage("Logged out successfully!");
      navigate("/login");
    } catch (error: unknown) {
      setMessage(
        `Logout failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      console.error("Logout error:", error);
    }
  };

  if (loading) {
    return <div>Loading dashboard...</div>;
  }

  if (!user) {
    return null; // Should be redirected by ProtectedRoute
  }

  return (
    <div>
      <h2>Dashboard</h2>
      <p>Welcome, {user.email}!</p>
      <button onClick={handleLogout}>Logout</button>
      <button
        onClick={() => setAddHostOpen(true)}
        style={{ marginLeft: "10px" }}
      >
        Add New Host
      </button>
      {message && <p>{message}</p>}

      <AddHostModal
        open={addHostOpen}
        onClose={() => setAddHostOpen(false)}
        onCreate={(payload) => {
          console.log("Create host:", payload);
        }}
      />

      <UploadDocument />

      <DocumentList />

      {/* Placeholder for DocumentList and PdfViewer */}


    </div>
  );
};

export default Dashboard;
