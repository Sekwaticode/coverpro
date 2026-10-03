# Local setup

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

## Production notes

- The Next.js apps deploy well to Vercel. Create one project per app, with its root directory set to `apps/<app>`.
- The API holds Socket.IO connections and runs a payout cron, so host it on a long-running server (Railway, Render, Fly.io) rather than serverless functions.
- Redis and NATS must be reachable with no TLS or credentials beyond the Redis password, because the current client config doesn't support them. Running both next to the API, for example as Railway services, is the simplest option.
- Update every `*_DASHBOARD` / `NEXT_PUBLIC_*` URL to the production domains.
- Switch Clerk to a production instance.
