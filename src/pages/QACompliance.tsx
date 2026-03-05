import { useEffect, useMemo, useState } from "react";
import Card from "../components/Card";
import Button from "../components/Button";
import TableComponent, { type TableColumn } from "../components/TableComponent";
import Modal from "../components/Modal";
import InputField from "../components/InputField";
import Dropdown, { type DropdownOption } from "../components/Dropdown";
import LoadingSpinner from "../components/LoadingSpinner";
import Snackbar from "../components/Snackbar";
import { supabase } from "../services/supabaseClient";
import { useAuth } from "../hooks/useAuth";
import "./Dashboard.css";
import "./SystemSettings.css";
import "./QACompliance.css";

type ComplianceTab = "compliance" | "documents" | "issues";

type VerificationStatus = "Pending" | "Approved" | "Rejected";

type VerifiableDocument = {
  id: string;
  learner: string;
  learner_id: string;
  documentName: string;
  uploadedOn: string;
  status: string;
  doc: any;
};

type DocumentIssue = {
  id: string;
  documentId: string;
  documentName: string;
  learner: string;
  severity: "Low" | "Medium" | "High";
  title: string;
  description: string;
  createdOn: string;
  status: "Open" | "Resolved";
};

const SEVERITY_OPTIONS: DropdownOption[] = [
  { label: "Low", value: "Low" },
  { label: "Medium", value: "Medium" },
  { label: "High", value: "High" },
];

export default function QACompliance() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<ComplianceTab>("compliance");
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  const [documents, setDocuments] = useState<VerifiableDocument[]>([]);
  const [issues, setIssues] = useState<DocumentIssue[]>([]);
  const [profiles, setProfiles] = useState<Record<string, string>>({});

  // Modal states
  const [issueModalOpen, setIssueModalOpen] = useState(false);
  const [selectedDocForIssue, setSelectedDocForIssue] = useState<VerifiableDocument | null>(null);
  const [issueTitle, setIssueTitle] = useState("");
  const [issueDescription, setIssueDescription] = useState("");
  const [issueSeverity, setIssueSeverity] = useState<DocumentIssue["severity"]>("Medium");

  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedDocForReject, setSelectedDocForReject] = useState<VerifiableDocument | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // 1. Fetch profiles for name mapping
      const { data: profData } = await supabase.from("profiles").select("id, full_name");
      const profileMap: Record<string, string> = {};
      (profData || []).forEach(p => {
        profileMap[p.id] = p.full_name?.split(' ')[0] || 'Unknown';
      });
      setProfiles(profileMap);

      // 2. Fetch documents
      const { data: docData, error: docError } = await supabase
        .from("documents")
        .select("*")
        .order("created_at", { ascending: false });

      if (docError) throw docError;

      const formattedDocs: VerifiableDocument[] = (docData || []).map(d => ({
        id: d.id,
        learner: profileMap[d.user_id] || 'Unknown',
        learner_id: d.user_id,
        documentName: d.file_name.includes('__') ? d.file_name.split('__').pop() || d.file_name : d.file_name,
        uploadedOn: new Date(d.created_at).toLocaleDateString(),
        status: d.review_status || 'pending',
        doc: d
      }));
      setDocuments(formattedDocs);

      // 3. Fetch issues
      const { data: issueData, error: issueError } = await supabase
        .from("compliance_issues")
        .select("*")
        .order("created_at", { ascending: false });

      if (issueError) {
        if (!issueError.message.includes("not found")) throw issueError;
      }

      const formattedIssues: DocumentIssue[] = (issueData || []).map(i => {
        const doc = formattedDocs.find(d => d.id === i.document_id);
        return {
          id: i.id,
          documentId: i.document_id,
          documentName: doc?.documentName || 'Unknown Doc',
          learner: profileMap[i.learner_id] || 'Unknown',
          severity: i.severity as any,
          title: i.title,
          description: i.description,
          createdOn: new Date(i.created_at).toLocaleDateString(),
          status: i.status as any
        };
      });
      setIssues(formattedIssues);

    } catch (err: any) {
      console.error("Error fetching compliance data:", err);
      setSnackbarMessage(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const stats = useMemo(() => {
    const pending = documents.filter(d => d.status.toLowerCase() === "pending").length;
    const approved = documents.filter(d => d.status.toLowerCase() === "approved").length;
    const rejected = documents.filter(d => d.status.toLowerCase() === "declined" || d.status.toLowerCase() === "rejected").length;
    const rate = documents.length > 0 ? Math.round((approved / documents.length) * 100) : 0;
    return { pending, approved, rejected, rate };
  }, [documents]);

  const approveDocument = async (docId: string) => {
    setProcessing(true);
    try {
      const { error } = await supabase
        .from("documents")
        .update({ review_status: "approved" })
        .eq("id", docId);
      if (error) throw error;
      setSnackbarMessage("Document approved.");
      fetchData();
    } catch (err: any) {
      setSnackbarMessage(`Failed to approve: ${err.message}`);
    } finally {
      setProcessing(false);
    }
  };

  const submitRejection = async () => {
    if (!selectedDocForReject || !rejectReason.trim()) return;
    setProcessing(true);
    try {
      // 1. Update document status
      const { error: docError } = await supabase
        .from("documents")
        .update({ review_status: "declined", review_comment: rejectReason })
        .eq("id", selectedDocForReject.id);
      if (docError) throw docError;

      // 2. Create a compliance issue
      const { error: issueError } = await supabase
        .from("compliance_issues")
        .insert([{
          document_id: selectedDocForReject.id,
          learner_id: selectedDocForReject.learner_id,
          user_id: user?.id,
          severity: "High",
          title: "Document Rejected",
          description: rejectReason,
          status: "Open"
        }]);
      
      if (issueError) console.error("Error creating issue record:", issueError);

      setSnackbarMessage("Document rejected and issue logged.");
      setRejectModalOpen(false);
      setRejectReason("");
      fetchData();
    } catch (err: any) {
      setSnackbarMessage(`Failed: ${err.message}`);
    } finally {
      setProcessing(false);
    }
  };

  const postIssue = async () => {
    if (!selectedDocForIssue || !issueTitle.trim() || !issueDescription.trim()) return;
    setProcessing(true);
    try {
      const { error } = await supabase
        .from("compliance_issues")
        .insert([{
          document_id: selectedDocForIssue.id,
          learner_id: selectedDocForIssue.learner_id,
          user_id: user?.id,
          severity: issueSeverity,
          title: issueTitle,
          description: issueDescription,
          status: "Open"
        }]);
      
      if (error) throw error;

      setSnackbarMessage("Compliance issue published.");
      setIssueModalOpen(false);
      setIssueTitle("");
      setIssueDescription("");
      fetchData();
    } catch (err: any) {
      setSnackbarMessage(`Failed: ${err.message}`);
    } finally {
      setProcessing(false);
    }
  };

  const columns: TableColumn<VerifiableDocument>[] = [
    { header: "Document", key: "documentName" },
    { header: "Learner", key: "learner" },
    { header: "Uploaded", key: "uploadedOn" },
    { 
      header: "Status", 
      key: "status",
      render: (row) => (
        <span className={`status-tag status-${row.status.toLowerCase()}`} style={{
          padding: '4px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 'bold',
          backgroundColor: row.status === 'approved' ? '#dcfce7' : row.status === 'pending' ? '#fef9c3' : '#fee2e2',
          color: row.status === 'approved' ? '#166534' : row.status === 'pending' ? '#854d0e' : '#991b1b',
          textTransform: 'uppercase'
        }}>
          {row.status}
        </span>
      )
    },
    {
      header: "Actions",
      render: (row) => (
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button text="Verify" variant="primary" onClick={() => approveDocument(row.id)} disabled={processing || row.status === 'approved'} />
          <Button text="Reject" variant="secondary" onClick={() => { setSelectedDocForReject(row); setRejectModalOpen(true); }} disabled={processing} />
          <Button text="Issue" variant="secondary" onClick={() => { setSelectedDocForIssue(row); setIssueModalOpen(true); }} disabled={processing} />
        </div>
      ),
    },
  ];

  const issueCols: TableColumn<DocumentIssue>[] = [
    { header: "Document", key: "documentName" },
    { header: "Learner", key: "learner" },
    { 
      header: "Severity", 
      key: "severity",
      render: (row) => (
        <span style={{ color: row.severity === 'High' ? '#ef4444' : row.severity === 'Medium' ? '#f59e0b' : '#10b981', fontWeight: 'bold' }}>
          {row.severity}
        </span>
      )
    },
    { header: "Title", key: "title" },
    { header: "Status", key: "status" },
    { header: "Created", key: "createdOn" },
  ];

  return (
    <div className="qa-compliance">
      <h2 className="qa-compliance__title">COMPLIANCE & VERIFICATION</h2>
      <Snackbar message={snackbarMessage} onClose={() => setSnackbarMessage("")} />

      <div className="system-settings__tabs">
        <button className={`system-settings__tab ${activeTab === 'compliance' ? 'system-settings__tab--active' : ''}`} onClick={() => setActiveTab('compliance')}>
          Overview
        </button>
        <button className={`system-settings__tab ${activeTab === 'documents' ? 'system-settings__tab--active' : ''}`} onClick={() => setActiveTab('documents')}>
          Verification
        </button>
        <button className={`system-settings__tab ${activeTab === 'issues' ? 'system-settings__tab--active' : ''}`} onClick={() => setActiveTab('issues')}>
          Issues Log
        </button>
      </div>

      {loading ? <LoadingSpinner /> : (
        <div className="tab-content animate-fade-in">
          {activeTab === 'compliance' && (
            <>
              <div className="qa-compliance__stats">
                <Card className="qa-compliance__stat">
                  <div className="qa-compliance__stat-label">PENDING REVIEW</div>
                  <div className="qa-compliance__stat-value">{stats.pending}</div>
                </Card>
                <Card className="qa-compliance__stat">
                  <div className="qa-compliance__stat-label">APPROVED</div>
                  <div className="qa-compliance__stat-value">{stats.approved}</div>
                </Card>
                <Card className="qa-compliance__stat">
                  <div className="qa-compliance__stat-label">REJECTED</div>
                  <div className="qa-compliance__stat-value">{stats.rejected}</div>
                </Card>
                <Card className="qa-compliance__stat">
                  <div className="qa-compliance__stat-label">COMPLIANCE RATE</div>
                  <div className="qa-compliance__stat-value">{stats.rate}%</div>
                </Card>
              </div>
              <Card><TableComponent columns={columns.slice(0, 4)} data={documents} caption="All uploaded documents status" /></Card>
            </>
          )}

          {activeTab === 'documents' && (
            <Card><TableComponent columns={columns} data={documents} caption="Verify pending documents" /></Card>
          )}

          {activeTab === 'issues' && (
            <Card><TableComponent columns={issueCols} data={issues} caption="Active compliance issues" /></Card>
          )}
        </div>
      )}

      {/* Reject Modal */}
      <Modal isOpen={rejectModalOpen} onClose={() => setRejectModalOpen(false)} title="Decline Document">
        <div style={{ padding: '10px', color: '#000' }}>
          <p style={{ color: '#000' }}>Declining: <strong>{selectedDocForReject?.documentName}</strong></p>
          <textarea
            style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '6px', minHeight: '100px', marginTop: '15px', color: '#000' }}
            placeholder="Reason for rejection..."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
            <Button text="Cancel" variant="secondary" onClick={() => setRejectModalOpen(false)} />
            <Button text="Submit Rejection" variant="primary" onClick={submitRejection} disabled={processing || !rejectReason.trim()} />
          </div>
        </div>
      </Modal>

      {/* Issue Modal */}
      <Modal isOpen={issueModalOpen} onClose={() => setIssueModalOpen(false)} title="Report Compliance Issue">
        <div style={{ padding: '10px', color: '#000', display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <p style={{ color: '#000' }}>Report issue for: <strong>{selectedDocForIssue?.documentName}</strong> ({selectedDocForIssue?.learner})</p>
          <InputField label="Issue Title" value={issueTitle} onChange={setIssueTitle} placeholder="e.g. Invalid Format" required />
          <Dropdown label="Severity" value={issueSeverity} onChange={(v) => setIssueSeverity(v as any)} options={SEVERITY_OPTIONS} />
          <textarea
            style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '6px', minHeight: '100px', color: '#000' }}
            placeholder="Detailed description..."
            value={issueDescription}
            onChange={(e) => setIssueDescription(e.target.value)}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <Button text="Cancel" variant="secondary" onClick={() => setIssueModalOpen(false)} />
            <Button text="Publish Issue" variant="primary" onClick={postIssue} disabled={processing || !issueTitle.trim()} />
          </div>
        </div>
      </Modal>
    </div>
  );
}
