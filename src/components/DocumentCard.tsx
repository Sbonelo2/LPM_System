import { useId, useState } from "react";
import "./DocumentCard.css";

type Props = {
  title: string;
  currentFileName?: string;
  uploadedAt?: string;
  thumbnailLabel?: string;
  onCurrentClick?: () => void;
  showPreviousToggle?: boolean;
  defaultExpanded?: boolean;
  expanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
  onDeleteCurrent?: () => void;
  onDeletePrevious?: (documentId: string) => void;
  children?: React.ReactNode;
};

export default function DocumentCard({
  title,
  currentFileName,
  uploadedAt,
  thumbnailLabel,
  onCurrentClick,
  showPreviousToggle,
  defaultExpanded,
  expanded,
  onExpandedChange,
  onDeleteCurrent,
  onDeletePrevious,
  children,
}: Props) {
  const contentId = useId();
  const [internalExpanded, setInternalExpanded] = useState<boolean>(
    Boolean(defaultExpanded),
  );

  const isControlled = expanded !== undefined;
  const isExpanded = isControlled ? expanded : internalExpanded;

  const canShowPreviousToggle = showPreviousToggle ?? Boolean(children);

  const setExpanded = (next: boolean) => {
    if (!isControlled) setInternalExpanded(next);
    onExpandedChange?.(next);
  };

  return (
    <section className="document-card">
      <h3 className="document-card__title">{title}</h3>

      <div className="document-card__panel">
        <div className="document-card__panel-title">Current Upload:</div>

        <button
          type="button"
          className="document-card__current"
          onClick={onCurrentClick}
          disabled={!onCurrentClick}
        >
          <div className="document-card__thumb">
            <span className="document-card__thumb-text">
              {thumbnailLabel || title}
            </span>
          </div>

          <div className="document-card__meta">
            <div className="document-card__file">{currentFileName || "—"}</div>
            <div className="document-card__date">
              Uploaded: {uploadedAt || "—"}
            </div>
          </div>
        </button>

        {onDeleteCurrent && currentFileName && (
          <button
            type="button"
            className="document-card__delete-btn"
            onClick={onDeleteCurrent}
            title="Delete current document"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 6h18"></path>
              <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"></path>
              <line x1="10" y1="11" x2="10" y2="17"></line>
              <line x1="14" y1="11" x2="14" y2="17"></line>
            </svg>
            🗑️
          </button>
        )}
      </div>

      {canShowPreviousToggle && (
        <>
          <button
            type="button"
            className="document-card__toggle"
            aria-expanded={isExpanded}
            aria-controls={contentId}
            onClick={() => setExpanded(!isExpanded)}
          >
            <span className="document-card__toggle-text">Previous Uploads</span>
            <span
              className={`document-card__chevron${isExpanded ? " document-card__chevron--up" : ""}`}
              aria-hidden="true"
            />
          </button>

          <div
            id={contentId}
            className={`document-card__previous${isExpanded ? " document-card__previous--open" : ""}`}
          >
            {children}
          </div>
        </>
      )}
    </section>
  );
}
