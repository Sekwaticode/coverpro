import { CircleCheck, FilePlus2, LockKeyhole, ShieldCheck, Users } from "lucide-react";

import { SectionHeading } from "./section-heading";

const steps = [
  {
    icon: FilePlus2,
    title: "Post your project",
    body: "Describe the job — a new roof, retiled bathroom or full kitchen renovation — with your budget in rands and the town you're in.",
  },
  {
    icon: Users,
    title: "Compare quotes from verified pros",
    body: "Local contractors send proposals with milestones, timelines and pricing. Check their reviews, past jobs and verification first.",
  },
  {
    icon: LockKeyhole,
    title: "Fund each milestone into escrow",
    body: "Your money is held safely by CoverPro — the pro can see it's secured, but it isn't released yet.",
  },
  {
    icon: CircleCheck,
    title: "Approve the work, release payment",
    body: "Only when you're happy with the finished milestone does the payment go to your pro. Not happy? Request changes first.",
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="scroll-mt-16 bg-background py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
        <SectionHeading
          icon={ShieldCheck}
          eyebrow="How escrow works"
          title={
            <>
              Every rand protected,{" "}
              <span className="text-primary">from deposit to final coat.</span>
            </>
          }
          description="No more paying a deposit and hoping the builder comes back. CoverPro holds payment for each stage of the job until you sign it off."
        />

        <ol className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map(({ icon: Icon, title, body }, index) => (
            <li
              key={title}
              className="relative rounded-2xl border border-border bg-background p-6 shadow-xl shadow-black/5"
            >
              <div className="flex items-center justify-between">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent text-primary">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="text-sm font-semibold text-muted-foreground/60">
                  0{index + 1}
                </span>
              </div>
              <h3 className="mt-6 text-lg font-semibold tracking-tight text-foreground">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
