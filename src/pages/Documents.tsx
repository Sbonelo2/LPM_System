import React, { useEffect, useRef, useState } from "react";
import Button from "../components/Button";
import Card from "../components/Card";
import { supabase } from "../services/supabaseClient";
import "./Documents.css";

type DocumentTypeKey =
  | "ID_COPY"
  | "MATRIC_CERTIFICATE"
  | "TERTIARY_QUALIFICATION"
  | "PROOF_OF_ADDRESS";

const DOCUMENT_TYPES: Array<{ key: DocumentTypeKey; label: string }> = [
  { key: "ID_COPY", label: "ID Copy" },
  { key: "MATRIC_CERTIFICATE", label: "Matric Certificate" },
  { key: "TERTIARY_QUALIFICATION", label: "Tertiary Qualification" },
  { key: "PROOF_OF_ADDRESS", label: "Proof of Address" },
];

export default function Documents(): React.JSX.Element {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [selectedType, setSelectedType] = useState<DocumentTypeKey>("ID_COPY");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [feedback, setFeedback] = useState("");

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

        // Documents are no longer being fetched or stored in state as they were unused.
        // If document display is needed, this logic will need to be re-introduced
        // along with components to render the documents.
        
      } catch (error: unknown) {
        setFeedback(
          `Failed to load documents: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
        );
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

      const taggedFileName = `${selectedType}__${selectedFile.name}`; // Simplified tag
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

      // No longer updating 'documents' state as it is removed.
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
