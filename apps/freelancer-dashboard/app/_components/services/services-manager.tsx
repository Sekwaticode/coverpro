"use client";

// Shared with apps/agency-dashboard/app/_components/services/services-manager.tsx (keep in sync).
import { useAuth } from "@clerk/nextjs";
import { Icon } from "@iconify/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

type Milestone = { title: string; description: string; amount: number; days: number };

export type ServiceListing = {
  id: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  price: number;
  milestones: Milestone[];
  deliveryDays: number;
  status: "ACTIVE" | "PAUSED";
};

type Draft = {
  title: string;
  description: string;
  category: string;
  tags: string;
  milestones: { title: string; description: string; amount: string; days: string }[];
};

const categories = [
  "Building & construction",
  "Plumbing",
  "Electrical",
  "Roofing",
  "Tiling",
  "Painting",
  "Ceilings & drywall",
  "Carpentry",
  "Cleaning",
  "Landscaping",
  "Web development",
  "Graphic design",
  "Photography",
  "Videography",
  "Makeup & beauty",
  "Hair",
  "Tattoo",
  "Events",
  "Tutoring",
  "Other",
];

const emptyMilestone = { title: "", description: "", amount: "", days: "" };
const emptyDraft: Draft = {
  title: "",
  description: "",
  category: "",
  tags: "",
  milestones: [{ ...emptyMilestone }],
};

const rand = (value: number) => `R${value.toLocaleString("en-ZA", { maximumFractionDigits: 2 })}`;

export function ServicesManager({ scope }: { scope?: "agency" }) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const scopeParam = scope ? `&scope=${scope}` : "";
  const server = process.env.NEXT_PUBLIC_SERVER_URI;
  const [editing, setEditing] = useState<ServiceListing | "new" | null>(null);
  const [error, setError] = useState("");

  const call = async (path: string, init: RequestInit = {}) => {
    const token = await getToken();
    const response = await fetch(`${server}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(init.body ? { "Content-Type": "application/json" } : {}),
      },
      cache: "no-store",
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || "Something went wrong.");
    return result.data;
  };

  const { data: listings = [], isLoading } = useQuery<ServiceListing[]>({
    queryKey: ["my-services", scope ?? "personal"],
    queryFn: () => call(`/listings/mine?role=freelancer${scopeParam}`),
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["my-services", scope ?? "personal"] });

  const toggleStatus = useMutation({
    mutationFn: (listing: ServiceListing) =>
      call(`/listings/${listing.id}/status?role=freelancer${scopeParam}`, {
        method: "PATCH",
        body: JSON.stringify({ status: listing.status === "ACTIVE" ? "PAUSED" : "ACTIVE" }),
      }),
    onSuccess: refresh,
    onError: (err) => setError(err.message),
  });

  const remove = useMutation({
    mutationFn: (listing: ServiceListing) =>
      call(`/listings/${listing.id}?role=freelancer${scopeParam}`, { method: "DELETE" }),
    onSuccess: refresh,
    onError: (err) => setError(err.message),
  });

  return (
    <div>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-semibold tracking-[.14em] text-[#e66d31] uppercase">
            Services
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-.045em] sm:text-4xl">
            {scope === "agency" ? "Company services" : "My services"}
          </h1>
          <p className="mt-2 text-sm text-[#77736f]">
            Fixed-price services clients can request. Each one is paid into escrow milestone by
            milestone.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setEditing("new")}
          className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#272624] px-5 text-sm font-semibold text-white"
        >
          <Icon icon="solar:add-circle-linear" width="18" />
          Add a service
        </button>
      </div>

      {error && (
        <p className="mt-5 rounded-xl bg-[#fff0ee] px-4 py-3 text-xs font-medium text-[#9a4d45]" role="alert">
          {error}
        </p>
      )}

      <div className="mt-6 grid gap-4">
        {isLoading && (
          <div className="animate-pulse rounded-2xl border border-black/8 bg-white p-6">
            <div className="h-5 w-48 rounded bg-[#ebe9e6]" />
            <div className="mt-4 h-4 w-72 rounded bg-[#ebe9e6]" />
          </div>
        )}

        {!isLoading && !listings.length && (
          <div className="rounded-2xl border border-black/8 bg-white px-6 py-16 text-center">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#faece4] text-[#dd5c1b]">
              <Icon icon="solar:shop-2-linear" width="25" />
            </span>
            <h2 className="mt-4 font-semibold">No services yet</h2>
            <p className="mx-auto mt-2 max-w-sm text-sm text-[#817d79]">
              Add the work you offer with a fixed price and milestone plan. Clients will see it on
              your profile and can request it straight away.
            </p>
          </div>
        )}

        {listings.map((listing) => (
          <article key={listing.id} className="rounded-2xl border border-black/8 bg-white p-5 sm:p-6">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-semibold">{listing.title}</h2>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      listing.status === "ACTIVE"
                        ? "bg-[#e8f3ea] text-[#3f7a4d]"
                        : "bg-[#f0eeec] text-[#7c7874]"
                    }`}
                  >
                    {listing.status === "ACTIVE" ? "Live" : "Paused"}
                  </span>
                </div>
                <p className="mt-1 text-xs text-[#807c78]">
                  {listing.category} · {rand(listing.price)} · {listing.deliveryDays} days ·{" "}
                  {listing.milestones.length}{" "}
                  {listing.milestones.length === 1 ? "milestone" : "milestones"}
                </p>
                <p className="mt-3 line-clamp-2 text-sm leading-6 text-[#5f5b57]">
                  {listing.description}
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setEditing(listing)}
                  className="h-9 cursor-pointer rounded-xl border border-black/10 px-3 text-xs font-semibold hover:bg-black/3"
                >
                  Edit
                </button>
                <button
                  type="button"
                  disabled={toggleStatus.isPending}
                  onClick={() => toggleStatus.mutate(listing)}
                  className="h-9 cursor-pointer rounded-xl border border-black/10 px-3 text-xs font-semibold hover:bg-black/3 disabled:opacity-50"
                >
                  {listing.status === "ACTIVE" ? "Pause" : "Go live"}
                </button>
                <button
                  type="button"
                  disabled={remove.isPending}
                  onClick={() => {
                    if (window.confirm(`Delete “${listing.title}”? Existing requests are kept.`)) {
                      remove.mutate(listing);
                    }
                  }}
                  className="h-9 cursor-pointer rounded-xl px-3 text-xs font-semibold text-[#a65050] hover:bg-[#fff0ee] disabled:opacity-50"
                >
                  Delete
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>

      {editing &&
        createPortal(
          <ServiceForm
            listing={editing === "new" ? null : editing}
            onClose={() => setEditing(null)}
            onSave={async (body, id) => {
              await call(
                id
                  ? `/listings/${id}?role=freelancer${scopeParam}`
                  : `/listings?role=freelancer${scopeParam}`,
                { method: id ? "PUT" : "POST", body: JSON.stringify(body) },
              );
              await refresh();
              setEditing(null);
            }}
          />,
          document.body,
        )}
    </div>
  );
}

function ServiceForm({
  listing,
  onClose,
  onSave,
}: {
  listing: ServiceListing | null;
  onClose: () => void;
  onSave: (body: Record<string, unknown>, id?: string) => Promise<void>;
}) {
  const [draft, setDraft] = useState<Draft>(() =>
    listing
      ? {
          title: listing.title,
          description: listing.description,
          category: listing.category,
          tags: listing.tags.join(", "),
          milestones: listing.milestones.map((m) => ({
            title: m.title,
            description: m.description,
            amount: String(m.amount),
            days: String(m.days),
          })),
        }
      : emptyDraft,
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  const total = draft.milestones.reduce((sum, m) => sum + (Number(m.amount) || 0), 0);
  const totalDays = draft.milestones.reduce((sum, m) => sum + (Number(m.days) || 0), 0);

  const setMilestone = (index: number, field: keyof Draft["milestones"][number], value: string) =>
    setDraft((current) => ({
      ...current,
      milestones: current.milestones.map((m, i) => (i === index ? { ...m, [field]: value } : m)),
    }));

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await onSave(
        {
          title: draft.title,
          description: draft.description,
          category: draft.category,
          tags: draft.tags.split(",").map((tag) => tag.trim()).filter(Boolean),
          milestones: draft.milestones.map((m) => ({
            title: m.title,
            description: m.description,
            amount: Number(m.amount),
            days: Number(m.days),
          })),
        },
        listing?.id,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "The service could not be saved.");
      setSaving(false);
    }
  };

  const input =
    "h-11 w-full rounded-xl border border-black/10 bg-white px-3 text-sm font-normal outline-none focus:border-[#e67137] focus:ring-3 focus:ring-[#f6ddce]";

  return (
    <div className="fixed inset-0 z-60 flex items-start justify-center bg-[#201a17]/38 px-3 py-5 backdrop-blur-[3px] sm:px-6 sm:py-10">
      <form
        onSubmit={submit}
        role="dialog"
        aria-modal="true"
        aria-labelledby="service-form-title"
        className="flex max-h-[calc(100svh-2.5rem)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-black/8 bg-white shadow-[0_30px_100px_rgba(28,23,20,.28)]"
      >
        <header className="flex items-start justify-between gap-4 border-b border-black/7 p-5">
          <div>
            <p className="text-[10px] font-semibold tracking-[.13em] text-[#e66d31] uppercase">
              {listing ? "Edit service" : "New service"}
            </p>
            <h2 id="service-form-title" className="mt-1 text-lg font-semibold">
              {listing ? listing.title : "What do you offer?"}
            </h2>
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

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-5">
          <label className="grid gap-2 text-xs font-semibold text-[#33312f]">
            Title
            <input
              required
              minLength={5}
              maxLength={120}
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              placeholder="e.g. Bathroom retiling (up to 10 m²)"
              className={input}
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2 text-xs font-semibold text-[#33312f]">
              Category
              <input
                required
                list="service-categories"
                maxLength={60}
                value={draft.category}
                onChange={(e) => setDraft({ ...draft, category: e.target.value })}
                placeholder="Choose or type a category"
                className={input}
              />
              <datalist id="service-categories">
                {categories.map((category) => (
                  <option key={category} value={category} />
                ))}
              </datalist>
            </label>
            <label className="grid gap-2 text-xs font-semibold text-[#33312f]">
              Tags (comma separated)
              <input
                value={draft.tags}
                onChange={(e) => setDraft({ ...draft, tags: e.target.value })}
                placeholder="tiling, waterproofing, grouting"
                className={input}
              />
            </label>
          </div>

          <label className="grid gap-2 text-xs font-semibold text-[#33312f]">
            Description
            <textarea
              required
              minLength={30}
              maxLength={5000}
              rows={5}
              value={draft.description}
              onChange={(e) => setDraft({ ...draft, description: e.target.value })}
              placeholder="What's included, what isn't, what you need from the client, and the area you cover."
              className="resize-y rounded-xl border border-black/10 bg-white p-3 text-sm font-normal outline-none focus:border-[#e67137] focus:ring-3 focus:ring-[#f6ddce]"
            />
          </label>

          <div>
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-[#33312f]">Milestones</p>
                <p className="mt-1 text-[11px] text-[#807c78]">
                  The client pays each milestone into escrow. You&apos;re paid when they approve it.
                </p>
              </div>
              <p className="shrink-0 text-right text-xs text-[#6b6763]">
                <strong className="text-sm text-[#272624]">{rand(total)}</strong>
                <br />
                {totalDays} {totalDays === 1 ? "day" : "days"}
              </p>
            </div>

            <div className="mt-3 grid gap-3">
              {draft.milestones.map((milestone, index) => (
                <div key={index} className="rounded-xl border border-black/8 bg-[#fcf8f5] p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-[#807c78]">
                      Milestone {index + 1}
                    </span>
                    {draft.milestones.length > 1 && (
                      <button
                        type="button"
                        onClick={() =>
                          setDraft({
                            ...draft,
                            milestones: draft.milestones.filter((_, i) => i !== index),
                          })
                        }
                        className="cursor-pointer text-[11px] font-semibold text-[#a65050]"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <div className="mt-2 grid gap-2 sm:grid-cols-[minmax(0,1fr)_120px_90px]">
                    <input
                      required
                      maxLength={120}
                      value={milestone.title}
                      onChange={(e) => setMilestone(index, "title", e.target.value)}
                      placeholder="e.g. Remove old tiles & prep"
                      aria-label={`Milestone ${index + 1} title`}
                      className={input}
                    />
                    <input
                      required
                      type="number"
                      min={1}
                      step="0.01"
                      value={milestone.amount}
                      onChange={(e) => setMilestone(index, "amount", e.target.value)}
                      placeholder="Amount (R)"
                      aria-label={`Milestone ${index + 1} amount in rand`}
                      className={input}
                    />
                    <input
                      required
                      type="number"
                      min={1}
                      max={365}
                      value={milestone.days}
                      onChange={(e) => setMilestone(index, "days", e.target.value)}
                      placeholder="Days"
                      aria-label={`Milestone ${index + 1} days`}
                      className={input}
                    />
                  </div>
                  <input
                    maxLength={1000}
                    value={milestone.description}
                    onChange={(e) => setMilestone(index, "description", e.target.value)}
                    placeholder="What gets delivered (optional)"
                    aria-label={`Milestone ${index + 1} description`}
                    className={`${input} mt-2`}
                  />
                </div>
              ))}
            </div>
            {draft.milestones.length < 10 && (
              <button
                type="button"
                onClick={() =>
                  setDraft({ ...draft, milestones: [...draft.milestones, { ...emptyMilestone }] })
                }
                className="mt-3 inline-flex cursor-pointer items-center gap-1.5 text-xs font-semibold text-[#dd5c1b]"
              >
                <Icon icon="solar:add-circle-linear" width="16" />
                Add milestone
              </button>
            )}
          </div>

          {error && (
            <p className="rounded-xl bg-[#fff0ee] px-4 py-3 text-xs font-medium text-[#9a4d45]" role="alert">
              {error}
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
            disabled={saving}
            className="h-10 cursor-pointer rounded-xl bg-[#272624] px-5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Saving..." : listing ? "Save changes" : "Publish service"}
          </button>
        </footer>
      </form>
    </div>
  );
}
