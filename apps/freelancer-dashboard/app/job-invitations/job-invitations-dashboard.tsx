"use client";

import { useAuth, useUser } from "@clerk/nextjs";
import { Icon } from "@iconify/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { format } from "timeago.js";
import { DashboardHeader } from "../_components/dashboard/dashboard-header";
import { WorkspaceSidebar } from "../_components/dashboard/workspace-sidebar";

type JobInvitation = {
  id: string;
  status: "PENDING" | "APPLIED" | "DECLINED";
  message: string | null;
  createdAt: string;
  clientName: string;
  forAgency: boolean;
  job: {
    id: string;
    title: string;
    status: string;
    totalBudget: number;
    expectedDuration: string;
    skills: string[];
  };
};

const statusBadge: Record<JobInvitation["status"], { label: string; className: string }> = {
  PENDING: { label: "New", className: "bg-[#faece4] text-[#d85a1b]" },
  APPLIED: { label: "Applied", className: "bg-[#e8f3ea] text-[#3f7a4d]" },
  DECLINED: { label: "Declined", className: "bg-[#f0eeec] text-[#7c7874]" },
};

export function JobInvitationsDashboard() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const [decliningId, setDecliningId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const { data: invitations = [], isLoading } = useQuery<JobInvitation[]>({
    queryKey: ["my-job-invitations"],
    enabled: Boolean(user),
    queryFn: async () => {
      const token = await getToken();
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SERVER_URI}/invitations/received?role=freelancer`,
        { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" },
      );
      const result = await response.json();
      if (!response.ok) throw new Error(result.message);
      return result.data;
    },
  });

  const decline = async (invitation: JobInvitation) => {
    if (decliningId) return;
    setDecliningId(invitation.id);
    setError("");
    try {
      const token = await getToken();
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SERVER_URI}/invitations/${invitation.id}/decline?role=freelancer`,
        { method: "POST", headers: { Authorization: `Bearer ${token}` } },
      );
      const result = await response.json();
      if (!response.ok) throw new Error(result.message);
      await queryClient.invalidateQueries({ queryKey: ["my-job-invitations"] });
    } catch (err) {
      setError(err instanceof Error ? err.message : "The invitation could not be declined.");
    } finally {
      setDecliningId(null);
    }
  };

  return (
    <div className="min-h-svh bg-[#faf3ee] font-(family-name:--font-dm-sans) text-[#272624]">
      <DashboardHeader />
      <main className="mx-auto max-w-360 px-5 py-8 sm:px-8 lg:py-10">
        <div className="grid items-start gap-6 xl:grid-cols-[240px_minmax(0,1fr)]">
          <WorkspaceSidebar />

          <div className="min-w-0">
            <p className="text-xs font-semibold tracking-[0.14em] text-[#e66d31] uppercase">
              Invitations
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-[-0.045em] sm:text-4xl">
              Job invitations
            </h1>
            <p className="mt-2 text-sm text-[#77736f]">
              Clients who saw your profile and want you to apply to their job.
            </p>

            {error && <p className="mt-5 text-sm text-[#a65050]">{error}</p>}

            <div className="mt-6 grid gap-4">
              {isLoading && (
                <div className="animate-pulse rounded-2xl border border-black/8 bg-white p-6">
                  <div className="h-5 w-40 rounded bg-[#ebe9e6]" />
                  <div className="mt-4 h-4 w-64 rounded bg-[#ebe9e6]" />
                </div>
              )}

              {!isLoading &&
                invitations.map((invitation) => {
                  const badge = statusBadge[invitation.status] ?? statusBadge.PENDING;
                  const jobOpen = invitation.job.status === "PUBLISHED";
                  return (
                    <article
                      key={invitation.id}
                      className="rounded-2xl border border-black/8 bg-white p-5 sm:p-6"
                    >
                      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h2 className="truncate font-semibold">{invitation.job.title}</h2>
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${badge.className}`}
                            >
                              {badge.label}
                            </span>
                            {invitation.forAgency && (
                              <span className="rounded-full bg-[#f8ede6] px-2 py-0.5 text-[10px] font-semibold text-[#e25e1c]">
                                For your company
                              </span>
                            )}
                          </div>
                          <p className="mt-1 text-xs text-[#807c78]">
                            {invitation.clientName} invited you · {format(invitation.createdAt)}
                          </p>
                          <p className="mt-3 text-xs text-[#6b6763]">
                            R{invitation.job.totalBudget.toLocaleString("en-ZA")} ·{" "}
                            {invitation.job.expectedDuration}
                          </p>
                          {invitation.message && (
                            <blockquote className="mt-3 rounded-xl bg-[#fcf8f5] px-4 py-3 text-sm leading-6 text-[#4d4a46]">
                              “{invitation.message}”
                            </blockquote>
                          )}
                          {invitation.job.skills.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-1.5">
                              {invitation.job.skills.slice(0, 5).map((skill) => (
                                <span
                                  key={skill}
                                  className="rounded-md bg-[#f8eee9] px-2 py-1 text-[10px] font-medium text-[#706a64]"
                                >
                                  {skill}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="flex shrink-0 gap-2">
                          {!jobOpen ? (
                            <span className="text-xs text-[#8b8783]">Job no longer open</span>
                          ) : invitation.status === "PENDING" ? (
                            <>
                              {!invitation.forAgency && (
                                <button
                                  type="button"
                                  disabled={decliningId === invitation.id}
                                  onClick={() => void decline(invitation)}
                                  className="h-10 cursor-pointer rounded-xl border border-black/10 px-4 text-xs font-semibold hover:bg-black/3 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  {decliningId === invitation.id ? "Declining…" : "Decline"}
                                </button>
                              )}
                              <Link
                                href={`/jobs/${invitation.job.id}`}
                                className="inline-flex h-10 items-center rounded-xl bg-[#272624] px-4 text-xs font-semibold text-white"
                              >
                                View job & apply
                              </Link>
                            </>
                          ) : (
                            <Link
                              href={`/jobs/${invitation.job.id}`}
                              className="inline-flex h-10 items-center rounded-xl border border-black/10 px-4 text-xs font-semibold hover:bg-black/3"
                            >
                              View job
                            </Link>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })}

              {!isLoading && !invitations.length && (
                <div className="rounded-2xl border border-black/8 bg-white px-6 py-16 text-center">
                  <Icon icon="solar:letter-linear" width="34" className="mx-auto text-[#8a8682]" />
                  <h2 className="mt-4 font-semibold">No job invitations yet</h2>
                  <p className="mt-2 text-sm text-[#817d79]">
                    When a client invites you to apply to a job, it will show up here.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
