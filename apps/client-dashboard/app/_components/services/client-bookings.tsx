"use client";

import { useAuth } from "@clerk/nextjs";
import { Icon } from "@iconify/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { useState } from "react";
import { rand } from "./profile-services";

type BookingStatus = "REQUESTED" | "ACCEPTED" | "DECLINED" | "CANCELLED" | "PAID";

type ClientBooking = {
  id: string;
  title: string;
  price: number;
  milestones: { title: string; amount: number; days: number }[];
  note: string | null;
  preferredStart: string | null;
  status: BookingStatus;
  declineReason: string | null;
  conversationId: string | null;
  contractId: string | null;
  createdAt: string;
  pro: {
    type: "Freelancer" | "Agency";
    profileId: string;
    name: string;
    avatarUrl: string | null;
    verified: boolean;
  } | null;
};

const badges: Record<BookingStatus, { label: string; className: string }> = {
  REQUESTED: { label: "Waiting for pro", className: "bg-[#fdf3dc] text-[#8a6214]" },
  ACCEPTED: { label: "Accepted – chat open", className: "bg-[#e8f3ea] text-[#3f7a4d]" },
  DECLINED: { label: "Declined", className: "bg-[#f0eeec] text-[#7c7874]" },
  CANCELLED: { label: "Cancelled", className: "bg-[#f0eeec] text-[#7c7874]" },
  PAID: { label: "Paid – contract active", className: "bg-[#e3eefb] text-[#2f5f93]" },
};

export function ClientBookings() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const { data: bookings = [], isLoading } = useQuery<ClientBooking[]>({
    queryKey: ["client-bookings"],
    queryFn: async () => {
      const token = await getToken();
      const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URI}/bookings?role=client`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message);
      return result.data;
    },
  });

  const pay = async (booking: ClientBooking) => {
    if (busyId) return;
    setBusyId(booking.id);
    setError("");
    try {
      const token = await getToken();
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SERVER_URI}/bookings/${booking.id}/checkout?role=client`,
        { method: "POST", headers: { Authorization: `Bearer ${token}` } },
      );
      const result = await response.json();
      if (!response.ok) throw new Error(result.message);
      window.location.assign(result.data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout could not start.");
      setBusyId(null);
    }
  };

  const cancel = async (booking: ClientBooking) => {
    if (busyId || !window.confirm(`Cancel your request for “${booking.title}”?`)) return;
    setBusyId(booking.id);
    setError("");
    try {
      const token = await getToken();
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SERVER_URI}/bookings/${booking.id}/cancel?role=client`,
        { method: "POST", headers: { Authorization: `Bearer ${token}` } },
      );
      const result = await response.json();
      if (!response.ok) throw new Error(result.message);
      await queryClient.invalidateQueries({ queryKey: ["client-bookings"] });
    } catch (err) {
      setError(err instanceof Error ? err.message : "The request could not be cancelled.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-semibold tracking-[.14em] text-[#e66d31] uppercase">Hiring</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-.045em] sm:text-4xl">My bookings</h1>
          <p className="mt-2 text-sm text-[#77736f]">
            Services you&apos;ve requested. Once a pro accepts, chat with them to agree on the details.
          </p>
        </div>
        <Link
          href="/talent"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#272624] px-5 text-sm font-semibold text-white"
        >
          <Icon icon="solar:magnifer-linear" width="18" />
          Find pros
        </Link>
      </div>

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
            <h2 className="mt-4 font-semibold">No bookings yet</h2>
            <p className="mt-2 text-sm text-[#817d79]">
              Browse pros, open a profile, and request one of their services.
            </p>
          </div>
        )}

        {bookings.map((booking) => {
          const badge = badges[booking.status] ?? badges.REQUESTED;
          const profileHref = booking.pro
            ? booking.pro.type === "Agency"
              ? `/agency/${booking.pro.profileId}`
              : `/talent/${booking.pro.profileId}`
            : null;
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
                    {profileHref ? (
                      <Link href={profileHref} className="font-semibold text-[#33312f] hover:underline">
                        {booking.pro?.name}
                      </Link>
                    ) : (
                      "Pro"
                    )}{" "}
                    · {rand(booking.price)} · requested{" "}
                    {formatDistanceToNow(new Date(booking.createdAt), { addSuffix: true })}
                  </p>
                  {booking.status === "DECLINED" && booking.declineReason && (
                    <p className="mt-3 rounded-xl bg-[#fcf8f5] px-4 py-3 text-sm text-[#5f5b57]">
                      “{booking.declineReason}”
                    </p>
                  )}
                  {booking.status === "ACCEPTED" && (
                    <p className="mt-3 flex gap-2 text-xs leading-5 text-[#6b6763]">
                      <Icon icon="solar:shield-check-linear" width="16" className="mt-0.5 shrink-0 text-[#dd5c1b]" />
                      Agree on the details in the chat, then pay {rand(booking.price)} into
                      TradeSafe escrow. The pro is paid per milestone, only when you approve it.
                    </p>
                  )}
                </div>

                <div className="flex shrink-0 gap-2">
                  {booking.status === "PAID" && booking.contractId && (
                    <Link
                      href={`/contracts?contractId=${booking.contractId}`}
                      className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-black/10 px-4 text-xs font-semibold hover:bg-black/3"
                    >
                      View contract
                    </Link>
                  )}
                  {(booking.status === "REQUESTED" || booking.status === "ACCEPTED") && (
                    <button
                      type="button"
                      disabled={busyId === booking.id}
                      onClick={() => void cancel(booking)}
                      className="h-10 cursor-pointer rounded-xl border border-black/10 px-4 text-xs font-semibold hover:bg-black/3 disabled:opacity-50"
                    >
                      Cancel request
                    </button>
                  )}
                  {(booking.status === "ACCEPTED" || booking.status === "PAID") &&
                    booking.conversationId && (
                      <Link
                        href={`/messages?conversationId=${booking.conversationId}`}
                        className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-black/10 px-4 text-xs font-semibold hover:bg-black/3"
                      >
                        <Icon icon="solar:chat-round-dots-linear" width="16" />
                        Chat
                      </Link>
                    )}
                  {booking.status === "ACCEPTED" && (
                    <button
                      type="button"
                      disabled={busyId === booking.id}
                      onClick={() => void pay(booking)}
                      className="inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-xl bg-[#272624] px-4 text-xs font-semibold text-white disabled:opacity-50"
                    >
                      <Icon icon="solar:lock-keyhole-linear" width="16" />
                      {busyId === booking.id ? "Opening checkout…" : `Pay ${rand(booking.price)} into escrow`}
                    </button>
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
