import { Icon } from "@iconify/react";
import Link from "next/link";

const perks = [
  "A public company profile with your past projects",
  "Bring your whole crew onto one account",
  "Bid on bigger jobs with milestone payments",
];

export function AgenciesSection() {
  return (
    <section
      id="companies"
      className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-24 lg:px-10"
    >
      <div className="overflow-hidden rounded-3xl bg-[#1f1c1a]">
        <div className="grid lg:grid-cols-2">
          <div className="p-8 sm:p-12 lg:p-16">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium text-[#f6c9ad]">
              <Icon icon="solar:buildings-3-linear" width="15" />
              CoverPro for construction companies
            </span>
            <h2 className="mt-7 max-w-lg text-4xl font-bold tracking-tight text-white sm:text-5xl">
              Run a building company? Bring your whole team.
            </h2>
            <p className="mt-5 max-w-md text-sm leading-7 text-[#bdb5ae] sm:text-base">
              Win more work in your province, show off finished projects, and
              get paid on time — every milestone is funded before you start.
            </p>
            <ul className="mt-6 grid gap-3 text-sm text-[#e4ddd7]">
              {perks.map((perk) => (
                <li key={perk} className="flex items-center gap-2.5">
                  <Icon
                    icon="solar:check-circle-bold"
                    width="18"
                    className="shrink-0 text-[#ee6c2b]"
                  />
                  {perk}
                </li>
              ))}
            </ul>
            <Link
              href="/agencies"
              className="mt-9 inline-flex items-center gap-2 rounded-full bg-[#ee6c2b] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#d95a1c]"
            >
              Explore companies
              <Icon icon="solar:arrow-right-linear" width="18" />
            </Link>
          </div>

          <div className="relative min-h-80">
            <img
              src="https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=1100&q=80"
              className="absolute inset-0 h-full w-full object-cover"
              alt="Construction crew on a building site"
            />
            <div className="absolute right-6 bottom-6 left-6 rounded-2xl bg-white p-4 shadow-xl sm:left-auto sm:w-72">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#ee6c2b] text-sm font-bold text-white">
                  KB
                </span>
                <div>
                  <p className="text-sm font-semibold">Khumalo Builders</p>
                  <p className="text-xs text-[#77716b]">
                    Construction · Mpumalanga
                  </p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-md bg-[#fdeee5] px-2 py-1 text-xs text-[#b84f1a]">
                  Roofing
                </span>
                <span className="rounded-md bg-[#fdeee5] px-2 py-1 text-xs text-[#b84f1a]">
                  Brickwork
                </span>
                <span className="rounded-md bg-[#fdeee5] px-2 py-1 text-xs text-[#b84f1a]">
                  Ceilings
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
