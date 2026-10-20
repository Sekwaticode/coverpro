import { Icon } from "@iconify/react";

const steps = [
  {
    icon: "solar:document-add-linear",
    title: "Post your project",
    body: "Describe the job — a new roof, retiled bathroom or full kitchen renovation — with your budget in rands and the town you're in.",
  },
  {
    icon: "solar:users-group-rounded-linear",
    title: "Compare quotes from verified pros",
    body: "Local contractors send proposals with milestones, timelines and pricing. Check their reviews, past jobs and verification first.",
  },
  {
    icon: "solar:lock-keyhole-minimalistic-linear",
    title: "Fund each milestone into escrow",
    body: "Your money is held safely by CoverPro — the pro can see it's secured, but it isn't released yet.",
  },
  {
    icon: "solar:check-circle-linear",
    title: "Approve the work, release payment",
    body: "Only when you're happy with the finished milestone does the payment go to your pro. Not happy? Request changes first.",
  },
];

export function HowItWorksSection() {
  return (
    <section
      id="how-it-works"
      className="border-t border-black/[0.07] bg-white py-20 sm:py-24"
    >
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold tracking-[0.14em] text-[#ee6c2b] uppercase">
            How escrow works
          </p>
          <h2 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
            Every rand protected, from deposit to final coat.
          </h2>
          <p className="mt-4 text-sm leading-6 text-[#6b6560] sm:text-base">
            No more paying a deposit and hoping the builder comes back.
            CoverPro holds payment for each stage of the job until you sign it
            off.
          </p>
        </div>

        <ol className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => (
            <li
              key={step.title}
              className="relative rounded-2xl border border-black/8 bg-[#fbfaf8] p-6"
            >
              <div className="flex items-center justify-between">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#fdeee5] text-[#ee6c2b]">
                  <Icon icon={step.icon} width="22" />
                </span>
                <span className="text-sm font-semibold text-[#b9b2ab]">
                  0{index + 1}
                </span>
              </div>
              <h3 className="mt-6 text-lg font-semibold tracking-tight">
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-[#6b6560]">
                {step.body}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
