import type { Metadata } from "next";
import { Suspense } from "react";
import { ClientShell } from "../_components/dashboard/client-shell";
import { ClientBookings } from "../_components/services/client-bookings";

export const metadata: Metadata = {
  title: "My Bookings",
  description: "Services you've requested from pros.",
};

export default function BookingsPage() {
  return (
    <Suspense>
      <ClientShell>
        <ClientBookings />
      </ClientShell>
    </Suspense>
  );
}
