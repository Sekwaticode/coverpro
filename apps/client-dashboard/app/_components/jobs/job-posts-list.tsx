"use client";
import { useAuth } from "@clerk/nextjs";
import { Icon } from "@iconify/react";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import React from "react";

type JobPost = {
  id: string;
  title: string;
  description: string;
  expertise_level: string;
  expected_duration: string;
  skills: string[];
  total_budget: string;
  status: string;
  proposalCount?: number;
  shortlistCount?: number;
  hireCount?: number;
  created_at: string | null;
};

const JobPostsList = () => {
  const { getToken } = useAuth();
  const {
    data: jobs = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["client-job-posts"],
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error("Your session has expired.");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SERVER_URI}/jobs?role=client`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.message || "Job posts could not be loaded.");
      return result.data as JobPost[];
    },
  });

  if (isLoading) return <JobPostsSkeleton />;
  if (error) return <Message text={error.message} />;
  if (!jobs.length) return <Message text="You have not posted any jobs yet." />;
  return (
    <div className="mt-8 grid gap-4">
      {jobs.map((job) => {
        const open = job.status === "PUBLISHED";
        const hasHires = (job.hireCount ?? 0) > 0;

        return (
          <article
            key={job.id}
            className="rounded-2xl border border-black/8 bg-white p-5 sm:p-6"
          >
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                      open
                        ? "bg-[#fae7dc] text-[#d85a1b]"
                        : "bg-[#f1f0e7] text-[#766f47]"
                    }`}
                  >
                    {open
                      ? "Open"
                      : job.status === "DRAFT"
                        ? "Draft"
                        : "Closed"}
                  </span>
                  <span className="text-[10px] text-[#8f8b87]">
                    {job.created_at
                      ? `${formatDistanceToNow(new Date(job.created_at))} ago`
                      : "Recently created"}
                  </span>
                </div>
                <h2 className="mt-3 text-lg font-semibold">{job.title}</h2>
                <p className="mt-2 text-xs text-[#7b7773]">
                  Fixed price · ${Number(job.total_budget).toLocaleString()} ·{" "}
                  {job.expertise_level} · {job.expected_duration}
                </p>
              </div>
              <div className="flex flex-wrap items-start justify-end gap-2">
                {!hasHires && (
                  <Link
                    href={`/jobs/${job.id}/edit`}
                    className="h-10 rounded-xl border border-black/10 px-4 py-3 text-xs font-semibold"
                  >
                    Edit
                  </Link>
                )}
                {open && (
                  <Link
                    href={`/proposals?job=${job.id}`}
                    className="h-10 rounded-xl bg-[#272624] px-4 py-3 text-xs font-semibold text-white"
                  >
                    Review proposals
                  </Link>
                )}
              </div>
            </div>

            <p className="truncate mt-5 max-w-4xl text-sm leading-6 text-[#75716d]">
              {job.description}
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              {job?.skills?.map((skill) => (
                <span
                  key={skill}
                  className="rounded-lg bg-[#f8efe9] px-2.5 py-1.5 text-[10px] text-[#706962]"
                >
                  {skill}
                </span>
              ))}
            </div>

            <div className="mt-5 grid grid-cols-3 gap-3 border-t border-black/7 pt-4 sm:max-w-md">
              <JobStat label={"Proposals"} value={job.proposalCount || 0} />
              <JobStat label={"Shortlisted"} value={job.shortlistCount || 0} />
              <JobStat label={"Hires"} value={job.hireCount || 0} />
            </div>
          </article>
        );
      })}
    </div>
  );
};

export default JobPostsList;

function JobStat({ label, value }: { value: number; label: string }) {
  return (
    <div>
      <p className="text-base font-semibold">{value}</p>
      <p className="mt-1 text-[10px] text-[#8f8b87]">{label}</p>
    </div>
  );
}

function Message({ text }: { text: string }) {
  return (
    <div className="mt-8 rounded-2xl border border-black/8 bg-white p-8 text-center text-sm text-[#797570]">
      {text}
    </div>
  );
}

function JobPostsSkeleton() {
  return (
    <div className="mt-8 grid gap-4" aria-label="Loading job posts">
      {[1, 2].map((item) => (
        <div
          key={item}
          className="animate-pulse rounded-2xl border border-black/8 bg-white p-5 sm:p-6"
        >
          <div className="flex justify-between gap-6">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="h-6 w-14 rounded-full bg-[#ebe9e6]" />
                <span className="h-2.5 w-20 rounded-full bg-[#f0eeec]" />
              </div>
              <div className="mt-4 h-5 w-full max-w-lg rounded-md bg-[#e7e4e2]" />
              <div className="mt-3 h-3 w-72 max-w-full rounded bg-[#f0eeec]" />
            </div>
            <div className="hidden gap-2 sm:flex">
              <span className="h-10 w-16 rounded-xl bg-[#f0eeec]" />
              <span className="h-10 w-32 rounded-xl bg-[#e7e4e2]" />
            </div>
          </div>

          <div className="mt-6 grid max-w-4xl gap-2">
            <span className="h-3 w-full rounded bg-[#f0eeec]" />
            <span className="h-3 w-4/5 rounded bg-[#f0eeec]" />
          </div>

          <div className="mt-5 flex gap-2">
            {[70, 86, 62, 92].map((width) => (
              <span
                key={width}
                style={{ width }}
                className="h-7 rounded-lg bg-[#f7ece6]"
              />
            ))}
          </div>

          <div className="mt-5 grid max-w-md grid-cols-3 gap-3 border-t border-black/7 pt-4">
            {[1, 2, 3].map((stat) => (
              <div key={stat} className="grid gap-2">
                <span className="h-4 w-6 rounded bg-[#e7e4e2]" />
                <span className="h-2.5 w-16 rounded bg-[#f0eeec]" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
