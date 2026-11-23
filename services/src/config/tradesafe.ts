import { env } from "./env.js";

// Domains match TradeSafe's official WooCommerce plugin (github.com/tradesafe/woocommerce, config.php).
const API_DOMAINS = {
  sandbox: "https://api-developer.tradesafe.dev",
  production: "https://api.tradesafe.co.za",
} as const;

const AUTH_DOMAIN = "https://auth.tradesafe.co.za";

export const tradesafeGraphqlUrl = `${API_DOMAINS[env.tradesafe.environment]}/graphql`;

let cachedToken: { value: string; expiresAt: number } | undefined;

const getAccessToken = async (): Promise<string> => {
  // Reuse the token until 2 minutes before it expires.
  if (cachedToken && cachedToken.expiresAt > Date.now() + 120_000) {
    return cachedToken.value;
  }

  const { clientId, clientSecret } = env.tradesafe;
  if (!clientId || !clientSecret) {
    throw new Error(
      "TRADESAFE_CLIENT_ID and TRADESAFE_CLIENT_SECRET must be set.",
    );
  }

  const response = await fetch(`${AUTH_DOMAIN}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });

  if (!response.ok) {
    throw new Error(
      `TradeSafe token request failed with status ${response.status}.`,
    );
  }

  const data = (await response.json()) as {
    access_token: string;
    expires_in: number;
  };

  cachedToken = {
    value: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };

  return cachedToken.value;
};

export const tradesafeQuery = async <T>(
  query: string,
  variables: Record<string, unknown> = {},
): Promise<T> => {
  const token = await getAccessToken();

  const response = await fetch(tradesafeGraphqlUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    throw new Error(`TradeSafe API request failed with status ${response.status}.`);
  }

  const result = (await response.json()) as {
    data?: T;
    errors?: { message: string }[];
  };

  if (result.errors?.length) {
    throw new Error(
      `TradeSafe API error: ${result.errors.map((error) => error.message).join("; ")}`,
    );
  }

  if (!result.data) {
    throw new Error("TradeSafe API returned no data.");
  }

  return result.data;
};
