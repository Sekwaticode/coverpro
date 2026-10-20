import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@iconify/react";
import { AgencyHeader } from "../../_components/dashboard/agency-header";
import { ProfilePanel } from "../../_components/settings/settings-panels";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Set Up Company Profile | CoverPro",
  description:
    "Set up your company identity, positioning, specialties, and portfolio.",
};

export default function EditAgencyProfilePage() {
  return (
    <Suspense>
      <div className="min-h-svh bg-[#faf3ee] text-[#272624]">
        <AgencyHeader />
        <main className="mx-auto max-w-360 px-5 py-8 sm:px-8 lg:py-10">
          <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-semibold tracking-[0.14em] text-[#e66d31] uppercase">
                Company onboarding
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-[-0.045em] sm:text-4xl">
                Set up company profile
              </h1>
              <p className="mt-2 text-sm text-[#77736f]">
                Complete the information clients will see across the
                marketplace.
              </p>
            </div>
            <Link
              href="/profile"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-black/10 bg-white px-4 text-sm font-semibold"
            >
              Preview profile
              <Icon icon="solar:arrow-right-up-linear" width="18" />
            </Link>
          </div>
          <ProfilePanel />
        </main>
      </div>
    </Suspense>
  );
}
