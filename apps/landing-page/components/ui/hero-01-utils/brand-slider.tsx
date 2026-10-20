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
    <section className="border-y border-border bg-background py-8">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-5 px-5 sm:px-8 lg:flex-row lg:px-10">
        <p className="shrink-0 text-xs font-semibold tracking-[0.12em] text-muted-foreground uppercase">
          Trades on CoverPro
        </p>
        <div className="relative w-full overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
          <ul className="flex w-max animate-[coverpro-marquee_40s_linear_infinite] gap-3 hover:[animation-play-state:paused]">
            {items.map((brand, index) => {
              const Icon = brand.icon;
              return (
                <li key={`${brand.name}-${index}`} aria-hidden={index >= brandList.length}>
                  <Link
                    href={brand.href ?? `/talents?q=${encodeURIComponent(brand.name)}`}
                    tabIndex={index >= brandList.length ? -1 : undefined}
                    className="flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium whitespace-nowrap text-foreground transition-colors hover:border-primary/40 hover:text-primary"
                  >
                    {Icon ? (
                      <Icon className="h-4 w-4 text-primary" />
                    ) : brand.image ? (
                      <img src={brand.image} alt="" className="h-5 w-auto" />
                    ) : null}
                    {brand.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}
