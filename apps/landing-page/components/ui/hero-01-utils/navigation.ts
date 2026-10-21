// Plain module (not "use client") so server components can import the data.
export type NavigationSection = {
  title: string;
  href: string;
  isActive?: boolean;
};

export const siteNavigation: NavigationSection[] = [
  { title: "Home", href: "/" },
  { title: "Browse services", href: "/talents" },
  { title: "How escrow works", href: "/#how-it-works" },
  { title: "For pros", href: "/works" },
  { title: "Companies", href: "/agencies" },
];
