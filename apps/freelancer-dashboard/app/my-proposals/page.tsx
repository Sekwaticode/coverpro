import type { Metadata } from "next";
import { ProposalsDashboard } from "./proposals-dashboard";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "My Proposals | CoverPro",
  description: "Track and manage your trade proposals.",
};

export default function MyProposalsPage() {
  return (
    <Suspense>
      <ProposalsDashboard />
    </Suspense>
  );
}
