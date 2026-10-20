import type { Metadata } from "next";
import { Suspense } from "react";
import { AgencyInvitationsDashboard } from "./agency-invitations-dashboard";

export const metadata: Metadata = {
  title: "Company Invitations | CoverPro",
  description: "Review and respond to invitations to join a company team.",
};

export default function AgencyInvitationsPage() {
  return (
    <Suspense>
      <AgencyInvitationsDashboard />
    </Suspense>
  );
}
