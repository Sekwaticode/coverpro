import type { Metadata } from "next";
import { Suspense } from "react";
import { DashboardHeader } from "../_components/dashboard/dashboard-header";
import { WorkspaceSidebar } from "../_components/dashboard/workspace-sidebar";
import { PayoutDetailsForm } from "../_components/services/payout-details-form";

export const metadata: Metadata = {
  title: "Payout Details | CoverPro",
  description: "Where escrow pays you for completed milestones.",
};

export default function Page() {
  return (
    <Suspense>
      <div className="min-h-svh bg-[#faf3ee] font-(family-name:--font-dm-sans) text-[#272624]">
        <DashboardHeader />
        <main className="mx-auto max-w-360 px-5 py-8 sm:px-8 lg:py-10">
          <div className="grid items-start gap-6 xl:grid-cols-[240px_minmax(0,1fr)]">
            <WorkspaceSidebar />
            <div className="min-w-0">
              <PayoutDetailsForm />
            </div>
          </div>
        </main>
      </div>
    </Suspense>
  );
}
