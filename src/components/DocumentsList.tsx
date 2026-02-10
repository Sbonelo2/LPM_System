import { useState, useEffect } from "react";
import { supabase } from "../services/supabaseClient";
import PdfViewer from "./PdfViewer";

interface Document {
  id: string;
  user_id: string;
  file_name: string;
  file_url: string;
  created_at: string;
}

export default function DocumentList() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(
    null,
  );
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    // Get current user ID
    supabase.auth.getUser().then(({ data: { user } }) => {
      console.log("Current user ID:", user?.id);
      setCurrentUserId(user?.id || null);
    });

    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      console.log("Fetched documents:", data);
      console.log("Current user ID:", currentUserId);
      setDocuments(data || []);
    } catch (error: unknown) {
      console.error(
        "Error fetching documents:",
        error instanceof Error ? error.message : "Unknown error",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (doc: Document) => {
    if (!confirm(`Are you sure you want to delete "${doc.file_name}"?`)) {
      return;
    }

    setDeletingId(doc.id);

    try {
      // Extract file path from the URL
      // URL format: https://[project].supabase.co/storage/v1/object/public/documents/userId/filename
      console.log("Document URL:", doc.file_url);
      const urlParts = doc.file_url.split("/documents");
      console.log("URL parts:", urlParts);
      if (urlParts.length < 2) {
        throw new Error("Invalid file URL: " + doc.file_url);
      }
      const filePath = urlParts[1];
      console.log("File path to delete:", filePath);

      // Delete from storage
      console.log("Deleting from storage...");
      const { error: storageError, data: storageData } = await supabase.storage
        .from("documents")
        .remove([filePath]);
      console.log("Storage result:", {
        error: storageError,
        data: storageData,
      });

      if (storageError) {
        console.error("Storage error:", storageError);
        throw storageError;
      }

      // Delete from database
      console.log("Deleting from database...");
      const { error: dbError, data: dbData } = await supabase
        .from("documents")
        .delete()
        .eq("id", doc.id);
      console.log("Database result:", { error: dbError, data: dbData });

      if (dbError) {
        console.error("Database error:", dbError);
        throw dbError;
      }

      // Verify the document was actually deleted from database
      const { data: verifyData, error: verifyError } = await supabase
        .from("documents")
        .select("id")
        .eq("id", doc.id);

      console.log("Verification result:", {
        data: verifyData,
        error: verifyError,
      });

      if (verifyData && verifyData.length > 0) {
        // Document still exists - delete didn't work
        console.error("Document still exists in database after delete!");
        throw new Error(
          "Document was not deleted. This might be due to RLS policies.",
        );
      }

      // Successfully deleted - update local state
      console.log("Document deleted successfully!");
      setDocuments((prev) => prev.filter((d) => d.id !== doc.id));
      alert("Document deleted successfully!");
    } catch (error: unknown) {
      console.error(
        "Error deleting document:",
        error instanceof Error ? error.message : "Unknown error",
      );
      alert(
        `Failed to delete document: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "2rem 0",
        }}
      >
        Loading documents...
      </div>
    );
  }

  return (
    <div
      style={{
        backgroundColor: "white",
        padding: "1.5rem",
        borderRadius: "0.5rem",
        boxShadow:
          "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
      }}
    >
      <h2
        style={{
          fontSize: "1.5rem",
          fontWeight: "bold",
          marginBottom: "1rem",
        }}
      >
        Uploaded Documents
      </h2>

      {documents.length === 0 ? (
        <p
          style={{
            color: "#6b7280",
            textAlign: "center",
            padding: "2rem 0",
          }}
        >
          No documents uploaded yet.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {documents.map((doc) => (
            <div
              key={doc.id}
              style={{
                border: "1px solid #d1d5db",
                borderRadius: "0.5rem",
                padding: "1rem",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <h3
                    style={{
                      fontSize: "1.125rem",
                      fontWeight: "500",
                      color: "#111827",
                    }}
                  >
                    {doc.file_name}
                  </h3>
                  <p
                    style={{
                      fontSize: "0.875rem",
                      color: "#6b7280",
                    }}
                  >
                    Uploaded on {new Date(doc.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button
                    onClick={() => setSelectedDocument(doc)}
                    style={{
                      backgroundColor: "#16a34a",
                      color: "white",
                      padding: "0.5rem 1rem",
                      border: "none",
                      borderRadius: "0.375rem",
                      fontSize: "0.875rem",
                      fontWeight: "500",
                      cursor: "pointer",
                    }}
                    onMouseOver={(e) =>
                      (e.currentTarget.style.backgroundColor = "#15803d")
                    }
                    onMouseOut={(e) =>
                      (e.currentTarget.style.backgroundColor = "#16a34a")
                    }
                  >
                    View PDF
                  </button>
                  <button
                    onClick={() => handleDelete(doc)}
                    disabled={deletingId === doc.id}
                    style={{
                      backgroundColor:
                        deletingId === doc.id ? "#9ca3af" : "#dc2626",
                      color: "white",
                      padding: "0.5rem 1rem",
                      border: "none",
                      borderRadius: "0.375rem",
                      fontSize: "0.875rem",
                      fontWeight: "500",
                      cursor: deletingId === doc.id ? "not-allowed" : "pointer",
                    }}
                    onMouseOver={(e) =>
                      deletingId !== doc.id &&
                      (e.currentTarget.style.backgroundColor = "#b91c1c")
                    }
                    onMouseOut={(e) =>
                      deletingId !== doc.id &&
                      (e.currentTarget.style.backgroundColor = "#dc2626")
                    }
                  >
                    {deletingId === doc.id ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </div>
              <div style={{ marginTop: "0.5rem" }}>
                <a
                  href={doc.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: "#2563eb",
                    fontSize: "0.875rem",
                    textDecoration: "underline",
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.color = "#1d4ed8")}
                  onMouseOut={(e) => (e.currentTarget.style.color = "#2563eb")}
                >
                  Open in new tab
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedDocument && (
        <PdfViewer
          document={selectedDocument}
          onClose={() => setSelectedDocument(null)}
        />
      )}
    </div>
  );
}
