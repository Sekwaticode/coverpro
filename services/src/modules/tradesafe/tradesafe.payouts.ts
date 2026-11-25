/**
 * Payout details for pros and agencies. Each seller gets a TradeSafe token holding their
 * identity and bank account; escrowed funds are paid out to it when released.
 * Bank and ID details are sent to TradeSafe and never stored by CoverPro.
 */
import { createClerkClient } from "@clerk/backend";
import { eq } from "drizzle-orm";
import { env } from "../../config/env.js";
import { db } from "../../database/client.js";
import { accounts, agency_metadata } from "../../database/schema.js";
import { ApiError } from "../../utils/api-error.js";
import type { ListingOwner } from "../listings/listings.owner.js";
import {
  BANK_ACCOUNT_TYPES,
  BANKS,
  createPayoutToken,
  getPayoutToken,
  updatePayoutToken,
  type BankAccountType,
  type BankCode,
  type PayoutTokenInput,
} from "./tradesafe.api.js";

const getStoredTokenId = async (owner: ListingOwner): Promise<string | null> => {
  if ("agencyId" in owner) {
    const [row] = (await db
      .select({ tokenId: agency_metadata.tradesafe_token_id })
      .from(agency_metadata)
      .where(eq(agency_metadata.id, owner.agencyId))
      .limit(1)) as { tokenId: string | null }[];
    return row?.tokenId ?? null;
  }
  const [row] = (await db
    .select({ tokenId: accounts.tradesafe_token_id })
    .from(accounts)
    .where(eq(accounts.auth_id, owner.freelancerId))
    .limit(1)) as { tokenId: string | null }[];
  return row?.tokenId ?? null;
};

const storeTokenId = async (owner: ListingOwner, tokenId: string) => {
  if ("agencyId" in owner) {
    await db
      .update(agency_metadata)
      .set({ tradesafe_token_id: tokenId, updated_at: new Date() })
      .where(eq(agency_metadata.id, owner.agencyId));
  } else {
    await db
      .update(accounts)
      .set({ tradesafe_token_id: tokenId, updated_at: new Date() })
      .where(eq(accounts.auth_id, owner.freelancerId));
  }
};

/** The seller's TradeSafe token, or a 409 telling them to add payout details first. */
export const getSellerToken = async (owner: ListingOwner): Promise<string> => {
  const tokenId = await getStoredTokenId(owner);
  if (!tokenId) {
    throw new ApiError(
      409,
      "agencyId" in owner
        ? "This company hasn't added payout details yet, so it can't be paid through escrow."
        : "This pro hasn't added payout details yet, so they can't be paid through escrow.",
    );
  }
  return tokenId;
};

export const hasPayoutDetails = async (owner: ListingOwner) =>
  Boolean(await getStoredTokenId(owner));

const mask = (value: string | null | undefined, visible = 3) =>
  value ? `${"•".repeat(Math.max(0, value.length - visible))}${value.slice(-visible)}` : null;

export const getPayoutDetails = async (owner: ListingOwner, actorId: string) => {
  const tokenId = await getStoredTokenId(owner);
  const banks = Object.entries(BANKS).map(([code, name]) => ({ code, name }));

  if (!tokenId) {
    // Prefill the form from the signed-in user's account.
    const user = env.clerkSecretKey
      ? await createClerkClient({ secretKey: env.clerkSecretKey })
          .users.getUser(actorId)
          .catch(() => null)
      : null;
    return {
      configured: false,
      details: null,
      defaults: {
        givenName: user?.firstName ?? "",
        familyName: user?.lastName ?? "",
        email: user?.primaryEmailAddress?.emailAddress ?? "",
      },
      banks,
      accountTypes: BANK_ACCOUNT_TYPES,
    };
  }

  const token = await getPayoutToken(tokenId);
  return {
    configured: true,
    details: token
      ? {
          valid: token.valid,
          verified: token.verified,
          givenName: token.user?.givenName ?? "",
          familyName: token.user?.familyName ?? "",
          email: token.user?.email ?? "",
          mobile: token.user?.mobile ?? "",
          idType: token.user?.idType ?? null,
          idCountry: token.user?.idCountry ?? null,
          idNumberMasked: mask(token.user?.idNumber),
          bank: token.bankAccount?.bank ?? null,
          accountType: token.bankAccount?.accountType ?? null,
          // TradeSafe already masks the account number.
          accountNumberMasked: token.bankAccount?.accountNumber ?? null,
        }
      : null,
    defaults: null,
    banks,
    accountTypes: BANK_ACCOUNT_TYPES,
  };
};

// ---------------------------------------------------------------------------
// Validation

/** South African ID numbers are 13 digits with a Luhn check digit. */
const isValidSaId = (id: string) => {
  if (!/^\d{13}$/.test(id)) return false;
  let sum = 0;
  for (let index = 0; index < 13; index += 1) {
    let digit = Number(id[index]);
    if (index % 2 === 1) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
  }
  return sum % 10 === 0;
};

const normalizeMobile = (value: string) => {
  const compact = value.replace(/[\s()-]/g, "");
  if (/^0\d{9}$/.test(compact)) return `+27${compact.slice(1)}`;
  if (/^27\d{9}$/.test(compact)) return `+${compact}`;
  if (/^\+\d{10,15}$/.test(compact)) return compact;
  throw new ApiError(400, "Enter a valid mobile number, e.g. 082 123 4567.");
};

const text = (value: unknown, name: string, max = 100) => {
  const result = typeof value === "string" ? value.trim() : "";
  if (!result) throw new ApiError(400, `${name} is required.`);
  if (result.length > max) throw new ApiError(400, `${name} is too long.`);
  return result;
};

export const parsePayoutDetails = (
  body: Record<string, unknown>,
  updating: boolean,
): PayoutTokenInput => {
  const user: PayoutTokenInput["user"] = {
    givenName: text(body.givenName, "First name"),
    familyName: text(body.familyName, "Last name"),
    mobile: normalizeMobile(text(body.mobile, "Mobile number", 30)),
  };

  // Email is set once, when the token is created; TradeSafe doesn't allow changing it.
  if (!updating) {
    const email = text(body.email, "Email", 254).toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new ApiError(400, "Enter a valid email address.");
    }
    user.email = email;
  }

  // ID: required the first time; optional on update (blank keeps the current one).
  const idNumber = typeof body.idNumber === "string" ? body.idNumber.replace(/\s/g, "") : "";
  if (idNumber || !updating) {
    const idType = body.idType === "PASSPORT" ? "PASSPORT" : "NATIONAL";
    if (idType === "NATIONAL") {
      if (!isValidSaId(idNumber)) throw new ApiError(400, "Enter a valid 13-digit SA ID number.");
      Object.assign(user, { idNumber, idType, idCountry: "ZAF" });
    } else {
      if (!/^[A-Za-z0-9]{6,20}$/.test(idNumber)) {
        throw new ApiError(400, "Enter a valid passport number.");
      }
      const idCountry = typeof body.idCountry === "string" ? body.idCountry.trim().toUpperCase() : "";
      if (!/^[A-Z]{3}$/.test(idCountry)) {
        throw new ApiError(400, "Choose the country that issued the passport.");
      }
      Object.assign(user, { idNumber: idNumber.toUpperCase(), idType, idCountry });
    }
  }

  // Bank account: required the first time; on update only when a new number is entered.
  const accountNumber =
    typeof body.accountNumber === "string" ? body.accountNumber.replace(/[\s-]/g, "") : "";
  let bankAccount: PayoutTokenInput["bankAccount"];
  if (accountNumber || !updating) {
    if (!/^\d{6,16}$/.test(accountNumber)) {
      throw new ApiError(400, "Enter a valid bank account number (digits only).");
    }
    if (typeof body.bank !== "string" || !(body.bank in BANKS)) {
      throw new ApiError(400, "Choose your bank.");
    }
    if (!BANK_ACCOUNT_TYPES.includes(body.accountType as BankAccountType)) {
      throw new ApiError(400, "Choose your account type.");
    }
    bankAccount = {
      accountNumber,
      bank: body.bank as BankCode,
      accountType: body.accountType as BankAccountType,
    };
  }

  return { user, bankAccount };
};

export const savePayoutDetails = async (owner: ListingOwner, input: PayoutTokenInput) => {
  const tokenId = await getStoredTokenId(owner);
  try {
    if (tokenId) {
      await updatePayoutToken(tokenId, input);
    } else {
      const token = await createPayoutToken(input);
      await storeTokenId(owner, token.id);
    }
  } catch (error) {
    // GraphQL validation errors (e.g. a rejected ID or account number) are safe to show;
    // anything else (network, auth) gets a generic message.
    const message = error instanceof Error ? error.message : "";
    const prefix = "TradeSafe API error: ";
    throw new ApiError(
      message.startsWith(prefix) ? 400 : 502,
      message.startsWith(prefix)
        ? `TradeSafe rejected these details: ${message.slice(prefix.length)}`
        : "TradeSafe couldn't save these payout details right now. Please try again.",
    );
  }
};
