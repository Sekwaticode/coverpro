import type { LucideIcon } from "lucide-react";
import Link from "next/link";

export type BrandList = {
  name: string;
  /** Logo shown on light backgrounds. */
  image?: string;
  /** Optional logo variant for dark backgrounds. */
  lightimg?: string;
  /** Icon used instead of a logo image. */
  icon?: LucideIcon;
  href?: string;
};

export default function BrandSlider({ brandList }: { brandList: BrandList[] }) {
  // Rendered twice so the -50% marquee loops seamlessly.
  const items = [...brandList, ...brandList];

  return (
    <section className="mx-auto max-w-6xl px-5 pb-20 sm:px-8">
      <div className="flex items-center gap-4">
        <span className="h-px flex-1 bg-linear-to-r from-transparent to-foreground/15" />
        <p className="text-center text-sm text-muted-foreground">
          Every trade covered, in all nine provinces
        </p>
        <span className="h-px flex-1 bg-linear-to-l from-transparent to-foreground/15" />
      </div>

      <div className="relative mt-8 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]">
        <ul className="flex w-max animate-[coverpro-marquee_40s_linear_infinite] gap-12 hover:[animation-play-state:paused]">
          {items.map((brand, index) => {
            const Icon = brand.icon;
            const duplicate = index >= brandList.length;
            return (
              <li key={`${brand.name}-${index}`} aria-hidden={duplicate}>
                <Link
                  href={brand.href ?? `/talents?q=${encodeURIComponent(brand.name)}`}
                  tabIndex={duplicate ? -1 : undefined}
                  className="flex items-center gap-2 text-lg font-semibold tracking-tight whitespace-nowrap text-muted-foreground/70 transition-colors hover:text-foreground"
                >
                  {Icon ? (
                    <Icon className="h-5 w-5" />
                  ) : brand.image ? (
                    <img src={brand.image} alt="" className="h-6 w-auto" />
                  ) : null}
                  {brand.name}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
