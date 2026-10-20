import type { Metadata } from "next";
import { AgencyHeader } from "../_components/dashboard/agency-header";
import { AgencyProfileView } from "../_components/profile/agency-profile-view";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Company Profile | CoverPro",
  description:
    "Preview your company's public profile, specialists, work, and client reviews.",
};

export default function AgencyProfilePage() {
  return (
    <Suspense>
      <div className="min-h-svh bg-[#faf3ee] text-[#272624]">
        <AgencyHeader />
        <main className="mx-auto max-w-360 px-5 py-8 sm:px-8 lg:py-10">
          <AgencyProfileView />
        </main>
      </div>
    </Suspense>
  );
}
