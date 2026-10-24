import { ArrowRight, ArrowUpRight, LayoutGrid } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { serviceCategories, talentSearchHref } from "@/lib/service-categories";

import { SectionHeading } from "./section-heading";

export function ServicesSection() {
  return (
    <section id="services" className="bg-background py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
        <SectionHeading
          icon={LayoutGrid}
          eyebrow="Browse by category"
          title="Talent for every kind of gig."
          description="Developers, creators, photographers, singers, makeup and tattoo artists, renovation experts, tutors and coaches."
          action={
            <Button asChild variant="outline" className="self-start rounded-full font-semibold sm:self-auto">
              <Link href="/talents">
                All services
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          }
        />

        <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
          {serviceCategories.map(({ label, icon: Icon }) => (
            <Link
              key={label}
              href={talentSearchHref(label)}
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
