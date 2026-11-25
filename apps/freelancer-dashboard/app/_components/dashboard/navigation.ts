export const headerNavigation = [
  { href: "/", label: "Find jobs" },
  { href: "/services", label: "My services" },
  { href: "/bookings", label: "Bookings" },
  { href: "/my-proposals", label: "My proposals" },
  { href: "/contracts", label: "Contracts" },
] as const;

export const sidebarNavigation = [
  { href: "/", label: "Home", icon: "solar:home-2-linear" },
  { href: "/services", label: "My services", icon: "solar:shop-2-linear" },
  { href: "/bookings", label: "Bookings", icon: "solar:calendar-linear" },
  { href: "/payout-details", label: "Payouts", icon: "solar:wallet-money-linear" },
  {
    href: "/my-proposals",
    label: "My proposals",
    icon: "solar:document-text-linear",
  },
  {
    href: "/contracts",
    label: "Contracts",
    icon: "solar:case-round-linear",
  },
  {
    href: "/saved-jobs",
    label: "Saved jobs",
    icon: "solar:bookmark-linear",
  },
  {
    href: "/messages",
    label: "Messages",
    icon: "solar:chat-round-dots-linear",
  },
  {
    href: "/settings?section=overview",
    label: "Settings",
    icon: "solar:settings-linear",
  },
] as const;
