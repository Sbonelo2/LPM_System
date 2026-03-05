import { useId, useMemo, useState } from "react";
import "./AddHostModal.css";

export type NewHostPayload = {
  hostName: string;
  location: string;
  contactPerson: string;
  contactEmail: string;
  contactPhone: string;
  currentLearners: number;
  maxCapacity: number;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onCreate?: (payload: NewHostPayload) => void | Promise<void>;
};

export default function AddHostModal({ open, onClose, onCreate }: Props) {
  const titleId = useId();

  const [hostName, setHostName] = useState("");
  const [location, setLocation] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [capacityString, setCapacityString] = useState(""); // Format: "5/10"
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const canSubmit = useMemo(() => {
    return (
      hostName.trim().length > 0 &&
      location.trim().length > 0 &&
      contactPerson.trim().length > 0 &&
      contactEmail.trim().length > 0 &&
      contactPhone.trim().length > 0 &&
      capacityString.includes("/")
    );
  }, [hostName, location, contactPerson, contactEmail, contactPhone, capacityString]);

  const handleSubmit = async () => {
    if (!canSubmit || submitting) return;
    setError("");

    // Parse "5/10" format
    const parts = capacityString.split("/");
    const current = parseInt(parts[0]);
    const max = parseInt(parts[1]);

    if (isNaN(current) || isNaN(max)) {
      setError("Capacity must be in format 'current/max' (e.g. 5/10)");
      return;
    }

    const payload: NewHostPayload = {
      hostName: hostName.trim(),
      location: location.trim(),
      contactPerson: contactPerson.trim(),
      contactEmail: contactEmail.trim(),
      contactPhone: contactPhone.trim(),
      currentLearners: current,
      maxCapacity: max,
    };

    try {
      setSubmitting(true);
      await onCreate?.(payload);
      onClose();

      setHostName("");
      setLocation("");
      setContactPerson("");
      setContactEmail("");
      setContactPhone("");
      setCapacityString("");
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="add-host-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="add-host-modal-content">
        <div className="modal-header">
          <h2 id={titleId}>Add New Host</h2>
        </div>

        <div className="modal-body">
          <div className="form-group">
            <label className="form-label" htmlFor="hostName">
              Host Name <span style={{ color: "#dc3545" }}>*</span>
            </label>
            <input
              id="hostName"
              className="form-input"
              placeholder="Enter host company name"
              value={hostName}
              onChange={(e) => setHostName(e.target.value)}
              disabled={submitting}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="location">
              Location <span style={{ color: "#dc3545" }}>*</span>
            </label>
            <input
              id="location"
              className="form-input"
              placeholder="Enter host location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              disabled={submitting}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="contactPerson">
              Contact Person <span style={{ color: "#dc3545" }}>*</span>
            </label>
            <input
              id="contactPerson"
              className="form-input"
              placeholder="Enter contact person name"
              value={contactPerson}
              onChange={(e) => setContactPerson(e.target.value)}
              disabled={submitting}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="contactEmail">
              Contact Email <span style={{ color: "#dc3545" }}>*</span>
            </label>
            <input
              id="contactEmail"
              className="form-input"
              type="email"
              placeholder="Enter contact email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              disabled={submitting}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="contactPhone">
              Contact Phone <span style={{ color: "#dc3545" }}>*</span>
            </label>
            <input
              id="contactPhone"
              className="form-input"
              placeholder="Enter contact phone number"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              disabled={submitting}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="capacity">
              Learner Capacity (Current/Max) <span style={{ color: "#dc3545" }}>*</span>
            </label>
            <input
              id="capacity"
              type="text"
              className="form-input"
              placeholder="e.g. 5/10"
              value={capacityString}
              onChange={(e) => setCapacityString(e.target.value)}
              disabled={submitting}
            />
          </div>
          
          {error && <p style={{ color: '#dc3545', fontSize: '14px', marginTop: '10px' }}>{error}</p>}
        </div>

        <div className="modal-footer">
          <button
            className="modal-btn modal-btn-cancel"
            onClick={onClose}
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            className="modal-btn modal-btn-submit"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? "Adding..." : "Add Host"}
          </button>
        </div>
      </div>
    </div>
  );
}
