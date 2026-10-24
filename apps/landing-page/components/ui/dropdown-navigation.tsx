"use client";

import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import Link from "next/link";
import {
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type ElementType,
  type FocusEvent,
} from "react";

import { cn } from "@/lib/utils";

export type DropdownNavItem = {
  id: number;
  label: string;
  /** Where the top-level item goes when clicked. */
  link: string;
  isActive?: boolean;
  subMenus?: {
    title: string;
    items: {
      label: string;
      description: string;
      icon: ElementType;
      link: string;
    }[];
  }[];
};

/** Most columns a menu shows below the 2xl breakpoint; extra groups wrap to a new row. */
const MAX_NARROW_COLUMNS = 3;
/** Grace period so the menu survives the mouse crossing the gap into the panel. */
const CLOSE_DELAY_MS = 150;

/**
 * Dropdown panels are centred on the nearest positioned ancestor (e.g. a
 * `relative` header bar), so wide menus stay on screen whichever item opens them.
 */
export function DropdownNavigation({
  navItems,
  className,
}: {
  navItems: DropdownNavItem[];
  className?: string;
}) {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [hovered, setHovered] = useState<number | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Keeps the shared-layout animations of this nav separate from any other on the page.
  const groupId = useId();

  const cancelClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = null;
  };
  const open = (label: string) => {
    cancelClose();
    setOpenMenu(label);
  };
  const scheduleClose = () => {
    cancelClose();
    closeTimer.current = setTimeout(() => setOpenMenu(null), CLOSE_DELAY_MS);
  };
  const closeNow = () => {
    cancelClose();
    setOpenMenu(null);
  };

  useEffect(() => cancelClose, []);

  const closeOnFocusLeave = (event: FocusEvent<HTMLLIElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
      closeNow();
    }
  };

  return (
    <LayoutGroup id={groupId}>
      <nav aria-label="Main" className={className}>
        <ul
          className="flex items-center"
          onKeyDown={(event) => event.key === "Escape" && closeNow()}
        >
          {navItems.map((navItem) => {
            const isOpen = openMenu === navItem.label;
            const groupCount = navItem.subMenus?.length ?? 0;

            return (
              <li
                key={navItem.label}
                onMouseEnter={() => open(navItem.label)}
                onMouseLeave={scheduleClose}
                onFocus={() => open(navItem.label)}
                onBlur={closeOnFocusLeave}
              >
                <Link
                  href={navItem.link}
                  aria-current={navItem.isActive ? "page" : undefined}
                  aria-haspopup={navItem.subMenus ? "true" : undefined}
                  aria-expanded={navItem.subMenus ? isOpen : undefined}
                  className={cn(
                    "group relative flex items-center justify-center gap-1 px-4 py-1.5 text-sm font-medium text-muted-foreground transition-colors duration-300 hover:text-foreground",
                    navItem.isActive && "text-foreground",
                  )}
                  onMouseEnter={() => setHovered(navItem.id)}
                  onMouseLeave={() => setHovered(null)}
                >
                  <span className="relative z-10">{navItem.label}</span>
                  {navItem.subMenus && (
                    <ChevronDown
                      className={cn(
                        "relative z-10 h-4 w-4 transition-transform duration-300 group-hover:rotate-180",
                        isOpen && "rotate-180",
                      )}
                    />
                  )}
                  {(hovered === navItem.id || isOpen) && (
                    <motion.div
                      layoutId="hover-bg"
                      className="absolute inset-0 size-full bg-primary/10"
                      style={{ borderRadius: 99 }}
                    />
                  )}
                  {navItem.isActive && hovered !== navItem.id && !isOpen && (
                    <span className="absolute -bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-primary" />
                  )}
                </Link>

                <AnimatePresence>
                  {isOpen && navItem.subMenus && (
                    <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2">
                      <motion.div
                        className="w-max border border-border bg-background p-5 shadow-xl shadow-black/5"
                        style={{ borderRadius: 16 }}
                        layoutId="menu"
                      >
                        <div
                          className="grid gap-x-8 gap-y-7 [grid-template-columns:repeat(var(--cols),max-content)] 2xl:[grid-template-columns:repeat(var(--cols-wide),max-content)]"
                          style={
                            {
                              "--cols": Math.min(groupCount, MAX_NARROW_COLUMNS),
                              "--cols-wide": groupCount,
                            } as CSSProperties
                          }
                        >
                          {navItem.subMenus.map((sub) => (
                            <motion.div layout key={sub.title}>
                              <h3 className="mb-4 text-sm font-medium text-muted-foreground">
                                {sub.title}
                              </h3>
                              <ul className="space-y-5">
                                {sub.items.map((item) => {
                                  const Icon = item.icon;
                                  return (
                                    <li key={item.label}>
                                      <Link
                                        href={item.link}
                                        onClick={closeNow}
                                        className="group flex items-start space-x-3"
                                      >
                                        <div className="flex size-9 shrink-0 items-center justify-center rounded-md border border-border text-foreground transition-colors duration-300 group-hover:bg-accent group-hover:text-accent-foreground">
                                          <Icon className="h-5 w-5 flex-none" />
                                        </div>
                                        <div className="w-max leading-5">
                                          <p className="text-sm font-medium text-foreground">
                                            {item.label}
                                          </p>
                                          <p className="text-xs text-muted-foreground transition-colors duration-300 group-hover:text-foreground">
                                            {item.description}
                                          </p>
                                        </div>
                                      </Link>
                                    </li>
                                  );
                                })}
                              </ul>
                            </motion.div>
                          ))}
                        </div>
                      </motion.div>
                    </div>
                  )}
                </AnimatePresence>
              </li>
            );
          })}
        </ul>
      </nav>
    </LayoutGroup>
  );
}
