"use client";

import { ArrowRight, CircleCheck, LockKeyhole, Search, ShieldCheck, Star } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type AvatarList = {
  image: string;
  name?: string;
};

const promises = ["Free quotes", "Verified pros", "Escrow-protected payments"];

export default function HeroSection({ avatarList }: { avatarList: AvatarList[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = query.trim();
    router.push(trimmed ? `/talents?q=${encodeURIComponent(trimmed)}` : "/talents");
  };

  return (
    <section className="relative overflow-hidden bg-secondary">
      <div className="mx-auto grid max-w-7xl items-center gap-14 px-5 pt-14 pb-20 sm:px-8 sm:pt-20 lg:grid-cols-[1.05fr_1fr] lg:gap-10 lg:px-10 lg:pt-24 lg:pb-28">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3.5 py-1.5 text-xs font-medium">
            <ShieldCheck className="h-4 w-4 text-primary" />
            Escrow-backed bookings across South Africa
          </span>

          <h1
            className="mt-6 leading-[1.05] font-bold tracking-tight text-foreground"
            style={{ fontSize: "clamp(2.6rem, 4.8vw, 4.1rem)" }}
          >
            Hire trusted pros.
            <br />
            <span className="text-primary">Pay only when the job&apos;s done right.</span>
          </h1>

          <p className="mt-6 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
            CoverPro connects you with verified builders, roofers, tilers,
            plumbers and electricians in all nine provinces — and holds every
            rand in milestone escrow until you sign the work off.
          </p>

          <form
            onSubmit={handleSearch}
            className="mt-9 flex flex-col gap-2 rounded-2xl border border-border bg-background p-2 shadow-xl shadow-black/5 sm:flex-row sm:items-center"
          >
            <Label htmlFor="hero-search" className="sr-only">
              What do you need done?
            </Label>
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="hero-search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="What do you need done? (tiling, plumbing, roofing…)"
                className="h-12 border-0 pl-11 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </div>
            <Button type="submit" size="lg" className="h-12 rounded-xl px-6 font-semibold">
              Find pros
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>

          <ul className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-xs text-muted-foreground">
            {promises.map((promise) => (
              <li key={promise} className="flex items-center gap-1.5">
                <CircleCheck className="h-4 w-4 text-primary" />
                {promise}
              </li>
            ))}
          </ul>

          <div className="mt-8 flex items-center gap-4">
            <div className="flex -space-x-3">
              {avatarList.map((avatar, index) => (
                <img
                  key={avatar.image}
                  src={avatar.image}
                  alt={avatar.name ?? `CoverPro pro ${index + 1}`}
                  className="h-10 w-10 rounded-full border-2 border-background object-cover"
                />
              ))}
            </div>
            <div className="text-sm">
              <div className="flex items-center gap-1 font-semibold">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Star key={index} className="h-4 w-4 fill-[#f2a33a] text-[#f2a33a]" />
                ))}
              </div>
              <p className="mt-0.5 text-muted-foreground">
                Rated by homeowners from Polokwane to Gqeberha
              </p>
            </div>
          </div>
        </div>

        <div className="relative">
          <img
            src="https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=1100&q=80"
            alt="Builder measuring timber on a construction site"
            className="aspect-[4/3] w-full rounded-3xl object-cover shadow-2xl shadow-black/10"
          />
          <div className="absolute right-4 -bottom-7 flex items-center gap-3 rounded-2xl border border-border bg-background px-4 py-3.5 shadow-xl shadow-black/8 sm:-right-6">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-primary">
              <LockKeyhole className="h-5 w-5" />
            </span>
            <div>
              <p className="text-[11px] text-muted-foreground">Your deposit is held in escrow</p>
              <p className="text-base font-semibold">Released per milestone</p>
            </div>
          </div>
          <Link
            href="/signup?role=freelancer"
            className="absolute top-4 left-4 rounded-full bg-background/95 px-3.5 py-2 text-xs font-semibold shadow-sm hover:text-primary"
          >
            Are you a tradesperson? Join as a pro →
          </Link>
        </div>
      </div>
    </section>
  );
}
