import net from "node:net";

// Node's default 250ms per-address connect attempt is too short on slow links, causing
// sporadic ETIMEDOUT (internalConnectMultiple) for Neon and Clerk requests.
net.setDefaultAutoSelectFamilyAttemptTimeout(
  Number(process.env.NETWORK_FAMILY_ATTEMPT_TIMEOUT_MS ?? 2000),
);
