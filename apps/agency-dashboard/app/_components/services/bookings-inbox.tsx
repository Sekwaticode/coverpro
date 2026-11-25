"use client";

// Shared with apps/freelancer-dashboard/app/_components/services/bookings-inbox.tsx (keep in sync).
import { useAuth } from "@clerk/nextjs";
import { Icon } from "@iconify/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { format } from "timeago.js";
import { usePayoutDetails } from "./payout-details-form";

type BookingStatus = "REQUESTED" | "ACCEPTED" | "DECLINED" | "CANCELLED" | "PAID";

type ReceivedBooking = {
  id: string;
  title: string;
  price: number;
  milestones: { title: string; amount: number; days: number }[];
  note: string | null;
  preferredStart: string | null;
  status: BookingStatus;
  conversationId: string | null;
  contractId: string | null;
  createdAt: string;
  client: { name: string; avatarUrl: string | null };
};

const badges: Record<BookingStatus, { label: string; className: string }> = {
  REQUESTED: { label: "New request", className: "bg-[#faece4] text-[#d85a1b]" },
  ACCEPTED: { label: "Accepted – awaiting payment", className: "bg-[#e8f3ea] text-[#3f7a4d]" },
  PAID: { label: "Paid – contract active", className: "bg-[#e3eefb] text-[#2f5f93]" },
  DECLINED: { label: "Declined", className: "bg-[#f0eeec] text-[#7c7874]" },
  CANCELLED: { label: "Cancelled by client", className: "bg-[#f0eeec] text-[#7c7874]" },
};

const rand = (value: number) => `R${value.toLocaleString("en-ZA", { maximumFractionDigits: 2 })}`;

export function BookingsInbox({ scope }: { scope?: "agency" }) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const scopeParam = scope ? `&scope=${scope}` : "";
  const queryKey = ["received-bookings", scope ?? "personal"];
  const [busyId, setBusyId] = useState<string | null>(null);
  const payouts = usePayoutDetails(scope);
  const needsPayouts = payouts.data ? !payouts.data.configured : false;
  const [error, setError] = useState("");

  const { data: bookings = [], isLoading } = useQuery<ReceivedBooking[]>({
    queryKey,
    queryFn: async () => {
      const token = await getToken();
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SERVER_URI}/bookings/received?role=freelancer${scopeParam}`,
        { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" },
      );
      const result = await response.json();
      if (!response.ok) throw new Error(result.message);
      return result.data;
    },
  });

  const respond = async (booking: ReceivedBooking, action: "accept" | "decline") => {
    if (busyId) return;
    let reason: string | null = null;
    if (action === "decline") {
      reason = window.prompt("Let the client know why (optional):", "");
      if (reason === null) return; // cancelled the prompt
    }
    setBusyId(booking.id);
    setError("");
    try {
      const token = await getToken();
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SERVER_URI}/bookings/${booking.id}/${action}?role=freelancer${scopeParam}`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify(action === "decline" ? { reason } : {}),
        },
      );
      const result = await response.json();
      if (!response.ok) throw new Error(result.message);
      await queryClient.invalidateQueries({ queryKey });
    } catch (err) {
      setError(err instanceof Error ? err.message : "The request could not be updated.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <p className="text-xs font-semibold tracking-[.14em] text-[#e66d31] uppercase">Bookings</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-[-.045em] sm:text-4xl">
        Booking requests
      </h1>
      <p className="mt-2 text-sm text-[#77736f]">
        Clients asking to book your services. Accept to open a chat and agree on the details;
        the client then pays into escrow.
      </p>

      {needsPayouts && (
        <div className="mt-5 flex flex-col justify-between gap-3 rounded-2xl border border-[#ebcfbf] bg-[#faece4] p-4 sm:flex-row sm:items-center">
          <p className="flex gap-2 text-sm text-[#8a3f16]">
            <Icon icon="solar:wallet-money-linear" width="20" className="mt-0.5 shrink-0" />
            Add your payout details so clients can pay you through escrow. You need them before
            you can accept a booking.
          </p>
          <Link
            href="/payout-details"
            className="inline-flex h-10 shrink-0 items-center justify-center rounded-xl bg-[#272624] px-4 text-xs font-semibold text-white"
          >
            Add payout details
          </Link>
        </div>
      )}

      {error && <p className="mt-5 text-sm text-[#a65050]">{error}</p>}

      <div className="mt-6 grid gap-4">
        {isLoading && (
          <div className="animate-pulse rounded-2xl border border-black/8 bg-white p-6">
            <div className="h-5 w-40 rounded bg-[#ebe9e6]" />
            <div className="mt-4 h-4 w-64 rounded bg-[#ebe9e6]" />
          </div>
        )}

        {!isLoading && !bookings.length && (
          <div className="rounded-2xl border border-black/8 bg-white px-6 py-16 text-center">
            <Icon icon="solar:calendar-linear" width="34" className="mx-auto text-[#8a8682]" />
            <h2 className="mt-4 font-semibold">No booking requests yet</h2>
            <p className="mt-2 text-sm text-[#817d79]">
              When a client requests one of your services, it will show up here.
            </p>
          </div>
        )}

        {bookings.map((booking) => {
          const badge = badges[booking.status] ?? badges.REQUESTED;
          return (
            <article key={booking.id} className="rounded-2xl border border-black/8 bg-white p-5 sm:p-6">
              <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-semibold">{booking.title}</h2>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${badge.className}`}>
                      {badge.label}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-[#807c78]">
                    {booking.client.name} · {format(booking.createdAt)}
                  </p>
                  <p className="mt-3 text-xs text-[#6b6763]">
                    {rand(booking.price)} · {booking.milestones.length}{" "}
                    {booking.milestones.length === 1 ? "milestone" : "milestones"}
                    {booking.preferredStart && ` · Preferred start ${booking.preferredStart}`}
                  </p>
                  {booking.note && (
                    <blockquote className="mt-3 rounded-xl bg-[#fcf8f5] px-4 py-3 text-sm leading-6 whitespace-pre-line text-[#4d4a46]">
                      {booking.note}
                    </blockquote>
                  )}
                </div>

                <div className="flex shrink-0 gap-2">
                  {booking.status === "REQUESTED" && (
                    <>
                      <button
                        type="button"
                        disabled={busyId === booking.id}
                        onClick={() => void respond(booking, "decline")}
                        className="h-10 cursor-pointer rounded-xl border border-black/10 px-4 text-xs font-semibold hover:bg-black/3 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Decline
                      </button>
                      <button
                        type="button"
                        disabled={busyId === booking.id}
                        onClick={() => void respond(booking, "accept")}
                        className="h-10 cursor-pointer rounded-xl bg-[#272624] px-4 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {busyId === booking.id ? "Working…" : "Accept & chat"}
                      </button>
                    </>
                  )}
                  {booking.status === "PAID" && booking.contractId && (
                    <Link
                      href={`/contracts?contractId=${booking.contractId}`}
                      className="inline-flex h-10 items-center rounded-xl border border-black/10 px-4 text-xs font-semibold hover:bg-black/3"
                    >
                      View contract
                    </Link>
                  )}
                  {(booking.status === "ACCEPTED" || booking.status === "PAID") && booking.conversationId && (
                    <Link
                      href={`/messages?conversationId=${booking.conversationId}`}
                      className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-[#272624] px-4 text-xs font-semibold text-white"
                    >
                      <Icon icon="solar:chat-round-dots-linear" width="16" />
                      Open chat
                    </Link>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
