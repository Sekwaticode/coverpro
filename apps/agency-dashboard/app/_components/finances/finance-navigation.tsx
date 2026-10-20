"use client";

import { Icon, type IconName } from "../ui/icon";
import { financeSections, type FinanceSection } from "./finance-data";

export function FinanceNavigation({
  active,
  onChange,
}: {
  active: FinanceSection;
  onChange: (section: FinanceSection) => void;
}) {
  return (
    <nav className="rounded-2xl border border-black/8 bg-white p-2">
      {financeSections.map((section) => (
        <button
          key={section.id}
          type="button"
          onClick={() => onChange(section.id)}
          className={`flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium transition ${
            active === section.id
              ? "bg-[#faece4] text-[#d85a1b]"
              : "text-[#6d6965] hover:bg-black/3"
          }`}
        >
          <Icon
            name={section.icon as IconName}
            size={19}
            active={active === section.id}
          />
          {section.label}
        </button>
      ))}
    </nav>
  );
}
