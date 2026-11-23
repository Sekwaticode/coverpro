import { timingSafeEqual } from "crypto";
import { RequestHandler } from "express";
import { env } from "../../config/env.js";
import { ApiError } from "../../utils/api-error.js";
import { asyncHandler } from "../../utils/async-handler.js";
import {
  getTradeSafeTransaction,
  handleTradeSafeTransactionUpdate,
  markCallbackProcessed,
  wasCallbackProcessed,
} from "./tradesafe.service.js";

const tokenMatches = (provided: unknown, expected: string): boolean => {
  if (typeof provided !== "string") return false;
  const providedBuffer = Buffer.from(provided);
  const expectedBuffer = Buffer.from(expected);
  return (
    providedBuffer.length === expectedBuffer.length &&
    timingSafeEqual(providedBuffer, expectedBuffer)
  );
};

/**
 * TradeSafe POSTs JSON like { id, reference, state, ... } to the callback URL.
 * TradeSafe's own plugins don't verify a signature, so this endpoint:
 *   1. requires the secret ?token= set in the callback URL, and
 *   2. ignores the posted state and re-fetches the transaction from TradeSafe's API.
 */
export const tradesafeCallback: RequestHandler = asyncHandler(
  async (request, response) => {
    const secret = env.tradesafe.callbackSecret;
    if (!secret || !tokenMatches(request.query.token, secret)) {
      await request.logger.warn({
        message: "Webhook signature rejected",
        eventName: "webhook.inbound.rejected",
        attributes: {
          "webhook.source": "tradesafe",
          "webhook.reject_reason": secret ? "invalid_token" : "missing_secret",
        },
      });
      throw new ApiError(401, "Invalid TradeSafe callback.");
    }

    const body = (request.body ?? {}) as Record<string, unknown>;
    const transactionId =
      typeof body.id === "string"
        ? body.id
        : typeof body.transactionId === "string"
          ? body.transactionId
          : undefined;

    if (!transactionId) {
      await request.logger.warn({
        message: "TradeSafe callback missing transaction id",
        eventName: "webhook.inbound.rejected",
        attributes: {
          "webhook.source": "tradesafe",
          "webhook.reject_reason": "missing_transaction_id",
          "webhook.body_keys": Object.keys(body).join(","),
        },
      });
      throw new ApiError(400, "TradeSafe callback has no transaction id.");
    }

    let transaction;
    try {
      transaction = await getTradeSafeTransaction(transactionId);
    } catch (error) {
      await request.logger.error({
        message: "TradeSafe transaction lookup failed",
        eventName: "tradesafe.transaction.lookup_failed",
        attributes: {
          "tradesafe.transaction_id": transactionId,
          "error.message": error instanceof Error ? error.message : String(error),
        },
      });
      // Non-2xx so TradeSafe retries later.
      throw new ApiError(502, "Could not verify TradeSafe transaction.");
    }

    if (await wasCallbackProcessed(transaction.id, transaction.state)) {
      response.status(200).json({ received: true, duplicate: true });
      return;
    }

    await handleTradeSafeTransactionUpdate(transaction);
    await markCallbackProcessed(transaction.id, transaction.state);

    response.status(200).json({ received: true });
  },
);
