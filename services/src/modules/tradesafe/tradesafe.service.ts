import { logger } from "../../config/logger.js";
import { redis } from "../../config/redis.js";
import { tradesafeQuery } from "../../config/tradesafe.js";

// Transaction states seen in TradeSafe callbacks (from their official WooCommerce plugin).
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
  allocations: { id: string; state: string }[];
  parties: { id: string; role: string; details: { tokenId: string | null } | null }[];
};

const TRANSACTION_QUERY = /* GraphQL */ `
  query Transaction($id: ID!) {
    transaction(id: $id) {
      id
      reference
      state
      allocations {
        id
        state
      }
      parties {
        id
        role
        details {
          tokenId
        }
      }
    }
  }
`;

const PROCESSED_TTL_SECONDS = 60 * 60 * 24 * 7;

const processedKey = (transactionId: string, state: string) =>
  `tradesafe:callback:${transactionId}:${state}`;

export const getTradeSafeTransaction = async (
  id: string,
): Promise<TradeSafeTransaction> => {
  const data = await tradesafeQuery<{ transaction: TradeSafeTransaction | null }>(
    TRANSACTION_QUERY,
    { id },
  );

  if (!data.transaction) {
    throw new Error(`TradeSafe transaction ${id} was not found.`);
  }

  return data.transaction;
};

export const wasCallbackProcessed = async (
  transactionId: string,
  state: string,
): Promise<boolean> =>
  (await redis.exists(processedKey(transactionId, state))) === 1;

export const markCallbackProcessed = async (
  transactionId: string,
  state: string,
): Promise<void> => {
  await redis.set(processedKey(transactionId, state), "1", {
    expiration: { type: "EX", value: PROCESSED_TTL_SECONDS },
  });
};

/**
 * Acts on a transaction whose state was confirmed with TradeSafe's API.
 * CoverPro doesn't create TradeSafe transactions yet, so each branch only logs.
 * Once contracts store a TradeSafe transaction ID, update the matching contract here.
 */
export const handleTradeSafeTransactionUpdate = async (
  transaction: TradeSafeTransaction,
): Promise<void> => {
  const attributes = {
    "tradesafe.transaction_id": transaction.id,
    "tradesafe.reference": transaction.reference ?? "",
    "tradesafe.state": transaction.state,
    "tradesafe.allocation_state": transaction.allocations[0]?.state ?? "",
  };

  switch (transaction.state) {
    case "FUNDS_DEPOSITED":
      // Buyer chose manual EFT; funds not yet cleared.
      break;
    case "FUNDS_RECEIVED":
      // Funds are in escrow: work can start (allocationStartDelivery).
      break;
    case "INITIATED":
      // Delivery started; check allocation state for DISPUTED.
      break;
    case "DELIVERED":
      // Buyer accepted the work; TradeSafe will release funds.
      break;
    case "FUNDS_RELEASED":
      // Seller has been paid.
      break;
    case "REFUNDED":
    case "ADMIN_REFUNDED":
      // Transaction cancelled and buyer refunded.
      break;
    default:
      break;
  }

  await logger.info({
    message: "TradeSafe transaction updated",
    eventName: "tradesafe.transaction.updated",
    attributes,
  });
};
