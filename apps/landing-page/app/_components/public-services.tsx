import Link from "next/link";

export type PublicService = {
  id: string;
  title: string;
  description: string;
  category: string;
  price: number;
  deliveryDays: number;
  milestones: { title: string; description: string; amount: number; days: number }[];
};

export const rand = (value: number) =>
  `R${value.toLocaleString("en-ZA", { maximumFractionDigits: 2 })}`;

/** Active services for a pro (freelancer profile ID) or an agency. Empty on failure. */
export async function getPublicServices(
  owner: { freelancerId: string } | { agencyId: string },
): Promise<PublicService[]> {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SERVER_URI}/listings/public?${new URLSearchParams(owner)}`,
      { cache: "no-store" },
    );
    if (!response.ok) return [];
    const { data } = await response.json();
    return Array.isArray(data?.listings) ? data.listings : [];
  } catch {
    return [];
  }
}

/**
 * Where "Request this service" goes: the same profile inside the client dashboard,
 * which handles sign-in and the request form.
 */
export const clientDashboardProfileUrl = (path: string) =>
  `${process.env.NEXT_PUBLIC_CLIENT_DASHBOARD ?? ""}${path}#services`;

export function PublicServices({
  services,
  name,
  requestHref,
  titleClassName,
}: {
  services: PublicService[];
  name: string;
  requestHref: string;
  titleClassName?: string;
}) {
  return (
    <section id="services" className="scroll-mt-24 rounded-2xl border border-black/7 bg-white p-6 sm:p-8">
      <p className="text-xs font-semibold uppercase tracking-[0.13em] text-[#e66d31]">Services</p>
      <h2 className={`${titleClassName ?? "text-2xl font-semibold"} mt-2`}>
        What {name.split(" ")[0]} offers
      </h2>

      {services.length === 0 ? (
        <p className="mt-4 rounded-xl bg-[#faf5f1] p-4 text-sm text-[#77736f]">
          {name} hasn&apos;t listed any services yet.
        </p>
      ) : (
        <div className="mt-6 grid gap-4">
          {services.map((service) => (
            <article key={service.id} className="rounded-2xl border border-black/8 p-5">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                <div className="min-w-0">
                  <span className="rounded-full bg-[#f8ede6] px-2.5 py-1 text-[11px] font-semibold text-[#d85a1b]">
                    {service.category}
                  </span>
                  <h3 className="mt-3 text-lg font-semibold">{service.title}</h3>
                  <p className="mt-2 line-clamp-3 text-sm leading-6 whitespace-pre-line text-[#686562]">
                    {service.description}
                  </p>
                </div>
                <div className="shrink-0 sm:text-right">
                  <p className="text-2xl font-semibold tracking-tight">{rand(service.price)}</p>
                  <p className="text-xs text-[#85827e]">
                    {service.deliveryDays} {service.deliveryDays === 1 ? "day" : "days"} ·{" "}
                    {service.milestones.length}{" "}
                    {service.milestones.length === 1 ? "milestone" : "milestones"}
                  </p>
                  <Link
                    href={requestHref}
                    className="mt-3 inline-flex rounded-xl bg-[#272624] px-4 py-2.5 text-sm font-semibold text-white! transition hover:bg-[#3e3c39]"
                  >
                    Request this service
                  </Link>
                </div>
              </div>

              <details className="group mt-4">
                <summary className="cursor-pointer list-none text-sm font-semibold text-[#d85a1b] marker:hidden">
                  <span className="group-open:hidden">See what&apos;s included</span>
                  <span className="hidden group-open:inline">Hide details</span>
                </summary>
                <ol className="mt-3 grid gap-2">
                  {service.milestones.map((milestone, index) => (
                    <li
                      key={index}
                      className="flex items-start justify-between gap-4 rounded-xl bg-[#faf5f1] px-4 py-3"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium">
                          {index + 1}. {milestone.title}
                        </p>
                        {milestone.description && (
                          <p className="mt-0.5 text-xs text-[#85827e]">{milestone.description}</p>
                        )}
                      </div>
                      <p className="shrink-0 text-right text-xs text-[#6b6763]">
                        <strong className="text-sm text-[#23211f]">{rand(milestone.amount)}</strong>
                        <br />
                        {milestone.days} {milestone.days === 1 ? "day" : "days"}
                      </p>
                    </li>
                  ))}
                </ol>
              </details>
            </article>
          ))}
          <p className="flex gap-2 text-xs leading-5 text-[#77736f]">
            <span aria-hidden="true">🔒</span>
            Nothing is charged when you request. If {name.split(" ")[0]} accepts, you chat first,
            then pay into TradeSafe escrow. They&apos;re paid per milestone, only when you approve.
          </p>
        </div>
      )}
    </section>
  );
}
