import { MapPin } from "lucide-react";

import { provinces } from "../../signup/provinces";

export function ProvincesSection() {
  return (
    <section className="border-y border-border bg-background py-8">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-5 px-5 text-center sm:px-8 lg:flex-row lg:justify-between lg:px-10 lg:text-left">
        <p className="shrink-0 text-xs font-semibold tracking-[0.12em] text-muted-foreground uppercase">
          Pros in all nine provinces
        </p>
        <ul className="flex flex-wrap justify-center gap-2 lg:justify-end">
          {provinces.map((province) => (
            <li
              key={province}
              className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-foreground"
            >
              <MapPin className="h-3.5 w-3.5 text-primary" />
              {province}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
