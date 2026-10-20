import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "../../_components/landing-page/header";
import styles from "./agency-profile.module.css";

interface AgencyPortfolioItem {
  id: string;
  title: string;
  category: string;
  description: string;
  liveUrl: string | null;
  coverImage: { imageId: string; url: string };
}

interface AgencyMember {
  id: string;
  freelancerId: string;
  profileId: string | null;
  name: string;
  avatarUrl: string | null;
  role: string;
  skills: string[];
  isOwner: boolean;
  rating: number;
  jobSuccessScore: number;
  completedProjects: number;
}

interface AgencyWorkHistoryItem {
  id: string;
  title: string;
  client: string;
  status: "ACTIVE" | "COMPLETED";
  completed: string | null;
  rating: number | null;
  review: string | null;
}

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
  portfolio: AgencyPortfolioItem[];
  ownerLocation: string | null;
  ownerLanguageDetails: Array<{ language: string; proficiency: string }>;
  members: AgencyMember[];
  createdAt: string | null;
  stats: {
    totalEarning: number;
    completedJobs: number;
    reviewCount: number;
    jobSuccessScore: number;
    rating: number | null;
  };
  workHistory: AgencyWorkHistoryItem[];
}

function initialsFor(name: string) {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "?"
  );
}

function earningsTierFor(totalEarning: number) {
  if (totalEarning <= 0) return "New on CoverPro";
  if (totalEarning < 1000) return `R${Math.round(totalEarning)}`;
  return `R${Math.floor(totalEarning / 1000)}k+`;
}

async function getAgencyProfile(id: string): Promise<AgencyProfile | null> {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_SERVER_URI}/agency/profile/${id}`,
    { cache: "no-store" },
  );
  if (response.status === 404) return null;
  if (!response.ok) return null;
  const result = await response.json();
  return result.data as AgencyProfile;
}

interface AgencyProfilePageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: AgencyProfilePageProps): Promise<Metadata> {
  const agency = await getAgencyProfile((await params).id);
  return {
    title: agency
      ? `${agency.name} — Company profile | CoverPro`
      : "Company profile | CoverPro",
  };
}

export default async function AgencyProfilePage({
  params,
}: AgencyProfilePageProps) {
  const { id } = await params;
  const agency = await getAgencyProfile(id);
  if (!agency) notFound();

  const initials = initialsFor(agency.name);
  const reviews = agency.workHistory.filter((item) => item.review);
  const foundedYear = agency.createdAt
    ? new Date(agency.createdAt).getFullYear()
    : null;

  return (
    <div className="min-h-svh bg-[#fbf5f2] font-(family-name:--font-dm-sans) text-[#23211f]">
      <Header />
      <main>
        <div className="mx-auto max-w-7xl px-5 py-6 sm:px-8 lg:px-10">
          <nav
            className="flex items-center gap-2 text-sm text-[#787470]"
            aria-label="Breadcrumb"
          >
            <Link href="/agencies" className="hover:text-[#b84c17]">
              Companies
            </Link>
            <span aria-hidden="true">/</span>
            <span className="truncate text-[#42403d]">{agency.name}</span>
          </nav>
        </div>

        <section className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <div className="relative overflow-hidden rounded-3xl border border-black/6 bg-[#f6e5dc] p-6 sm:p-9 lg:p-11">
            <div
              className="absolute inset-0 bg-[radial-gradient(circle_at_78%_18%,rgba(255,255,255,0.8),transparent_30%),radial-gradient(circle_at_82%_100%,rgba(217,164,133,0.48),transparent_36%)]"
              aria-hidden="true"
            ></div>
            <div className="relative flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
                {agency.avatarImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={agency.avatarImage.url}
                    alt=""
                    className="h-28 w-28 shrink-0 rounded-3xl object-cover shadow-lg shadow-black/8 sm:h-32 sm:w-32"
                  />
                ) : (
                  <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-3xl bg-[#cc5519] text-2xl font-bold text-white shadow-lg shadow-black/8 sm:h-32 sm:w-32">
                    {initials}
                  </div>
                )}
                <div>
                  <h1 className={`${styles.profileTitle} text-[#201b18]`}>
                    {agency.name}
                  </h1>
                  <p className="mt-2 text-lg text-[#635e58]">
                    {agency.professionalTitle || agency.specialty}
                  </p>
                  <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-[#706a65]">
                    <span>{agency.specialty}</span>
                    {agency.ownerLocation && <span>{agency.ownerLocation}</span>}
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/signup?role=client"
                  className="rounded-xl border border-black/10 cursor-pointer bg-white/70 px-4 py-3 text-sm font-semibold transition hover:bg-white"
                >
                  Save profile
                </Link>
                <Link
                  href="/signup?role=client"
                  className="rounded-xl bg-[#272624] px-5 py-3 text-sm font-semibold text-white! transition hover:bg-[#3e3c39]"
                >
                  Hire this company
                </Link>
              </div>
            </div>
          </div>

          <div className="relative z-10 mx-4 -mt-5 grid grid-cols-2 overflow-hidden rounded-2xl border border-black/7 bg-white shadow-xl shadow-black/4 sm:mx-8 sm:grid-cols-4 lg:mx-12">
            {[
              ["Job success", `${Math.round(agency.stats.jobSuccessScore)}%`],
              ["Projects completed", agency.stats.completedJobs],
              [
                "Client rating",
                agency.stats.rating ? `${agency.stats.rating.toFixed(1)} / 5` : "New",
              ],
              ["Total earned", earningsTierFor(agency.stats.totalEarning)],
            ].map(([label, value], index) => (
              <div
                key={label}
                className={`px-4 py-5 text-center ${index > 0 ? "sm:border-l sm:border-black/7" : ""} ${index > 1 ? "border-t border-black/7 sm:border-t-0" : ""}`}
              >
                <p className="text-lg font-semibold">{value}</p>
                <p className="mt-1 text-xs text-[#85827e]">{label}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="mx-auto grid max-w-7xl items-start gap-7 px-5 py-12 sm:px-8 lg:grid-cols-[1fr_20rem] lg:px-10">
          <div className="space-y-7">
            <section className="rounded-2xl border border-black/7 bg-white p-6 sm:p-8">
              <h2 className={styles.sectionTitle}>About</h2>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-[#686562] sm:text-base">
                {agency.overview}
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                {agency.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-lg bg-[#f7ede7] px-3 py-2 text-xs font-semibold text-[#625d57]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </section>

            {agency.members.length > 0 && (
              <section className="rounded-2xl border border-black/7 bg-white p-6 sm:p-8">
                <p className="text-xs font-semibold uppercase tracking-[0.13em] text-[#e66d31]">
                  Our specialists
                </p>
                <h2 className={`${styles.sectionTitle} mt-2`}>Company team</h2>
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  {agency.members.map((member) => {
                    const memberInitials = initialsFor(member.name);
                    const card = (
                      <div className="flex items-start gap-3 rounded-xl border border-black/7 p-4 transition hover:bg-[#faf3ef]">
                        {member.avatarUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={member.avatarUrl}
                            alt=""
                            className="h-11 w-11 shrink-0 rounded-full object-cover"
                          />
                        ) : (
                          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#cc5519] text-sm font-semibold text-white">
                            {memberInitials}
                          </span>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold">
                            {member.name}
                            {member.isOwner && (
                              <span className="ml-1.5 text-xs font-normal text-[#8a8682]">
                                (Owner)
                              </span>
                            )}
                          </p>
                          <p className="mt-0.5 text-xs text-[#77736f]">
                            {member.role}
                          </p>
                        </div>
                      </div>
                    );
                    return member.profileId ? (
                      <Link key={member.id} href={`/talent/${member.profileId}`}>
                        {card}
                      </Link>
                    ) : (
                      <div key={member.id}>{card}</div>
                    );
                  })}
                </div>
              </section>
            )}

            {agency.portfolio.length > 0 && (
              <section className="rounded-2xl border border-black/7 bg-white p-6 sm:p-8">
                <p className="text-xs font-semibold uppercase tracking-[0.13em] text-[#e66d31]">
                  Selected work
                </p>
                <h2 className={`${styles.sectionTitle} mt-2`}>Portfolio</h2>
                <div className="mt-6 grid gap-4 sm:grid-cols-3">
                  {agency.portfolio.map((project) => (
                    <article key={project.id}>
                      <div className="relative aspect-4/3 overflow-hidden rounded-xl bg-[#f5e8e0]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={project.coverImage.url}
                          alt={project.title}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <h3 className={`${styles.itemTitle} mt-3`}>
                        {project.title}
                      </h3>
                      <p className="mt-1 text-xs text-[#85827e]">
                        {project.category}
                      </p>
                    </article>
                  ))}
                </div>
              </section>
            )}

            {reviews.length > 0 && (
              <section className="rounded-2xl border border-black/7 bg-white p-6 sm:p-8">
                <h2 className={styles.sectionTitle}>Client reviews</h2>
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  {reviews.map((item) => (
                    <article
                      key={item.id}
                      className="rounded-xl bg-[#faf4f0] p-5"
                    >
                      <p className="text-sm tracking-widest text-[#d2a43b]">
                        {"★".repeat(item.rating ?? 0)}
                        {"☆".repeat(5 - (item.rating ?? 0))}
                      </p>
                      <blockquote className="mt-3 text-sm leading-6 text-[#5a5753]">
                        &ldquo;{item.review}&rdquo;
                      </blockquote>
                      <p className="mt-5 text-sm font-semibold">
                        {item.client}
                      </p>
                      <p className="mt-1 text-xs text-[#87837f]">
                        {item.title}
                      </p>
                    </article>
                  ))}
                </div>
                {agency.stats.rating !== null && (
                  <p className="mt-5 text-sm text-[#74706c]">
                    {agency.stats.rating.toFixed(1)} average from{" "}
                    {agency.stats.reviewCount} verified client reviews
                  </p>
                )}
              </section>
            )}

            {agency.workHistory.length > 0 && (
              <section className="rounded-2xl border border-black/7 bg-white p-6 sm:p-8">
                <h2 className={styles.sectionTitle}>Work history</h2>
                <div className="mt-6 space-y-6">
                  {agency.workHistory.map((item) => (
                    <div
                      key={item.id}
                      className="grid gap-2 border-l-2 border-[#e9cbb9] pl-5 sm:grid-cols-[1fr_auto]"
                    >
                      <div>
                        <h3 className={styles.itemTitle}>{item.title}</h3>
                        <p className="mt-1 text-sm text-[#77736f]">
                          {item.client}
                        </p>
                      </div>
                      <p className="text-xs font-medium text-[#8e8b87]">
                        {item.status === "ACTIVE" ? "In progress" : "Completed"}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          <aside className="sticky top-24 rounded-2xl border border-black/7 bg-white p-6 shadow-lg shadow-black/3">
            <p className="text-xs font-semibold uppercase tracking-[0.13em] text-[#807265]">
              Work with {agency.name}
            </p>
            <Link
              href="/signup?role=client"
              className="mt-6 block rounded-xl bg-[#272624] px-4 py-3 text-center text-sm font-semibold text-white! transition hover:bg-[#3e3c39]"
            >
              Hire this company
            </Link>
            <Link
              href="/signup?role=client"
              className="mt-3 block rounded-xl text-center border border-black/10 px-4 py-3 text-sm font-semibold transition hover:bg-[#faf3ef]"
            >
              Send a message
            </Link>
            <div className="mt-6 space-y-4 border-t border-black/7 pt-6 text-sm">
              <div className="flex items-center justify-between gap-4">
                <span className="text-[#7e7b77]">Team size</span>
                <span className="font-semibold">{agency.size}</span>
              </div>
              <div className="flex items-start justify-between gap-4">
                <span className="shrink-0 text-[#7e7b77]">Specialty</span>
                <span className="text-right font-semibold">
                  {agency.specialty}
                </span>
              </div>
              {foundedYear && (
                <div className="flex items-center justify-between gap-4">
                  <span className="text-[#7e7b77]">Founded</span>
                  <span className="font-semibold">{foundedYear}</span>
                </div>
              )}
              {agency.website && (
                <div className="flex items-center justify-between gap-4">
                  <span className="text-[#7e7b77]">Website</span>
                  <a
                    href={agency.website}
                    target="_blank"
                    rel="noreferrer"
                    className="truncate font-semibold text-[#cc5519] hover:underline"
                  >
                    Visit
                  </a>
                </div>
              )}
              {agency.ownerLanguageDetails.map(({ language, proficiency }) => (
                <div
                  key={language}
                  className="flex items-center justify-between gap-4"
                >
                  <span className="text-[#7e7b77]">{language}</span>
                  <span className="font-semibold">{proficiency}</span>
                </div>
              ))}
            </div>
            <div className="mt-6 rounded-xl bg-[#faece4] p-4">
              <p className="text-xs font-semibold text-[#cc5519]">
                CoverPro protected
              </p>
              <p className="mt-1 text-xs leading-5 text-[#777069]">
                Secure payments, verified work history, and dedicated support.
              </p>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
