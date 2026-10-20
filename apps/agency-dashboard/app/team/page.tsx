import type { Metadata } from "next";
import { TeamDashboard } from "./team-dashboard";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Company Team | CoverPro",
  description:
    "Manage company membership, pro profiles, roles, and account permissions.",
};

export default function AgencyTeamPage() {
  return (
    <Suspense>
      <TeamDashboard />
    </Suspense>
  );
}
