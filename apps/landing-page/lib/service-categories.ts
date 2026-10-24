import {
  Brush,
  Camera,
  Clapperboard,
  Code,
  Dumbbell,
  GraduationCap,
  Hammer,
  HardHat,
  type LucideIcon,
  Megaphone,
  Mic,
  Music,
  PaintRoller,
  Palette,
  PartyPopper,
  PenTool,
  Presentation,
  Scissors,
  Sparkles,
  Video,
  Wrench,
} from "lucide-react";

export type ServiceCategory = {
  label: string;
  description: string;
  icon: LucideIcon;
};

export type ServiceGroup = {
  title: string;
  items: ServiceCategory[];
};

/** Categories shown in the navbar menu and the homepage grid. */
export const serviceGroups: ServiceGroup[] = [
  {
    title: "Digital & creative",
    items: [
      { label: "Web Development", description: "Sites, apps and online stores", icon: Code },
      { label: "Design & Branding", description: "Logos, UI and brand identity", icon: Palette },
      { label: "UGC Content", description: "Authentic videos for your brand", icon: Clapperboard },
      { label: "Influencers", description: "Reach audiences that trust them", icon: Megaphone },
    ],
  },
  {
    title: "Events & entertainment",
    items: [
      { label: "Photography", description: "Weddings, events and portraits", icon: Camera },
      { label: "Videography", description: "Films, reels and live coverage", icon: Video },
      { label: "Singers & Musicians", description: "Live music for any occasion", icon: Mic },
      { label: "Wedding & Event Planning", description: "Plan the day, end to end", icon: PartyPopper },
    ],
  },
  {
    title: "Beauty & body art",
    items: [
      { label: "Makeup Artists", description: "Bridal, editorial and events", icon: Brush },
      { label: "Tattoo Artists", description: "Custom pieces and cover-ups", icon: PenTool },
      { label: "Hair Stylists & Barbers", description: "Cuts, braids and styling", icon: Scissors },
      { label: "Nail Technicians", description: "Manicures, gels and nail art", icon: Sparkles },
    ],
  },
  {
    title: "Home & renovations",
    items: [
      { label: "Builders & Renovations", description: "Extensions, remodels and builds", icon: HardHat },
      { label: "Plumbing & Electrical", description: "Installs, repairs and compliance", icon: Wrench },
      { label: "Painting & Tiling", description: "Walls, floors and finishes", icon: PaintRoller },
      { label: "Handyman & Repairs", description: "Odd jobs and quick fixes", icon: Hammer },
    ],
  },
  {
    title: "Lessons & coaching",
    items: [
      { label: "Tutors", description: "School subjects and exam prep", icon: GraduationCap },
      { label: "Personal Trainers", description: "Fitness plans and sessions", icon: Dumbbell },
      { label: "Music Lessons", description: "Voice, piano, guitar and more", icon: Music },
      { label: "Business Coaching", description: "Strategy, careers and growth", icon: Presentation },
    ],
  },
];

export const serviceCategories = serviceGroups.flatMap((group) => group.items);

export const talentSearchHref = (label: string) =>
  `/talents?q=${encodeURIComponent(label)}`;
