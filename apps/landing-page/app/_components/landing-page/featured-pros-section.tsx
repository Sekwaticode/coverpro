import { ArrowRight, MapPin, ShieldCheck, Star } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

import { SectionHeading } from "./section-heading";

const pros = [
  {
    name: "Mokoena Kitchens & Joinery",
    trade: "Kitchen renovations",
    province: "Gauteng",
    rate: "From R450/hr",
    rating: "4.9",
    jobs: 86,
    image: "photo-1556911220-bff31c812dba",
  },
  {
    name: "Naidoo Tiling & Bathrooms",
    trade: "Bathroom remodels & tiling",
    province: "KwaZulu-Natal",
    rate: "From R380/hr",
    rating: "5.0",
    jobs: 64,
    image: "photo-1552321554-5fefe8c9ef14",
  },
  {
    name: "Van Wyk Building Co.",
    trade: "New builds & extensions",
    province: "Western Cape",
    rate: "From R520/hr",
    rating: "4.8",
    jobs: 112,
    image: "photo-1600566753190-17f0baa2a6c3",
  },
];

export function FeaturedProsSection() {
  return (
    <section id="pros" className="border-y border-border bg-secondary py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
        <SectionHeading
          icon={Star}
          eyebrow="Featured pros"
          title="Top-rated pros, taking on work this week."
          description="Verified contractors with real reviews from homeowners near you."
          action={
            <Button asChild variant="outline" className="self-start rounded-full font-semibold sm:self-auto">
              <Link href="/talents">
                Browse all
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          }
        />

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {pros.map((pro) => (
            <article
              key={pro.name}
              className="overflow-hidden rounded-3xl border border-border bg-background shadow-xl shadow-black/5 transition hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/10"
            >
              <div className="relative">
                <img
                  src={`https://images.unsplash.com/${pro.image}?auto=format&fit=crop&w=800&q=80`}
                  alt={pro.trade}
                  className="h-64 w-full object-cover"
                />
                <span className="absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-background/95 px-3 py-1.5 text-xs font-semibold text-foreground shadow-sm">
                  <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                  Verified
                </span>
              </div>
              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-foreground">{pro.name}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{pro.trade}</p>
                  </div>
                  <span className="flex shrink-0 items-center gap-1 text-sm font-semibold">
                    <Star className="h-4 w-4 fill-[#f2a33a] text-[#f2a33a]" />
                    {pro.rating}
                  </span>
                </div>
                <div className="mt-5 flex items-center justify-between border-t border-border pt-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {pro.province}
                  </span>
                  <span>{pro.jobs} jobs</span>
                  <span className="font-semibold text-foreground">{pro.rate}</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
