import type { Metadata } from "next";
import { Suspense } from "react";
import { AgencyShell } from "../_components/dashboard/agency-shell";
import { BookingsInbox } from "../_components/services/bookings-inbox";

export const metadata: Metadata = {
  title: "Company Booking Requests | CoverPro",
  description: "Respond to clients who want to book your services.",
};

export default function Page() {
  return (
    <Suspense>
      <AgencyShell>
        <BookingsInbox scope="agency" />
      </AgencyShell>
    </Suspense>
  );
}
