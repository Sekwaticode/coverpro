import type { Metadata } from "next";
import { Suspense } from "react";
import { JobInvitationsDashboard } from "./job-invitations-dashboard";

export const metadata: Metadata = {
  title: "Job Invitations | CoverPro",
  description: "Jobs clients have invited you to apply to.",
};

export default function JobInvitationsPage() {
  return (
    <Suspense>
      <JobInvitationsDashboard />
    </Suspense>
  );
}
