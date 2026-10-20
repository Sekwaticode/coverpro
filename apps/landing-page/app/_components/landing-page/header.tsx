"use client";

import { Icon } from "@iconify/react";
import { useClerk, useUser } from "@clerk/nextjs";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { BrandMark } from "./brand-mark";

const navigation = [
  { href: "/talents", label: "Browse services" },
  { href: "/#how-it-works", label: "How escrow works", hash: "#how-it-works" },
  { href: "/works", label: "For pros" },
  { href: "/agencies", label: "Companies" },
];

export function Header() {
  const [isFixed, setIsFixed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeHash, setActiveHash] = useState("");
  const pathname = usePathname();
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const role = user?.unsafeMetadata?.role;
  const dashboardUrl =
    role === "client"
      ? process.env.NEXT_PUBLIC_CLIENT_DASHBOARD
      : role === "freelancer"
        ? process.env.NEXT_PUBLIC_FREELANCER_DASHBOARD
        : undefined;
  const isSignedIn = isLoaded && Boolean(user);

  const logOutHandler = async () => {
    setIsSigningOut(true);
    setIsMobileMenuOpen(false);
    try {
      await signOut({ redirectUrl: "/" });
    } finally {
      setIsSigningOut(false);
    }
  };

  useEffect(() => {
    const updateHeaderPosition = () => {
      setIsFixed(window.scrollY >= window.innerHeight * 0.15);
    };

    updateHeaderPosition();
    window.addEventListener("scroll", updateHeaderPosition, { passive: true });
    window.addEventListener("resize", updateHeaderPosition);

    return () => {
      window.removeEventListener("scroll", updateHeaderPosition);
      window.removeEventListener("resize", updateHeaderPosition);
    };
  }, []);

  useEffect(() => {
    const updateActiveHash = () => setActiveHash(window.location.hash);

    updateActiveHash();
    window.addEventListener("hashchange", updateActiveHash);

    return () => window.removeEventListener("hashchange", updateActiveHash);
  }, [pathname]);

  const isActive = (item: (typeof navigation)[number]) =>
    item.hash
      ? pathname === "/" && activeHash === item.hash
      : pathname === item.href;

  return (
    <header
      className={`border-b border-black/[0.07] bg-white/95 backdrop-blur-sm ${
        isFixed ? "landing-header-enter fixed inset-x-0 top-0 z-50" : ""
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3.5 sm:px-8 lg:px-10">
        <Link
          href="/#"
          className="flex items-center gap-2.5"
          aria-label="CoverPro home"
        >
          <BrandMark />
          <span className="text-xl font-bold tracking-tight">
            Cover<span className="text-[#ee6c2b]">Pro</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-8 text-sm font-medium text-[#5f5a55] lg:flex">
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(item) ? "page" : undefined}
              className={`transition ${
                isActive(item)
                  ? "font-semibold text-[#ee6c2b]!"
                  : "hover:text-[#1d1b19]!"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 sm:flex">
          {isSignedIn ? (
            <>
              <button
                type="button"
                onClick={logOutHandler}
                disabled={isSigningOut}
                className="flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium text-[#4f4a45] transition hover:bg-black/4 disabled:opacity-60"
              >
                <Icon icon="solar:logout-2-linear" width="18" />
                {isSigningOut ? "Logging out..." : "Log out"}
              </button>
              <Link
                href={dashboardUrl ?? "/login"}
                className="rounded-full bg-[#ee6c2b] px-5 py-2.5 text-sm font-semibold text-white! shadow-lg shadow-[#ee6c2b]/25 transition hover:bg-[#d95a1c]"
              >
                Go to dashboard
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-full px-3 py-2 text-sm font-semibold text-[#1d1b19] transition hover:bg-black/4"
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                className="rounded-full bg-[#ee6c2b] px-5 py-2.5 text-sm font-semibold text-white! shadow-lg shadow-[#ee6c2b]/25 transition hover:bg-[#d95a1c]"
              >
                Get started
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setIsMobileMenuOpen((open) => !open)}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-black/8 text-[#302d2a] sm:hidden"
          aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
          aria-expanded={isMobileMenuOpen}
          aria-controls="mobile-menu"
        >
          <Icon
            icon="solar:hamburger-menu-linear"
            width="21"
            strokeWidth="1.5"
          ></Icon>
        </button>
      </div>

      <div
        id="mobile-menu"
        className={`border-t border-black/[0.07] px-5 py-4 sm:hidden sm:px-8 ${
          isMobileMenuOpen ? "block" : "hidden"
        }`}
      >
        <nav className="flex flex-col gap-1">
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(item) ? "page" : undefined}
              onClick={() => setIsMobileMenuOpen(false)}
              className={`rounded-lg px-3 py-3 text-sm font-medium ${
                isActive(item)
                  ? "font-semibold text-[#ee6c2b]"
                  : "hover:bg-black/4"
              }`}
            >
              {item.label}
            </Link>
          ))}
          <div className="mt-3 flex gap-3 border-t border-black/[0.07] pt-4">
            {isSignedIn ? (
              <>
                <button
                  type="button"
                  onClick={logOutHandler}
                  disabled={isSigningOut}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-black/10 px-4 py-2.5 text-sm font-medium disabled:opacity-60"
                >
                  <Icon icon="solar:logout-2-linear" width="18" />
                  {isSigningOut ? "Logging out..." : "Log out"}
                </button>
                <Link
                  href={dashboardUrl ?? "/login"}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex-1 rounded-full bg-[#ee6c2b] px-4 py-2.5 text-center text-sm font-semibold text-white!"
                >
                  Go to dashboard
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex-1 rounded-full border border-black/10 px-4 py-2.5 text-center text-sm font-semibold"
                >
                  Sign in
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex-1 rounded-full bg-[#ee6c2b] px-4 py-2.5 text-center text-sm font-semibold text-white!"
                >
                  Get started
                </Link>
              </>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
