import React, { useEffect, useState, useRef } from "react";
import Card from "../components/Card";
import Button from "../components/Button";
import TableComponent, { type TableColumn } from "../components/TableComponent";
import Snackbar from "../components/Snackbar";
import PdfViewer from "../components/PdfViewer";
import { supabase } from "../services/supabaseClient";
import { useAuth } from "../hooks/useAuth";
import { formatDate } from "../utils/dateUtils";
import "./MentorLearners.css";

interface LearnerProfile {
  user_id: string;
  learner_name: string;
  email: string;
  programme: string;
}

interface DocumentRecord {
  id: string;
  user_id: string;
  file_name: string;
  file_url: string;
  document_type: string;
  review_status: string;
  review_owner_role: string;
  created_at: string;
  uploaded_by: string;
}

const DOCUMENT_TYPES = [
  { key: "ID_COPY", label: "ID Copy" },
  { key: "MATRIC_CERTIFICATE", label: "Matric Certificate" },
  { key: "TERTIARY_QUALIFICATION", label: "Tertiary Qualification" },
  { key: "PROOF_OF_ADDRESS", label: "Proof of Address" },
  { key: "TIMESHEET", label: "Timesheet Template" },
  { key: "EVIDENCE", label: "Evidence of Work" },
];

export default function MentorLearners() {
  const { user } = useAuth();
  const [learners, setLearners] = useState<LearnerProfile[]>([]);
  const [selectedLearner, setSelectedLearner] = useState<LearnerProfile | null>(null);
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedType, setSelectedType] = useState(DOCUMENT_TYPES[0].key);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [viewingDocument, setViewingDocument] = useState<DocumentRecord | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      fetchLearners();
    }
  }, [user]);

  useEffect(() => {
    if (selectedLearner) {
      fetchDocuments(selectedLearner.user_id);
    } else {
      setDocuments([]);
    }
  }, [selectedLearner]);

  const fetchLearners = async () => {
    setLoading(true);
    try {
      // First try to fetch learners assigned to this mentor
      const { data, error } = await supabase
        .from("learner_profiles")
        .select("user_id, learner_name, email, programme")
        .eq("mentor_id", user?.id);

      if (error) throw error;
      
      // If no learners assigned specifically, fetch all for demo/fallback
      if (!data || data.length === 0) {
        const { data: allLearners, error: allErr } = await supabase
          .from("learner_profiles")
          .select("user_id, learner_name, email, programme")
          .limit(10);
        if (allErr) throw allErr;
        setLearners(allLearners || []);
      } else {
        setLearners(data);
      }
    } catch (err: any) {
      setSnackbarMessage(`Error fetching learners: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchDocuments = async (learnerId: string) => {
    try {
      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .eq("user_id", learnerId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (err: any) {
      setSnackbarMessage(`Error fetching documents: ${err.message}`);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !selectedLearner || !user) {
      setSnackbarMessage("Please select a file and a learner.");
      return;
    }

    setUploading(true);
    try {
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${Date.now()}_${selectedFile.name.replace(/\s/g, '_')}`;
      const filePath = `${selectedLearner.user_id}/mentor_uploads/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("documents")
        .upload(filePath, selectedFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("documents")
        .getPublicUrl(filePath);

      const { error: insertError } = await supabase
        .from("documents")
        .insert({
          user_id: selectedLearner.user_id,
          file_name: selectedFile.name,
          file_url: publicUrl,
          document_type: selectedType,
          review_status: 'pending',
          review_owner_role: 'mentor', // Changed from 'learner' to 'mentor' to fix constraint error
          uploaded_by: user.id,
          storage_path: filePath
        });

      if (insertError) throw insertError;

      setSnackbarMessage("Document uploaded for learner.");
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      fetchDocuments(selectedLearner.user_id);
    } catch (err: any) {
      setSnackbarMessage(`Upload failed: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleApprove = async (docId: string) => {
    try {
      const { error } = await supabase
        .from("documents")
        .update({ 
          review_status: 'approved',
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString()
        })
        .eq("id", docId);

      if (error) throw error;
      setSnackbarMessage("Document approved.");
      fetchDocuments(selectedLearner!.user_id);
    } catch (err: any) {
      setSnackbarMessage(`Error: ${err.message}`);
    }
  };

  const handleSubmitToAdmin = async (docId: string) => {
    try {
      const { error } = await supabase
        .from("documents")
        .update({ 
          review_owner_role: 'super_admin',
          review_status: 'submitted'
        })
        .eq("id", docId);

      if (error) throw error;
      setSnackbarMessage("Document submitted to Super Admin.");
      fetchDocuments(selectedLearner!.user_id);
    } catch (err: any) {
      setSnackbarMessage(`Error: ${err.message}`);
    }
  };

  const documentColumns: TableColumn<DocumentRecord>[] = [
    { 
      key: "document_type", 
      header: "Type",
      render: (row) => DOCUMENT_TYPES.find(t => t.key === row.document_type)?.label || row.document_type
    },
    { 
      key: "file_name", 
      header: "File Name",
      render: (row) => (
        <span 
          style={{ color: '#3498db', cursor: 'pointer', fontWeight: 500 }}
          onClick={() => setViewingDocument(row)}
        >
          {row.file_name}
        </span>
      )
    },
    { 
      key: "uploaded_by", 
      header: "Source",
      render: (row) => row.uploaded_by === user?.id ? "Me (Mentor)" : "Learner"
    },
    { 
      key: "review_status", 
      header: "Status",
      render: (row) => (
        <span className={`status-tag status-${row.review_status}`}>
          {row.review_status.toUpperCase()}
        </span>
      )
    },
    {
      key: "created_at",
      header: "Date Uploaded",
      render: (row) => formatDate(row.created_at)
    },
    {
      key: "actions",
      header: "Actions",
      render: (row) => (
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button 
            text="View" 
            size="small" 
            variant="outline" 
            onClick={() => setViewingDocument(row)} 
          />
          {row.uploaded_by !== user?.id && row.review_status === 'pending' && (
            <Button 
              text="Approve" 
              size="small" 
              onClick={() => handleApprove(row.id)} 
            />
          )}
          {row.review_status === 'approved' && row.review_owner_role !== 'super_admin' && (
            <Button 
              text="Submit to Admin" 
              size="small" 
              variant="secondary"
              onClick={() => handleSubmitToAdmin(row.id)} 
            />
          )}
        </div>
      )
    }
  ];

  return (
    <div className="mentor-learners">
      <Snackbar 
        message={snackbarMessage} 
        onClose={() => setSnackbarMessage("")}
      />

      {viewingDocument && (
        <PdfViewer 
          document={{
            id: viewingDocument.id,
            file_name: viewingDocument.file_name,
            file_url: viewingDocument.file_url,
            created_at: viewingDocument.created_at
          }} 
          onClose={() => setViewingDocument(null)} 
        />
      )}

      <header className="mentor-learners__header">
        <h1 className="mentor-learners__title">Learner Management</h1>
        <p className="mentor-learners__subtitle">Manage documents and approvals for your assigned learners</p>
      </header>

      <div className="mentor-learners__layout">
        <aside className="mentor-learners__sidebar">
          <Card>
            <h3>MY LEARNERS</h3>
            {loading ? (
              <p>Loading learners...</p>
            ) : (
              <div className="mentor-learners__learner-list">
                {learners.map((learner) => (
                  <button
                    key={learner.user_id}
                    className={`mentor-learners__learner-card ${selectedLearner?.user_id === learner.user_id ? 'mentor-learners__learner-card--active' : ''}`}
                    onClick={() => setSelectedLearner(learner)}
                  >
                    <div className="mentor-learners__avatar">
                      {learner.learner_name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div className="mentor-learners__learner-info">
                      <span className="mentor-learners__learner-name">{learner.learner_name}</span>
                      <span className="mentor-learners__learner-email">{learner.email}</span>
                    </div>
                  </button>
                ))}
                {learners.length === 0 && <p>No learners assigned.</p>}
              </div>
            )}
          </Card>
        </aside>

        <main className="mentor-learners__content">
          {selectedLearner ? (
            <>
              <Card>
                <h3>UPLOAD DOCUMENT FOR {selectedLearner.learner_name.toUpperCase()}</h3>
                <div className="mentor-learners__upload-section">
                  <div className="mentor-learners__upload-controls">
                    <div className="mentor-learners__field-group">
                      <label className="mentor-learners__label">Document Type</label>
                      <select 
                        className="mentor-learners__select"
                        value={selectedType}
                        onChange={(e) => setSelectedType(e.target.value)}
                      >
                        {DOCUMENT_TYPES.map(t => (
                          <option key={t.key} value={t.key}>{t.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="mentor-learners__field-group">
                      <label className="mentor-learners__label">Choose File</label>
                      <input 
                        type="file" 
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept=".pdf,.doc,.docx"
                      />
                    </div>
                    <Button 
                      text={uploading ? "Uploading..." : "Upload for Learner"} 
                      onClick={handleUpload}
                      disabled={uploading || !selectedFile}
                    />
                  </div>
                </div>
              </Card>

              <Card>
                <h3>LEARNER DOCUMENTS</h3>
                <TableComponent 
                  columns={documentColumns} 
                  data={documents} 
                  caption={`Documents for ${selectedLearner.learner_name}`}
                />
              </Card>
            </>
          ) : (
            <div className="mentor-learners__empty">
              <h3>Select a learner to manage their documents</h3>
              <p>Choose a learner from the list on the left to get started.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
