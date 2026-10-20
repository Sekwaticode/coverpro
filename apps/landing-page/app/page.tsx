import HeroOne from "@/components/ui/hero-01";
import { AgenciesSection } from "./_components/landing-page/agencies-section";
import { FeaturedProsSection } from "./_components/landing-page/featured-pros-section";
import { Footer } from "./_components/landing-page/footer";
import { GetStartedSection } from "./_components/landing-page/get-started-section";
import { HowItWorksSection } from "./_components/landing-page/how-it-works-section";
import { LandingPageShell } from "./_components/landing-page/landing-page-shell";
import { ProvincesSection } from "./_components/landing-page/provinces-section";
import { ServicesSection } from "./_components/landing-page/services-section";

export default function HomePage() {
  return (
    <LandingPageShell>
      <div id="top">
        <HeroOne>
          <ServicesSection />
          <FeaturedProsSection />
          <HowItWorksSection />
          <ProvincesSection />
          <AgenciesSection />
          <GetStartedSection />
        </HeroOne>
      </div>
      <Footer />
    </LandingPageShell>
  );
}
