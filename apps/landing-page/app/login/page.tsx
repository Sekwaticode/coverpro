import Link from "next/link";
import { BrandMark } from "../_components/landing-page/brand-mark";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <div className="relative flex min-h-svh flex-col overflow-hidden bg-white font-(family-name:--font-dm-sans)">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-128 bg-[radial-gradient(ellipse_at_top,rgba(253,228,213,0.8),rgba(254,247,243,0.48)_44%,transparent_76%)]"
        aria-hidden="true"
      ></div>

      <header className="relative z-10 px-5 py-7 sm:px-8 sm:py-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2.5"
          aria-label="CoverPro home"
        >
          <BrandMark />
          <span className="text-xl font-semibold tracking-tight">
              Cover<span className="text-[#ee6c2b]">Pro</span>
            </span>
        </Link>
      </header>

      <main className="relative z-10 flex flex-1 items-center justify-center px-5 py-10 sm:px-8">
        <LoginForm />
      </main>
    </div>
  );
}
