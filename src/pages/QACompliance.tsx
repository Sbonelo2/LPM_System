import { useEffect, useMemo, useState } from "react";
import Card from "../components/Card";
import Button from "../components/Button";
import TableComponent, { type TableColumn } from "../components/TableComponent";
import Modal from "../components/Modal";
import InputField from "../components/InputField";
import Dropdown, { type DropdownOption } from "../components/Dropdown";
import LoadingSpinner from "../components/LoadingSpinner";
import { supabase } from "../services/supabaseClient";
import { useAuth } from "../hooks/useAuth";
import { useLocation } from "react-router-dom";
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

const TYPE_PREFIX = "__DOC_TYPE__";

function stripTypePrefix(fileName: string): string {
  if (!fileName.startsWith(TYPE_PREFIX)) return fileName;
  const typeSplitIndex = fileName.indexOf("__", TYPE_PREFIX.length);
  if (typeSplitIndex === -1) return fileName;
  return fileName.slice(typeSplitIndex + 2);
}

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
  const { user, loading: authLoading } = useAuth();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<ComplianceTab>("compliance");

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  const [documents, setDocuments] = useState<VerifiableDocument[]>([]);
  const [issues, setIssues] = useState<DocumentIssue[]>([]);

  const withTimeout = async <T,>(
    promise: PromiseLike<T>,
    ms: number,
    label: string,
  ): Promise<T> => {
    return await Promise.race([
      Promise.resolve(promise),
      new Promise<T>((_resolve, reject) =>
        setTimeout(() => reject(new Error(`${label} timed out`)), ms),
      ),
    ]);
  };

  const loadCompliance = async () => {
    if (!user) {
      setDocuments([]);
      setIssues([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const { data: docs, error: docsError } = (await withTimeout(
        supabase
          .from("documents")
          .select("id, user_id, file_name, created_at")
          .order("created_at", { ascending: false })
          .limit(300),
        12000,
        "Load documents",
      )) as {
        data:
          | {
              id: string;
              user_id: string;
              file_name: string;
              created_at: string;
            }[]
          | null;
        error: { message: string } | null;
      };

      if (docsError) throw new Error(docsError.message);

      const documentIds = (docs ?? []).map((d) => d.id);
      const userIds = Array.from(new Set((docs ?? []).map((d) => d.user_id)));

      const verificationByDocId = new Map<string, VerificationStatus>();
      const verificationReasonByDocId = new Map<string, string>();

      if (documentIds.length > 0) {
        const { data: verRows, error: verError } = (await withTimeout(
          supabase
            .from("document_verifications")
            .select("document_id, status, rejection_reason")
            .in("document_id", documentIds),
          12000,
          "Load verifications",
        )) as {
          data:
            | {
                document_id: string;
                status: string;
                rejection_reason: string | null;
              }[]
            | null;
          error: { message: string } | null;
        };
        if (verError) throw new Error(verError.message);
        (verRows ?? []).forEach((v) => {
          const statusValue: VerificationStatus =
            v.status === "Approved"
              ? "Approved"
              : v.status === "Rejected"
                ? "Rejected"
                : "Pending";
          verificationByDocId.set(v.document_id, statusValue);
          if (v.rejection_reason) {
            verificationReasonByDocId.set(v.document_id, v.rejection_reason);
          }
        });
      }

      const learnerById = new Map<string, string>();
      if (userIds.length > 0) {
        const { data: learnerRows, error: learnerError } = (await withTimeout(
          supabase
            .from("profiles")
            .select("id, full_name, email")
            .in("id", userIds),
          12000,
          "Load learners",
        )) as {
          data:
            | { id: string; full_name: string | null; email: string | null }[]
            | null;
          error: { message: string } | null;
        };
        if (learnerError) throw new Error(learnerError.message);
        (learnerRows ?? []).forEach((l) => {
          learnerById.set(l.id, l.full_name ?? l.email ?? l.id);
        });
      }

      setDocuments(
        (docs ?? []).map((d) => ({
          id: d.id,
          learner: learnerById.get(d.user_id) ?? d.user_id ?? "Unknown",
          documentName: stripTypePrefix(d.file_name),
          uploadedOn: d.created_at ? d.created_at.slice(0, 10) : "",
          status: verificationByDocId.get(d.id) ?? "Pending",
        })),
      );

      const { data: issueRows, error: issueError } = (await withTimeout(
        supabase
          .from("qa_issues")
          .select(
            "id, document_id, severity, title, description, status, created_at",
          )
          .order("created_at", { ascending: false })
          .limit(500),
        12000,
        "Load issues",
      )) as {
        data:
          | {
              id: string;
              document_id: string;
              severity: string | null;
              title: string | null;
              description: string | null;
              status: string | null;
              created_at: string;
            }[]
          | null;
        error: { message: string } | null;
      };
      if (issueError) throw new Error(issueError.message);

      const issueDocIds = Array.from(
        new Set((issueRows ?? []).map((i) => i.document_id).filter(Boolean)),
      );
      const docById = new Map<string, { file_name: string; user_id: string }>();
      if (issueDocIds.length > 0) {
        const { data: docsForIssues, error: docsForIssuesError } =
          (await withTimeout(
            supabase
              .from("documents")
              .select("id, user_id, file_name")
              .in("id", issueDocIds),
            12000,
            "Load issue documents",
          )) as {
            data: { id: string; user_id: string; file_name: string }[] | null;
            error: { message: string } | null;
          };
        if (docsForIssuesError) throw new Error(docsForIssuesError.message);
        (docsForIssues ?? []).forEach((d) => {
          docById.set(d.id, { file_name: d.file_name, user_id: d.user_id });
        });
      }

      const severityValue = (raw: string | null): DocumentIssue["severity"] => {
        const s = String(raw ?? "");
        if (s.toLowerCase() === "high") return "High";
        if (s.toLowerCase() === "medium") return "Medium";
        return "Low";
      };

      const issueStatusValue = (
        raw: string | null,
      ): DocumentIssue["status"] => {
        const s = String(raw ?? "");
        if (s === "Pending QA" || s === "Under Review") return "Open";
        return "Resolved";
      };

      setIssues(
        (issueRows ?? []).map((i) => {
          const doc = docById.get(i.document_id);
          const learnerId = doc?.user_id;
          return {
            id: i.id,
            documentId: i.document_id,
            documentName: doc ? stripTypePrefix(doc.file_name) : i.document_id,
            learner: learnerId
              ? (learnerById.get(learnerId) ?? learnerId)
              : "Unknown",
            severity: severityValue(i.severity),
            title: i.title ?? "",
            description: i.description ?? "",
            createdOn: i.created_at ? i.created_at.slice(0, 10) : "",
            status: issueStatusValue(i.status),
          };
        }),
      );
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load compliance");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    void loadCompliance();
  }, [authLoading, user]);

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
    if (!user?.id) {
      alert("You must be logged in to approve documents.");
      return;
    }

    const approve = async () => {
      try {
        const { error: upsertError } = (await withTimeout(
          supabase.from("document_verifications").upsert(
            [
              {
                document_id: documentId,
                status: "Approved",
                qa_officer_id: user.id,
                verified_at: new Date().toISOString(),
                reviewed_at: new Date().toISOString(),
                rejection_reason: null,
              },
            ],
            { onConflict: "document_id" },
          ),
          12000,
          "Approve document",
        )) as { error: { message: string } | null };
        if (upsertError) throw new Error(upsertError.message);

        setDocuments((prev) =>
          prev.map((doc) =>
            doc.id === documentId ? { ...doc, status: "Approved" } : doc,
          ),
        );
      } catch (e: unknown) {
        alert(
          `Approve failed: ${e instanceof Error ? e.message : "Unknown error"}`,
        );
      }
    };

    void approve();
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

    if (!user?.id) {
      setRejectError("You must be logged in to reject documents.");
      return;
    }

    const doc = documents.find((d) => d.id === rejectDocId);
    if (!doc) {
      setRejectError("Selected document could not be found.");
      return;
    }

    const reject = async () => {
      try {
        const { error: upsertError } = (await withTimeout(
          supabase.from("document_verifications").upsert(
            [
              {
                document_id: rejectDocId,
                status: "Rejected",
                qa_officer_id: user.id,
                verified_at: new Date().toISOString(),
                reviewed_at: new Date().toISOString(),
                rejection_reason: reason,
              },
            ],
            { onConflict: "document_id" },
          ),
          12000,
          "Reject document",
        )) as { error: { message: string } | null };
        if (upsertError) throw new Error(upsertError.message);

        try {
          await withTimeout(
            supabase.from("qa_issues").insert([
              {
                document_id: doc.id,
                raised_by: user.id,
                severity: "medium",
                title: "Document rejected",
                description: reason,
                status: "Pending QA",
              },
            ]),
            12000,
            "Create rejection issue",
          );
        } catch (_issueErr) {
          console.warn("Could not create rejection issue:", _issueErr);
        }

        closeRejectModal();
        await loadCompliance();
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Reject failed";
        setRejectError(msg);
        alert(`Reject failed: ${msg}`);
      }
    };

    void reject();
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

    if (!user?.id) {
      setIssueError("You must be logged in to post issues.");
      return;
    }

    const post = async () => {
      try {
        const severity = issueSeverity.toLowerCase();
        const { error: insertError } = (await withTimeout(
          supabase.from("qa_issues").insert([
            {
              document_id: doc.id,
              raised_by: user.id,
              severity,
              title,
              description,
              status: "Pending QA",
            },
          ]),
          12000,
          "Post issue",
        )) as { error: { message: string } | null };

        if (insertError) throw new Error(insertError.message);
        closeIssueModal();
        await loadCompliance();
      } catch (e: unknown) {
        setIssueError(e instanceof Error ? e.message : "Failed to post issue");
      }
    };

    void post();
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
      <h2 className="qa-compliance__title">
        {location.pathname.startsWith("/super-admin")
          ? "Super Admin Compliance"
          : "QA Compliance"}
      </h2>

      {loading ? (
        <div style={{ padding: "16px 0" }}>
          <LoadingSpinner />
        </div>
      ) : null}

      {error ? (
        <div style={{ color: "#dc3545", padding: "12px 0" }}>{error}</div>
      ) : null}

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
