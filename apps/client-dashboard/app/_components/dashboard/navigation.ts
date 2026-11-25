export const clientHeaderNavigation = [
  { href: "/", label: "Overview" },
  { href: "/talent", label: "Find pros" },
  { href: "/bookings", label: "Bookings" },
  { href: "/jobs", label: "Job posts" },
  { href: "/proposals", label: "Proposals" },
  { href: "/contracts", label: "Contracts" },
] as const;

export const clientSidebarNavigation = [
  { href: "/", label: "Home", icon: "solar:home-2-linear" },
  { href: "/talent", label: "Find pros", icon: "solar:magnifer-linear" },
  { href: "/bookings", label: "Bookings", icon: "solar:calendar-linear" },
  { href: "/jobs", label: "Job posts", icon: "solar:document-add-linear" },
  { href: "/proposals", label: "Proposals", icon: "solar:users-group-rounded-linear" },
  { href: "/contracts", label: "Contracts", icon: "solar:case-round-linear" },
  { href: "/messages", label: "Messages", icon: "solar:chat-round-dots-linear" },
  {
    href: "/settings?section=overview",
    label: "Settings",
    icon: "solar:settings-linear",
  },
] as const;
