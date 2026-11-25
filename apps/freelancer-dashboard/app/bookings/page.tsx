import type { Metadata } from "next";
import { Suspense } from "react";
import { DashboardHeader } from "../_components/dashboard/dashboard-header";
import { WorkspaceSidebar } from "../_components/dashboard/workspace-sidebar";
import { BookingsInbox } from "../_components/services/bookings-inbox";

export const metadata: Metadata = {
  title: "Booking Requests | CoverPro",
  description: "Respond to clients who want to book your services.",
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
              <BookingsInbox />
            </div>
          </div>
        </main>
      </div>
    </Suspense>
  );
}
