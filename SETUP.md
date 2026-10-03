# Local setup

Planning to move payments to South African providers? See [`docs/payments-migration.md`](docs/payments-migration.md) and section 7 below.

CoverPro is made of one Express API (`services/`) and five Next.js apps (`apps/`).

| App | Port |
|---|---|
| API (`services`) | 4000 |
| landing-page | 3000 |
| freelancer-dashboard | 3001 |
| client-dashboard | 3002 |
| agency-dashboard | 3003 |
| admin-dashboard | 3004 |

## 1. Prerequisites

- Node.js 20+
- Docker (runs Redis and NATS from `services/docker-compose.yml`)
- [Stripe CLI](https://docs.stripe.com/stripe-cli) (forwards webhooks locally)
- [ngrok](https://ngrok.com) (optional; only for the Daily meeting webhook)

## 2. Accounts

| Platform | Used for | Required | Keys |
|---|---|---|---|
| [Neon](https://neon.tech) | Postgres | Yes | `DATABASE_URL` |
| [Clerk](https://clerk.com) | Auth for every app (use **one** Clerk application) | Yes | `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY` |
| OneMinuteLogs | Request logging | Yes, the API refuses to start without it | `ONE_MINUTE_LOGS_API_KEY` |
| [Stripe](https://stripe.com) | Checkout, Connect payouts, Identity verification | For payments | `STRIPE_SECRET_KEY` + webhook secrets |
| [ImageKit](https://imagekit.io) | File uploads | For uploads | `IMAGEKIT_PRIVATE_KEY` |
| [Daily](https://daily.co) | Video meetings | For meetings | `DAILY_API_KEY`, `DAILY_WEBHOOK_SECRET` |

In Stripe, use test mode and enable **Connect** and **Identity**.

## 3. API

```bash
cd services
npm install
cp .env.example .env      # fill in the keys from step 2
docker compose up -d      # Redis (6379) + NATS (4222)
npm run db:migrate        # apply drizzle/ migrations to Neon
npm run dev               # http://localhost:4000
```

- Set `ADMIN_DASHBOARD_PASSWORD` to the password for the admin dashboard.
- Set `ADMIN_SESSION_SECRET` to a long random string, e.g. from `openssl rand -hex 32`.

To check the API is up, run `curl http://localhost:4000/api/v1/health`.

## 4. Frontends

For each app in `apps/`:

```bash
cd apps/<app>
npm install
cp .env.example .env.local   # fill in Clerk keys (admin-dashboard: ADMIN_SESSION_SECRET, same as services/.env)
npx next dev -p <port>       # port from the table above
```

## 5. Stripe webhooks

Run `stripe login` once. Then run each of these in its own terminal:

```bash
stripe listen --forward-to localhost:4000/api/v1/contracts/webhook   # STRIPE_WEBHOOK_SECRET
stripe listen --forward-to localhost:4000/api/v1/connects/webhook    # STRIPE_CONNECTS_WEBHOOK_SECRET
stripe listen --forward-to localhost:4000/api/v1/identity/webhook    # STRIPE_IDENTITY_WEBHOOK_SECRET
```

Copy each printed `whsec_…` value into `services/.env`, then restart the API.

In production, create the same three endpoints in the Stripe dashboard with these events:

- **contracts:** `checkout.session.completed`, `checkout.session.async_payment_succeeded`
- **connects:** `checkout.session.completed`
- **identity:** `identity.verification_session.verified`

## 6. Daily webhook (optional)

1. Expose the API with `ngrok http 4000`.
2. Create a Daily webhook pointing to `https://<host>/api/v1/meetings/webhook` (`POST https://api.daily.co/v1/webhooks`).
3. Put the returned `hmac` value in `DAILY_WEBHOOK_SECRET`.

Without the webhook, rooms still expire automatically after 6 hours.

## 7. South African providers (Paystack, TradeSafe, VerifyNow)

> **Status: the code for these providers hasn't been built yet.**
> [`docs/payments-migration.md`](docs/payments-migration.md) is the build plan.
> The steps below get the accounts, keys and webhook URLs ready. Stripe stays the active provider until the `*_PROVIDER` flags are switched, so both can be set up at the same time.

### 7.1 Accounts

| Platform | Used for | Sign up | What to get |
|---|---|---|---|
| [Paystack](https://paystack.com) | Connects purchases, saved cards (optional payouts) | Register a South African business, then complete compliance | Test secret key (`sk_test_…`), public key (`pk_test_…`) |
| [TradeSafe](https://www.tradesafe.co.za) | Escrow for milestone payments | Business account + developer portal application | Client ID + client secret (sandbox first) |
| [VerifyNow](https://verifynow.co.za) | SA ID + selfie verification, bank account checks | Business account, then buy credits | API key |

### 7.2 Environment variables (`services/.env`)

Add these alongside the Stripe variables. Both sets can be filled in at once.

```env
# Which provider each flow uses (stripe until the new code is live)
COLLECTION_PROVIDER=stripe   # stripe | paystack
ESCROW_PROVIDER=stripe       # stripe | tradesafe | paystack
IDENTITY_PROVIDER=stripe     # stripe | verifynow

# Paystack (Dashboard → Settings → API Keys & Webhooks)
PAYSTACK_SECRET_KEY=sk_test_...
PAYSTACK_PUBLIC_KEY=pk_test_...

# TradeSafe (developer portal → your application)
TRADESAFE_CLIENT_ID=...
TRADESAFE_CLIENT_SECRET=...
TRADESAFE_API_URL=https://api-developer.tradesafe.dev/graphql   # production: https://api.tradesafe.co.za/graphql
TRADESAFE_AUTH_URL=https://auth.tradesafe.co.za/oauth/token
TRADESAFE_PLATFORM_TOKEN_ID=...   # CoverPro's own TradeSafe token (receives the platform fee)

# VerifyNow
VERIFYNOW_API_KEY=...
```

Paystack signs webhooks with the secret key, so it needs no separate webhook secret.

### 7.3 Webhooks and callbacks for local testing

Paystack and TradeSafe have no CLI like `stripe listen`, so expose the API with ngrok:

```bash
ngrok http 4000
```

- **Paystack** (Dashboard → Settings → API Keys & Webhooks, **Test** mode): set the webhook URL to `https://<ngrok-host>/api/v1/paystack/webhook`. Paystack allows only one URL per mode, and the API routes events by `metadata.purpose`.
- **TradeSafe** (developer portal → application): set the callback URL to `https://<ngrok-host>/api/v1/tradesafe/callback`.
- **VerifyNow**: no webhook needed. Verification calls return their result in the same request.

The ngrok URL changes each time you restart ngrok unless you have a reserved domain. Update both dashboards when it changes.

### 7.4 One-time setup

1. **Paystack:**
   - Test a payment with Paystack's test cards.
   - If you'll use Transfers for payouts, turn off the transfer OTP (Settings → Preferences).
   - Ask Paystack to enable Transfers on your account.
2. **TradeSafe:**
   - In the sandbox, create CoverPro's own token with the `tokenCreate` mutation, using the company and bank details.
   - Put its ID in `TRADESAFE_PLATFORM_TOKEN_ID`.
3. **VerifyNow:** run one test check from their dashboard to confirm your credits and API key work.
4. **Database:** once the migration lands, run `npm run db:migrate` for the new provider columns.

### 7.5 Switching a flow over

Once a flow's code is merged:

1. Change its flag, for example `COLLECTION_PROVIDER=paystack`.
2. Restart the API.

Existing Stripe payments and milestones still finish on Stripe, because each payment row records the provider that created it.

## Production notes

- The Next.js apps deploy well to Vercel. Create one project per app, with its root directory set to `apps/<app>`.
- The API holds Socket.IO connections and runs a payout cron, so host it on a long-running server (Railway, Render, Fly.io) rather than serverless functions.
- Redis and NATS must be reachable with no TLS or credentials beyond the Redis password, because the current client config doesn't support them. Running both next to the API, for example as Railway services, is the simplest option.
- Update every `*_DASHBOARD` / `NEXT_PUBLIC_*` URL to the production domains.
- Switch Clerk to a production instance.
