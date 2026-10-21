import { Star } from "lucide-react";

import ArrowLink from "./arrow-link";

export type AvatarList = {
  image: string;
  name?: string;
};

export default function HeroSection({ avatarList }: { avatarList: AvatarList[] }) {
  return (
    <section className="mx-auto flex max-w-6xl flex-col items-center px-5 pt-16 pb-20 text-center sm:px-8 sm:pt-24 lg:pt-28">
      <h1
        className="leading-[1.05] font-semibold tracking-tight text-foreground"
        style={{ fontSize: "clamp(2.75rem, 7.5vw, 6rem)" }}
      >
        Hire trusted pros,
        <br />
        pay when it&apos;s{" "}
        <span className="font-(family-name:--font-Fraunces) font-normal text-primary italic">
          done right
        </span>
      </h1>

      <p className="mt-7 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
        CoverPro connects you with verified builders, roofers, tilers, plumbers
        and electricians across South Africa — and holds every rand in escrow
        until you sign the work off.
      </p>

      <div className="mt-10 flex flex-col items-center gap-8 sm:flex-row sm:gap-10">
        <ArrowLink href="/signup" size="lg">
          Get started
        </ArrowLink>

        <div className="flex items-center gap-3">
          <div className="flex -space-x-3">
            {avatarList.map((avatar, index) => (
              <img
                key={avatar.image}
                src={avatar.image}
                alt={avatar.name ?? `CoverPro customer ${index + 1}`}
                className="h-11 w-11 rounded-full border-2 border-background object-cover"
              />
            ))}
          </div>
          <div className="text-left">
            <div className="flex gap-0.5">
              {Array.from({ length: 5 }).map((_, index) => (
                <Star key={index} className="h-4 w-4 fill-primary text-primary" />
              ))}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Trusted by 1000+ homeowners
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
