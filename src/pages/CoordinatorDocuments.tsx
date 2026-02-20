import React, { useEffect, useMemo, useRef, useState } from "react";
import { Eye, Trash2 } from "lucide-react";
import Button from "../components/Button";
import Card from "../components/Card";
import Modal from "../components/Modal";
import Snackbar from "../components/Snackbar";
import TableComponent, { type TableColumn } from "../components/TableComponent";
import Dropdown, { type DropdownOption } from "../components/Dropdown";
import { supabase } from "../services/supabaseClient";
import "./CoordinatorDocuments.css";

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

const COORDINATOR_LOCAL_DOCS_KEY = "coordinator_documents_local";
const COORDINATOR_LOCAL_USER_ID = "coordinator-local";
const COORDINATOR_HISTORY_KEY = "coordinator_documents_history";
const COORDINATOR_ROLE_TARGETS_KEY = "coordinator_documents_role_targets";

const DOCUMENT_TYPES: Array<{ key: DocumentTypeKey; label: string }> = [
  { key: "ID_COPY", label: "ID Copy" },
  { key: "MATRIC_CERTIFICATE", label: "Matric Certificate" },
  { key: "TERTIARY_QUALIFICATION", label: "Tertiary Qualification" },
  { key: "PROOF_OF_ADDRESS", label: "Proof of Address" },
];

const ROLE_OPTIONS: DropdownOption[] = [
  { label: "Admin", value: "Admin" },
  { label: "Learner", value: "Learner" },
  { label: "Coordinator", value: "Coordinator" },
  { label: "QA Officer", value: "QA Officer" },
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
  return null;
}

function isCoordinatorTokenSession(): boolean {
  return localStorage.getItem("coordinator-token") === "dummy-coordinator-token";
}

function loadLocalDocuments(): DocumentRecord[] {
  try {
    const raw = localStorage.getItem(COORDINATOR_LOCAL_DOCS_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as DocumentRecord[];
  } catch {
    return [];
  }
}

function saveLocalDocuments(documents: DocumentRecord[]): void {
  localStorage.setItem(COORDINATOR_LOCAL_DOCS_KEY, JSON.stringify(documents));
}

function loadHistoricalDocuments(): HistoricalDocumentEntry[] {
  try {
    const raw = localStorage.getItem(COORDINATOR_HISTORY_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((entry, index) => {
        const record = entry as Partial<HistoricalDocumentEntry> & {
          doc?: Partial<DocumentRecord>;
        };

        const fileName = record.file_name || record.doc?.file_name || "";
        const fileUrl = record.file_url || record.doc?.file_url || "";
        const createdAt = record.created_at || record.doc?.created_at || new Date().toISOString();
        const sourceDocumentId = record.sourceDocumentId || record.doc?.id || `legacy-${index}`;
        const userId = record.userId || record.doc?.user_id || COORDINATOR_LOCAL_USER_ID;
        const typeKey = record.typeKey || resolveDocumentType(fileName) || "ID_COPY";
        const typeLabel =
          record.typeLabel ||
          DOCUMENT_TYPES.find((item) => item.key === typeKey)?.label ||
          "Document";

        if (!fileName || !fileUrl) {
          return null;
        }

        return {
          historyId:
            record.historyId ||
            `${sourceDocumentId}-legacy-${Math.random().toString(36).slice(2, 7)}`,
          sourceDocumentId,
          file_name: fileName,
          file_url: fileUrl,
          created_at: createdAt,
          event_at: record.event_at || createdAt,
          status: record.status || "uploaded",
          userId,
          typeKey,
          typeLabel,
        } as HistoricalDocumentEntry;
      })
      .filter((entry): entry is HistoricalDocumentEntry => Boolean(entry));
  } catch {
    return [];
  }
}

function saveHistoricalDocuments(history: HistoricalDocumentEntry[]): HistoricalDocumentEntry[] {
  // Avoid persisting huge base64 payloads in history records.
  const compactHistory = history.map((entry) => ({
    ...entry,
    file_url: entry.file_url.startsWith("data:") ? "" : entry.file_url,
  }));

  let candidate = compactHistory;
  while (candidate.length >= 0) {
    try {
      localStorage.setItem(COORDINATOR_HISTORY_KEY, JSON.stringify(candidate));
      return candidate;
    } catch {
      if (candidate.length === 0) {
        return [];
      }
      // Drop oldest entries until it fits.
      candidate = candidate.slice(0, candidate.length - 1);
    }
  }

  return [];
}

function loadDocumentRoleTargets(): Record<string, string[]> {
  try {
    const raw = localStorage.getItem(COORDINATOR_ROLE_TARGETS_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return {};
    return parsed as Record<string, string[]>;
  } catch {
    return {};
  }
}

function saveDocumentRoleTargets(targets: Record<string, string[]>): void {
  localStorage.setItem(COORDINATOR_ROLE_TARGETS_KEY, JSON.stringify(targets));
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Failed to read selected file."));
    reader.readAsDataURL(file);
  });
}

type GroupedDocuments = {
  groupKey: string;
  userId: string;
  typeKey: DocumentTypeKey;
  typeLabel: string;
  docs: DocumentRecord[];
};

type HistoricalDocumentEntry = {
  historyId: string;
  sourceDocumentId: string;
  file_name: string;
  file_url: string;
  created_at: string;
  event_at: string;
  status: "uploaded" | "updated" | "deleted";
  userId: string;
  typeKey: DocumentTypeKey;
  typeLabel: string;
};

type PendingDelete = {
  id: string;
  fileName: string;
  createdAt: string;
};

type HistoricalTableRow = {
  id: string;
  source: string;
  documentName: string;
  uploadedOn: string;
  entry: HistoricalDocumentEntry;
};

type CurrentTableRow = {
  id: string;
  source: string;
  documentName: string;
  uploadedOn: string;
  doc: DocumentRecord;
};

export default function CoordinatorDocuments(): React.JSX.Element {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [uploading, setUploading] = useState(false);
  const [selectedType, setSelectedType] = useState<DocumentTypeKey>("ID_COPY");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [feedback, setFeedback] = useState("");
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [viewingDocument, setViewingDocument] = useState<DocumentRecord | null>(null);
  const [roleModalDocument, setRoleModalDocument] = useState<DocumentRecord | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [editingRoles, setEditingRoles] = useState<string[]>([]);
  const [documentRoleTargets, setDocumentRoleTargets] = useState<Record<string, string[]>>(
    () => loadDocumentRoleTargets(),
  );
  const [historicalRecords, setHistoricalRecords] = useState<HistoricalDocumentEntry[]>(
    () => loadHistoricalDocuments(),
  );

  const updateHistoricalRecords = (
    updater: (prev: HistoricalDocumentEntry[]) => HistoricalDocumentEntry[],
  ) => {
    setHistoricalRecords((prev) => {
      const next = updater(prev);
      return saveHistoricalDocuments(next);
    });
  };

  const appendHistoryRecord = (
    doc: DocumentRecord,
    status: HistoricalDocumentEntry["status"],
    eventAt?: string,
  ) => {
    const typeKey = resolveDocumentType(doc.file_name) ?? "ID_COPY";
    const typeLabel =
      DOCUMENT_TYPES.find((entry) => entry.key === typeKey)?.label ?? "Document";

    const record: HistoricalDocumentEntry = {
      historyId: `${doc.id}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      sourceDocumentId: doc.id,
      file_name: doc.file_name,
      file_url: doc.file_url,
      created_at: doc.created_at,
      event_at: eventAt ?? new Date().toISOString(),
      status,
      userId: doc.user_id,
      typeKey,
      typeLabel,
    };

    updateHistoricalRecords((prev) => [record, ...prev]);
  };

  const ensureCurrentDocsInHistory = (docs: DocumentRecord[]) => {
    updateHistoricalRecords((prev) => {
      const seen = new Set(prev.map((entry) => `${entry.sourceDocumentId}:${entry.created_at}`));
      const additions: HistoricalDocumentEntry[] = [];

      docs.forEach((doc) => {
        const key = `${doc.id}:${doc.created_at}`;
        if (seen.has(key)) return;

        const typeKey = resolveDocumentType(doc.file_name) ?? "ID_COPY";
        const typeLabel =
          DOCUMENT_TYPES.find((entry) => entry.key === typeKey)?.label ?? "Document";

        additions.push({
          historyId: `${doc.id}-seed-${Math.random().toString(36).slice(2, 7)}`,
          sourceDocumentId: doc.id,
          file_name: doc.file_name,
          file_url: doc.file_url,
          created_at: doc.created_at,
          event_at: doc.created_at,
          status: "uploaded",
          userId: doc.user_id,
          typeKey,
          typeLabel,
        });
      });

      if (additions.length === 0) return prev;
      return [...additions, ...prev];
    });
  };

  const groupedDocuments = useMemo(() => {
    const map = new Map<string, GroupedDocuments>();

    for (const doc of documents) {
      const type = resolveDocumentType(doc.file_name);
      if (!type) continue;

      const typeLabel = DOCUMENT_TYPES.find((item) => item.key === type)?.label || type;
      const groupKey = `${doc.user_id}:${type}`;

      if (!map.has(groupKey)) {
        map.set(groupKey, {
          groupKey,
          userId: doc.user_id,
          typeKey: type,
          typeLabel,
          docs: [],
        });
      }

      map.get(groupKey)?.docs.push(doc);
    }

    const groups = Array.from(map.values());
    groups.forEach((group) => {
      group.docs.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
    });

    groups.sort(
      (a, b) =>
        new Date(b.docs[0]?.created_at || 0).getTime() -
        new Date(a.docs[0]?.created_at || 0).getTime(),
    );

    return groups;
  }, [documents]);

  const historicalDocuments = useMemo<HistoricalDocumentEntry[]>(
    () =>
      [...historicalRecords].sort(
        (a, b) => new Date(b.event_at).getTime() - new Date(a.event_at).getTime(),
      ),
    [historicalRecords],
  );

  const historicalRows = useMemo<HistoricalTableRow[]>(
    () =>
      historicalDocuments.map((entry) => ({
        id: entry.historyId,
        source: entry.typeLabel,
        documentName: stripTypePrefix(entry.file_name),
        uploadedOn: `${new Date(entry.created_at).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        })} ${new Date(entry.created_at).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        })}`,
        entry,
      })),
    [historicalDocuments],
  );

  const historyColumns: TableColumn<HistoricalTableRow>[] = [
    { key: "source", header: "Source" },
    { key: "documentName", header: "Document" },
    { key: "uploadedOn", header: "Uploaded On" },
    {
      key: "actions",
      header: "Actions",
      render: (row: HistoricalTableRow) => (
        <div className="coordinator-history-row__actions">
          <span
            role="button"
            tabIndex={0}
            className="coordinator-history-action-icon coordinator-history-action-icon--view"
            onClick={() => openHistoricalDocument(row.entry)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                openHistoricalDocument(row.entry);
              }
            }}
            title="View document"
            aria-label="View document"
          >
            <Eye />
          </span>
          {row.entry.status !== "deleted" && (
            <span
              role="button"
              tabIndex={0}
              className="coordinator-history-action-icon coordinator-history-action-icon--delete"
              onClick={() =>
                requestDelete(
                  row.entry.sourceDocumentId,
                  stripTypePrefix(row.entry.file_name),
                  row.entry.created_at,
                )
              }
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  requestDelete(
                    row.entry.sourceDocumentId,
                    stripTypePrefix(row.entry.file_name),
                    row.entry.created_at,
                  );
                }
              }}
              title="Delete document"
              aria-label="Delete document"
            >
              <Trash2 />
            </span>
          )}
        </div>
      ),
    },
  ];

  const currentRows = useMemo<CurrentTableRow[]>(
    () =>
      groupedDocuments.map((group) => {
        const currentDoc = group.docs[0];
        return {
          id: group.groupKey,
          source: group.typeLabel,
          documentName: stripTypePrefix(currentDoc.file_name),
          uploadedOn: `${new Date(currentDoc.created_at).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "long",
            year: "numeric",
          })} ${new Date(currentDoc.created_at).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          })}`,
          doc: currentDoc,
        };
      }),
    [groupedDocuments],
  );

  const currentColumns: TableColumn<CurrentTableRow>[] = [
    { key: "source", header: "Source" },
    { key: "documentName", header: "Document" },
    { key: "uploadedOn", header: "Uploaded On" },
    {
      key: "forRoles",
      header: "For Roles",
      render: (row: CurrentTableRow) => (
        <div className="coordinator-role-cell">
          <span className="coordinator-role-cell__text">
            {(documentRoleTargets[row.doc.id] ?? []).length > 0
              ? (documentRoleTargets[row.doc.id] ?? []).join(", ")
              : "Not set"}
          </span>
          <Button
            text="Set"
            variant="ghost"
            className="coordinator-role-cell__btn"
            onClick={() => openRoleModal(row.doc)}
          />
        </div>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (row: CurrentTableRow) => (
        <div className="coordinator-history-row__actions">
          <span
            role="button"
            tabIndex={0}
            className="coordinator-history-action-icon coordinator-history-action-icon--view"
            onClick={() => setViewingDocument(row.doc)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                setViewingDocument(row.doc);
              }
            }}
            title="View document"
            aria-label="View document"
          >
            <Eye />
          </span>
          <span
            role="button"
            tabIndex={0}
            className="coordinator-history-action-icon coordinator-history-action-icon--delete"
            onClick={() =>
              requestDelete(
                row.doc.id,
                stripTypePrefix(row.doc.file_name),
                row.doc.created_at,
              )
            }
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                requestDelete(
                  row.doc.id,
                  stripTypePrefix(row.doc.file_name),
                  row.doc.created_at,
                );
              }
            }}
            title="Delete document"
            aria-label="Delete document"
          >
            <Trash2 />
          </span>
        </div>
      ),
    },
  ];

  useEffect(() => {
    const fetchDocuments = async () => {
      if (isCoordinatorTokenSession()) {
        const localDocs = loadLocalDocuments();
        setDocuments(localDocs);
        ensureCurrentDocsInHistory(localDocs);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("documents")
          .select("id, user_id, file_name, file_url, created_at")
          .order("created_at", { ascending: false });

        if (error) throw error;
        const fetchedDocs = data ?? [];
        setDocuments(fetchedDocs);
        ensureCurrentDocsInHistory(fetchedDocs);
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

  const executeDelete = async (documentId: string) => {
    const docToDelete = documents.find((doc) => doc.id === documentId);

    if (isCoordinatorTokenSession()) {
      setDocuments((prev) => {
        const next = prev.filter((doc) => doc.id !== documentId);
        saveLocalDocuments(next);
        return next;
      });
      setDocumentRoleTargets((prev) => {
        const next = { ...prev };
        delete next[documentId];
        saveDocumentRoleTargets(next);
        return next;
      });
      if (docToDelete) {
        appendHistoryRecord(docToDelete, "deleted");
      }
      setFeedback("");
      setSnackbarMessage("Document deleted successfully.");
      return;
    }

    try {
      const { error } = await supabase.from("documents").delete().eq("id", documentId);
      if (error) throw error;
      setDocuments((prev) => prev.filter((doc) => doc.id !== documentId));
      setDocumentRoleTargets((prev) => {
        const next = { ...prev };
        delete next[documentId];
        saveDocumentRoleTargets(next);
        return next;
      });
      if (docToDelete) {
        appendHistoryRecord(docToDelete, "deleted");
      }
      setFeedback("");
      setSnackbarMessage("Document deleted successfully.");
    } catch (error: unknown) {
      setFeedback(
        `Delete failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      setSnackbarMessage("Failed to delete document.");
    }
  };

  const requestDelete = (documentId: string, fileName: string, createdAt: string) => {
    setPendingDelete({ id: documentId, fileName, createdAt });
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    await executeDelete(pendingDelete.id);
    setPendingDelete(null);
  };

  const cancelDelete = () => {
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
      if (isCoordinatorTokenSession()) {
        const taggedFileName = `${TYPE_PREFIX}${selectedType}__${selectedFile.name}`;
        const fileDataUrl = await fileToDataUrl(selectedFile);
        const localDoc: DocumentRecord = {
          id: `local-${Date.now()}`,
          user_id: COORDINATOR_LOCAL_USER_ID,
          file_name: taggedFileName,
          file_url: fileDataUrl,
          created_at: new Date().toISOString(),
        };

        setDocuments((prev) => {
          const next = [localDoc, ...prev];
          saveLocalDocuments(next);
          return next;
        });
        appendHistoryRecord(localDoc, "uploaded", localDoc.created_at);

        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        setFeedback("Upload complete (local test mode).");
        return;
      }

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
          },
        ])
        .select("id, user_id, file_name, file_url, created_at")
        .single();

      if (insertError) throw insertError;

      setDocuments((prev) => [inserted, ...prev]);
      appendHistoryRecord(inserted, "uploaded", inserted.created_at);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setFeedback("Upload complete.");
    } catch (error: unknown) {
      setFeedback(
        `Upload failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    } finally {
      setUploading(false);
    }
  };

  const openHistoricalDocument = (entry: HistoricalDocumentEntry) => {
    const fallbackUrl =
      documents.find((doc) => doc.id === entry.sourceDocumentId)?.file_url || "";
    const resolvedUrl = entry.file_url || fallbackUrl;

    if (!resolvedUrl) {
      setSnackbarMessage("Preview unavailable for this historical record.");
      return;
    }

    setViewingDocument({
      id: entry.sourceDocumentId,
      user_id: entry.userId,
      file_name: entry.file_name,
      file_url: resolvedUrl,
      created_at: entry.created_at,
    });
  };

  const openRoleModal = (doc: DocumentRecord) => {
    setRoleModalDocument(doc);
    setEditingRoles(documentRoleTargets[doc.id] ?? []);
    setSelectedRole("");
  };

  const closeRoleModal = () => {
    setRoleModalDocument(null);
    setEditingRoles([]);
    setSelectedRole("");
  };

  const addRoleToSelection = () => {
    if (!selectedRole) return;
    setEditingRoles((prev) => (prev.includes(selectedRole) ? prev : [...prev, selectedRole]));
    setSelectedRole("");
  };

  const removeRoleFromSelection = (role: string) => {
    setEditingRoles((prev) => prev.filter((item) => item !== role));
  };

  const saveRoleSelection = () => {
    if (!roleModalDocument) return;
    setDocumentRoleTargets((prev) => {
      const next = { ...prev, [roleModalDocument.id]: editingRoles };
      saveDocumentRoleTargets(next);
      return next;
    });
    setSnackbarMessage("Role targets updated.");
    closeRoleModal();
  };

  const resolvedPendingDelete = useMemo(() => {
    if (!pendingDelete) return null;

    const currentDoc = documents.find((doc) => doc.id === pendingDelete.id);
    const historyDoc = historicalDocuments.find(
      (entry) => entry.sourceDocumentId === pendingDelete.id,
    );

    const resolvedFileName =
      pendingDelete.fileName?.trim() ||
      (currentDoc ? stripTypePrefix(currentDoc.file_name) : "") ||
      (historyDoc ? stripTypePrefix(historyDoc.file_name) : "") ||
      "Selected document";

    const resolvedCreatedAt =
      pendingDelete.createdAt ||
      currentDoc?.created_at ||
      historyDoc?.created_at ||
      "";

    const dateText = Number.isNaN(new Date(resolvedCreatedAt).getTime())
      ? "Uploaded date unavailable"
      : `Uploaded on ${new Date(resolvedCreatedAt).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        })}`;

    return {
      fileName: resolvedFileName,
      dateText,
    };
  }, [pendingDelete, documents, historicalDocuments]);

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <div style={{ flex: 1 }}>
        <div className="coordinator-documents-page">
          <div className="coordinator-documents-header">
            <h2>COORDINATOR DOCUMENTS</h2>
            <Button
              text="View Historical Documents"
              variant="secondary"
              onClick={() => setShowHistoryModal(true)}
            />
          </div>

          {feedback && <p className="coordinator-documents-feedback">{feedback}</p>}

          <div className="coordinator-documents-layout">
            <div className="coordinator-documents-list">
              {currentRows.length > 0 ? (
                <Card>
                  <TableComponent
                    columns={currentColumns}
                    data={currentRows}
                    caption="Current Documents"
                  />
                </Card>
              ) : (
                <div className="coordinator-documents-empty">
                  <h3>No documents uploaded yet</h3>
                  <p>Upload a new document to get started.</p>
                </div>
              )}
            </div>

            <aside className="coordinator-upload-panel-wrap">
              <Card className="coordinator-upload-panel">
                <h3 className="coordinator-upload-title">UPLOAD NEW DOCUMENT</h3>
                <label className="coordinator-upload-label" htmlFor="coordinator-document-type-select">
                  Select Document Type
                </label>
                <select
                  id="coordinator-document-type-select"
                  className="coordinator-upload-select"
                  value={selectedType}
                  onChange={(event) => setSelectedType(event.target.value as DocumentTypeKey)}
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
                  className="coordinator-upload-hidden-input"
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={handleFileChange}
                />

                <Button
                  text={selectedFile ? selectedFile.name : "Choose File"}
                  className="coordinator-upload-btn coordinator-upload-btn--choose"
                  onClick={handleChooseFile}
                  disabled={uploading}
                />
                <Button
                  text={uploading ? "Uploading..." : "Upload Document"}
                  className="coordinator-upload-btn coordinator-upload-btn--submit"
                  onClick={handleUpload}
                  disabled={uploading || !selectedFile}
                />
                <p className="coordinator-upload-note">
                  Supported formats: PDF, JPG, PNG. New uploads become current versions.
                </p>
              </Card>
            </aside>
          </div>
        </div>
      </div>

      {showHistoryModal && (
        <Modal
          isOpen={showHistoryModal}
          onClose={() => {
            setShowHistoryModal(false);
          }}
          title="Historical Documents"
        >
          <div className="coordinator-history-modal">
            {historicalDocuments.length === 0 ? (
              <p className="coordinator-history-empty">No historical documents available yet.</p>
            ) : (
              <TableComponent
                columns={historyColumns}
                data={historicalRows}
                caption="All Historical Documents"
              />
            )}
          </div>
        </Modal>
      )}

      {pendingDelete && resolvedPendingDelete && (
        <Modal
          isOpen={Boolean(pendingDelete)}
          onClose={cancelDelete}
          title="Confirm Deletion"
        >
          <p className="coordinator-delete-modal-filename">
            {resolvedPendingDelete.fileName}
          </p>
          <p className="coordinator-delete-modal-meta">
            {resolvedPendingDelete.dateText}
          </p>
          <div className="coordinator-delete-modal-actions">
            <Button text="Cancel" variant="secondary" onClick={cancelDelete} />
            <Button text="Delete" variant="primary" onClick={confirmDelete} />
          </div>
        </Modal>
      )}

      {viewingDocument && (
        <Modal
          isOpen={Boolean(viewingDocument)}
          onClose={() => setViewingDocument(null)}
          title={stripTypePrefix(viewingDocument.file_name)}
          contentClassName="coordinator-view-modal-content"
        >
          <div className="coordinator-view-modal">
            <iframe
              src={viewingDocument.file_url}
              title={stripTypePrefix(viewingDocument.file_name)}
              className="coordinator-view-modal__frame"
            />
            <a
              href={viewingDocument.file_url}
              target="_blank"
              rel="noopener noreferrer"
              className="coordinator-view-modal__link"
            >
              Open in new tab
            </a>
          </div>
        </Modal>
      )}

      {roleModalDocument && (
        <Modal
          isOpen={Boolean(roleModalDocument)}
          onClose={closeRoleModal}
          title={`Set Document Roles: ${stripTypePrefix(roleModalDocument.file_name)}`}
        >
          <div className="coordinator-role-modal">
            <Dropdown
              label="Select Role"
              value={selectedRole}
              onChange={setSelectedRole}
              options={ROLE_OPTIONS}
              placeholder="Choose role"
            />
            <div className="coordinator-role-modal__add">
              <Button
                text="Add Role"
                variant="secondary"
                onClick={addRoleToSelection}
                disabled={!selectedRole}
              />
            </div>
            <div className="coordinator-role-modal__chips">
              {editingRoles.length === 0 ? (
                <span className="coordinator-role-modal__empty">No roles selected.</span>
              ) : (
                editingRoles.map((role) => (
                  <span key={role} className="coordinator-role-chip">
                    {role}
                    <button
                      type="button"
                      className="coordinator-role-chip__remove"
                      onClick={() => removeRoleFromSelection(role)}
                      aria-label={`Remove ${role}`}
                    >
                      ×
                    </button>
                  </span>
                ))
              )}
            </div>
            <div className="coordinator-delete-modal-actions">
              <Button text="Cancel" variant="secondary" onClick={closeRoleModal} />
              <Button text="Save Roles" variant="primary" onClick={saveRoleSelection} />
            </div>
          </div>
        </Modal>
      )}

      <Snackbar
        message={snackbarMessage}
        onClose={() => setSnackbarMessage("")}
      />
    </div>
  );
}
