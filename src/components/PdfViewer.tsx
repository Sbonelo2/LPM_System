interface DocumentProp {
  id: string;
  file_name: string;
  file_url: string;
  created_at: string;
}

interface Props {
  document: DocumentProp;
  onClose: () => void;
}

export default function PdfViewer({ document, onClose }: Props) {
  return (
    <div
      role="dialog"
      aria-label={`Viewing ${document.file_name}`}
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 50,
      }}
    >
      <div
        style={{
          width: "90%",
          height: "90%",
          background: "#fff",
          borderRadius: 8,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "0.5rem 1rem",
            borderBottom: "1px solid #e5e7eb",
          }}
        >
          <div style={{ fontWeight: 600 }}>{document.file_name}</div>
          <div>
            <button
              onClick={onClose}
              style={{ marginRight: 8, padding: "0.35rem 0.6rem" }}
            >
              Close
            </button>
            <a
              href={document.file_url}
              target="_blank"
              rel="noopener noreferrer"
              style={{ padding: "0.35rem 0.6rem" }}
            >
              Open in new tab
            </a>
          </div>
        </div>

        <div style={{ flex: 1 }}>
          <iframe
            src={document.file_url}
            title={document.file_name}
            style={{ width: "100%", height: "100%", border: "none" }}
          />
        </div>
      </div>
    </div>
  );
}
