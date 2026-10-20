import type { Metadata } from "next";
import { ClientHeader } from "../_components/dashboard/client-header";
import { ClientProfile } from "../_components/profile/client-profile";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Client Profile",
  description: "Preview and edit your public client and company profile.",
};

export default function ClientProfilePage() {
  return (
    <Suspense>
      <div className="min-h-svh bg-[#faf3ee] text-[#272624]">
        <ClientHeader />
        <main className="mx-auto max-w-360 px-5 py-8 sm:px-8 lg:py-10">
          <ClientProfile />
        </main>
      </div>
    </Suspense>
  );
}
