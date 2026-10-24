import { Briefcase, UserPlus, Wallet } from "lucide-react";

import type { DropdownNavItem } from "@/components/ui/dropdown-navigation";
import { serviceGroups, talentSearchHref } from "@/lib/service-categories";

type SubMenus = NonNullable<DropdownNavItem["subMenus"]>;

/**
 * Dropdown contents, keyed by the top-level link in `siteNavigation`.
 * Kept apart from navigation.ts because icons can't be passed from
 * server to client components; only the client header imports this.
 */
export const navSubMenus: Record<string, SubMenus> = {
  "/talents": serviceGroups.map((group) => ({
    title: group.title,
    items: group.items.map((item) => ({ ...item, link: talentSearchHref(item.label) })),
  })),
  "/works": [
    {
      title: "Work on CoverPro",
      items: [
        {
          label: "Find work",
          description: "Browse gigs from clients",
          icon: Briefcase,
          link: "/works",
        },
        {
          label: "Join as a pro",
          description: "Create your pro profile",
          icon: UserPlus,
          link: "/signup?role=freelancer",
        },
        {
          label: "Getting paid",
          description: "Milestones funded upfront in escrow",
          icon: Wallet,
          link: "/#how-it-works",
        },
      ],
    },
  ],
};
