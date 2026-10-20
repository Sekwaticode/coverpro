"use client";

import { Icon } from "@iconify/react";
import { useAuth } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { FeaturedMembers, type FeaturedMember } from "./featured-members";
import { AgencyWorkHistory } from "./agency-work-history";
import { AgencyProfileSkeleton } from "./agency-profile-skeleton";

const NOT_AVAILABLE = "N/A";

interface AgencyProfile {
  id: string;
  name: string;
  professionalTitle: string | null;
  size: string;
  specialty: string;
  website: string | null;
  overview: string;
  tags: string[];
  avatarImage: { imageId: string; url: string } | null;
  isOnboarded: boolean;
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
  members: FeaturedMember[];
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

export function AgencyProfileView() {
  const { getToken } = useAuth();

  const { data: agency, isLoading } = useQuery({
    queryKey: ["agency-mine"],
    queryFn: async () => {
      const token = await getToken();

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SERVER_URI}/agency/mine?role=freelancer`,
        {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "The company profile could not be loaded.");
      }

      return result.data as AgencyProfile | null;
    },
  });

  if (isLoading || !agency) {
    return <AgencyProfileSkeleton />;
  }

  return (
    <>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-semibold tracking-[0.14em] text-[#e66d31] uppercase">
            Public company profile
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.045em] sm:text-4xl">
            {agency.name}
          </h1>
          <p className="mt-2 text-sm text-[#77736f]">
            This is how clients see your company on CoverPro.
          </p>
        </div>
        <Link
          href="/profile/edit"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#272624] px-5 text-sm font-semibold text-white"
        >
          <Icon icon="solar:pen-2-linear" width="18" />
          Edit company profile
        </Link>
      </div>

      <div className="mt-8 grid items-start gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="grid gap-5 xl:sticky xl:top-24">
          <section className="rounded-2xl border border-black/8 bg-white p-6 text-center">
            {agency.avatarImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={agency.avatarImage.url}
                alt={`${agency.name} avatar`}
                className="mx-auto h-24 w-24 rounded-3xl object-cover"
              />
            ) : (
              <span className="mx-auto flex h-24 w-24 items-center justify-center rounded-3xl bg-[#cc5519] text-2xl font-semibold text-white">
                {getInitials(agency.name)}
              </span>
            )}
            <h2 className="mt-5 text-xl font-semibold">{agency.name}</h2>
            <p className="mt-1 text-sm text-[#7b7773]">{agency.specialty}</p>
            <div className="mt-3 flex justify-center text-xs text-[#807c78]">
              <span className="inline-flex max-w-52 items-start gap-1.5 text-center">
                <Icon
                  icon="solar:map-point-linear"
                  width="16"
                  className="mt-px shrink-0"
                />
                <span>{agency.ownerLocation ?? NOT_AVAILABLE}</span>
              </span>
            </div>
            <div className="mt-6 grid grid-cols-3 border-t border-black/7 py-4">
              <Stat
                value={`${Math.round(agency.stats.jobSuccessScore)}%`}
                label="Success"
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
          </section>

          <section className="rounded-2xl border border-black/8 bg-white p-5">
            <h2 className="text-sm font-semibold">Company details</h2>
            <dl className="mt-4 grid gap-4 text-xs">
              <Detail label="Team size" value={agency.size || NOT_AVAILABLE} />
              <Detail
                label="Founded"
                value={
                  agency.createdAt
                    ? String(new Date(agency.createdAt).getFullYear())
                    : NOT_AVAILABLE
                }
              />
              <Detail label="Response time" value="Within 1 day" />
              <Detail
                label="Languages"
                value={
                  agency.ownerLanguages.length > 0
                    ? agency.ownerLanguages.join(", ")
                    : NOT_AVAILABLE
                }
              />
            </dl>
          </section>
        </aside>

        <div className="grid min-w-0 gap-6">
          <section className="overflow-hidden rounded-2xl border border-black/8 bg-white">
            <div className="bg-[radial-gradient(circle_at_82%_18%,rgba(220,157,120,.35),transparent_34%),linear-gradient(135deg,#f7e5da,#fcf7f4)] p-6 sm:p-9">
              <p className="text-xs font-semibold tracking-[0.13em] text-[#e66d31] uppercase">
                Available for selected projects
              </p>
              <h2 className="mt-4 max-w-3xl text-3xl font-semibold tracking-[-0.045em] sm:text-4xl">
                {agency.professionalTitle || NOT_AVAILABLE}
              </h2>
              <p className="mt-5 max-w-3xl text-sm leading-7 text-[#706c67]">
                {agency.overview}
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                {agency.tags.length > 0 ? (
                  agency.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-white/85 px-3 py-2 text-xs font-medium text-[#d85a1b]"
                    >
                      {tag}
                    </span>
                  ))
                ) : (
                  <span className="rounded-full bg-white/85 px-3 py-2 text-xs font-medium text-[#d85a1b]">
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
              <div className="grid gap-4 md:grid-cols-2">
                {agency.portfolio.map((project) => (
                  <article
                    key={project.id}
                    className="group flex min-w-0 flex-col overflow-hidden rounded-xl border border-black/9 bg-white transition duration-200 hover:-translate-y-0.5 hover:border-black/14 hover:shadow hover:shadow-black/2"
                  >
                    <div
                      className="relative aspect-video overflow-hidden bg-[#f5dccd] bg-cover bg-center"
                      style={{
                        backgroundImage: `url(${project.coverImage.url})`,
                      }}
                    >
                      <div className="absolute inset-0 bg-linear-to-t from-black/28 via-transparent to-transparent opacity-70" />
                    </div>
                    <div className="flex flex-1 flex-col p-5">
                      <p className="text-[10px] font-semibold tracking-[0.12em] text-[#e66d31] uppercase">
                        {project.category}
                      </p>
                      <h3 className="mt-2 line-clamp-2 text-base font-semibold tracking-[-0.015em] text-[#2d2b28]">
                        {project.title}
                      </h3>
                      <p className="mt-2 line-clamp-3 text-xs leading-5 text-[#7c7874]">
                        {project.description}
                      </p>
                      <div className="mt-5 border-t border-black/7 pt-4">
                        {project.liveUrl ? (
                          <a
                            href={project.liveUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#dd5c1b] transition hover:text-[#a44414]"
                          >
                            View live project
                            <Icon icon="solar:arrow-right-up-linear" width="15" />
                          </a>
                        ) : (
                          <span className="text-xs text-[#9b9894]">
                            Portfolio case study
                          </span>
                        )}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </ProfileSection>

          <ProfileSection
            eyebrow="Our specialists"
            title="Featured company members"
            detail={`${agency.members.length} company member${agency.members.length === 1 ? "" : "s"}`}
          >
            <FeaturedMembers members={agency.members} />
          </ProfileSection>

          <AgencyWorkHistory
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
          <p className="text-[10px] font-semibold tracking-[0.13em] text-[#e66d31] uppercase">
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
      <dt className="text-base font-semibold">{value}</dt>
      <dd className="mt-1 text-[10px] text-[#8f8b87]">{label}</dd>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="text-[#8e8a86]">{label}</dt>
      <dd className="text-right font-medium text-[#44413e]">{value}</dd>
    </div>
  );
}
