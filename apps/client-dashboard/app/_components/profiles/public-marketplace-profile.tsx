import { Icon } from "@iconify/react";
import Link from "next/link";
import type { ClientProposal } from "../data/client-data";
import { OngoingProjects } from "./ongoing-projects";
import { WorkHistoryPagination } from "./work-history-pagination";
import Image from "next/image";

export function PublicMarketplaceProfile({
  profile,
}: {
  profile: ClientProposal;
}) {
  const portfolio = (profile.portfolios ?? []).map((project) => ({
    title: project.title,
    category: project.category,
    result: project.description,
    imageUrl: project.cover_image.url,
    liveUrl: project.live_url,
    icon: "solar:code-square-linear",
    tone: "from-[#f4dfd3] to-[#dbb29b]",
  }));

  return (
    <>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <Link
            href="/proposals"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#dd5c1b]"
          >
            <Icon icon="solar:arrow-left-linear" width="15" />
            Back to proposals
          </Link>
          <p className="mt-5 text-xs font-semibold tracking-[.14em] text-[#e66d31] uppercase">
            Public pro profile
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-.045em] sm:text-4xl">
            {profile.bidder}
          </h1>
        </div>
      </div>

      <div className="mt-8 grid items-start gap-6 lg:grid-cols-[290px_minmax(0,1fr)]">
        <aside className="grid gap-5 lg:sticky lg:top-24">
          <section className="rounded-3xl border border-black/8 bg-white p-6 text-center">
            <div className="relative mx-auto h-28 w-28">
              <span className="flex h-full w-full items-center justify-center rounded-full bg-[#cc5519] text-3xl font-semibold text-white">
                {profile.avatarUrl ? (
                  <Image
                    src={profile.avatarUrl}
                    alt={profile.bidder}
                    fill
                    sizes="112px"
                    className="rounded-full object-cover"
                  />
                ) : (
                  profile.initials
                )}
              </span>
              {profile.online && (
                <span className="absolute right-1 bottom-1 h-5 w-5 rounded-full border-4 border-white bg-[#e77840]" />
              )}
            </div>
            <h2 className="mt-5 inline-flex items-center justify-center gap-1.5 text-xl font-semibold">
              {profile.bidder}
              {profile.verified && (
                <Icon
                  icon="solar:verified-check-bold"
                  width="18"
                  className="text-[#e56d30]"
                />
              )}
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#6b6763]">
              {profile.title}
            </p>
            <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-[#7c7874]">
              <Icon icon="solar:map-point-linear" width="16" />
              {profile.location}
            </p>
            <div className="mt-6 grid grid-cols-3 border-y border-black/7 py-4">
              <Stat
                value={
                  profile.jobSuccess && profile.jobSuccess > 0
                    ? `${profile.jobSuccess}%`
                    : "N/A"
                }
                label="Job success"
              />
              <Stat value={String(profile.rating)} label="Rating" bordered />
              <Stat
                value={String(profile.completedProjects)}
                label="Projects"
              />
            </div>
            <div className="mt-5 text-left">
              <Detail label="Availability" value={profile.duration} />
              <div className="mt-4">
                <p className="text-xs font-semibold tracking-wide text-[#8a8682] uppercase">
                  Languages
                </p>
                <div className="mt-3 grid gap-2 text-sm text-[#6b6763]">
                  {profile.languages?.length ? (
                    profile.languages.map(({ language, proficiency }) => (
                      <p key={language}>
                        {language} – {proficiency}
                      </p>
                    ))
                  ) : (
                    <p>Not specified</p>
                  )}
                </div>
              </div>
            </div>
          </section>
          {profile.verified && (
            <section className="rounded-2xl border border-[#ebd2c3] bg-[#faece4] p-5">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#c75319]">
                <Icon icon="solar:verified-check-bold" width="20" />
                Identity verified
              </div>
              <p className="mt-2 text-xs leading-5 text-[#706a63]">
                Securely verified through Stripe Identity.
              </p>
            </section>
          )}
          {profile.agency && (
            <section className="rounded-2xl border border-black/8 bg-white p-5">
              <p className="text-xs font-semibold tracking-wide text-[#8a8682] uppercase">
                Associated with
              </p>
              <Link
                href={`/agency/${profile.agency.id}`}
                className="mt-3 flex items-center gap-3 rounded-xl p-2 -m-2 transition hover:bg-[#faf3ee]"
              >
                {profile.agency.avatarUrl ? (
                  <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl">
                    <Image
                      src={profile.agency.avatarUrl}
                      alt={profile.agency.name}
                      fill
                      sizes="40px"
                      className="object-cover"
                    />
                  </span>
                ) : (
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#cc5519] text-sm font-semibold text-white">
                    <Icon icon="solar:buildings-2-linear" width="20" />
                  </span>
                )}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-[#272624]">
                    {profile.agency.name}
                  </span>
                  <span className="block text-xs text-[#dd5c1b]">
                    View company profile
                  </span>
                </span>
                <Icon
                  icon="solar:arrow-right-up-linear"
                  width="16"
                  className="text-[#8a8682]"
                />
              </Link>
            </section>
          )}
        </aside>

        <div className="grid min-w-0 gap-6">
          <section className="overflow-hidden rounded-3xl border border-black/8 bg-white">
            <div className="bg-[radial-gradient(circle_at_82%_18%,rgba(220,157,120,.32),transparent_34%),linear-gradient(135deg,#f7e5da,#fcf7f4)] p-6 sm:p-8">
              <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
                <div>
                  <p className="text-xs font-semibold tracking-[.14em] text-[#e5692c] uppercase">
                    Available for selected projects
                  </p>
                  <h2 className="mt-3 max-w-2xl text-3xl leading-tight font-semibold tracking-[-.04em]">
                    {profile.title}
                  </h2>
                </div>
                <div className="shrink-0 sm:text-right">
                  <p className="text-xs text-[#817d79]">Hourly rate</p>
                  <p className="mt-1 text-xl font-semibold">
                    R{profile.bid}
                    <span className="text-sm text-[#817d79]">/hr</span>
                  </p>
                </div>
              </div>
              <p className="mt-6 max-w-3xl text-sm leading-7 text-[#686460]">
                {profile.coverLetter}
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                {profile.skills.map((skill) => (
                  <span
                    key={skill}
                    className="rounded-xl bg-white/85 px-3 py-2 text-xs font-medium text-[#58524d]"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </section>

          <ProfileSection
            eyebrow="Selected work"
            title="Portfolio"
            detail={`${portfolio.length} featured projects`}
          >
            <div className="grid max-w-lg gap-4">
              {portfolio.map((project) => (
                <article
                  key={project.title}
                  className="overflow-hidden rounded-xl border border-black/10 bg-white"
                >
                  <div
                    className={`relative flex h-44 items-center justify-center bg-linear-to-br ${project.tone}`}
                  >
                    {project.imageUrl ? (
                      <Image
                        src={project.imageUrl}
                        alt={project.title}
                        fill
                        sizes="(max-width: 1024px) 100vw, 900px"
                        className="object-cover"
                      />
                    ) : (
                      <Icon
                        icon={project.icon}
                        width="38"
                        className="text-[#bd4f17]"
                      />
                    )}
                  </div>
                  <div className="p-4 sm:p-5">
                    <p className="text-xs font-semibold tracking-[.14em] text-[#e66d31] uppercase">
                      {project.category}
                    </p>
                    <h3 className="mt-3 text-xl font-semibold tracking-[-.03em]">
                      {project.title}
                    </h3>
                    <p className="mt-3 line-clamp-3 text-sm leading-6 text-[#7d7975]">
                      {project.result}
                    </p>
                    {project.liveUrl && (
                      <div className="mt-5 border-t border-black/8 pt-4">
                        <a
                          href={project.liveUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 text-sm font-semibold text-[#dd5c1b]"
                        >
                          View live project
                          <Icon icon="solar:arrow-right-up-linear" width="18" />
                        </a>
                      </div>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </ProfileSection>

          <OngoingProjects
            projects={(profile.workHistory ?? []).filter(
              (job) => job.status === "ACTIVE",
            )}
          />

          <WorkHistoryPagination
            averageRating={profile.rating}
            workHistory={profile.workHistory ?? []}
          />
        </div>
      </div>
    </>
  );
}

function ProfileSection({
  eyebrow,
  title,
  detail,
  children,
}: {
  eyebrow: string;
  title: string;
  detail: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-black/8 bg-white p-5 sm:p-6">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold tracking-[.13em] text-[#e66d31] uppercase">
            {eyebrow}
          </p>
          <h2 className="mt-2 text-xl font-semibold">{title}</h2>
        </div>
        <p className="text-xs text-[#8f8b87]">{detail}</p>
      </div>
      {children}
    </section>
  );
}

function Stat({
  value,
  label,
  bordered = false,
}: {
  value: string;
  label: string;
  bordered?: boolean;
}) {
  return (
    <div className={bordered ? "border-x border-black/7" : ""}>
      <strong className="block">{value}</strong>
      <span className="mt-1 block text-[10px] text-[#8a8682]">{label}</span>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3 text-xs">
      <span className="text-[#8a8682]">{label}</span>
      <span className="text-right font-semibold">{value}</span>
    </div>
  );
}
