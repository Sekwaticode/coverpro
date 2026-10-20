import type { Metadata } from "next";
import { SavedJobsDashboard } from "./saved-jobs-dashboard";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Saved Jobs | CoverPro",
  description: "Review and manage your saved trade opportunities.",
};

export default function SavedJobsPage() {
  return (
    <Suspense>
      <SavedJobsDashboard />
    </Suspense>
  );
}
