import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/** Outlined pill badge, matching the one above the hero headline. */
export function Eyebrow({
  icon: Icon,
  children,
  className,
}: {
  icon: LucideIcon;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-border bg-background px-3.5 py-1.5 text-xs font-medium text-foreground",
        className,
      )}
    >
      <Icon className="h-4 w-4 text-primary" />
      {children}
    </span>
  );
}

export function SectionHeading({
  icon,
  eyebrow,
  title,
  description,
  align = "left",
  action,
}: {
  icon: LucideIcon;
  eyebrow: string;
  title: ReactNode;
  description?: ReactNode;
  align?: "left" | "center";
  action?: ReactNode;
}) {
  const centered = align === "center";

  return (
    <div
      className={cn(
        "flex flex-col gap-4",
        centered ? "items-center text-center" : "sm:flex-row sm:items-end sm:justify-between",
      )}
    >
      <div className={cn("max-w-2xl", centered && "mx-auto")}>
        <Eyebrow icon={icon}>{eyebrow}</Eyebrow>
        <h2 className="mt-5 text-3xl leading-[1.1] font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
          {title}
        </h2>
        {description ? (
          <p className="mt-4 text-base leading-7 text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}
