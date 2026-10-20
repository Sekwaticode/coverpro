import type { Metadata } from "next";
import { ProposalsDashboard } from "./proposals-dashboard";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Company Proposals | CoverPro",
  description: "Track proposals submitted by your company.",
};

export default function AgencyProposalsPage() {
  return (
    <Suspense>
      <ProposalsDashboard />
    </Suspense>
  );
}
