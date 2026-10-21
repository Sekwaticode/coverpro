import Link from "next/link";
import { BrandMark } from "./brand-mark";

export function Footer() {
  const footerLinkClass = "transition hover:text-foreground";

  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8 lg:px-10">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2.5">
              <BrandMark />
              <span className="text-xl font-bold tracking-tight">
                Cover<span className="text-primary">Pro</span>
              </span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-6 text-muted-foreground">
              South Africa&apos;s escrow-backed marketplace for construction,
              renovation and home improvement pros.
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold tracking-[0.12em] text-muted-foreground uppercase">
              For homeowners
            </p>
            <div className="mt-4 flex flex-col gap-3 text-sm text-foreground/80">
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
            <p className="text-xs font-semibold tracking-[0.12em] text-muted-foreground uppercase">
              For pros
            </p>
            <div className="mt-4 flex flex-col gap-3 text-sm text-foreground/80">
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
            <p className="text-xs font-semibold tracking-[0.12em] text-muted-foreground uppercase">
              Company
            </p>
            <div className="mt-4 flex flex-col gap-3 text-sm text-foreground/80">
              <Link href="/#top" className={footerLinkClass}>
                About
              </Link>
              <a href="mailto:hello@coverpro.co.za" className={footerLinkClass}>
                Contact
              </a>
            </div>
          </div>
        </div>
        <div className="mt-12 flex flex-col gap-4 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
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
