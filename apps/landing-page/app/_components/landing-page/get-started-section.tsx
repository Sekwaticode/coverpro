import Link from "next/link";

export function GetStartedSection() {
  return (
    <section
      id="get-started"
      className="mx-auto max-w-7xl px-5 pb-20 sm:px-8 lg:px-10"
    >
      <div className="rounded-3xl bg-[#fdeee5] px-6 py-12 text-center sm:px-12 sm:py-16">
        <p className="text-xs font-semibold tracking-[0.14em] text-[#c4561c] uppercase">
          Building or renovating?
        </p>
        <h2 className="mx-auto mt-4 max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl">
          Get the job done right — and paid for fairly.
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-sm leading-6 text-[#6b5c52]">
          Homeowners get verified pros and protected payments. Tradespeople and
          contractors get funded milestones and steady work close to home.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/signup?role=client"
            className="rounded-full bg-[#ee6c2b] px-6 py-3 text-sm font-semibold text-white! transition hover:bg-[#d95a1c]"
          >
            Hire a pro
          </Link>
          <Link
            href="/signup?role=freelancer"
            className="rounded-full border border-[#f0b893] bg-white px-6 py-3 text-sm font-semibold text-[#1d1b19] transition hover:bg-white/70"
          >
            Join as a service provider
          </Link>
        </div>
      </div>
    </section>
  );
}
