import { Building2, CircleCheck } from "lucide-react";

import ArrowLink from "@/components/ui/hero-01-utils/arrow-link";

import { Eyebrow } from "./section-heading";

const perks = [
  "A public team profile with your portfolio",
  "Bring your whole team onto one account",
  "Take on bigger projects with milestone payments",
];

export function AgenciesSection() {
  return (
    <section id="companies" className="bg-secondary py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
        <div className="grid items-center gap-14 overflow-hidden rounded-3xl border border-border bg-background p-6 shadow-xl shadow-black/5 sm:p-10 lg:grid-cols-2 lg:gap-10 lg:p-14">
          <div>
            <Eyebrow icon={Building2}>CoverPro for agencies &amp; teams</Eyebrow>
            <h2 className="mt-6 max-w-lg text-3xl leading-[1.1] font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
              Run an agency, studio or crew?{" "}
              <span className="text-primary">Bring your whole team.</span>
            </h2>
            <p className="mt-5 max-w-md text-base leading-7 text-muted-foreground">
              Win more clients, show off your best work, and get paid on time —
              every milestone is funded before you start.
            </p>
            <ul className="mt-6 grid gap-3 text-sm text-foreground">
              {perks.map((perk) => (
                <li key={perk} className="flex items-center gap-2.5">
                  <CircleCheck className="h-4 w-4 shrink-0 text-primary" />
                  {perk}
                </li>
              ))}
            </ul>
            <ArrowLink href="/agencies" size="lg" className="mt-9">
              Explore companies
            </ArrowLink>
          </div>

          <div className="relative">
            <img
              src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1100&q=80"
              className="aspect-[4/3] w-full rounded-3xl object-cover shadow-2xl shadow-black/10"
              alt="A creative team working together at a shared table"
            />
            <div className="absolute right-4 -bottom-7 w-64 rounded-2xl border border-border bg-background p-4 shadow-xl shadow-black/8 sm:-right-4">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                  KS
                </span>
                <div>
                  <p className="text-sm font-semibold">Khumalo Studio</p>
                  <p className="text-xs text-muted-foreground">Design &amp; content · Mpumalanga</p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {["Branding", "Web design", "Video"].map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-accent px-2.5 py-1 text-xs font-medium text-accent-foreground"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
