"use client";

import { useAuth } from "@clerk/nextjs";
import { Icon } from "@iconify/react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  type AccountFilter,
  type MarketplaceResult,
  SearchResult,
  typeParam,
} from "./marketplace-search-modal";

const PAGE_SIZE = 20;
const categories = ["Tiling", "Roofing", "Plumbing", "Ceilings", "Electrical", "Painting"];

/** Full-page directory of pros and agencies, built on the marketplace search API. */
export function BrowsePros() {
  const { getToken } = useAuth();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [accountFilter, setAccountFilter] = useState<AccountFilter>("All");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedQuery(query), 250);
    return () => window.clearTimeout(timeout);
  }, [query]);

  const { data, isLoading, isError, error, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: ["marketplace-browse", debouncedQuery, accountFilter],
      initialPageParam: 0,
      queryFn: async ({ pageParam }) => {
        const token = await getToken();
        const params = new URLSearchParams({
          role: "client",
          query: debouncedQuery,
          type: typeParam(accountFilter),
          offset: String(pageParam),
        });
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_SERVER_URI}/client/marketplace/search?${params.toString()}`,
          { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" },
        );
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || "Could not load pros.");
        return result.data as { results: MarketplaceResult[]; hasMore: boolean };
      },
      getNextPageParam: (lastPage, allPages) =>
        lastPage.hasMore ? allPages.length * PAGE_SIZE : undefined,
    });

  const results = useMemo(() => {
    const all = data?.pages.flatMap((page) => page.results) ?? [];
    return verifiedOnly ? all.filter((profile) => profile.verified) : all;
  }, [data, verifiedOnly]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          void fetchNextPage();
        }
      },
      { rootMargin: "300px" },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, results.length]);

  return (
    <div>
      <div>
        <p className="text-xs font-semibold tracking-[.14em] text-[#e66d31] uppercase">
          Marketplace
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-.045em] sm:text-4xl">
          Find trusted pros
        </h1>
        <p className="mt-2 text-sm text-[#77736f]">
          Browse pros and agencies advertising their services, then message or hire them directly.
        </p>
      </div>

      <section className="mt-6 rounded-2xl border border-black/8 bg-white p-4 sm:p-5">
        <label className="flex h-12 items-center gap-3 rounded-xl border border-black/10 bg-[#fcf8f5] px-4 focus-within:border-[#e77840] focus-within:ring-3 focus-within:ring-[#f3ded2]">
          <Icon icon="solar:magnifer-linear" width="20" className="shrink-0 text-[#706a64]" />
          <span className="sr-only">Search pros</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by name, service, location, or skill"
            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[#a19e9a]"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="cursor-pointer text-xs font-semibold text-[#dd5c1b]"
            >
              Clear
            </button>
          )}
        </label>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          {categories.map((term) => (
            <button
              key={term}
              type="button"
              aria-pressed={query === term}
              onClick={() => setQuery(query === term ? "" : term)}
              className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs transition-colors ${
                query === term
                  ? "bg-[#faece4] font-semibold text-[#dd5c1b]"
                  : "bg-[#f8f0eb] text-[#625d57] hover:bg-[#f4e3da] hover:text-[#dd5c1b]"
              }`}
            >
              {term}
            </button>
          ))}
        </div>

        <div className="mt-4 flex flex-col justify-between gap-3 border-t border-black/6 pt-4 sm:flex-row sm:items-center">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1 rounded-lg bg-[#f8eee9] p-1">
              {(["All", "Freelancer", "Agency"] as AccountFilter[]).map((option) => (
                <button
                  key={option}
                  type="button"
                  aria-pressed={accountFilter === option}
                  onClick={() => setAccountFilter(option)}
                  className={`h-8 cursor-pointer rounded-md px-3 text-xs font-semibold ${
                    accountFilter === option
                      ? "bg-white text-[#dd5c1b] shadow-sm"
                      : "text-[#787470]"
                  }`}
                >
                  {option === "Freelancer" ? "Pros" : option === "Agency" ? "Agencies" : "All"}
                </button>
              ))}
            </div>
            <label className="flex cursor-pointer items-center gap-2 text-xs text-[#625d57]">
              <input
                type="checkbox"
                checked={verifiedOnly}
                onChange={(event) => setVerifiedOnly(event.target.checked)}
                className="h-4 w-4 accent-[#c35118]"
              />
              ID-verified only
            </label>
          </div>
          <p className="text-xs text-[#8b8783]">
            {isLoading
              ? "Loading..."
              : `${results.length}${hasNextPage ? "+" : ""} ${results.length === 1 ? "result" : "results"}`}
          </p>
        </div>
      </section>

      <section className="mt-5 overflow-hidden rounded-2xl border border-black/8 bg-white">
        {isLoading ? (
          <div className="grid sm:grid-cols-2">
            {[0, 1, 2, 3].map((item) => (
              <div key={item} className="animate-pulse border-b border-black/6 p-5 odd:sm:border-r">
                <div className="flex items-start gap-3">
                  <div className="h-11 w-11 shrink-0 rounded-full bg-[#f0eeec]" />
                  <div className="min-w-0 flex-1">
                    <div className="h-3 w-28 rounded bg-[#f0eeec]" />
                    <div className="mt-2 h-2.5 w-20 rounded bg-[#f8efea]" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : isError ? (
          <EmptyState
            icon="solar:danger-circle-linear"
            title="Couldn't load pros"
            body={error instanceof Error ? error.message : "Please try again shortly."}
          />
        ) : results.length ? (
          <>
            <div className="grid sm:grid-cols-2">
              {results.map((profile) => (
                <SearchResult
                  key={`${profile.accountType}-${profile.id}`}
                  profile={profile}
                  setQuery={setQuery}
                />
              ))}
            </div>
            {isFetchingNextPage && (
              <p className="py-4 text-center text-xs text-[#8b8783]">Loading more...</p>
            )}
          </>
        ) : (
          <EmptyState
            icon="solar:magnifer-linear"
            title={query || verifiedOnly ? "No matching pros" : "No pros yet"}
            body={
              query || verifiedOnly
                ? "Try another service, location, or skill."
                : "Pros who create profiles will show up here."
            }
          />
        )}
        <div ref={sentinelRef} className="h-1" />
      </section>
    </div>
  );
}

function EmptyState({ icon, title, body }: { icon: string; title: string; body: string }) {
  return (
    <div className="flex min-h-72 flex-col items-center justify-center px-6 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#faece4] text-[#dd5c1b]">
        <Icon icon={icon} width="25" />
      </span>
      <h3 className="mt-4 text-sm font-semibold">{title}</h3>
      <p className="mt-2 max-w-sm text-xs leading-5 text-[#807c78]">{body}</p>
    </div>
  );
}
