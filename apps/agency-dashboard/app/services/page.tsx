import type { Metadata } from "next";
import { Suspense } from "react";
import { AgencyShell } from "../_components/dashboard/agency-shell";
import { ServicesManager } from "../_components/services/services-manager";

export const metadata: Metadata = {
  title: "Company Services | CoverPro",
  description: "Manage the services clients can request.",
};

export default function Page() {
  return (
    <Suspense>
      <AgencyShell>
        <ServicesManager scope="agency" />
      </AgencyShell>
    </Suspense>
  );
}
