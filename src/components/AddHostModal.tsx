import React, { useId, useMemo, useState } from "react";
import "./AddHostModal.css";

export type NewHostPayload = {
  hostName: string;
  location: string;
  contactPerson: string;
  contactEmail: string;
  contactPhone: string;
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
  const [contactPerson, setContactPerson] = useState("Shantela Silindile Noyila");
  const [contactEmail, setContactEmail] = useState("shantelaslie@gmail.com");
  const [contactPhone, setContactPhone] = useState("0638998411");
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = useMemo(() => {
    return (
      hostName.trim().length > 0 &&
      location.trim().length > 0 &&
      contactPerson.trim().length > 0 &&
      contactEmail.trim().length > 0 &&
      contactPhone.trim().length > 0
    );
  }, [hostName, location, contactPerson, contactEmail, contactPhone]);

  const handleSubmit = async () => {
    if (!canSubmit || submitting) return;

    const payload: NewHostPayload = {
      hostName: hostName.trim(),
      location: location.trim(),
      contactPerson: contactPerson.trim(),
      contactEmail: contactEmail.trim(),
      contactPhone: contactPhone.trim(),
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
