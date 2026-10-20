import { Header } from "../_components/landing-page/header";
import { WorksDirectory } from "./works-directory";

export default function WorksPage() {
  return (
    <div className="min-h-svh bg-[#fbf7f4] font-(family-name:--font-dm-sans) text-[#23211f]">
      <Header />
      <WorksDirectory />
    </div>
  );
}
