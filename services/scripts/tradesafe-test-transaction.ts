/**
 * Creates a sandbox TradeSafe transaction and prints a checkout link to pay it.
 * Paying it makes TradeSafe call the callback URL configured on your API application.
 *
 * Run from services/:  npx tsx scripts/tradesafe-test-transaction.ts
 * Mutations mirror TradeSafe's official WooCommerce plugin (github.com/tradesafe/woocommerce).
 */
import { env } from "../src/config/env.js";
import { tradesafeGraphqlUrl, tradesafeQuery } from "../src/config/tradesafe.js";

const str = (value: string) => JSON.stringify(value);

const main = async () => {
  if (env.tradesafe.environment !== "sandbox") {
    throw new Error("Refusing to run: TRADESAFE_ENV is not 'sandbox'.");
  }

  console.log(`API: ${tradesafeGraphqlUrl}\n`);

  // 1. Show which callback URL TradeSafe has on file for this application.
  const { clientInfo } = await tradesafeQuery<{
    clientInfo: { name: string; callback: string | null; production: boolean };
  }>(`query { clientInfo { name callback production } }`);
  console.log(`Application: ${clientInfo.name}`);
  console.log(`Callback URL on file: ${clientInfo.callback ?? "(none set)"}\n`);

  // 2. The seller is the API application's own profile token.
  const { apiProfile } = await tradesafeQuery<{ apiProfile: { token: string } }>(
    `query { apiProfile { token } }`,
  );

  // 3. Create a throwaway buyer token.
  const stamp = Date.now();
  const { tokenCreate: buyer } = await tradesafeQuery<{ tokenCreate: { id: string } }>(
    `mutation ($input: TokenInput!) { tokenCreate(input: $input) { id } }`,
    {
      input: {
        user: {
          givenName: "Test",
          familyName: "Buyer",
          email: `test-buyer-${stamp}@example.com`,
        },
        settings: { payout: { interval: "WEEKLY" } },
      },
    },
  );

  // 4. Create a R100 transaction between them.
  const reference = `coverpro-test-${stamp}`;
  const { transactionCreate: transaction } = await tradesafeQuery<{
    transactionCreate: { id: string; state: string };
  }>(`mutation {
    transactionCreate(input: {
      title: ${str("CoverPro test transaction")},
      description: ${str("Sandbox callback test")},
      industry: GENERAL_GOODS_SERVICES,
      currency: ZAR,
      feeAllocation: SELLER,
      workflow: STANDARD,
      reference: ${str(reference)},
      privacy: NONE,
      allocations: { create: [{
        title: ${str("Test milestone")},
        description: ${str("Sandbox callback test")},
        value: 100,
        daysToDeliver: 14,
        daysToInspect: 7
      }] },
      parties: { create: [
        { token: ${str(buyer.id)}, role: BUYER },
        { token: ${str(apiProfile.token)}, role: SELLER }
      ] }
    }) { id state }
  }`);

  // 5. Get a checkout link for the buyer to pay.
  const { checkoutLink } = await tradesafeQuery<{ checkoutLink: string }>(
    `mutation ($transactionId: ID!) { checkoutLink(transactionId: $transactionId) }`,
    { transactionId: transaction.id },
  );

  console.log(`Transaction: ${transaction.id} (${transaction.state})`);
  console.log(`Reference:   ${reference}`);
  console.log(`\nOpen this link and pay with a sandbox method:\n${checkoutLink}\n`);
};

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
