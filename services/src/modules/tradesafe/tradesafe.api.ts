/**
 * Thin wrappers over TradeSafe's GraphQL API.
 * Query and mutation shapes follow TradeSafe's official WooCommerce plugin
 * (github.com/tradesafe/woocommerce, helpers/class-tradesafeapiclient.php).
 */
import { tradesafeQuery } from "../../config/tradesafe.js";

// Transaction states seen in TradeSafe callbacks.
export type TradeSafeTransactionState =
  | "CREATED"
  | "FUNDS_DEPOSITED"
  | "FUNDS_RECEIVED"
  | "INITIATED"
  | "DELIVERED"
  | "FUNDS_RELEASED"
  | "REFUNDED"
  | "ADMIN_REFUNDED"
  | (string & {});

export type TradeSafeTransaction = {
  id: string;
  reference: string | null;
  state: TradeSafeTransactionState;
  allocations: { id: string; state: string; value: number }[];
};

const str = (value: string) => JSON.stringify(value);

export const getTradeSafeTransaction = async (
  id: string,
): Promise<TradeSafeTransaction> => {
  const data = await tradesafeQuery<{ transaction: TradeSafeTransaction | null }>(
    `query Transaction($id: ID!) {
      transaction(id: $id) {
        id
        reference
        state
        allocations { id state value }
      }
    }`,
    { id },
  );

  if (!data.transaction) {
    throw new Error(`TradeSafe transaction ${id} was not found.`);
  }

  return data.transaction;
};

let platformToken: string | undefined;

/** The API application's own TradeSafe token (CoverPro's account). */
export const getPlatformToken = async (): Promise<string> => {
  if (!platformToken) {
    const data = await tradesafeQuery<{ apiProfile: { token: string } }>(
      `query { apiProfile { token } }`,
    );
    platformToken = data.apiProfile.token;
  }
  return platformToken;
};

export const createTradeSafeUserToken = async (user: {
  givenName: string;
  familyName: string;
  email: string;
}): Promise<string> => {
  const data = await tradesafeQuery<{ tokenCreate: { id: string } }>(
    `mutation ($input: TokenInput!) { tokenCreate(input: $input) { id } }`,
    {
      input: {
        user,
        settings: { payout: { interval: "WEEKLY" } },
      },
    },
  );
  return data.tokenCreate.id;
};

export type EscrowAllocationInput = {
  title: string;
  description: string;
  value: number;
  daysToDeliver: number;
  daysToInspect: number;
};

/**
 * Creates a ZAR escrow transaction. Allocations are returned in the order given,
 * so callers can map allocation IDs back to milestone positions.
 */
export const createEscrowTransaction = async (input: {
  title: string;
  description: string;
  reference: string;
  buyerToken: string;
  sellerToken: string;
  /** CoverPro's commission: an AGENT party whose percentage fee is taken from the seller. */
  agent?: { token: string; feePercent: number };
  allocations: EscrowAllocationInput[];
}): Promise<{ id: string; state: string; allocationIds: string[] }> => {
  const agentParty = input.agent
    ? `,
        {
          token: ${str(input.agent.token)},
          role: AGENT,
          fee: ${input.agent.feePercent},
          feeType: PERCENT,
          feeAllocation: SELLER
        }`
    : "";

  const allocations = input.allocations
    .map(
      (allocation) => `{
        title: ${str(allocation.title)},
        description: ${str(allocation.description)},
        value: ${allocation.value.toFixed(2)},
        daysToDeliver: ${Math.max(1, Math.round(allocation.daysToDeliver))},
        daysToInspect: ${Math.max(1, Math.round(allocation.daysToInspect))}
      }`,
    )
    .join(",");

  const data = await tradesafeQuery<{
    transactionCreate: {
      id: string;
      state: string;
      allocations: { id: string; title: string; value: number }[];
    };
  }>(`mutation {
    transactionCreate(input: {
      title: ${str(input.title)},
      description: ${str(input.description)},
      industry: GENERAL_GOODS_SERVICES,
      currency: ZAR,
      feeAllocation: SELLER,
      workflow: STANDARD,
      reference: ${str(input.reference)},
      privacy: NONE,
      allocations: { create: [${allocations}] },
      parties: { create: [
        { token: ${str(input.buyerToken)}, role: BUYER },
        { token: ${str(input.sellerToken)}, role: SELLER }${agentParty}
      ] }
    }) {
      id
      state
      allocations { id title value }
    }
  }`);

  const created = data.transactionCreate;
  if (created.allocations.length !== input.allocations.length) {
    throw new Error("TradeSafe returned a different number of allocations.");
  }

  return {
    id: created.id,
    state: created.state,
    allocationIds: created.allocations.map((allocation) => allocation.id),
  };
};

export const getCheckoutLink = async (transactionId: string): Promise<string> => {
  const data = await tradesafeQuery<{ checkoutLink: string }>(
    `mutation ($transactionId: ID!) { checkoutLink(transactionId: $transactionId) }`,
    { transactionId },
  );
  return data.checkoutLink;
};

// ---------------------------------------------------------------------------
// Payout tokens for pros and agencies (sellers). Bank details are stored at
// TradeSafe only; CoverPro keeps the token ID.

export const BANK_ACCOUNT_TYPES = ["CHEQUE", "SAVINGS", "TRANSMISSION", "BOND"] as const;
export type BankAccountType = (typeof BANK_ACCOUNT_TYPES)[number];

/** TradeSafe's UniversalBranchCode enum (sandbox, Nov 2026). */
export const BANKS = {
  ABSA: "Absa Bank",
  ACCESS: "Access Bank",
  AFRICAN: "African Bank",
  BANKZERO: "Bank Zero",
  BIDVEST: "Bidvest Bank",
  CAPITEC: "Capitec Bank",
  CAPITEC_BUSINESS: "Capitec Business / Mercantile",
  DISCOVERY: "Discovery Bank",
  FNB: "First National Bank",
  INVESTEC: "Investec Bank",
  ITHALA: "Ithala",
  MERCANTILE: "Mercantile",
  NEDBANK: "Nedbank",
  RMB: "RMB Private Bank",
  SASFIN: "Sasfin Bank",
  SBSA: "Standard Bank South Africa",
  TYME: "TymeBank",
  OTHER: "Other Bank",
} as const;
export type BankCode = keyof typeof BANKS;

export type PayoutTokenInput = {
  user: {
    givenName: string;
    familyName: string;
    // Required on create; TradeSafe doesn't allow changing it afterwards.
    email?: string;
    mobile: string;
    // Omitted on update to keep the value TradeSafe already has.
    idNumber?: string;
    idType?: "NATIONAL" | "PASSPORT";
    idCountry?: string;
  };
  // Omitted on update to keep the current bank account.
  bankAccount?: { accountNumber: string; accountType: BankAccountType; bank: BankCode };
};

export type PayoutTokenDetails = {
  id: string;
  valid: boolean | null;
  verified: boolean | null;
  user: {
    givenName: string | null;
    familyName: string | null;
    email: string | null;
    mobile: string | null;
    idNumber: string | null;
    idType: string | null;
    idCountry: string | null;
  } | null;
  bankAccount: {
    accountNumber: string | null; // masked by TradeSafe
    accountType: string | null;
    bank: string | null;
  } | null;
};

const TOKEN_FIELDS = `
  id valid verified
  user { givenName familyName email mobile idNumber idType idCountry }
  bankAccount { accountNumber accountType bank }
`;

const tokenInput = (input: PayoutTokenInput) => ({
  user: input.user,
  ...(input.bankAccount ? { bankAccount: input.bankAccount } : {}),
  // Pay out as soon as funds are released to the seller.
  settings: { payout: { interval: "IMMEDIATE" } },
});

export const createPayoutToken = async (input: PayoutTokenInput) => {
  const data = await tradesafeQuery<{ tokenCreate: PayoutTokenDetails }>(
    `mutation ($input: TokenInput!) { tokenCreate(input: $input) { ${TOKEN_FIELDS} } }`,
    { input: tokenInput(input) },
  );
  return data.tokenCreate;
};

export const updatePayoutToken = async (id: string, input: PayoutTokenInput) => {
  // TradeSafe rejects any email in tokenUpdate (sandbox returns "Internal server error"),
  // so a token's email is fixed once created.
  const { email: _email, ...user } = input.user;
  const data = await tradesafeQuery<{ tokenUpdate: PayoutTokenDetails }>(
    `mutation ($id: ID!, $input: TokenInput!) { tokenUpdate(id: $id, input: $input) { ${TOKEN_FIELDS} } }`,
    { id, input: tokenInput({ ...input, user }) },
  );
  return data.tokenUpdate;
};

export const getPayoutToken = async (id: string) => {
  const data = await tradesafeQuery<{ token: PayoutTokenDetails | null }>(
    `query ($id: ID!) { token(id: $id) { ${TOKEN_FIELDS} } }`,
    { id },
  );
  return data.token;
};

// ---------------------------------------------------------------------------
// Delivery workflow per allocation (one allocation = one milestone):
//   CREATED -> allocationStartDelivery -> INITIATED
//   -> allocationCompleteDelivery -> PENDING_ACCEPTANCE (client inspects)
//   -> allocationAcceptDelivery -> DELIVERED -> FUNDS_RELEASED (seller paid out)

export type AllocationTarget = "STARTED" | "SUBMITTED" | "ACCEPTED";

const ALLOCATION_ORDER = [
  "CREATED",
  "INITIATED",
  "IN_TRANSIT",
  "PENDING_ACCEPTANCE",
  "DELIVERED",
  "FUNDS_RELEASED",
] as const;

const TARGET_STATE: Record<AllocationTarget, (typeof ALLOCATION_ORDER)[number]> = {
  STARTED: "INITIATED",
  SUBMITTED: "PENDING_ACCEPTANCE",
  ACCEPTED: "DELIVERED",
};

const allocationMutation = async (
  name: "allocationStartDelivery" | "allocationCompleteDelivery" | "allocationAcceptDelivery",
  id: string,
) => {
  const data = await tradesafeQuery<Record<string, { id: string; state: string }>>(
    `mutation ($id: ID!) { ${name}(id: $id) { id state } }`,
    { id },
  );
  return data[name]!.state;
};

/**
 * Moves an allocation forward to `target`, running only the steps still needed, so
 * it is safe to call again after a partial failure. Returns the final state.
 * Throws if the allocation is disputed, cancelled, or otherwise off the happy path.
 */
export const advanceAllocation = async (
  transactionId: string,
  allocationId: string,
  target: AllocationTarget,
): Promise<string> => {
  const transaction = await getTradeSafeTransaction(transactionId);
  const allocation = transaction.allocations.find((item) => item.id === allocationId);
  if (!allocation) {
    throw new Error(`TradeSafe allocation ${allocationId} is not part of ${transactionId}.`);
  }

  let state = allocation.state;
  const goal = ALLOCATION_ORDER.indexOf(TARGET_STATE[target]);
  const position = () => ALLOCATION_ORDER.indexOf(state as (typeof ALLOCATION_ORDER)[number]);

  if (position() === -1) {
    throw new Error(`TradeSafe allocation is ${state}; it can't move to ${target}.`);
  }
  if (position() < 1 && goal >= 1) state = await allocationMutation("allocationStartDelivery", allocationId);
  if (position() < 3 && goal >= 3) state = await allocationMutation("allocationCompleteDelivery", allocationId);
  if (position() < 4 && goal >= 4) state = await allocationMutation("allocationAcceptDelivery", allocationId);
  return state;
};
