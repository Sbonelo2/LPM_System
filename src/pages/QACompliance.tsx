import { useMemo, useState } from "react";
import Card from "../components/Card";
import Button from "../components/Button";
import TableComponent, { type TableColumn } from "../components/TableComponent";
import Modal from "../components/Modal";
import InputField from "../components/InputField";
import Dropdown, { type DropdownOption } from "../components/Dropdown";
import "./Dashboard.css";
import "./SystemSettings.css";
import "./QACompliance.css";

type ComplianceTab = "compliance" | "documents" | "issues";

type VerificationStatus = "Pending" | "Approved" | "Rejected";

type VerifiableDocument = {
  id: string;
  learner: string;
  documentName: string;
  uploadedOn: string;
  status: VerificationStatus;
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
  const [activeTab, setActiveTab] = useState<ComplianceTab>("compliance");

  const [documents, setDocuments] = useState<VerifiableDocument[]>([
    {
      id: "DOC-001",
      learner: "Sarah Coordinator",
      documentName: "Learner ID Copy",
      uploadedOn: "2024-08-01",
      status: "Pending",
    },
    {
      id: "DOC-002",
      learner: "James Ndlovu",
      documentName: "Proof of Address",
      uploadedOn: "2024-08-02",
      status: "Pending",
    },
    {
      id: "DOC-003",
      learner: "Ayesha Khan",
      documentName: "Consent Form",
      uploadedOn: "2024-08-03",
      status: "Approved",
    },
  ]);

  const [issues, setIssues] = useState<DocumentIssue[]>([
    {
      id: "ISS-001",
      documentId: "DOC-001",
      documentName: "Learner ID Copy",
      learner: "Sarah Coordinator",
      severity: "High",
      title: "Document unclear",
      description: "The ID copy is blurry. Please upload a clearer scan/photo.",
      createdOn: "2024-08-04",
      status: "Open",
    },
  ]);

  const [issueModalOpen, setIssueModalOpen] = useState(false);
  const [issueDocId, setIssueDocId] = useState<string>("");
  const [issueTitle, setIssueTitle] = useState("");
  const [issueDescription, setIssueDescription] = useState("");
  const [issueSeverity, setIssueSeverity] =
    useState<DocumentIssue["severity"]>("Medium");
  const [issueError, setIssueError] = useState("");

  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectDocId, setRejectDocId] = useState<string>("");
  const [rejectReason, setRejectReason] = useState("");
  const [rejectError, setRejectError] = useState("");

  const pendingCount = useMemo(
    () => documents.filter((d) => d.status === "Pending").length,
    [documents],
  );

  const approvedCount = useMemo(
    () => documents.filter((d) => d.status === "Approved").length,
    [documents],
  );

  const rejectedCount = useMemo(
    () => documents.filter((d) => d.status === "Rejected").length,
    [documents],
  );

  const complianceRate = useMemo(() => {
    const total = documents.length;
    if (total === 0) return 0;
    return Math.round((approvedCount / total) * 100);
  }, [approvedCount, documents.length]);

  const openIssueModal = (documentId: string) => {
    setIssueError("");
    setIssueDocId(documentId);
    setIssueTitle("");
    setIssueDescription("");
    setIssueSeverity("Medium");
    setIssueModalOpen(true);
  };

  const closeIssueModal = () => {
    setIssueModalOpen(false);
    setIssueError("");
  };

  const openRejectModal = (documentId: string) => {
    setRejectError("");
    setRejectDocId(documentId);
    setRejectReason("");
    setRejectModalOpen(true);
  };

  const closeRejectModal = () => {
    setRejectModalOpen(false);
    setRejectError("");
  };

  const approveDocument = (documentId: string) => {
    setDocuments((prev) =>
      prev.map((doc) =>
        doc.id === documentId ? { ...doc, status: "Approved" } : doc,
      ),
    );
  };

  const rejectDocument = (documentId: string) => {
    openRejectModal(documentId);
  };

  const submitRejection = () => {
    const reason = rejectReason.trim();
    if (!rejectDocId || !reason) {
      setRejectError("Please provide a reason for rejection.");
      return;
    }

    const doc = documents.find((d) => d.id === rejectDocId);
    if (!doc) {
      setRejectError("Selected document could not be found.");
      return;
    }

    setDocuments((prev) =>
      prev.map((item) =>
        item.id === rejectDocId ? { ...item, status: "Rejected" } : item,
      ),
    );

    const newIssue: DocumentIssue = {
      id: `ISS-${String(issues.length + 1).padStart(3, "0")}`,
      documentId: doc.id,
      documentName: doc.documentName,
      learner: doc.learner,
      severity: "Medium",
      title: "Document rejected",
      description: reason,
      createdOn: new Date().toISOString().slice(0, 10),
      status: "Open",
    };

    setIssues((prev) => [newIssue, ...prev]);
    closeRejectModal();
  };

  const postIssue = () => {
    const title = issueTitle.trim();
    const description = issueDescription.trim();

    if (!issueDocId || !title || !description) {
      setIssueError("Please fill in all fields.");
      return;
    }

    const doc = documents.find((d) => d.id === issueDocId);
    if (!doc) {
      setIssueError("Selected document could not be found.");
      return;
    }

    const newIssue: DocumentIssue = {
      id: `ISS-${String(issues.length + 1).padStart(3, "0")}`,
      documentId: doc.id,
      documentName: doc.documentName,
      learner: doc.learner,
      severity: issueSeverity,
      title,
      description,
      createdOn: new Date().toISOString().slice(0, 10),
      status: "Open",
    };

    setIssues((prev) => [newIssue, ...prev]);
    closeIssueModal();
  };

  const overviewColumns: TableColumn<VerifiableDocument>[] = useMemo(
    () => [
      { header: "Document", key: "documentName" },
      { header: "Learner", key: "learner" },
      { header: "Uploaded", key: "uploadedOn" },
      { header: "Status", key: "status" },
    ],
    [],
  );

  const documentColumns: TableColumn<VerifiableDocument>[] = useMemo(
    () => [
      { header: "Document", key: "documentName" },
      { header: "Learner", key: "learner" },
      { header: "Uploaded", key: "uploadedOn" },
      { header: "Status", key: "status" },
      {
        header: "Actions",
        render: (doc) => (
          <div className="qa-compliance__actions-cell">
            <Button
              text="Approve"
              variant="primary"
              onClick={() => approveDocument(doc.id)}
            />
            <Button
              text="Reject"
              variant="secondary"
              onClick={() => rejectDocument(doc.id)}
            />
            <Button
              text="Post Issue"
              variant="secondary"
              onClick={() => openIssueModal(doc.id)}
            />
          </div>
        ),
      },
    ],
    [],
  );

  const issueColumns: TableColumn<DocumentIssue>[] = useMemo(
    () => [
      { header: "Document", key: "documentName" },
      { header: "Learner", key: "learner" },
      { header: "Severity", key: "severity" },
      { header: "Title", key: "title" },
      { header: "Status", key: "status" },
      { header: "Created", key: "createdOn" },
    ],
    [],
  );

  return (
    <div className="qa-compliance">
      <h2 className="qa-compliance__title">QA Compliance</h2>

      <div
        className="system-settings__tabs"
        role="tablist"
        aria-label="QA compliance tabs"
      >
        <button
          type="button"
          className={
            "system-settings__tab" +
            (activeTab === "compliance" ? " system-settings__tab--active" : "")
          }
          role="tab"
          aria-selected={activeTab === "compliance"}
          onClick={() => setActiveTab("compliance")}
        >
          Compliance
        </button>
        <button
          type="button"
          className={
            "system-settings__tab" +
            (activeTab === "documents" ? " system-settings__tab--active" : "")
          }
          role="tab"
          aria-selected={activeTab === "documents"}
          onClick={() => setActiveTab("documents")}
        >
          Documents
        </button>
        <button
          type="button"
          className={
            "system-settings__tab" +
            (activeTab === "issues" ? " system-settings__tab--active" : "")
          }
          role="tab"
          aria-selected={activeTab === "issues"}
          onClick={() => setActiveTab("issues")}
        >
          Issues
        </button>
      </div>

      {activeTab === "compliance" ? (
        <div className="qa-compliance__content">
          <div className="qa-compliance__stats">
            <Card className="qa-compliance__stat">
              <div className="qa-compliance__stat-label">Pending Review</div>
              <div className="qa-compliance__stat-value">{pendingCount}</div>
            </Card>
            <Card className="qa-compliance__stat">
              <div className="qa-compliance__stat-label">Approved</div>
              <div className="qa-compliance__stat-value">{approvedCount}</div>
            </Card>
            <Card className="qa-compliance__stat">
              <div className="qa-compliance__stat-label">Rejected</div>
              <div className="qa-compliance__stat-value">{rejectedCount}</div>
            </Card>
            <Card className="qa-compliance__stat">
              <div className="qa-compliance__stat-label">Compliance Rate</div>
              <div className="qa-compliance__stat-value">{complianceRate}%</div>
            </Card>
          </div>

          <Card className="qa-compliance__table-card">
            <TableComponent
              columns={overviewColumns}
              data={documents}
              caption="Documents overview"
            />
          </Card>
        </div>
      ) : activeTab === "documents" ? (
        <div className="qa-compliance__content">
          <Card className="qa-compliance__table-card">
            <TableComponent
              columns={documentColumns}
              data={documents}
              caption="Documents to verify"
            />
          </Card>
        </div>
      ) : (
        <div className="qa-compliance__content">
          <div className="qa-compliance__issues-header">
            <div className="qa-compliance__issues-title">Published Issues</div>
            <Button
              text="Post Issue"
              variant="primary"
              onClick={() => {
                const firstPending = documents.find(
                  (d) => d.status === "Pending",
                );
                openIssueModal(firstPending?.id ?? "");
              }}
            />
          </div>

          <Card className="qa-compliance__table-card">
            <TableComponent
              columns={issueColumns}
              data={issues}
              caption="Issues"
            />
          </Card>
        </div>
      )}

      <Modal
        isOpen={issueModalOpen}
        onClose={closeIssueModal}
        title="Post Issue"
      >
        <div className="qa-compliance__modal-form">
          <InputField
            label="Document ID"
            value={issueDocId}
            onChange={setIssueDocId}
            placeholder="e.g. DOC-001"
            required
          />
          <Dropdown
            label="Severity"
            value={issueSeverity}
            onChange={(value) =>
              setIssueSeverity(value as DocumentIssue["severity"])
            }
            options={SEVERITY_OPTIONS}
          />
          <InputField
            label="Issue title"
            value={issueTitle}
            onChange={setIssueTitle}
            placeholder="e.g. Missing signature"
            required
          />
          <label className="system-settings__field">
            <span className="system-settings__field-label">Description</span>
            <textarea
              className="system-settings__textarea"
              value={issueDescription}
              onChange={(e) => setIssueDescription(e.target.value)}
              rows={4}
            />
          </label>

          {issueError && (
            <p className="qa-compliance__modal-error">{issueError}</p>
          )}

          <div className="qa-compliance__modal-actions">
            <Button
              text="Cancel"
              variant="secondary"
              onClick={closeIssueModal}
            />
            <Button text="Post" variant="primary" onClick={postIssue} />
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={rejectModalOpen}
        onClose={closeRejectModal}
        title="Reject Document"
      >
        <div className="qa-compliance__modal-form">
          <InputField
            label="Document ID"
            value={rejectDocId}
            onChange={setRejectDocId}
            placeholder="e.g. DOC-001"
            required
          />

          <label className="system-settings__field">
            <span className="system-settings__field-label">Reason</span>
            <textarea
              className="system-settings__textarea"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
            />
          </label>

          {rejectError && (
            <p className="qa-compliance__modal-error">{rejectError}</p>
          )}

          <div className="qa-compliance__modal-actions">
            <Button
              text="Cancel"
              variant="secondary"
              onClick={closeRejectModal}
            />
            <Button text="Reject" variant="primary" onClick={submitRejection} />
          </div>
        </div>
      </Modal>
    </div>
  );
}
