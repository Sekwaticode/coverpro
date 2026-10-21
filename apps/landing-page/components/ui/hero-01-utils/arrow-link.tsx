import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

/** Pill link with a circled arrow on the right — the hero's primary CTA style. */
export default function ArrowLink({
  size = "default",
  className,
  children,
  ...props
}: ComponentProps<typeof Link> & { size?: "default" | "lg" }) {
  const lg = size === "lg";

  return (
    <Link
      className={cn(
        "group inline-flex items-center justify-between rounded-full bg-foreground font-semibold text-background shadow-lg shadow-black/10 transition-colors hover:bg-foreground/85",
        lg ? "gap-5 py-1.5 pr-1.5 pl-7 text-base" : "gap-3 py-1 pr-1 pl-5 text-sm",
        className,
      )}
      {...props}
    >
      {children}
      <span
        className={cn(
          "flex shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform duration-300 group-hover:rotate-45",
          lg ? "h-11 w-11" : "h-8 w-8",
        )}
      >
        <ArrowUpRight className={lg ? "h-5 w-5" : "h-4 w-4"} />
      </span>
    </Link>
  );
}
