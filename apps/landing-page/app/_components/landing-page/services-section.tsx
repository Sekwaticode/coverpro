import {
  ArrowRight,
  ArrowUpRight,
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
import Link from "next/link";

import { Button } from "@/components/ui/button";

import { SectionHeading } from "./section-heading";

const services = [
  { label: "General Construction", icon: HardHat },
  { label: "Roofing", icon: House },
  { label: "Tiling", icon: Grid3x3 },
  { label: "Flooring", icon: Layers },
  { label: "Ceilings & Drywall", icon: PanelTop },
  { label: "Plumbing", icon: Wrench },
  { label: "Electrical", icon: Zap },
  { label: "Painting", icon: PaintRoller },
  { label: "Kitchen Renovation", icon: CookingPot },
  { label: "Bathroom Remodel", icon: Bath },
  { label: "Carpentry", icon: Hammer },
  { label: "Paving & Landscaping", icon: Shovel },
];

export function ServicesSection() {
  return (
    <section id="services" className="bg-background py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
        <SectionHeading
          icon={HardHat}
          eyebrow="Browse by trade"
          title="Every trade your project needs."
          description="Builders, roofers, tilers, plumbers and more — ready to quote in your province."
          action={
            <Button asChild variant="outline" className="self-start rounded-full font-semibold sm:self-auto">
              <Link href="/talents">
                All services
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          }
        />

        <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {services.map(({ label, icon: Icon }) => (
            <Link
              key={label}
              href={`/talents?q=${encodeURIComponent(label)}`}
              className="group rounded-2xl border border-border bg-background p-4 transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-xl hover:shadow-black/5"
            >
              <div className="flex items-start justify-between">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-primary">
                  <Icon className="h-5 w-5" />
                </span>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 transition group-hover:opacity-100" />
              </div>
              <p className="mt-5 text-sm font-semibold text-foreground group-hover:text-primary">
                {label}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
