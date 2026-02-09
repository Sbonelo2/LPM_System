import React, { useEffect, useState } from "react";
import { supabase } from "../services/supabaseClient";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth"; // Import useAuth
import UploadDocument from "../components/UploadDocuments";

// import DocumentList from '../components/DocumentList'; // Placeholder
// import PdfViewer from '../components/PdfViewer'; // Placeholder

const Dashboard: React.FC = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [message, setMessage] = useState("");

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
      {message && <p>{message}</p>}

      <UploadDocument />

      {/* Placeholder for DocumentList and PdfViewer */}
      <h3>Your Documents</h3>
      <p>Documents will go here</p>

      <hr style={{ margin: "30px 0" }} />

      <h3>Backend Prototype Tables for FigJam (4 Tables)</h3>
      <div
        style={{
          backgroundColor: "#f0f0f0",
          padding: "15px",
          borderRadius: "5px",
          marginBottom: "20px",
          overflowX: "auto",
        }}
      >
        {/* Table: documents */}
        <h4 style={{ marginBottom: "10px" }}>Table: documents</h4>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            marginBottom: "20px",
            fontSize: "0.9em",
          }}
        >
          <thead>
            <tr style={{ backgroundColor: "#e0e0e0" }}>
              <th
                style={{
                  border: "1px solid #ccc",
                  padding: "8px",
                  textAlign: "left",
                }}
              >
                Field Name
              </th>
              <th
                style={{
                  border: "1px solid #ccc",
                  padding: "8px",
                  textAlign: "left",
                }}
              >
                Type
              </th>
              <th
                style={{
                  border: "1px solid #ccc",
                  padding: "8px",
                  textAlign: "left",
                }}
              >
                Key
              </th>
              <th
                style={{
                  border: "1px solid #ccc",
                  padding: "8px",
                  textAlign: "left",
                }}
              >
                Description
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ border: "1px solid #ccc", padding: "8px" }}>id</td>
              <td style={{ border: "1px solid #ccc", padding: "8px" }}>uuid</td>
              <td style={{ border: "1px solid #ccc", padding: "8px" }}>PK</td>
              <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                Primary key for the document.
              </td>
            </tr>
            <tr>
              <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                user_id
              </td>
              <td style={{ border: "1px solid #ccc", padding: "8px" }}>uuid</td>
              <td style={{ border: "1px solid #ccc", padding: "8px" }}>FK</td>
              <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                ID of the user who uploaded the document (references
                auth.users.id).
              </td>
            </tr>
            <tr>
              <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                file_name
              </td>
              <td style={{ border: "1px solid #ccc", padding: "8px" }}>text</td>
              <td style={{ border: "1px solid #ccc", padding: "8px" }}></td>
              <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                Original name of the uploaded file.
              </td>
            </tr>
            <tr>
              <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                file_url
              </td>
              <td style={{ border: "1px solid #ccc", padding: "8px" }}>text</td>
              <td style={{ border: "1px solid #ccc", padding: "8px" }}></td>
              <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                Public URL to access the uploaded file.
              </td>
            </tr>
            <tr>
              <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                created_at
              </td>
              <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                timestamp with time zone
              </td>
              <td style={{ border: "1px solid #ccc", padding: "8px" }}></td>
              <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                Timestamp when the document record was created.
              </td>
            </tr>
            <tr>
              <td
                style={{ border: "1px solid #ccc", padding: "8px" }}
                colSpan={4}
              >
                <strong>RLS Policy:</strong> Users can read their own documents;
                only the uploader can insert documents.
              </td>
            </tr>
            <tr>
              <td
                style={{ border: "1px solid #ccc", padding: "8px" }}
                colSpan={4}
              >
                <strong>Relationships:</strong> Many-to-one with `auth.users`
                via `user_id`.
              </td>
            </tr>
          </tbody>
        </table>

        {/* Table: notifications */}
        <h4 style={{ marginBottom: "10px" }}>Table: notifications</h4>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            marginBottom: "20px",
            fontSize: "0.9em",
          }}
        >
          <thead>
            <tr style={{ backgroundColor: "#e0e0e0" }}>
              <th
                style={{
                  border: "1px solid #ccc",
                  padding: "8px",
                  textAlign: "left",
                }}
              >
                Field Name
              </th>
              <th
                style={{
                  border: "1px solid #ccc",
                  padding: "8px",
                  textAlign: "left",
                }}
              >
                Type
              </th>
              <th
                style={{
                  border: "1px solid #ccc",
                  padding: "8px",
                  textAlign: "left",
                }}
              >
                Key
              </th>
              <th
                style={{
                  border: "1px solid #ccc",
                  padding: "8px",
                  textAlign: "left",
                }}
              >
                Description
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ border: "1px solid #ccc", padding: "8px" }}>id</td>
              <td style={{ border: "1px solid #ccc", padding: "8px" }}>uuid</td>
              <td style={{ border: "1px solid #ccc", padding: "8px" }}>PK</td>
              <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                Primary key for the notification.
              </td>
            </tr>
            <tr>
              <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                user_id
              </td>
              <td style={{ border: "1px solid #ccc", padding: "8px" }}>uuid</td>
              <td style={{ border: "1px solid #ccc", padding: "8px" }}>FK</td>
              <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                ID of the recipient user (references auth.users.id).
              </td>
            </tr>
            <tr>
              <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                message
              </td>
              <td style={{ border: "1px solid #ccc", padding: "8px" }}>text</td>
              <td style={{ border: "1px solid #ccc", padding: "8px" }}></td>
              <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                Content of the notification.
              </td>
            </tr>
            <tr>
              <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                is_read
              </td>
              <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                boolean
              </td>
              <td style={{ border: "1px solid #ccc", padding: "8px" }}></td>
              <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                Indicates if the user has read the notification (Default:
                false).
              </td>
            </tr>
            <tr>
              <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                created_at
              </td>
              <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                timestamp with time zone
              </td>
              <td style={{ border: "1px solid #ccc", padding: "8px" }}></td>
              <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                Timestamp when the notification was created.
              </td>
            </tr>
            <tr>
              <td
                style={{ border: "1px solid #ccc", padding: "8px" }}
                colSpan={4}
              >
                <strong>RLS Policy:</strong> Users can only read and update
                their own notifications.
              </td>
            </tr>
            <tr>
              <td
                style={{ border: "1px solid #ccc", padding: "8px" }}
                colSpan={4}
              >
                <strong>Relationships:</strong> Many-to-one with `auth.users`
                via `user_id`.
              </td>
            </tr>
          </tbody>
        </table>

        {/* Table: auth.users */}
        <h4 style={{ marginBottom: "10px" }}>
          Table: auth.users (Supabase Authentication Users Table)
        </h4>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            marginBottom: "20px",
            fontSize: "0.9em",
          }}
        >
          <thead>
            <tr style={{ backgroundColor: "#e0e0e0" }}>
              <th
                style={{
                  border: "1px solid #ccc",
                  padding: "8px",
                  textAlign: "left",
                }}
              >
                Field Name
              </th>
              <th
                style={{
                  border: "1px solid #ccc",
                  padding: "8px",
                  textAlign: "left",
                }}
              >
                Type
              </th>
              <th
                style={{
                  border: "1px solid #ccc",
                  padding: "8px",
                  textAlign: "left",
                }}
              >
                Key
              </th>
              <th
                style={{
                  border: "1px solid #ccc",
                  padding: "8px",
                  textAlign: "left",
                }}
              >
                Description
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ border: "1px solid #ccc", padding: "8px" }}>id</td>
              <td style={{ border: "1px solid #ccc", padding: "8px" }}>uuid</td>
              <td style={{ border: "1px solid #ccc", padding: "8px" }}>PK</td>
              <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                Unique identifier for the user.
              </td>
            </tr>
            <tr>
              <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                email
              </td>
              <td style={{ border: "1px solid #ccc", padding: "8px" }}>text</td>
              <td style={{ border: "1px solid #ccc", padding: "8px" }}></td>
              <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                User's email address (Unique).
              </td>
            </tr>
            <tr>
              <td style={{ border: "1px solid #ccc", padding: "8px" }}>role</td>
              <td style={{ border: "1px solid #ccc", padding: "8px" }}>text</td>
              <td style={{ border: "1px solid #ccc", padding: "8px" }}></td>
              <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                Conceptual role ('user', 'admin', 'facilitator'). Admin and
                Facilitator have same duties. (Often handled via custom claims
                or separate table).
              </td>
            </tr>
            <tr>
              <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                created_at
              </td>
              <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                timestamp with time zone
              </td>
              <td style={{ border: "1px solid #ccc", padding: "8px" }}></td>
              <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                Timestamp when the user account was created.
              </td>
            </tr>
            <tr>
              <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                last_sign_in_at
              </td>
              <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                timestamp with time zone
              </td>
              <td style={{ border: "1px solid #ccc", padding: "8px" }}></td>
              <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                Timestamp of the user's last sign-in.
              </td>
            </tr>
            <tr>
              <td
                style={{ border: "1px solid #ccc", padding: "8px" }}
                colSpan={4}
              >
                <strong>Relationships:</strong> One-to-many with `documents` via
                `auth.users.id &rarr; documents.user_id`.
              </td>
            </tr>
            <tr>
              <td
                style={{ border: "1px solid #ccc", padding: "8px" }}
                colSpan={4}
              >
                <strong>Relationships:</strong> One-to-many with `notifications`
                via `auth.users.id &rarr; notifications.user_id`.
              </td>
            </tr>
            <tr>
              <td
                style={{ border: "1px solid #ccc", padding: "8px" }}
                colSpan={4}
              >
                <strong>Relationships:</strong> One-to-many with
                `storage.objects` via `auth.users.id &rarr;
                storage.objects.owner_id`.
              </td>
            </tr>
          </tbody>
        </table>

        {/* Table: storage.objects */}
        <h4 style={{ marginBottom: "10px" }}>
          Table: storage.objects (Supabase Storage Objects Table)
        </h4>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            marginBottom: "20px",
            fontSize: "0.9em",
          }}
        >
          <thead>
            <tr style={{ backgroundColor: "#e0e0e0" }}>
              <th
                style={{
                  border: "1px solid #ccc",
                  padding: "8px",
                  textAlign: "left",
                }}
              >
                Field Name
              </th>
              <th
                style={{
                  border: "1px solid #ccc",
                  padding: "8px",
                  textAlign: "left",
                }}
              >
                Type
              </th>
              <th
                style={{
                  border: "1px solid #ccc",
                  padding: "8px",
                  textAlign: "left",
                }}
              >
                Key
              </th>
              <th
                style={{
                  border: "1px solid #ccc",
                  padding: "8px",
                  textAlign: "left",
                }}
              >
                Description
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ border: "1px solid #ccc", padding: "8px" }}>id</td>
              <td style={{ border: "1px solid #ccc", padding: "8px" }}>uuid</td>
              <td style={{ border: "1px solid #ccc", padding: "8px" }}>PK</td>
              <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                Unique identifier for the storage object.
              </td>
            </tr>
            <tr>
              <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                bucket_id
              </td>
              <td style={{ border: "1px solid #ccc", padding: "8px" }}>text</td>
              <td style={{ border: "1px solid #ccc", padding: "8px" }}>FK</td>
              <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                ID of the storage bucket the object belongs to (references
                storage.buckets.id, e.g., 'documents').
              </td>
            </tr>
            <tr>
              <td style={{ border: "1px solid #ccc", padding: "8px" }}>name</td>
              <td style={{ border: "1px solid #ccc", padding: "8px" }}>text</td>
              <td style={{ border: "1px solid #ccc", padding: "8px" }}></td>
              <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                Full path and name of the object within the bucket (e.g.,
                'userId/timestamp_filename.pdf').
              </td>
            </tr>
            <tr>
              <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                owner_id
              </td>
              <td style={{ border: "1px solid #ccc", padding: "8px" }}>uuid</td>
              <td style={{ border: "1px solid #ccc", padding: "8px" }}>FK</td>
              <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                ID of the user who uploaded this object (references
                auth.users.id).
              </td>
            </tr>
            <tr>
              <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                created_at
              </td>
              <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                timestamp with time zone
              </td>
              <td style={{ border: "1px solid #ccc", padding: "8px" }}></td>
              <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                Timestamp when the object was uploaded.
              </td>
            </tr>
            <tr>
              <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                last_accessed_at
              </td>
              <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                timestamp with time zone
              </td>
              <td style={{ border: "1px solid #ccc", padding: "8px" }}></td>
              <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                Timestamp when the object was last accessed.
              </td>
            </tr>
            <tr>
              <td
                style={{ border: "1px solid #ccc", padding: "8px" }}
                colSpan={4}
              >
                <strong>RLS Policy:</strong> Controls who can insert, select,
                and delete objects in the 'documents' bucket, based on user ID
                and file type.
              </td>
            </tr>
            <tr>
              <td
                style={{ border: "1px solid #ccc", padding: "8px" }}
                colSpan={4}
              >
                <strong>Relationships:</strong> Many-to-one with `auth.users`
                via `owner_id`.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Dashboard;
