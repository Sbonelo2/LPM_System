import React, { useEffect, useMemo, useRef, useState } from "react";
import { Eye, Trash2 } from "lucide-react";
import Button from "../components/Button";
import Card from "../components/Card";
import Modal from "../components/Modal";
import Snackbar from "../components/Snackbar";
import TableComponent, { type TableColumn } from "../components/TableComponent";
import Dropdown, { type DropdownOption } from "../components/Dropdown";
import InputField from "../components/InputField";
import { supabase } from "../services/supabaseClient";
import "./CoordinatorDocuments.css";

type DocumentTypeKey =
  | "ID_COPY"
  | "MATRIC_CERTIFICATE"
  | "TERTIARY_QUALIFICATION"
  | "PROOF_OF_ADDRESS"
  | "OTHER";

type DocumentRecord = {
  id: string;
  user_id: string;
  file_name: string;
  file_url: string;
  created_at: string;
  subject?: string;
  comment?: string;
  document_type?: string;
};

const DOCUMENT_TYPES: Array<{ key: DocumentTypeKey; label: string }> = [
  { key: "ID_COPY", label: "ID Copy" },
  { key: "MATRIC_CERTIFICATE", label: "Matric Certificate" },
  { key: "TERTIARY_QUALIFICATION", label: "Tertiary Qualification" },
  { key: "PROOF_OF_ADDRESS", label: "Proof of Address" },
  { key: "OTHER", label: "Other" },
];

const ROLE_OPTIONS: DropdownOption[] = [
  { label: "Admin", value: "Admin" },
  { label: "Learner", value: "Learner" },
  { label: "Super Admin", value: "Super Admin" },
];

const TYPE_PREFIX = "__DOC_TYPE__";

function stripTypePrefix(fileName: string): string {
  if (!fileName.startsWith(TYPE_PREFIX)) return fileName;
  const typeSplitIndex = fileName.indexOf("__", TYPE_PREFIX.length);
  if (typeSplitIndex === -1) return fileName;
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
  return "OTHER";
}

type CurrentTableRow = {
  id: string;
  source: string;
  documentName: string;
  subject: string;
  comment: string;
  uploadedOn: string;
  doc: DocumentRecord;
};

export default function CoordinatorDocuments(): React.JSX.Element {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [uploading, setUploading] = useState(false);
  const [selectedType, setSelectedType] = useState<DocumentTypeKey>("ID_COPY");
  const [subject, setSubject] = useState("");
  const [comment, setComment] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [feedback, setFeedback] = useState("");
  const [pendingDelete, setPendingDelete] = useState<DocumentRecord | null>(null);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [viewingDocument, setViewingDocument] = useState<DocumentRecord | null>(null);
  const [roleModalDocument, setRoleModalDocument] = useState<DocumentRecord | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [editingRoles, setEditingRoles] = useState<string[]>([]);
  const [documentRoleTargets, setDocumentRoleTargets] = useState<Record<string, string[]>>({});

  const fetchDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setDocuments(data ?? []);
    } catch (error: unknown) {
      setFeedback(
        `Failed to load documents: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleChooseFile = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setSelectedFile(file);
    setFeedback("");
  };

  const executeDelete = async (documentId: string) => {
    try {
      const { error } = await supabase.from("documents").delete().eq("id", documentId);
      if (error) throw error;
      setDocuments((prev) => prev.filter((doc) => doc.id !== documentId));
      setSnackbarMessage("Document deleted successfully.");
    } catch (error: unknown) {
      setSnackbarMessage("Failed to delete document.");
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    await executeDelete(pendingDelete.id);
    setPendingDelete(null);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setFeedback("Please choose a file first.");
      return;
    }

    setUploading(true);
    setFeedback("Uploading document...");

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
      const filePath = `${user.id}/admin_docs/${storageFileName}`;

      const { error: uploadError } = await supabase.storage
        .from("documents")
        .upload(filePath, selectedFile, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) throw uploadError;

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
            subject: subject,
            comment: comment,
            document_type: selectedType,
            storage_path: filePath,
            review_owner_role: 'super_admin',
            review_status: 'approved' // Admin docs are pre-approved
          },
        ])
        .select("*")
        .single();

      if (insertError) throw insertError;

      setDocuments((prev) => [inserted, ...prev]);
      setSelectedFile(null);
      setSubject("");
      setComment("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      setFeedback("Upload complete.");
      setSnackbarMessage("Document uploaded successfully.");
    } catch (error: unknown) {
      setFeedback(
        `Upload failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    } finally {
      setUploading(false);
    }
  };

  const currentRows = useMemo<CurrentTableRow[]>(
    () =>
      documents.map((doc) => ({
        id: doc.id,
        source: DOCUMENT_TYPES.find(t => t.key === (doc.document_type || resolveDocumentType(doc.file_name)))?.label || "Other",
        documentName: stripTypePrefix(doc.file_name),
        subject: doc.subject || "No subject",
        comment: doc.comment || "No comment",
        uploadedOn: new Date(doc.created_at).toLocaleString(),
        doc: doc,
      })),
    [documents]
  );

  const currentColumns: TableColumn<CurrentTableRow>[] = [
    { key: "source", header: "Type" },
    { key: "documentName", header: "Document" },
    { key: "subject", header: "Subject" },
    { key: "comment", header: "Comment" },
    { key: "uploadedOn", header: "Uploaded On" },
    {
      key: "actions",
      header: "Actions",
      render: (row: CurrentTableRow) => (
        <div style={{ display: 'flex', gap: '10px' }}>
          <span
            style={{ cursor: "pointer", color: "var(--primary-color)" }}
            onClick={() => setViewingDocument(row.doc)}
            title="View"
          >
            <Eye size={20} />
          </span>
          <span
            style={{ cursor: "pointer", color: "var(--secondary-color)" }}
            onClick={() => setPendingDelete(row.doc)}
            title="Delete"
          >
            <Trash2 size={20} />
          </span>
        </div>
      ),
    },
  ];

  return (
    <div className="coordinator-documents-page">
      <div className="coordinator-documents-header">
        <h2>SUPER ADMIN DOCUMENTS</h2>
      </div>

      <Snackbar
        message={snackbarMessage}
        onClose={() => setSnackbarMessage("")}
      />

      {feedback && <p className="coordinator-documents-feedback">{feedback}</p>}

      <div className="coordinator-documents-layout">
        <div className="coordinator-documents-list">
          <Card>
            <TableComponent
              columns={currentColumns}
              data={currentRows}
              caption="System-wide documents"
            />
          </Card>
        </div>

        <aside className="coordinator-upload-panel-wrap">
          <Card className="coordinator-upload-panel">
            <h3 className="coordinator-upload-title">UPLOAD NEW DOCUMENT</h3>
            
            <Dropdown
              label="Select Document Type"
              value={selectedType}
              onChange={(val) => setSelectedType(val as DocumentTypeKey)}
              options={DOCUMENT_TYPES.map(t => ({ label: t.label, value: t.key }))}
              disabled={uploading}
            />

            <InputField
              label="Subject"
              value={subject}
              onChange={setSubject}
              placeholder="Enter document subject"
              disabled={uploading}
            />

            <div className="form-group" style={{ marginBottom: '15px' }}>
              <label className="form-label">Comment</label>
              <textarea
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd', minHeight: '80px' }}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Add a comment about this document"
                disabled={uploading}
              />
            </div>

            <input
              ref={fileInputRef}
              style={{ display: 'none' }}
              type="file"
              onChange={handleFileChange}
            />

            <Button
              text={selectedFile ? selectedFile.name : "Choose File"}
              className="coordinator-upload-btn"
              onClick={handleChooseFile}
              disabled={uploading}
              variant="secondary"
            />
            <Button
              text={uploading ? "Uploading..." : "Upload Document"}
              className="coordinator-upload-btn"
              onClick={handleUpload}
              disabled={uploading || !selectedFile}
              variant="primary"
              style={{ marginTop: '10px' }}
            />
          </Card>
        </aside>
      </div>

      {pendingDelete && (
        <Modal
          isOpen={Boolean(pendingDelete)}
          onClose={() => setPendingDelete(null)}
          title="Confirm Deletion"
        >
          <p>Are you sure you want to delete <strong>{stripTypePrefix(pendingDelete.file_name)}</strong>?</p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
            <Button text="Cancel" variant="secondary" onClick={() => setPendingDelete(null)} />
            <Button text="Delete" variant="primary" onClick={confirmDelete} />
          </div>
        </Modal>
      )}

      {viewingDocument && (
        <Modal
          isOpen={Boolean(viewingDocument)}
          onClose={() => setViewingDocument(null)}
          title={stripTypePrefix(viewingDocument.file_name)}
        >
          <div style={{ height: '70vh' }}>
            <iframe
              src={viewingDocument.file_url}
              title={stripTypePrefix(viewingDocument.file_name)}
              style={{ width: "100%", height: "100%", border: "none" }}
            />
          </div>
        </Modal>
      )}
    </div>
  );
}
