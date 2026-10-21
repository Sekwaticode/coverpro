import type { LucideIcon } from "lucide-react";

import LogoLoop, { type LogoItem } from "@/components/ui/logo-loop";

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
  const logos: LogoItem[] = brandList.map((brand) => {
    const Icon = brand.icon;
    return {
      node: Icon ? (
        <Icon className="h-5 w-5" />
      ) : brand.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={brand.image} alt="" className="h-6 w-auto" />
      ) : null,
      title: brand.name,
      href: brand.href,
      hoverColor: "var(--foreground)",
    };
  });

  return (
    <section className="mx-auto max-w-6xl px-5 pb-20 sm:px-8">
      <div className="flex items-center gap-4">
        <span className="h-px flex-1 bg-linear-to-r from-transparent to-foreground/15" />
        <p className="text-center text-sm text-muted-foreground">
          Everything you need to get the job done
        </p>
        <span className="h-px flex-1 bg-linear-to-l from-transparent to-foreground/15" />
      </div>

      <LogoLoop
        logos={logos}
        speed={40}
        // Label text is half the logo height, so 36 gives 18px labels; icons stay 20px.
        logoHeight={36}
        gap={48}
        labels="inline"
        hoverSpeed={0}
        ariaLabel="CoverPro platform features"
        className="mt-8 text-muted-foreground/70"
      />
    </section>
  );
}
