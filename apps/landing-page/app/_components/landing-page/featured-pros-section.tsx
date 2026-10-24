import { ArrowRight, MapPin, ShieldCheck, Star } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

import { SectionHeading } from "./section-heading";

const pros = [
  {
    name: "Thandi Mokoena Photography",
    trade: "Wedding & event photography",
    province: "Gauteng",
    rate: "From R850/hr",
    rating: "4.9",
    jobs: 86,
    image: "photo-1519741497674-611481863552",
  },
  {
    name: "Ayesha Naidoo Beauty",
    trade: "Bridal & editorial makeup",
    province: "KwaZulu-Natal",
    rate: "From R600/hr",
    rating: "5.0",
    jobs: 64,
    image: "photo-1487412947147-5cebf100ffc2",
  },
  {
    name: "Pieter van Wyk",
    trade: "Web developer · Next.js & Shopify",
    province: "Western Cape",
    rate: "From R520/hr",
    rating: "4.8",
    jobs: 112,
    image: "photo-1498050108023-c5249f4df085",
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
          description="Verified freelancers and service pros with real reviews from clients."
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
