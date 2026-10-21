import {
  Bath,
  CookingPot,
  Grid3x3,
  Hammer,
  HardHat,
  House,
  Layers,
  PaintRoller,
  PanelTop,
  Shovel,
  Wrench,
  Zap,
} from "lucide-react";
import type { ReactNode } from "react";

import HeroSection from "@/components/ui/hero-01-utils/hero";
import type { NavigationSection } from "@/components/ui/hero-01-utils/header";
import Header from "@/components/ui/hero-01-utils/header";
import { siteNavigation } from "@/components/ui/hero-01-utils/navigation";
import BrandSlider, {
  BrandList,
} from "@/components/ui/hero-01-utils/brand-slider";
import type { AvatarList } from "@/components/ui/hero-01-utils/hero";

import GridBackground from "@/components/ui/hero-01-utils/grid-background";

const avatar = (hash: string) => `https://cdn.21st.dev/assets/localized/${hash}.jpg`;

export default function AgencyHeroSection({
  children,
}: {
  /** Page sections rendered inside <main> after the hero. */
  children?: ReactNode;
}) {
  const avatarList: AvatarList[] = [
    { image: avatar("59a2b5a0dfc1531e2d1ea42d71ae8615f37582e1f8a17e4a1b1aff9afc7ef878") },
    { image: avatar("c7097eeb66ad097b6e5f9dbb95ae857cd6b55c0ad398c1ea84f3ab90a02c631e") },
    { image: avatar("c70d48e47d3a2d79ad07d16bff3aa3cff686580be031b6102cad73a15b47d8fd") },
    { image: avatar("51c9ed392f6e7fce7fd85a78648e3e06bfdcd91999ab5fa48485888231589abf") },
  ];

  const navigationData: NavigationSection[] = siteNavigation.map((item) => ({
    ...item,
    isActive: item.href === "/",
  }));

  const brandList: BrandList[] = [
    { name: "General Construction", icon: HardHat },
    { name: "Roofing", icon: House },
    { name: "Tiling", icon: Grid3x3 },
    { name: "Flooring", icon: Layers },
    { name: "Ceilings", icon: PanelTop },
    { name: "Plumbing", icon: Wrench },
    { name: "Electrical", icon: Zap },
    { name: "Painting", icon: PaintRoller },
    { name: "Kitchen Renovation", icon: CookingPot },
    { name: "Bathroom Remodel", icon: Bath },
    { name: "Carpentry", icon: Hammer },
    { name: "Paving & Landscaping", icon: Shovel },
  ];

  return (
    <div className="relative">
      <Header navigationData={navigationData} />
      <main>
        {/* Pulled up under the 80px floating header so the background runs behind it. */}
        <div className="relative isolate -mt-20 overflow-hidden pt-20">
          <GridBackground />
          <HeroSection avatarList={avatarList} />
          <BrandSlider brandList={brandList} />
        </div>
        {children}
      </main>
    </div>
  );
}
