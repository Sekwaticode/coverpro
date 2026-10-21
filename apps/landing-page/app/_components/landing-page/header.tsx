"use client";

import { usePathname } from "next/navigation";

import HeroHeader from "@/components/ui/hero-01-utils/header";
import { siteNavigation } from "@/components/ui/hero-01-utils/navigation";

/** Site header for inner pages: the hero header with the current page marked active. */
export function Header() {
  const pathname = usePathname();

  return (
    <HeroHeader
      navigationData={siteNavigation.map((item) => ({
        ...item,
        isActive: !item.href.includes("#") && item.href === pathname,
      }))}
    />
  );
}
