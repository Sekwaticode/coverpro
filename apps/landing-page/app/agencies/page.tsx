import { Header } from "../_components/landing-page/header";
import { AgenciesDirectory } from "./agencies-directory";

export default function AgenciesPage() {
  return (
    <div className="min-h-svh bg-[#fbf7f4] font-(family-name:--font-dm-sans) text-[#23211f]">
      <Header />
      <AgenciesDirectory />
    </div>
  );
}
