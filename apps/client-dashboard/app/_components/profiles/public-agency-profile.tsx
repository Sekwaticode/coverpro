import { Icon } from "@iconify/react";
import Link from "next/link";
import {
  AgencyFeaturedMembers,
  type AgencyFeaturedMember,
} from "./agency-featured-members";
import { WorkHistoryPagination } from "./work-history-pagination";

const NOT_AVAILABLE = "N/A";

export interface PublicAgencyProfileData {
  id: string;
  name: string;
  professionalTitle: string | null;
  size: string;
  specialty: string;
  website: string | null;
  overview: string;
  tags: string[];
  avatarImage: { imageId: string; url: string } | null;
  portfolio: Array<{
    id: string;
    title: string;
    category: string;
    description: string;
    liveUrl: string | null;
    coverImage: { imageId: string; url: string };
  }>;
  ownerLocation: string | null;
  ownerLanguages: string[];
  ownerLanguageDetails: Array<{ language: string; proficiency: string }>;
  members: AgencyFeaturedMember[];
  createdAt: string | null;
  stats: {
    totalEarning: number;
    completedJobs: number;
    ongoingJobs: number;
    reviewCount: number;
    jobSuccessScore: number;
    rating: number | null;
  };
  workHistory: Array<{
    id: string;
    title: string;
    client: string;
    status: "ACTIVE" | "COMPLETED";
    completed: string | null;
    amount: number;
    rating: number | null;
    review: string | null;
    clientHasReviewed: boolean;
    freelancerHasReviewed: boolean;
  }>;
}

const getInitials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("") || "?";

export function PublicAgencyProfile({
  agency,
}: {
  agency: PublicAgencyProfileData;
}) {
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
            Public company profile
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-.045em] sm:text-4xl">
            {agency.name}
          </h1>
        </div>
      </div>

      <div className="mt-8 grid items-start gap-6 lg:grid-cols-[290px_minmax(0,1fr)]">
        <aside className="grid gap-5 lg:sticky lg:top-24">
          <section className="rounded-3xl border border-black/8 bg-white p-6 text-center">
            {agency.avatarImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={agency.avatarImage.url}
                alt={`${agency.name} avatar`}
                className="mx-auto h-28 w-28 rounded-3xl object-cover"
              />
            ) : (
              <span className="mx-auto flex h-28 w-28 items-center justify-center rounded-3xl bg-[#cc5519] text-3xl font-semibold text-white">
                {getInitials(agency.name)}
              </span>
            )}
            <h2 className="mt-5 text-xl font-semibold">{agency.name}</h2>
            <p className="mt-2 text-sm leading-6 text-[#6b6763]">
              {agency.specialty}
            </p>
            <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-[#7c7874]">
              <Icon icon="solar:map-point-linear" width="16" />
              {agency.ownerLocation ?? NOT_AVAILABLE}
            </p>
            <div className="mt-6 grid grid-cols-3 border-y border-black/7 py-4">
              <Stat
                value={`${Math.round(agency.stats.jobSuccessScore)}%`}
                label="Job success"
              />
              <Stat
                value={
                  agency.stats.rating !== null
                    ? agency.stats.rating.toFixed(1)
                    : "0"
                }
                label="Rating"
                bordered
              />
              <Stat value={String(agency.stats.completedJobs)} label="Projects" />
            </div>
            <div className="mt-5 text-left">
              <Detail label="Team size" value={agency.size || NOT_AVAILABLE} />
              <div className="mt-4">
                <Detail
                  label="Founded"
                  value={
                    agency.createdAt
                      ? String(new Date(agency.createdAt).getFullYear())
                      : NOT_AVAILABLE
                  }
                />
              </div>
              <div className="mt-4">
                <p className="text-xs font-semibold tracking-wide text-[#8a8682] uppercase">
                  Languages
                </p>
                <div className="mt-3 grid gap-2 text-sm text-[#6b6763]">
                  {agency.ownerLanguageDetails.length > 0 ? (
                    agency.ownerLanguageDetails.map(
                      ({ language, proficiency }) => (
                        <p key={language}>
                          {language} – {proficiency}
                        </p>
                      ),
                    )
                  ) : (
                    <p>Not specified</p>
                  )}
                </div>
              </div>
            </div>
          </section>
        </aside>

        <div className="grid min-w-0 gap-6">
          <section className="overflow-hidden rounded-3xl border border-black/8 bg-white">
            <div className="bg-[radial-gradient(circle_at_82%_18%,rgba(220,157,120,.32),transparent_34%),linear-gradient(135deg,#f7e5da,#fcf7f4)] p-6 sm:p-8">
              <p className="text-xs font-semibold tracking-[.14em] text-[#e5692c] uppercase">
                Available for selected projects
              </p>
              <h2 className="mt-3 max-w-2xl text-3xl leading-tight font-semibold tracking-[-.04em]">
                {agency.professionalTitle || NOT_AVAILABLE}
              </h2>
              <p className="mt-6 max-w-3xl text-sm leading-7 text-[#686460]">
                {agency.overview}
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                {agency.tags.length > 0 ? (
                  agency.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-xl bg-white/85 px-3 py-2 text-xs font-medium text-[#58524d]"
                    >
                      {tag}
                    </span>
                  ))
                ) : (
                  <span className="rounded-xl bg-white/85 px-3 py-2 text-xs font-medium text-[#58524d]">
                    {NOT_AVAILABLE}
                  </span>
                )}
              </div>
            </div>
          </section>

          <ProfileSection
            eyebrow="Selected work"
            title="Company portfolio"
            detail={`${agency.portfolio.length} featured project${agency.portfolio.length === 1 ? "" : "s"}`}
          >
            {agency.portfolio.length === 0 ? (
              <p className="py-8 text-center text-sm text-[#8a8682]">
                No portfolio projects added yet.
              </p>
            ) : (
              <div className="grid max-w-lg gap-4">
                {agency.portfolio.map((project) => (
                  <article
                    key={project.id}
                    className="overflow-hidden rounded-xl border border-black/10 bg-white"
                  >
                    <div
                      className="relative h-44 bg-[#f5dccd] bg-cover bg-center"
                      style={{
                        backgroundImage: `url(${project.coverImage.url})`,
                      }}
                    />
                    <div className="p-4 sm:p-5">
                      <p className="text-xs font-semibold tracking-[.14em] text-[#e66d31] uppercase">
                        {project.category}
                      </p>
                      <h3 className="mt-3 text-xl font-semibold tracking-[-.03em]">
                        {project.title}
                      </h3>
                      <p className="mt-3 line-clamp-3 text-sm leading-6 text-[#7d7975]">
                        {project.description}
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
            )}
          </ProfileSection>

          <ProfileSection
            eyebrow="Our specialists"
            title="Company team"
            detail={`${agency.members.length} company member${agency.members.length === 1 ? "" : "s"}`}
          >
            <AgencyFeaturedMembers members={agency.members} />
          </ProfileSection>

          <WorkHistoryPagination
            averageRating={agency.stats.rating ?? 0}
            workHistory={agency.workHistory}
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
