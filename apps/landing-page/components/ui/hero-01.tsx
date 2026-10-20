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
import BrandSlider, {
  BrandList,
} from "@/components/ui/hero-01-utils/brand-slider";
import type { AvatarList } from "@/components/ui/hero-01-utils/hero";

const unsplash = (id: string) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=120&h=120&q=80`;

export default function AgencyHeroSection({
  children,
}: {
  /** Page sections rendered inside <main> after the hero. */
  children?: ReactNode;
}) {
  const avatarList: AvatarList[] = [
    { image: unsplash("photo-1531123897727-8f129e1688ce") },
    { image: unsplash("photo-1500648767791-00dcc994a43e") },
    { image: unsplash("photo-1534751516642-a1af1ef26a56") },
    { image: unsplash("photo-1506794778202-cad84cf45f1d") },
  ];

  const navigationData: NavigationSection[] = [
    {
      title: "Home",
      href: "/",
      isActive: true,
    },
    {
      title: "Browse services",
      href: "/talents",
    },
    {
      title: "How escrow works",
      href: "/#how-it-works",
    },
    {
      title: "For pros",
      href: "/works",
    },
    {
      title: "Companies",
      href: "/agencies",
    },
  ];

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
        <HeroSection avatarList={avatarList} />
        <BrandSlider brandList={brandList} />
        {children}
      </main>
    </div>
  );
}
