"use client";

import { useAuth } from "@clerk/nextjs";
import { Icon } from "@iconify/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

type Milestone = { title: string; description: string; amount: number; days: number };

export type PublicService = {
  id: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  price: number;
  milestones: Milestone[];
  deliveryDays: number;
};

export const rand = (value: number) =>
  `R${value.toLocaleString("en-ZA", { maximumFractionDigits: 2 })}`;

const server = process.env.NEXT_PUBLIC_SERVER_URI;

/** The services a pro or agency offers, shown on their profile, each with a Request button. */
export function ProfileServices({
  owner,
  name,
}: {
  owner: { freelancerId: string } | { agencyId: string };
  name: string;
}) {
  const [requesting, setRequesting] = useState<PublicService | null>(null);
  const params = new URLSearchParams(owner);

  const { data, isLoading } = useQuery({
    queryKey: ["profile-services", params.toString()],
    queryFn: async () => {
      const response = await fetch(`${server}/listings/public?${params.toString()}`, {
        cache: "no-store",
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Could not load services.");
      return result.data.listings as PublicService[];
    },
  });

  return (
    <section id="services" className="scroll-mt-24 rounded-3xl border border-black/8 bg-white p-6">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold tracking-[.14em] text-[#e66d31] uppercase">
            Services
          </p>
          <h2 className="mt-1 text-xl font-semibold">What {name.split(" ")[0]} offers</h2>
        </div>
      </div>

      {isLoading ? (
        <div className="mt-5 h-24 animate-pulse rounded-2xl bg-[#f6f1ed]" />
      ) : !data?.length ? (
        <p className="mt-4 rounded-2xl bg-[#fcf8f5] p-4 text-sm text-[#77736f]">
          {name} hasn&apos;t listed any services yet. You can still message them once you&apos;ve
          worked together.
        </p>
      ) : (
        <div className="mt-5 grid gap-3">
          {data.map((service) => (
            <ServiceCard key={service.id} service={service} onRequest={() => setRequesting(service)} />
          ))}
        </div>
      )}

      {requesting &&
        createPortal(
          <RequestServiceModal
            service={requesting}
            proName={name}
            onClose={() => setRequesting(null)}
          />,
          document.body,
        )}
    </section>
  );
}

function ServiceCard({ service, onRequest }: { service: PublicService; onRequest: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <article className="rounded-2xl border border-black/8 p-4 sm:p-5">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div className="min-w-0">
          <span className="rounded-full bg-[#f8ede6] px-2 py-1 text-[10px] font-semibold text-[#e25e1c]">
            {service.category}
          </span>
          <h3 className="mt-2 font-semibold">{service.title}</h3>
          <p className={`mt-2 text-sm leading-6 whitespace-pre-line text-[#5f5b57] ${open ? "" : "line-clamp-2"}`}>
            {service.description}
          </p>
        </div>
        <div className="shrink-0 sm:text-right">
          <p className="text-lg font-semibold">{rand(service.price)}</p>
          <p className="text-xs text-[#807c78]">
            {service.deliveryDays} {service.deliveryDays === 1 ? "day" : "days"}
          </p>
          <button
            type="button"
            onClick={onRequest}
            className="mt-3 inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-xl bg-[#272624] px-4 text-xs font-semibold text-white"
          >
            Request this service
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="mt-3 inline-flex cursor-pointer items-center gap-1 text-xs font-semibold text-[#dd5c1b]"
      >
        {open ? "Hide details" : `See ${service.milestones.length} ${service.milestones.length === 1 ? "milestone" : "milestones"}`}
        <Icon icon={open ? "solar:alt-arrow-up-linear" : "solar:alt-arrow-down-linear"} width="14" />
      </button>
      {open && <MilestoneList milestones={service.milestones} />}
    </article>
  );
}

export function MilestoneList({ milestones }: { milestones: Milestone[] }) {
  return (
    <ol className="mt-3 grid gap-2">
      {milestones.map((milestone, index) => (
        <li key={index} className="flex items-start justify-between gap-4 rounded-xl bg-[#fcf8f5] px-4 py-3">
          <div className="min-w-0">
            <p className="text-sm font-medium">
              {index + 1}. {milestone.title}
            </p>
            {milestone.description && (
              <p className="mt-0.5 text-xs text-[#807c78]">{milestone.description}</p>
            )}
          </div>
          <p className="shrink-0 text-right text-xs text-[#6b6763]">
            <strong className="text-sm text-[#272624]">{rand(milestone.amount)}</strong>
            <br />
            {milestone.days} {milestone.days === 1 ? "day" : "days"}
          </p>
        </li>
      ))}
    </ol>
  );
}

function RequestServiceModal({
  service,
  proName,
  onClose,
}: {
  service: PublicService;
  proName: string;
  onClose: () => void;
}) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const [note, setNote] = useState("");
  const [preferredStart, setPreferredStart] = useState("");
  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeWithEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", closeWithEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", closeWithEscape);
    };
  }, [onClose]);

  const request = useMutation({
    mutationFn: async () => {
      const token = await getToken();
      const response = await fetch(`${server}/bookings?role=client`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ listingId: service.id, note, preferredStart: preferredStart || null }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Your request could not be sent.");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["client-bookings"] }),
  });

  return (
    <div
      className="fixed inset-0 z-60 flex items-start justify-center bg-[#201a17]/38 px-3 py-5 backdrop-blur-[3px] sm:px-6 sm:py-12"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="request-title"
        className="flex max-h-[calc(100svh-2.5rem)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-black/8 bg-white shadow-[0_30px_100px_rgba(28,23,20,.28)]"
      >
        <header className="flex items-start justify-between gap-4 border-b border-black/7 p-5">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold tracking-[.13em] text-[#e66d31] uppercase">
              Request a service
            </p>
            <h2 id="request-title" className="mt-1 text-lg font-semibold">
              {service.title}
            </h2>
            <p className="mt-1 text-xs text-[#807c78]">
              {proName} · {rand(service.price)} · {service.deliveryDays} days
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full border border-black/8 text-[#706c67] hover:bg-black/4"
          >
            <Icon icon="solar:close-circle-linear" width="21" />
          </button>
        </header>

        {request.isSuccess ? (
          <div className="flex flex-col items-center px-6 py-10 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#faece4] text-[#dd5c1b]">
              <Icon icon="solar:check-circle-linear" width="26" />
            </span>
            <h3 className="mt-4 text-sm font-semibold">Request sent</h3>
            <p className="mt-2 max-w-sm text-xs leading-5 text-[#807c78]">
              {proName} will review it. If they accept, a chat opens so you can agree on the
              details before paying into escrow. Nothing is charged yet.
            </p>
            <div className="mt-6 flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="h-10 cursor-pointer rounded-xl px-4 text-sm font-semibold text-[#67635f] hover:bg-black/4"
              >
                Close
              </button>
              <Link
                href="/bookings"
                className="inline-flex h-10 items-center rounded-xl bg-[#272624] px-5 text-sm font-semibold text-white"
              >
                View my bookings
              </Link>
            </div>
          </div>
        ) : (
          <form
            className="flex min-h-0 flex-1 flex-col"
            onSubmit={(event) => {
              event.preventDefault();
              request.mutate();
            }}
          >
            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-5">
              <div>
                <p className="text-xs font-semibold text-[#33312f]">What&apos;s included</p>
                <MilestoneList milestones={service.milestones} />
              </div>

              <label className="grid gap-2 text-xs font-semibold text-[#33312f]">
                Preferred start date (optional)
                <input
                  type="date"
                  min={today}
                  value={preferredStart}
                  onChange={(event) => setPreferredStart(event.target.value)}
                  className="h-11 rounded-xl border border-black/10 bg-white px-3 text-sm font-normal outline-none focus:border-[#e67137] focus:ring-3 focus:ring-[#f6ddce]"
                />
              </label>

              <label className="grid gap-2 text-xs font-semibold text-[#33312f]">
                Note to {proName.split(" ")[0]} (optional)
                <textarea
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  maxLength={2000}
                  rows={4}
                  placeholder="Where you're based, what you need done, and anything they should know."
                  className="resize-none rounded-xl border border-black/10 bg-white p-3 text-sm font-normal outline-none focus:border-[#e67137] focus:ring-3 focus:ring-[#f6ddce]"
                />
              </label>

              <p className="flex gap-2 rounded-xl bg-[#fcf8f5] px-4 py-3 text-[11px] leading-5 text-[#6f6b66]">
                <Icon icon="solar:shield-check-linear" width="16" className="mt-0.5 shrink-0 text-[#dd5c1b]" />
                You won&apos;t pay anything now. If the pro accepts, you&apos;ll chat first, then
                pay into TradeSafe escrow. They&apos;re only paid when you approve the work.
              </p>

              {request.isError && (
                <p className="rounded-xl bg-[#fff0ee] px-4 py-3 text-xs font-medium text-[#9a4d45]" role="alert">
                  {request.error.message}
                </p>
              )}
            </div>

            <footer className="flex justify-end gap-2 border-t border-black/7 p-4">
              <button
                type="button"
                onClick={onClose}
                className="h-10 cursor-pointer rounded-xl px-4 text-sm font-semibold text-[#67635f] hover:bg-black/4"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={request.isPending}
                className="h-10 cursor-pointer rounded-xl bg-[#272624] px-5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {request.isPending ? "Sending..." : "Send request"}
              </button>
            </footer>
          </form>
        )}
      </section>
    </div>
  );
}
