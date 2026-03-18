import React from "react";
import { useParams } from "react-router-dom";
import MentorModuleAssessment from "./MentorModuleAssessment";

export default function LearnerModuleAssessment() {
  const params = useParams();
  const moduleId = params.moduleId ?? "WM-01";

  return (
    <MentorModuleAssessment
      key={moduleId}
      backToLearnersPath="/learner/statement-of-work"
      backToSowPath="/learner/statement-of-work"
    />
  );
}
