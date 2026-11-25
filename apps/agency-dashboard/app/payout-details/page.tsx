import type { Metadata } from "next";
import { Suspense } from "react";
import { AgencyShell } from "../_components/dashboard/agency-shell";
import { PayoutDetailsForm } from "../_components/services/payout-details-form";

export const metadata: Metadata = {
  title: "Company Payout Details | CoverPro",
  description: "Where escrow pays your company for completed milestones.",
};

export default function Page() {
  return (
    <Suspense>
      <AgencyShell>
        <PayoutDetailsForm scope="agency" />
      </AgencyShell>
    </Suspense>
  );
}
