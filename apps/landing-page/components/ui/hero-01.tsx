import {
  BadgeCheck,
  Bell,
  FileText,
  LayoutDashboard,
  LifeBuoy,
  ListChecks,
  MessageCircle,
  ShieldCheck,
  Star,
  Users,
  Wallet,
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
    { name: "Escrow payments", icon: ShieldCheck, href: "/#how-it-works" },
    { name: "Milestone tracking", icon: ListChecks, href: "/#how-it-works" },
    { name: "Built-in messaging", icon: MessageCircle, href: "/#features" },
    { name: "Verified pro profiles", icon: BadgeCheck, href: "/talents" },
    { name: "Client & pro dashboards", icon: LayoutDashboard, href: "/#features" },
    { name: "Quotes & proposals", icon: FileText, href: "/#how-it-works" },
    { name: "Reviews & ratings", icon: Star, href: "/talents" },
    { name: "Agency teams", icon: Users, href: "/agencies" },
    { name: "Real-time notifications", icon: Bell, href: "/#features" },
    { name: "Secure payouts", icon: Wallet, href: "/#how-it-works" },
    { name: "Dispute support", icon: LifeBuoy, href: "/#features" },
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
