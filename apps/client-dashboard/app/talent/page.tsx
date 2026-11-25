import type { Metadata } from "next";
import { Suspense } from "react";
import { ClientShell } from "../_components/dashboard/client-shell";
import { BrowsePros } from "../_components/discovery/browse-pros";

export const metadata: Metadata = {
  title: "Find Pros",
  description: "Browse trusted pros and agencies on CoverPro.",
};

export default function TalentPage() {
  return (
    <Suspense>
      <ClientShell>
        <BrowsePros />
      </ClientShell>
    </Suspense>
  );
}
