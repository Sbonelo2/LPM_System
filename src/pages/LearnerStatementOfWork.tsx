import React, { useMemo } from "react";
import { useAuth } from "../hooks/useAuth";
import MentorStatementOfWork from "./MentorStatementOfWork";

export default function LearnerStatementOfWork() {
  const { user } = useAuth();

  const learner = useMemo(
    () => ({
      user_id: user?.id ?? "self",
      learner_name: user?.email ?? "Learner",
      email: user?.email ?? "",
      programme: "",
    }),
    [user?.email, user?.id],
  );

  return (
    <MentorStatementOfWork
      learner={learner}
      buildModuleLink={(moduleId) =>
        `/learner/modules/${encodeURIComponent(moduleId)}`
      }
    />
  );
}
