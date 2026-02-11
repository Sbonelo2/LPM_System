import React, { useEffect, useMemo, useRef, useState } from "react";
import Button from "../components/Button";
import Card from "../components/Card";
import DocumentCard from "../components/DocumentCard";
import { supabase } from "../services/supabaseClient";
import "./Documents.css";

type DocumentTypeKey =
  | "ID_COPY"
  | "MATRIC_CERTIFICATE"
  | "TERTIARY_QUALIFICATION"
  | "PROOF_OF_ADDRESS";

type DocumentRecord = {
  id: string;
  user_id: string;
  file_name: string;
  file_url: string;
  created_at: string;
};

const DOCUMENT_TYPES: Array<{ key: DocumentTypeKey; label: string }> = [
  { key: "ID_COPY", label: "ID Copy" },
  { key: "MATRIC_CERTIFICATE", label: "Matric Certificate" },
  { key: "TERTIARY_QUALIFICATION", label: "Tertiary Qualification" },
  { key: "PROOF_OF_ADDRESS", label: "Proof of Address" },
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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [feedback, setFeedback] = useState("");
  const [expandedType, setExpandedType] = useState<DocumentTypeKey | null>(
    null,
  );

  const groupedDocuments = useMemo(() => {
    const result: Record<DocumentTypeKey, DocumentRecord[]> = {
      ID_COPY: [],
      MATRIC_CERTIFICATE: [],
      TERTIARY_QUALIFICATION: [],
      PROOF_OF_ADDRESS: [],
    };

    documents.forEach((doc) => {
      const type = resolveDocumentType(doc.file_name);
      if (type) {
        result[type].push(doc);
      }
    });

    return result;
  }, [documents]);

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          setFeedback("Please sign in to view documents.");
          return;
        }

        const { data, error } = await supabase
          .from("documents")
          .select("id, user_id, file_name, file_url, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (error) throw error;
        setDocuments(data ?? []);
      } catch (error: unknown) {
        setFeedback(
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
    setFeedback("");
  };

  const handleDelete = async (documentId: string, fileName: string) => {
    if (!confirm('Are you sure you want to delete this document?')) {
      return;
    }

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error("User not authenticated.");
      }

      // Delete from storage
      const filePath = `${user.id}/${fileName}`;
      const { error: storageError } = await supabase.storage
        .from("documents")
        .remove([filePath]);

      if (storageError) {
        console.warn('Failed to delete from storage:', storageError);
      }

      // Delete from database
      const { error: deleteError } = await supabase
        .from("documents")
        .delete()
        .eq("id", documentId);

      if (deleteError) {
        throw deleteError;
      }

      setDocuments((prev) => prev.filter((doc) => doc.id !== documentId));
      setFeedback("Document deleted successfully.");
    } catch (error: unknown) {
      setFeedback(
        `Delete failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
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
          },
        ])
        .select("id, user_id, file_name, file_url, created_at")
        .single();

      if (insertError) {
        throw insertError;
      }

      setDocuments((prev) => [inserted, ...prev]);
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      setFeedback("Upload complete. Latest file is now current for this type.");
    } catch (error: unknown) {
      setFeedback(
        `Upload failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="documents-page">

      {feedback && <p className="documents-page__feedback">{feedback}</p>}

      <div className="documents-layout">
        {documents.length > 0 ? (
          <div className="documents-list">
            {DOCUMENT_TYPES.map((type) => {
              const docs = groupedDocuments[type.key];
              const currentDoc = docs[0];
              const previousDocs = docs.slice(1);

              // Only show document card if there are documents of this type
              if (docs.length === 0) return null;

              return (
                <DocumentCard
                  key={type.key}
                  title={type.label}
                  currentFileName={currentDoc ? stripTypePrefix(currentDoc.file_name) : undefined}
                  uploadedAt={currentDoc ? new Date(currentDoc.created_at).toLocaleDateString() : undefined}
                  thumbnailLabel={type.label}
                  onCurrentClick={currentDoc ? () => window.open(currentDoc.file_url, '_blank') : undefined}
                  onDeleteCurrent={currentDoc ? () => handleDelete(currentDoc.id, currentDoc.file_name) : undefined}
                  showPreviousToggle={previousDocs.length > 0}
                  expanded={expandedType === type.key}
                  onExpandedChange={(expanded: boolean) => setExpandedType(expanded ? type.key : null)}
                >
                  {previousDocs.length > 0 && (
                    <div className="previous-documents-list">
                      {previousDocs.map((doc) => (
                        <div key={doc.id} className="previous-document-item">
                          <button
                            className="previous-document-link"
                            onClick={() => window.open(doc.file_url, '_blank')}
                          >
                            {stripTypePrefix(doc.file_name)}
                          </button>
                          <div className="previous-document-meta">
                            <span className="previous-document-date">
                              {new Date(doc.created_at).toLocaleDateString()}
                            </span>
                            <button
                              className="previous-document-delete"
                              onClick={() => handleDelete(doc.id, doc.file_name)}
                              title="Delete document"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </DocumentCard>
              );
            })}
          </div>
        ) : (
          <div className="no-documents-message">
            <h3>No documents uploaded yet</h3>
            <p>Use the upload panel to add your first document.</p>
          </div>
        )}

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
