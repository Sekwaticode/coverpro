import { Icon } from "@iconify/react";
import Link from "next/link";

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
    <section id="pros" className="bg-[#f7f4ef] py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <h2 className="text-4xl font-bold tracking-tight sm:text-5xl">
              Featured pros
            </h2>
            <p className="mt-3 text-sm text-[#6b6560] sm:text-base">
              Top-rated, verified contractors taking on projects this week.
            </p>
          </div>
          <Link
            href="/talents"
            className="text-sm font-semibold text-[#ee6c2b] hover:text-[#d95a1c]"
          >
            Browse all →
          </Link>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {pros.map((pro) => (
            <article
              key={pro.name}
              className="overflow-hidden rounded-3xl bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl hover:shadow-black/6"
            >
              <div className="relative">
                <img
                  src={`https://images.unsplash.com/${pro.image}?auto=format&fit=crop&w=800&q=80`}
                  alt={pro.trade}
                  className="h-64 w-full object-cover"
                />
                <span className="absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-xs font-semibold text-[#1d1b19] shadow-sm">
                  <Icon
                    icon="solar:shield-check-linear"
                    width="14"
                    className="text-[#ee6c2b]"
                  />
                  Verified
                </span>
              </div>
              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-[#1d1b19]">{pro.name}</h3>
                    <p className="mt-1 text-sm text-[#6b6560]">{pro.trade}</p>
                  </div>
                  <span className="flex shrink-0 items-center gap-1 text-sm font-semibold">
                    <Icon
                      icon="solar:star-bold"
                      width="15"
                      className="text-[#f2a33a]"
                    />
                    {pro.rating}
                  </span>
                </div>
                <div className="mt-5 flex items-center justify-between border-t border-black/6 pt-4 text-xs text-[#6b6560]">
                  <span className="flex items-center gap-1">
                    <Icon icon="solar:map-point-linear" width="15" />
                    {pro.province}
                  </span>
                  <span>{pro.jobs} jobs</span>
                  <span className="font-semibold text-[#1d1b19]">
                    {pro.rate}
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
