import { Suspense } from "react";
import { TalentsDirectory } from "./talents-directory";
import { Header } from "../_components/landing-page/header";

export default function TalentsPage() {
  return (
    <div className="min-h-svh bg-[#fbf7f4] font-(family-name:--font-dm-sans) text-[#23211f]">
     <Header />

      <Suspense>
        <TalentsDirectory />
      </Suspense>
    </div>
  );
}
