import { Metadata } from "next";
import { Suspense } from "react";
import JobDetails from "./job-details";

export const metadata: Metadata = {
  title: "Job details | CoverPro",
  description: "Review the project scope, skills, and milestones.",
};

export default async function JobDetailsPage() {
  return (
    <Suspense>
      <JobDetails />
    </Suspense>
  );
}
