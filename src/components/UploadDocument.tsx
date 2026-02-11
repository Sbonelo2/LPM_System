import React, { useState } from "react";
import { supabase } from "../services/supabaseClient"; // Adjust path if necessary

const UploadDocument: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string | null>(null); // State for URL
  const [uploadedFileNameDisplay, setUploadedFileNameDisplay] = useState<
    string | null
  >(null); // State for display name
  const [copyFeedback, setCopyFeedback] = useState<boolean>(false); // State for copy feedback

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      // Validate file type
      if (file.type !== "application/pdf") {
        setMessage("Error: Only PDF files are allowed.");
        setSelectedFile(null);
        setUploadedFileUrl(null); // Clear URL on new file selection
        setUploadedFileNameDisplay(null); // Clear file name display on new file selection
        return;
      }
      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        setMessage("Error: File size exceeds 10MB limit.");
        setSelectedFile(null);
        setUploadedFileUrl(null); // Clear URL on new file selection
        setUploadedFileNameDisplay(null); // Clear file name display on new file selection
        return;
      }
      setSelectedFile(file);
      setMessage("");
      setUploadedFileUrl(null); // Clear URL on new file selection
      setUploadedFileNameDisplay(null); // Clear file name display on new file selection
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setMessage("Please select a file first.");
      return;
    }

    setUploading(true);
    setMessage("Uploading...");
    setUploadedFileUrl(null); // Clear previous URL before new upload
    setUploadedFileNameDisplay(null); // Clear previous file name display before new upload

    try {
      // Get current user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error("User not authenticated. Please log in.");
      }

      const userId = user.id;
      const fileName = `${Date.now()}_${selectedFile.name}`; // Unique name for storage
      const filePath = `${userId}/${fileName}`;

      // Upload file to Supabase storage
      const { error: uploadError } = await supabase.storage
        .from("documents")
        .upload(filePath, selectedFile, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("documents").getPublicUrl(filePath);

      if (!publicUrl) {
        throw new Error("Could not get public URL for the uploaded file.");
      }

      // Save metadata to database
      const { error: dbError } = await supabase.from("documents").insert([
        {
          user_id: userId,
          file_name: selectedFile.name,
          file_url: publicUrl,
        },
      ]);

      if (dbError) {
        throw dbError;
      }

      setMessage("Document uploaded successfully!");

      // Store the original file name for display before clearing selectedFile
      const nameWithoutExt = selectedFile.name.replace(/\.pdf$/i, "");
      setUploadedFileNameDisplay(nameWithoutExt);

      setSelectedFile(null); // Clear selected file after successful upload
      setUploadedFileUrl(publicUrl); // Set the uploaded file URL

      // Refresh the document list to show the new document
      if ((window as any).refreshDocuments) {
        (window as any).refreshDocuments();
      }
    } catch (error: unknown) {
      console.error("Upload error:", error);
      setMessage(
        `Upload failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    } finally {
      setUploading(false);
    }
  };

  const handleCopyLink = async () => {
    if (!uploadedFileUrl) return;

    try {
      await navigator.clipboard.writeText(uploadedFileUrl);
      setCopyFeedback(true);
      // Reset feedback after 2 seconds
      setTimeout(() => setCopyFeedback(false), 2000);
    } catch (error) {
      console.error("Failed to copy link:", error);
      setMessage("Failed to copy link to clipboard");
    }
  };

  return (
    <div>
      <h2>Upload Document</h2>
      <input type="file" accept="application/pdf" onChange={handleFileChange} />
      {selectedFile && <p>Selected file: {selectedFile.name}</p>}
      <button onClick={handleUpload} disabled={uploading || !selectedFile}>
        {uploading ? "Uploading..." : "Upload PDF"}
      </button>
      {message && <p>{message}</p>}
      {uploadedFileUrl && uploadedFileNameDisplay && (
        <div>
          <h3>Uploaded Document:</h3>
          <div
            style={{
              display: "flex",
              gap: "10px",
              alignItems: "center",
              marginTop: "10px",
            }}
          >
            <a
              href={uploadedFileUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-block",
                padding: "10px 20px",
                backgroundColor: "#007bff",
                color: "white",
                textDecoration: "none",
                borderRadius: "5px",
                border: "none",
                cursor: "pointer",
              }}
            >
              {uploadedFileNameDisplay}
            </a>
            <button
              onClick={handleCopyLink}
              style={{
                padding: "10px 20px",
                backgroundColor: copyFeedback ? "#28a745" : "#6c757d",
                color: "white",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer",
                fontWeight: "bold",
                transition: "background-color 0.2s",
              }}
            >
              {copyFeedback ? "✓ Copied!" : "Copy Link"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UploadDocument;
