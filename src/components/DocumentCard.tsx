import { useId, useState } from "react";
import { Eye, Trash2 } from "lucide-react";
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
            <div className="document-card__file">{currentFileName || "-"}</div>
            <div className="document-card__date">
              Uploaded: {uploadedAt || "-"}
            </div>
          </div>
        </button>

        {(onCurrentClick || onDeleteCurrent) && (
          <div className="document-card__icon-actions">
            {onCurrentClick && (
              <span
                role="button"
                tabIndex={0}
                className="document-card__action-icon document-card__action-icon--view"
                onClick={(event) => {
                  event.stopPropagation();
                  onCurrentClick();
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onCurrentClick();
                  }
                }}
                title="View document"
                aria-label="View document"
              >
                <Eye />
              </span>
            )}

            {onDeleteCurrent && currentFileName && (
              <span
                role="button"
                tabIndex={0}
                className="document-card__action-icon document-card__action-icon--delete"
                onClick={(event) => {
                  event.stopPropagation();
                  onDeleteCurrent();
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onDeleteCurrent();
                  }
                }}
                title="Delete document"
                aria-label="Delete document"
              >
                <Trash2 />
              </span>
            )}
          </div>
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
