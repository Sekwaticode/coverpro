import type { Metadata } from "next";
import { ProfileEditor } from "../../my-profile/profile-editor";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Set Up Pro Profile | CoverPro",
  description:
    "Set up your pro profile, professional information, skills, and portfolio.",
};

export default function EditFreelancerProfilePage() {
  return (
    <Suspense>
      <ProfileEditor initialEditing />
    </Suspense>
  );
}
