import Link from "next/link";
import { BrandMark } from "./brand-mark";

export function Footer() {
  const footerLinkClass = "transition hover:text-[#1d1b19]";

  return (
    <footer className="border-t border-black/[0.07] bg-white">
      <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8 lg:px-10">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2.5">
              <BrandMark />
              <span className="text-xl font-bold tracking-tight">
                Cover<span className="text-[#ee6c2b]">Pro</span>
              </span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-6 text-[#77716b]">
              South Africa&apos;s escrow-backed marketplace for construction,
              renovation and home improvement pros.
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold tracking-[0.12em] text-[#7a746e] uppercase">
              For homeowners
            </p>
            <div className="mt-4 flex flex-col gap-3 text-sm text-[#57524d]">
              <Link href="/talents" className={footerLinkClass}>
                Browse services
              </Link>
              <Link href="/agencies" className={footerLinkClass}>
                Construction companies
              </Link>
              <Link href="/#how-it-works" className={footerLinkClass}>
                How escrow works
              </Link>
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold tracking-[0.12em] text-[#7a746e] uppercase">
              For pros
            </p>
            <div className="mt-4 flex flex-col gap-3 text-sm text-[#57524d]">
              <Link href="/works" className={footerLinkClass}>
                Find jobs
              </Link>
              <Link href="/signup?role=freelancer" className={footerLinkClass}>
                Join CoverPro
              </Link>
              <Link href="/#how-it-works" className={footerLinkClass}>
                Getting paid
              </Link>
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold tracking-[0.12em] text-[#7a746e] uppercase">
              Company
            </p>
            <div className="mt-4 flex flex-col gap-3 text-sm text-[#57524d]">
              <Link href="/#top" className={footerLinkClass}>
                About
              </Link>
              <a href="mailto:hello@coverpro.co.za" className={footerLinkClass}>
                Contact
              </a>
            </div>
          </div>
        </div>
        <div className="mt-12 flex flex-col gap-4 border-t border-black/[0.07] pt-6 text-xs text-[#86807a] sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 CoverPro (Pty) Ltd. All rights reserved.</p>
          <div className="flex gap-5">
            <Link href="/privacy" className={footerLinkClass}>
              Privacy
            </Link>
            <Link href="/terms" className={footerLinkClass}>
              Terms
            </Link>
            <Link href="/accessibility" className={footerLinkClass}>
              Accessibility
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
