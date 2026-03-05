import React, { useEffect, useRef, useState } from "react";
import Button from "../components/Button";
import Card from "../components/Card";
import TableComponent, { type TableColumn } from "../components/TableComponent";
import Snackbar from "../components/Snackbar";
import PdfViewer from "../components/PdfViewer";
import { formatDate } from "../utils/dateUtils";
import "./Documents.css";

type DocumentTypeKey =
  | "ID_COPY"
  | "MATRIC_CERTIFICATE"
  | "TERTIARY_QUALIFICATION"
  | "PROOF_OF_ADDRESS"
  | "TIMESHEET"
  | "EVIDENCE";

type DocumentRecord = {
  id: string;
  user_id: string;
  file_name: string;
  file_url: string;
  created_at: string;
  document_type?: string;
  review_owner_role?: string;
  review_status?: string;
  uploaded_by?: string;
};

const DOCUMENT_TYPES: Array<{ key: DocumentTypeKey; label: string }> = [
  { key: "ID_COPY", label: "ID Copy" },
  { key: "MATRIC_CERTIFICATE", label: "Matric Certificate" },
  { key: "TERTIARY_QUALIFICATION", label: "Tertiary Qualification" },
  { key: "PROOF_OF_ADDRESS", label: "Proof of Address" },
  { key: "TIMESHEET", label: "Timesheet Template" },
  { key: "EVIDENCE", label: "Evidence of Work" },
];

const TYPE_PREFIX = "__DOC_TYPE__";

function stripTypePrefix(fileName: string): string {
  if (!fileName.startsWith(TYPE_PREFIX)) {
    return fileName;
  }

  const typeSplitIndex = fileName.indexOf("__", TYPE_PREFIX.length);
  if (typeSplitIndex === -1) {
    return fileName;
  }

  return fileName.slice(typeSplitIndex + 2);
}

function resolveDocumentType(fileName: string): DocumentTypeKey | null {
  if (fileName.startsWith(TYPE_PREFIX)) {
    const typeSplitIndex = fileName.indexOf("__", TYPE_PREFIX.length);
    if (typeSplitIndex > -1) {
      const key = fileName.slice(TYPE_PREFIX.length, typeSplitIndex);
      if (DOCUMENT_TYPES.some((entry) => entry.key === key)) {
        return key as DocumentTypeKey;
      }
    }
  }

  const normalized = fileName.toLowerCase();
  if (normalized.includes("id")) return "ID_COPY";
  if (normalized.includes("matric")) return "MATRIC_CERTIFICATE";
  if (normalized.includes("tertiary") || normalized.includes("qual")) {
    return "TERTIARY_QUALIFICATION";
  }
  if (normalized.includes("proof") || normalized.includes("address")) {
    return "PROOF_OF_ADDRESS";
  }

  return null;
}

export default function Documents(): React.JSX.Element {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [uploading, setUploading] = useState(false);
  const [selectedType, setSelectedType] = useState<DocumentTypeKey>("ID_COPY");
  const [submitTo, setSubmitTo] = useState<"mentor" | "super_admin">("mentor");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [viewingDocument, setViewingDocument] = useState<DocumentRecord | null>(null);

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          setSnackbarMessage("Please sign in to view documents.");
          return;
        }

        const { data, error } = await supabase
          .from("documents")
          .select("id, user_id, file_name, file_url, created_at, document_type, review_owner_role, review_status, uploaded_by")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (error) throw error;
        setDocuments(data ?? []);
      } catch (error: unknown) {
        setSnackbarMessage(
          `Failed to load documents: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
        );
      } finally {
        setUploading(false);
      }
    };

    fetchDocuments();
  }, []);

  const handleChooseFile = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setSelectedFile(file);
    setSnackbarMessage("");
  };

  const handleDelete = async (documentId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) {
      return;
    }

    try {
      const { error: deleteError } = await supabase
        .from("documents")
        .delete()
        .eq("id", documentId);

      if (deleteError) {
        throw deleteError;
      }

      setDocuments((prev) => prev.filter((doc) => doc.id !== documentId));
      setSnackbarMessage("Document deleted successfully.");
    } catch (error: unknown) {
      setSnackbarMessage(
        `Delete failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setSnackbarMessage("Please choose a file first.");
      return;
    }

    setUploading(true);
    setSnackbarMessage("Uploading document...");

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error("User not authenticated.");
      }

      const safeName = selectedFile.name.replace(/[^\w.-]/g, "_");
      const storageFileName = `${Date.now()}_${safeName}`;
      const filePath = `${user.id}/${selectedType}/${storageFileName}`;

      const { error: uploadError } = await supabase.storage
        .from("documents")
        .upload(filePath, selectedFile, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("documents").getPublicUrl(filePath);

      const taggedFileName = `${TYPE_PREFIX}${selectedType}__${selectedFile.name}`;
      const { data: inserted, error: insertError } = await supabase
        .from("documents")
        .insert([
          {
            user_id: user.id,
            file_name: taggedFileName,
            file_url: publicUrl,
            document_type: selectedType,
            review_owner_role: submitTo,
            storage_path: filePath
          },
        ])
        .select("id, user_id, file_name, file_url, created_at, document_type, review_owner_role, review_status")
        .single();

      if (insertError) {
        throw insertError;
      }

      setDocuments((prev) => [inserted, ...prev]);
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      setSnackbarMessage(`Upload complete. Document submitted to ${submitTo === 'mentor' ? 'Mentor' : 'Super Admin'}.`);
    } catch (error: unknown) {
      setSnackbarMessage(
        `Upload failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    } finally {
      setUploading(false);
    }
  };

  const handleView = (doc: DocumentRecord) => {
    setViewingDocument(doc);
  };

  const documentColumns: TableColumn<DocumentRecord>[] = [
    { 
      key: "document_type", 
      header: "Document Type",
      render: (row: DocumentRecord) => {
        const typeKey = row.document_type || resolveDocumentType(row.file_name);
        return DOCUMENT_TYPES.find(t => t.key === typeKey)?.label || "Unknown";
      }
    },
    { 
      key: "file_name", 
      header: "File Name",
      render: (row: DocumentRecord) => (
        <span 
          style={{ color: 'var(--primary-color)', cursor: 'pointer', fontWeight: 500 }}
          onClick={() => handleView(row)}
        >
          {stripTypePrefix(row.file_name)}
        </span>
      )
    },
    { 
      key: "review_owner_role", 
      header: "Submitted To",
      render: (row: DocumentRecord) => row.review_owner_role === "super_admin" ? "Super Admin" : "Mentor"
    },
    {
      key: "uploaded_by",
      header: "Source",
      render: (row: DocumentRecord) => row.uploaded_by === row.user_id ? "Self" : "Mentor"
    },
    { 
      key: "review_status", 
      header: "Status",
      render: (row: DocumentRecord) => (
        <span className={`status-tag status-${row.review_status || 'pending'}`}>
          {(row.review_status || 'pending').toUpperCase()}
        </span>
      )
    },
    { 
      key: "created_at", 
      header: "Date Uploaded",
      render: (row: DocumentRecord) => formatDate(row.created_at)
    },
    {
      key: "actions",
      header: "Actions",
      render: (row: DocumentRecord) => (
        <div style={{ display: 'flex', gap: '8px' }}>
          <span
            onClick={() => handleView(row)}
            style={{ cursor: "pointer", color: "var(--primary-color)", fontSize: "1.2em" }}
            title="View Document"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24">
              <path fill="currentColor" d="M12 9a3 3 0 0 0-3 3a3 3 0 0 0 3 3a3 3 0 0 0 3-3a3 3 0 0 0-3-3m0 8a5 5 0 0 1-5-5a5 5 0 0 1 5-5a5 5 0 0 1 5 5a5 5 0 0 1-5 5m0-12.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5Z"/>
            </svg>
          </span>
          <span
            onClick={() => handleDelete(row.id)}
            style={{ cursor: "pointer", color: "var(--secondary-color)", fontSize: "1.2em" }}
            title="Delete Document"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24">
              <path fill="currentColor" d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zm2.46-7.12l1.41-1.41L12 12.59l2.12-2.12l1.41 1.41L13.41 14l2.12 2.12l-1.41 1.41L12 15.41l-2.12 2.12l-1.41-1.41L10.59 14l-2.13-2.12zM15.5 4l-1-1h-5l-1 1H5v2h14V4z"/>
            </svg>
          </span>
        </div>
      )
    }
  ];

  return (
    <div className="documents-page">
      <Snackbar 
        message={snackbarMessage} 
        onClose={() => setSnackbarMessage("")}
      />

      {viewingDocument && (
        <PdfViewer 
          document={{
            id: viewingDocument.id,
            file_name: stripTypePrefix(viewingDocument.file_name),
            file_url: viewingDocument.file_url,
            created_at: viewingDocument.created_at
          }} 
          onClose={() => setViewingDocument(null)} 
        />
      )}

      <div className="documents-layout">
        <div className="documents-list-section">
          <Card>
            <h3>MY UPLOADED DOCUMENTS</h3>
            <TableComponent 
              columns={documentColumns} 
              data={documents} 
              caption="Manage your uploaded documents and track their review status"
            />
          </Card>
        </div>

        <aside className="upload-panel-wrap">
          <Card className="upload-panel">
            <h3 className="upload-panel__title">UPLOAD NEW DOCUMENT</h3>
            <div className="upload-panel__icon" aria-hidden="true">
              <span className="upload-panel__icon-arrow" />
              <span className="upload-panel__icon-base" />
            </div>

            <label
              className="upload-panel__label"
              htmlFor="document-type-select"
            >
              Select Document Type
            </label>
            <select
              id="document-type-select"
              className="upload-panel__select"
              value={selectedType}
              onChange={(event) =>
                setSelectedType(event.target.value as DocumentTypeKey)
              }
              disabled={uploading}
            >
              {DOCUMENT_TYPES.map((type) => (
                <option key={type.key} value={type.key}>
                  {type.label}
                </option>
              ))}
            </select>

            <label
              className="upload-panel__label"
              htmlFor="submit-to-select"
              style={{ marginTop: '15px' }}
            >
              Submit To
            </label>
            <select
              id="submit-to-select"
              className="upload-panel__select"
              value={submitTo}
              onChange={(event) =>
                setSubmitTo(event.target.value as "mentor" | "super_admin")
              }
              disabled={uploading}
            >
              <option value="mentor">Mentor</option>
              <option value="super_admin">Super Admin</option>
            </select>

            <input
              ref={fileInputRef}
              className="upload-panel__hidden-input"
              type="file"
              accept=".pdf,.png,.jpg,.jpeg"
              onChange={handleFileChange}
            />

            <Button
              text={selectedFile ? selectedFile.name : "Choose File"}
              className="upload-panel__choose-btn"
              onClick={handleChooseFile}
              disabled={uploading}
            />

            <p className="upload-panel__formats">
              Supported formats: PDF, JPG, PNG
            </p>

            <Button
              text={uploading ? "Uploading..." : "Upload / Replace"}
              className="upload-panel__upload-btn"
              onClick={handleUpload}
              disabled={uploading || !selectedFile}
            />

            <p className="upload-panel__note">
              Uploading a document of the same type will keep the newest file as
              current and move older files to Previous Uploads.
            </p>
          </Card>
        </aside>
      </div>
    </div>
  );
}