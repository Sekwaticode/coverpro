import { Hammer } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import ArrowLink from "@/components/ui/hero-01-utils/arrow-link";
import GridBackground from "@/components/ui/hero-01-utils/grid-background";

import { Eyebrow } from "./section-heading";

export function GetStartedSection() {
  return (
    <section id="get-started" className="bg-background py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
        <div className="relative isolate overflow-hidden rounded-3xl border border-border px-6 py-14 text-center shadow-xl shadow-black/5 sm:px-12 sm:py-20">
          <GridBackground />
          <div className="mx-auto max-w-2xl rounded-3xl bg-background/90 px-6 py-10 backdrop-blur-sm sm:px-10">
            <Eyebrow icon={Hammer}>Building or renovating?</Eyebrow>
            <h2 className="mt-6 text-3xl leading-[1.1] font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
              Get the job done right —{" "}
              <span className="text-primary">and paid for fairly.</span>
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-muted-foreground">
              Homeowners get verified pros and protected payments. Tradespeople
              and contractors get funded milestones and steady work close to home.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <ArrowLink href="/signup?role=client" size="lg">
                Hire a pro
              </ArrowLink>
              <Button asChild size="lg" variant="outline" className="h-14 rounded-full px-7 font-semibold">
                <Link href="/signup?role=freelancer">Join as a service provider</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
