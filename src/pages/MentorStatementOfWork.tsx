import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import type { LearnerProfile } from "./MentorTypes";
import "./MentorStatementOfWork.css";

export type WorkplaceModuleSummary = {
  moduleId: string;
  description: string;
  hours: number;
  outcome: "Competent" | "Not Yet Competent";
};

type Props = {
  learner: LearnerProfile;
};

export default function MentorStatementOfWork({ learner }: Props) {
  const navigate = useNavigate();

  const modules = useMemo<WorkplaceModuleSummary[]>(
    () => [
      {
        moduleId: "WM-01",
        description: "Install electrical wireway systems",
        hours: 200,
        outcome: "Competent",
      },
      {
        moduleId: "WM-02",
        description: "Install and connect electrical systems",
        hours: 450,
        outcome: "Competent",
      },
      {
        moduleId: "WM-03",
        description: "Maintain electrical systems and equipment",
        hours: 300,
        outcome: "Competent",
      },
      {
        moduleId: "WM-04",
        description: "Fault finding in electrical systems",
        hours: 250,
        outcome: "Competent",
      },
    ],
    [],
  );

  const totalHours = modules.reduce((sum, m) => sum + m.hours, 0);

  return (
    <div className="sow-page">
      <div className="sow-document-wrapper">
        <svg
          className="sow-watermark"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
        >
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <path d="m9 12 2 2 4-4" />
        </svg>

        <div className="sow-content-layer">
          <header className="sow-header">
            <div className="sow-header-title">
              <h1>Statement of Work Experience</h1>
              <p className="sow-header-subtitle">
                OFFICIAL QCTO COMPLIANCE DOCUMENT
              </p>
            </div>
            <div className="sow-header-ref">
              <p className="sow-label-small">Document Reference</p>
              <p className="sow-ref-number">SOWE-2024-08812</p>
            </div>
          </header>

          <div className="sow-details-grid">
            <div>
              <h3 className="sow-section-heading">Learner Information</h3>
              <p className="sow-learner-name">{learner.learner_name}</p>
              <p className="sow-learner-sub">
                Identity No: <strong>950101 5555 081</strong>
              </p>
            </div>
            <div>
              <h3 className="sow-section-heading">Qualification Framework</h3>
              <p className="sow-qual-title">
                National Occupational Certificate: Electrician
              </p>
              <p className="sow-qual-sub">SAQA ID: 91761 | NQF Level 4</p>
            </div>
          </div>

          <div className="sow-host-block">
            <div>
              <h3 className="sow-label-small sow-host-label">Workplace Host Authority</h3>
              <p className="sow-host-name">Volt-Tech Solutions (Pty) Ltd</p>
              <p className="sow-host-sub">SETA Approval No: WPA-2023-ELC-0092</p>
            </div>
            <div className="sow-host-right">
              <p className="sow-label-small sow-host-label">Verification Site</p>
              <p className="sow-host-site">Sandton, South Africa</p>
            </div>
          </div>

          <div className="sow-evidence-section">
            <h3 className="sow-section-heading sow-evidence-heading">
              Module Completion Summary
            </h3>
            <table className="sow-evidence-table">
              <thead>
                <tr>
                  <th>Module ID</th>
                  <th>Workplace Module Description</th>
                  <th style={{ textAlign: "center" }}>Hours</th>
                  <th style={{ textAlign: "right" }}>Outcome</th>
                </tr>
              </thead>
              <tbody>
                {modules.map((m) => (
                  <tr
                    key={m.moduleId}
                    className="sow-module-row"
                    onClick={() =>
                      navigate(
                        `/mentor/learners/${encodeURIComponent(learner.user_id)}/modules/${encodeURIComponent(m.moduleId)}`,
                      )
                    }
                  >
                    <td className="sow-mod-id">{m.moduleId}</td>
                    <td>{m.description}</td>
                    <td style={{ textAlign: "center" }}>{m.hours}</td>
                    <td style={{ textAlign: "right" }}>
                      <span className="sow-status-badge">{m.outcome}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="sow-table-footer">
                <tr>
                  <td colSpan={2}>Total Notional Hours Logged</td>
                  <td className="sow-total-hours">{totalHours}</td>
                  <td style={{ textAlign: "right" }} className="sow-label-small">
                    Verified Total
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="sow-signature-grid">
            <div className="sow-sig-line">
              <p className="sow-label-small sow-sig-label">
                Workplace Mentor Confirmation
              </p>
              <div className="sow-sig-space" />
              <p className="sow-sig-info">
                Sarah Jenkins (Licensed Master Electrician)
              </p>
              <p className="sow-sig-sub">Digitally Verified Stamp &amp; Signature</p>
            </div>

            <div className="sow-sig-line">
              <p className="sow-label-small sow-sig-label">
                Quality Assurance (Company Rep)
              </p>
              <div className="sow-qr-area">
                <div>
                  <p className="sow-sig-info">QA Approval Officer</p>
                  <p className="sow-sig-sub">Date Issued: 2024-03-15</p>
                </div>
                <svg
                  width="48"
                  height="48"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#1e293b"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect width="5" height="5" x="3" y="3" rx="1" />
                  <rect width="5" height="5" x="16" y="3" rx="1" />
                  <rect width="5" height="5" x="3" y="16" rx="1" />
                  <path d="M21 16h-3a2 2 0 0 0-2 2v3" />
                  <path d="M21 21v.01" />
                  <path d="M12 7v3a2 2 0 0 1-2 2H7" />
                  <path d="M3 12h.01" />
                  <path d="M12 3h.01" />
                  <path d="M12 16v.01" />
                  <path d="M16 12h1" />
                  <path d="M21 12v.01" />
                  <path d="M12 21v-1" />
                </svg>
              </div>
            </div>
          </div>

          <footer className="sow-footer">
            <p className="sow-footer-text">
              This document confirms the completion of the workplace-based learning component.
              <br />
              It must be presented to a registered assessment centre for EISA registration.
            </p>
          </footer>
        </div>
      </div>

      <div className="sow-action-bar">
        <button className="sow-btn sow-btn-secondary" onClick={() => window.print()}>
          Print Draft
        </button>
        <button className="sow-btn sow-btn-primary" type="button">
          Finalize &amp; Issue PDF
        </button>
      </div>
    </div>
  );
}
