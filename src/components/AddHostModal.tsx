import React, { useId, useMemo, useState } from "react";

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
  const [contactPerson, setContactPerson] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
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

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
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
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(255, 255, 255, 0.92)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
        padding: "24px",
      }}
    >
      <div
        style={{
          width: "min(720px, 100%)",
          background: "#fff",
          borderRadius: 10,
          boxSizing: "border-box",
          padding: "clamp(22px, 4vw, 40px)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.18)",
        }}
      >
        <h1
          id={titleId}
          style={{
            margin: 0,
            fontSize: 44,
            lineHeight: 1.05,
            letterSpacing: "-0.02em",
            fontWeight: 800,
            color: "#111",
          }}
        >
          Add New Host
        </h1>

        <form onSubmit={handleCreate}>
          <div style={{ marginTop: 56, display: "grid", gap: 40 }}>
            <Field
              label="Host Name"
              placeholder="Enter host name"
              value={hostName}
              onChange={setHostName}
              autoFocus
            />
            <Field
              label="location"
              placeholder="Enter location"
              value={location}
              onChange={setLocation}
            />
            <Field
              label="Contact Person"
              placeholder="Enter contact person"
              value={contactPerson}
              onChange={setContactPerson}
            />
            <Field
              label="Contact Email"
              type="email"
              placeholder="Enter contact email"
              value={contactEmail}
              onChange={setContactEmail}
            />
            <Field
              label="Contact Phone"
              placeholder="Enter contact phone"
              value={contactPhone}
              onChange={setContactPhone}
            />
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 24,
              marginTop: 34,
            }}
          >
            <button
              type="submit"
              disabled={!canSubmit || submitting}
              style={{
                flex: 1,
                height: 86,
                background: "linear-gradient(180deg, #A3D94E 0%, #7FB828 100%)",
                border: "2px solid #2f2f2f",
                borderRadius: 8,
                color: "#fff",
                fontSize: 42,
                fontWeight: 800,
                letterSpacing: "0.04em",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                boxShadow:
                  "0 12px 0 rgba(0,0,0,0.22), 0 16px 22px rgba(0,0,0,0.22)",
                transition: "transform 0.15s ease, box-shadow 0.15s ease",
                cursor: !canSubmit || submitting ? "not-allowed" : "pointer",
                opacity: !canSubmit || submitting ? 0.6 : 1,
              }}
            >
              CREATE
            </button>

            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                height: 86,
                background: "linear-gradient(180deg, #FF5A1F 0%, #E63E00 100%)",
                border: "2px solid #2f2f2f",
                borderRadius: 8,
                color: "#fff",
                fontSize: 42,
                fontWeight: 800,
                letterSpacing: "0.04em",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                boxShadow:
                  "0 12px 0 rgba(0,0,0,0.22), 0 16px 22px rgba(0,0,0,0.22)",
                transition: "transform 0.15s ease, box-shadow 0.15s ease",
                cursor: "pointer",
              }}
            >
              CANCEL
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

type FieldProps = {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: React.HTMLInputTypeAttribute;
  autoFocus?: boolean;
};

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  autoFocus,
}: FieldProps) {
  const inputId = useId();

  return (
    <div style={{ display: "grid", gap: 10, textAlign: "left" }}>
      <label
        htmlFor={inputId}
        style={{
          fontSize: 20,
          fontWeight: 700,
          color: "#cfcfcf",
          letterSpacing: "0.01em",
        }}
      >
        {label}
      </label>
      <input
        id={inputId}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoFocus={autoFocus}
        style={{
          width: "100%",
          boxSizing: "border-box",
          height: 58,
          borderRadius: 18,
          border: "1px solid rgba(0, 0, 0, 0.06)",
          padding: "0 22px",
          fontSize: 18,
          backgroundColor: "#fff",
          boxShadow: "0 14px 0 rgba(0,0,0,0.12), 0 14px 18px rgba(0,0,0,0.12)",
          outline: "none",
        }}
      />
    </div>
  );
}
