export const agencyHeaderNavigation = [
  { href: "/", label: "Find jobs" },
  { href: "/services", label: "Services" },
  { href: "/bookings", label: "Bookings" },
  { href: "/proposals", label: "Proposals" },
  { href: "/contracts", label: "Contracts" },
  { href: "/team", label: "Team" },
] as const;

export const agencyNavigation = [
  { href: "/", label: "Find jobs", icon: "home" },
  { href: "/services", label: "Services", icon: "shop" },
  { href: "/bookings", label: "Bookings", icon: "calendar" },
  { href: "/payout-details", label: "Payouts", icon: "money" },
  { href: "/proposals", label: "Proposals", icon: "proposal" },
  { href: "/contracts", label: "Contracts", icon: "contract" },
  { href: "/team", label: "Team", icon: "team" },
  { href: "/messages", label: "Messages", icon: "message" },
  { href: "/finances", label: "Finances", icon: "wallet" },
  { href: "/settings?section=overview", label: "Settings", icon: "settings" },
] as const;
