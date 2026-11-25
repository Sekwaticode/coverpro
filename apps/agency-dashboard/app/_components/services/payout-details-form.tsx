"use client";

// Shared with apps/freelancer-dashboard/app/_components/services/payout-details-form.tsx (keep in sync).
import { useAuth } from "@clerk/nextjs";
import { Icon } from "@iconify/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

type PayoutDetailsResponse = {
  configured: boolean;
  details: {
    valid: boolean | null;
    verified: boolean | null;
    givenName: string;
    familyName: string;
    email: string;
    mobile: string;
    idType: string | null;
    idCountry: string | null;
    idNumberMasked: string | null;
    bank: string | null;
    accountType: string | null;
    accountNumberMasked: string | null;
  } | null;
  defaults: { givenName: string; familyName: string; email: string } | null;
  banks: { code: string; name: string }[];
  accountTypes: string[];
};

const accountTypeLabels: Record<string, string> = {
  CHEQUE: "Cheque / current",
  SAVINGS: "Savings",
  TRANSMISSION: "Transmission",
  BOND: "Bond",
};

// ISO 3166 alpha-3 codes for passports most often used by pros in SA.
const passportCountries = [
  ["ZWE", "Zimbabwe"], ["MOZ", "Mozambique"], ["LSO", "Lesotho"], ["MWI", "Malawi"],
  ["ZMB", "Zambia"], ["BWA", "Botswana"], ["SWZ", "Eswatini"], ["NAM", "Namibia"],
  ["COD", "DR Congo"], ["NGA", "Nigeria"], ["GHA", "Ghana"], ["KEN", "Kenya"],
  ["ETH", "Ethiopia"], ["SOM", "Somalia"], ["AGO", "Angola"], ["TZA", "Tanzania"],
  ["GBR", "United Kingdom"], ["IND", "India"], ["PAK", "Pakistan"], ["CHN", "China"],
];

export const payoutDetailsQueryKey = (scope?: "agency") => ["payout-details", scope ?? "personal"];

/** Loads whether payouts are set up; used by the form and by the bookings banner. */
export function usePayoutDetails(scope?: "agency") {
  const { getToken } = useAuth();
  return useQuery<PayoutDetailsResponse>({
    queryKey: payoutDetailsQueryKey(scope),
    queryFn: async () => {
      const token = await getToken();
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SERVER_URI}/tradesafe/payout-details?role=freelancer${scope ? `&scope=${scope}` : ""}`,
        { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" },
      );
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Could not load payout details.");
      return result.data;
    },
  });
}

export function PayoutDetailsForm({ scope }: { scope?: "agency" }) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const { data, isLoading, isError, error } = usePayoutDetails(scope);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ error: boolean; text: string } | null>(null);
  const [form, setForm] = useState({
    givenName: "",
    familyName: "",
    email: "",
    mobile: "",
    idType: "NATIONAL",
    idCountry: "",
    idNumber: "",
    bank: "",
    accountType: "",
    accountNumber: "",
  });

  const configured = data?.configured ?? false;
  const showForm = !configured || editing;

  useEffect(() => {
    if (!data) return;
    const source = data.details ?? data.defaults;
    setForm((current) => ({
      ...current,
      givenName: source?.givenName ?? "",
      familyName: source?.familyName ?? "",
      email: source?.email ?? "",
      mobile: data.details?.mobile ?? "",
      idType: data.details?.idType ?? "NATIONAL",
      idCountry: data.details?.idCountry && data.details.idCountry !== "ZAF" ? data.details.idCountry : "",
      bank: data.details?.bank ?? "",
      accountType: data.details?.accountType ?? "",
      idNumber: "",
      accountNumber: "",
    }));
  }, [data]);

  const set = (field: keyof typeof form) => (event: { target: { value: string } }) =>
    setForm((current) => ({ ...current, [field]: event.target.value }));

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const token = await getToken();
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SERVER_URI}/tradesafe/payout-details?role=freelancer${scope ? `&scope=${scope}` : ""}`,
        {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify(form),
        },
      );
      const result = await response.json();
      if (!response.ok) throw new Error(result.message);
      queryClient.setQueryData(payoutDetailsQueryKey(scope), result.data);
      setEditing(false);
      setMessage({ error: false, text: "Payout details saved. You can now accept bookings." });
    } catch (err) {
      setMessage({
        error: true,
        text: err instanceof Error ? err.message : "Payout details could not be saved.",
      });
    } finally {
      setSaving(false);
    }
  };

  const input =
    "h-11 w-full rounded-xl border border-black/10 bg-white px-3 text-sm font-normal outline-none focus:border-[#e67137] focus:ring-3 focus:ring-[#f6ddce]";
  const label = "grid gap-2 text-xs font-semibold text-[#33312f]";
  const bankName = (code: string | null) =>
    data?.banks.find((bank) => bank.code === code)?.name ?? code ?? "—";

  return (
    <div>
      <p className="text-xs font-semibold tracking-[.14em] text-[#e66d31] uppercase">Payouts</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-[-.045em] sm:text-4xl">
        Payout details
      </h1>
      <p className="mt-2 max-w-2xl text-sm text-[#77736f]">
        Where escrow pays you when a client approves a milestone. Your details are stored securely
        by TradeSafe, our escrow partner — CoverPro never stores your ID or account number. A 10%
        CoverPro fee is deducted from each payout.
      </p>

      {message && (
        <p
          className={`mt-5 rounded-xl px-4 py-3 text-xs font-medium ${
            message.error ? "bg-[#fff0ee] text-[#9a4d45]" : "bg-[#e8f3ea] text-[#3f7a4d]"
          }`}
          role={message.error ? "alert" : "status"}
        >
          {message.text}
        </p>
      )}

      {isLoading ? (
        <div className="mt-6 h-64 animate-pulse rounded-2xl border border-black/8 bg-white" />
      ) : isError ? (
        <p className="mt-6 text-sm text-[#a65050]">{error.message}</p>
      ) : configured && !editing && data?.details ? (
        <section className="mt-6 rounded-2xl border border-black/8 bg-white p-5 sm:p-6">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#e8f3ea] text-[#3f7a4d]">
                <Icon icon="solar:shield-check-linear" width="22" />
              </span>
              <div>
                <h2 className="font-semibold">Payouts are set up</h2>
                <p className="text-xs text-[#807c78]">
                  {data.details.verified ? "Verified by TradeSafe" : "TradeSafe verifies details before the first payout"}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="h-10 cursor-pointer rounded-xl border border-black/10 px-4 text-xs font-semibold hover:bg-black/3"
            >
              Update details
            </button>
          </div>
          <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
            {[
              ["Name", `${data.details.givenName} ${data.details.familyName}`],
              ["Email", data.details.email],
              ["Mobile", data.details.mobile],
              [data.details.idType === "PASSPORT" ? "Passport" : "SA ID", data.details.idNumberMasked ?? "—"],
              ["Bank", bankName(data.details.bank)],
              [
                "Account",
                `${accountTypeLabels[data.details.accountType ?? ""] ?? data.details.accountType ?? ""} ${data.details.accountNumberMasked ?? ""}`.trim() || "—",
              ],
            ].map(([term, value]) => (
              <div key={term} className="rounded-xl bg-[#fcf8f5] px-4 py-3">
                <dt className="text-[11px] font-semibold text-[#807c78]">{term}</dt>
                <dd className="mt-0.5 font-medium break-all">{value}</dd>
              </div>
            ))}
          </dl>
        </section>
      ) : showForm && data ? (
        <form onSubmit={submit} className="mt-6 space-y-6 rounded-2xl border border-black/8 bg-white p-5 sm:p-6">
          <fieldset className="grid gap-4 sm:grid-cols-2">
            <legend className="mb-3 text-sm font-semibold">
              {scope === "agency" ? "Account holder (company representative)" : "About you"}
            </legend>
            <label className={label}>
              First name
              <input required value={form.givenName} onChange={set("givenName")} autoComplete="given-name" className={input} />
            </label>
            <label className={label}>
              Last name
              <input required value={form.familyName} onChange={set("familyName")} autoComplete="family-name" className={input} />
            </label>
            <label className={label}>
              Email
              <input
                required
                type="email"
                value={form.email}
                onChange={set("email")}
                readOnly={configured}
                autoComplete="email"
                className={`${input} ${configured ? "bg-[#f6f3f0] text-[#807c78]" : ""}`}
              />
              {configured && (
                <span className="text-[11px] font-normal text-[#807c78]">
                  TradeSafe doesn&apos;t allow changing this email.
                </span>
              )}
            </label>
            <label className={label}>
              Mobile number
              <input required type="tel" value={form.mobile} onChange={set("mobile")} autoComplete="tel" placeholder="082 123 4567" className={input} />
            </label>
          </fieldset>

          <fieldset className="grid gap-4 sm:grid-cols-2">
            <legend className="mb-3 text-sm font-semibold">Identity</legend>
            <label className={label}>
              ID type
              <select value={form.idType} onChange={set("idType")} className={input}>
                <option value="NATIONAL">South African ID</option>
                <option value="PASSPORT">Passport</option>
              </select>
            </label>
            {form.idType === "PASSPORT" && (
              <label className={label}>
                Issuing country
                <select required value={form.idCountry} onChange={set("idCountry")} className={input}>
                  <option value="" disabled>
                    Choose a country
                  </option>
                  {passportCountries.map(([code, name]) => (
                    <option key={code} value={code}>
                      {name}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <label className={`${label} sm:col-span-2`}>
              {form.idType === "PASSPORT" ? "Passport number" : "ID number"}
              <input
                required={!configured}
                value={form.idNumber}
                onChange={set("idNumber")}
                inputMode={form.idType === "PASSPORT" ? "text" : "numeric"}
                placeholder={
                  configured
                    ? `Leave blank to keep ${data.details?.idNumberMasked ?? "the current one"}`
                    : form.idType === "PASSPORT"
                      ? "Passport number"
                      : "13-digit SA ID number"
                }
                className={input}
              />
            </label>
          </fieldset>

          <fieldset className="grid gap-4 sm:grid-cols-2">
            <legend className="mb-3 text-sm font-semibold">Bank account</legend>
            <label className={label}>
              Bank
              <select required={!configured} value={form.bank} onChange={set("bank")} className={input}>
                <option value="" disabled>
                  Choose your bank
                </option>
                {data.banks.map((bank) => (
                  <option key={bank.code} value={bank.code}>
                    {bank.name}
                  </option>
                ))}
              </select>
            </label>
            <label className={label}>
              Account type
              <select required={!configured} value={form.accountType} onChange={set("accountType")} className={input}>
                <option value="" disabled>
                  Choose a type
                </option>
                {data.accountTypes.map((type) => (
                  <option key={type} value={type}>
                    {accountTypeLabels[type] ?? type}
                  </option>
                ))}
              </select>
            </label>
            <label className={`${label} sm:col-span-2`}>
              Account number
              <input
                required={!configured}
                value={form.accountNumber}
                onChange={set("accountNumber")}
                inputMode="numeric"
                autoComplete="off"
                placeholder={
                  configured
                    ? `Leave blank to keep ${data.details?.accountNumberMasked ?? "the current account"}`
                    : "Account number"
                }
                className={input}
              />
            </label>
          </fieldset>

          <div className="flex flex-col-reverse justify-end gap-2 border-t border-black/7 pt-5 sm:flex-row">
            {configured && (
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="h-11 cursor-pointer rounded-xl px-4 text-sm font-semibold text-[#67635f] hover:bg-black/4"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={saving}
              className="h-11 cursor-pointer rounded-xl bg-[#272624] px-5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Saving with TradeSafe..." : "Save payout details"}
            </button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
