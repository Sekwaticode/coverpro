import type { Metadata } from "next";
import { Suspense } from "react";
import { ContractsDashboard } from "./contracts-dashboard";

export const metadata: Metadata = {
  title: "Company Contracts | CoverPro",
  description:
    "Manage company contracts, milestones, client approvals, and work submissions.",
};

export default function AgencyContractsPage() {
  return (
    <Suspense>
      <ContractsDashboard />
    </Suspense>
  );
}
