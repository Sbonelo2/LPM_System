import React, { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./MentorModuleAssessment.css";

type EvidenceItem = {
  title: string;
  fileName: string;
};

type ModuleSpec = {
  moduleId: string;
  title: string;
  description: string;
  credits: number;
  hoursLogged: string;
  submissionDate: string;
  evidence: EvidenceItem[];
};

type Props = {
  backToLearnersPath?: string;
  backToSowPath?: string;
};

const MentorModuleAssessment: React.FC<Props> = ({
  backToLearnersPath,
  backToSowPath,
}) => {
  const navigate = useNavigate();
  const params = useParams();

  const learnerId = params.learnerId ?? "";
  const moduleId = params.moduleId ?? "WM-01";

  const resolvedBackToLearnersPath = backToLearnersPath ?? "/mentor/learners";
  const resolvedBackToSowPath =
    backToSowPath ?? `/mentor/learners/${encodeURIComponent(learnerId)}`;

  const moduleSpec = useMemo<ModuleSpec>(() => {
    const map: Record<string, ModuleSpec> = {
      "WM-01": {
        moduleId: "WM-01",
        title: "Install electrical wireway systems",
        description:
          "Learner must demonstrate ability to select, measure, and install various wireway systems including conduits, trunking, and tray systems according to site diagrams and SANS 10142 standards.",
        credits: 20,
        hoursLogged: "200 / 200",
        submissionDate: "12 Oct 2024",
        evidence: [
          { title: "Photo: Conduit Bend", fileName: "IMG_9912.JPG" },
          { title: "Site Diagram", fileName: "Annotated_Plan.PDF" },
          { title: "Video: Trunking", fileName: "VID_2024.MP4" },
        ],
      },
    };

    return (
      map[moduleId] ?? {
        moduleId,
        title: "Workplace Module",
        description:
          "Module specification is not available in the fake dataset yet.",
        credits: 0,
        hoursLogged: "0 / 0",
        submissionDate: "",
        evidence: [],
      }
    );
  }, [moduleId]);

  const [outcome, setOutcome] = useState<"C" | "NYC">("C");

  return (
    <div className="mma-page">
      <div className="mma-container">
        <header className="mma-header">
          <div>
            <p className="mma-breadcrumb">Workplace Placements / Learner</p>
            <h1>Module Assessment: {moduleSpec.moduleId}</h1>
          </div>
          <div className="mma-status-pill">Awaiting Mentor Review</div>
        </header>

        <div className="mma-main-grid">
          <div className="mma-content">
            <div className="mma-card">
              <div className="mma-card-title">Module Specification</div>
              <p className="mma-module-title">{moduleSpec.title}</p>
              <p className="mma-module-desc">{moduleSpec.description}</p>
            </div>

            <div className="mma-card">
              <div className="mma-card-title">
                Learner Evidence ({moduleSpec.evidence.length} Files Uploaded)
              </div>
              <div className="mma-evidence-grid">
                {moduleSpec.evidence.map((e, idx) => (
                  <div className="mma-evidence-item" key={idx}>
                    <div className="mma-evidence-placeholder">
                      <b>{e.title}</b>
                      <br />
                      <span className="mma-evidence-file">{e.fileName}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mma-card">
              <div className="mma-card-title">
                Mentor Feedback &amp; Outcome
              </div>

              <div className="mma-form-group">
                <label>Observation Comments / Technical Feedback</label>
                <textarea placeholder="Provide specific feedback on the learner's performance, technical accuracy, and adherence to safety standards..." />
              </div>

              <div className="mma-form-group">
                <label>Module Assessment Outcome</label>
                <div className="mma-grading-options">
                  <button
                    type="button"
                    className={
                      "mma-grade-btn" + (outcome === "C" ? " active-c" : "")
                    }
                    onClick={() => setOutcome("C")}
                  >
                    <b>C</b>
                    <span>Competent</span>
                  </button>
                  <button
                    type="button"
                    className={
                      "mma-grade-btn" + (outcome === "NYC" ? " active-nyc" : "")
                    }
                    onClick={() => setOutcome("NYC")}
                  >
                    <b>NYC</b>
                    <span>Not Yet Competent</span>
                  </button>
                </div>
              </div>

              <button className="mma-btn-submit" type="button">
                Sign-off &amp; Submit Assessment
              </button>
              <p className="mma-submit-note">
                By submitting, you are digitally signing that you have
                personally observed the learner's competence in this module.
              </p>
            </div>

            <div className="mma-back-row">
              <button
                type="button"
                className="mma-back-btn"
                onClick={() =>
                  navigate(resolvedBackToLearnersPath, { replace: false })
                }
              >
                Back to learners
              </button>
              <button
                type="button"
                className="mma-back-btn"
                onClick={() =>
                  navigate(resolvedBackToSowPath, { replace: false })
                }
              >
                Back to statement of work
              </button>
            </div>
          </div>

          <aside className="mma-sidebar">
            <div className="mma-card">
              <div className="mma-card-title">Context</div>
              <div className="mma-info-row">
                <span className="mma-info-label">Learner</span>
                <span className="mma-info-value">Learner</span>
              </div>
              <div className="mma-info-row">
                <span className="mma-info-label">Credits</span>
                <span className="mma-info-value">
                  {moduleSpec.credits} Credits
                </span>
              </div>
              <div className="mma-info-row">
                <span className="mma-info-label">Logged Hours</span>
                <span className="mma-info-value">{moduleSpec.hoursLogged}</span>
              </div>
              <div className="mma-info-row">
                <span className="mma-info-label">Submission Date</span>
                <span className="mma-info-value">
                  {moduleSpec.submissionDate}
                </span>
              </div>
            </div>

            <div className="mma-card">
              <div className="mma-card-title">Criteria Checklist</div>
              <div className="mma-checklist-item">
                <input type="checkbox" defaultChecked />
                <span>Correct selection of materials per job card.</span>
              </div>
              <div className="mma-checklist-item">
                <input type="checkbox" defaultChecked />
                <span>
                  Installation levels and verticality are within tolerance.
                </span>
              </div>
              <div className="mma-checklist-item">
                <input type="checkbox" />
                <span>Cleanliness of workspace post-installation.</span>
              </div>
              <div className="mma-checklist-item">
                <input type="checkbox" defaultChecked />
                <span>Correct use of PPE during installation.</span>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default MentorModuleAssessment;
