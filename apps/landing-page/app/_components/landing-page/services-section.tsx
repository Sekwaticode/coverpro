import { Icon } from "@iconify/react";
import Link from "next/link";

const services = [
  { label: "General Construction", icon: "fluent-emoji-flat:building-construction" },
  { label: "Roofing", icon: "fluent-emoji-flat:house" },
  { label: "Tiling", icon: "fluent-emoji-flat:purple-square" },
  { label: "Flooring", icon: "fluent-emoji-flat:wood" },
  { label: "Ceilings & Drywall", icon: "fluent-emoji-flat:hammer" },
  { label: "Plumbing", icon: "fluent-emoji-flat:wrench" },
  { label: "Electrical", icon: "fluent-emoji-flat:high-voltage" },
  { label: "Painting", icon: "fluent-emoji-flat:artist-palette" },
  { label: "Kitchen Renovation", icon: "fluent-emoji-flat:cooking" },
  { label: "Bathroom Remodel", icon: "fluent-emoji-flat:bathtub" },
  { label: "Carpentry", icon: "fluent-emoji-flat:carpentry-saw" },
  { label: "Paving & Landscaping", icon: "fluent-emoji-flat:herb" },
];

export function ServicesSection() {
  return (
    <section id="services" className="bg-white py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Browse by trade
            </h2>
            <p className="mt-2 text-sm text-[#6b6560]">
              Builders, roofers, tilers, plumbers and more — ready to quote in
              your province.
            </p>
          </div>
          <Link
            href="/talents"
            className="text-sm font-semibold text-[#ee6c2b] hover:text-[#d95a1c]"
          >
            All services →
          </Link>
        </div>

        <div className="mt-9 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {services.map((service) => (
            <Link
              key={service.label}
              href={`/talents?q=${encodeURIComponent(service.label)}`}
              className="group rounded-2xl border border-black/8 bg-white p-4 transition hover:-translate-y-0.5 hover:border-[#ee6c2b]/40 hover:shadow-lg hover:shadow-black/5"
            >
              <Icon icon={service.icon} width="26" />
              <p className="mt-5 text-sm font-semibold text-[#1d1b19] group-hover:text-[#ee6c2b]">
                {service.label}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
