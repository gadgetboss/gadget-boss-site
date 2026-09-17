# GadgetBoss Shop — Sync & Operations Guide

## Overview

GadgetBoss uses a **single Supabase PostgreSQL database** as the system of record for:

- Product catalogue (POS is primary editor)
- Inventory quantities
- POS sales and online orders
- Inventory movement ledger

The existing POS UI is preserved. Persistence was adapted under `completeSale`, product save, and dashboard sales hydration. The public website reads the same catalogue and places `ONLINE` orders through the same atomic RPC.

See also: [`docs/SYNC_IMPLEMENTATION_PLAN.md`](docs/SYNC_IMPLEMENTATION_PLAN.md)

---

## Environment variables

Copy [`.env.example`](.env.example).

| Variable | Where | Purpose |
|----------|--------|---------|
| `SUPABASE_URL` | Browser via `window.__GADGETBOSS_ENV__` | Project URL |
| `SUPABASE_ANON_KEY` | Browser via `window.__GADGETBOSS_ENV__` | Public anon key (RLS enforced) |
| `SUPABASE_SERVICE_ROLE_KEY` | Server/CI only | Migrations / admin seeds — **never** ship to browsers |
| `PAYSTACK_PUBLIC_KEY` | Browser (via `/api/public-config` or `index.html`) | Opens Paystack inline checkout |
| `PAYSTACK_SECRET_KEY` | Server/Vercel only | Verifies payments after checkout — **never** ship to browsers |
| `HUBTEL_CLIENT_ID` / `HUBTEL_CLIENT_SECRET` | Server/Vercel only | Hubtel OTP API credentials — **never** ship to browsers |
| `HUBTEL_SENDER_ID` | Server/Vercel only | SMS sender, defaults to `GADGETBOSS` |
| `HUBTEL_OTP_BASE_URL` | Server/Vercel only | Defaults to `https://api-otp.hubtel.com` |
| `SESSION_SECRET` | Server/Vercel only | Long random string that signs the `gb_otp` / `gb_session` cookies |

Inject keys in:

- [`index.html`](index.html) → `window.__GADGETBOSS_ENV__`
- [`pos/index.html`](pos/index.html) → `window.__GADGETBOSS_ENV__`

When URL/key are empty, POS and website keep working offline with local seed data (no shared sync).

On Vercel, set `PAYSTACK_PUBLIC_KEY` and `PAYSTACK_SECRET_KEY` in **Project → Settings → Environment Variables**. The storefront loads the public key from `GET /api/public-config` at startup, so you do not need to edit `index.html` for each deploy.

---

## Paystack checkout

Customers can pay with **Card** or **Mobile Money** (MTN, Telecel, AirtelTigo) from the cart:

1. Add items → **Pay with Paystack**
2. Confirm phone via OTP (when Hubtel is configured)
3. Enter delivery details and choose payment channel
4. Paystack inline popup collects payment in GHS
5. Server verifies the transaction at `POST /api/paystack/verify`
6. Order is saved to Supabase as `ONLINE` / `CONFIRMED` with idempotency key `paystack-{reference}`

### Paystack dashboard setup

1. Create a Paystack account and enable **Ghana Cedi (GHS)**.
2. Copy **Public Key** → `PAYSTACK_PUBLIC_KEY`
3. Copy **Secret Key** → `PAYSTACK_SECRET_KEY` (Vercel env + local `.env` for `server.py`)
4. Test with Paystack test keys (`pk_test_…` / `sk_test_…`) before going live.

Local dev with verification:

```bash
export PAYSTACK_PUBLIC_KEY=pk_test_...
export PAYSTACK_SECRET_KEY=sk_test_...
python3 server.py 8090
```

---

## Passwordless customer sign-in (Hubtel OTP)

Customers sign in with a phone number and a one-time SMS code — no passwords, no
customer rows in Supabase Auth.

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/auth/request-otp` | POST | `{ phone }` → sends the code, sets `gb_otp` |
| `/api/auth/verify-otp` | POST | `{ code }` → clears `gb_otp`, sets `gb_session` |
| `/api/auth/resend-otp` | POST | resends the code (1 per 30s) |
| `/api/auth/logout` | POST | clears both cookies |
| `/api/auth/session` | GET | `{ authenticated, phone?, maskedPhone?, configured }` |
| `/api/account/orders` | GET | the signed-in customer's last 50 orders |
| `/api/account/orders/:id` | GET | one order plus a derived `tracking` timeline |

**No database is used for pending OTP state.** Both cookies are HttpOnly and
HMAC-SHA256 signed with `SESSION_SECRET` (`base64url(payload).base64url(sig)`,
compared with `crypto.timingSafeEqual`):

- `gb_otp` — `{ phone, requestId, prefix, attempts, lastSentAt, exp }`, Max-Age 10 min.
  Hubtel's `requestId`/`prefix` stay server-only; they never appear in a response body.
- `gb_session` — `{ phone, iat, exp }`, Max-Age 30 days.

Flags on both: `HttpOnly; Path=/; SameSite=Lax; Max-Age=…`, plus `Secure` when
`x-forwarded-proto` is `https` (omitted on plain HTTP so local dev works).

Limits: 5 wrong codes per pending OTP, then `429` until a new code is requested;
resend is capped at 1 per 30 seconds.

### Graceful degradation

When `HUBTEL_CLIENT_ID`, `HUBTEL_CLIENT_SECRET` or `SESSION_SECRET` is missing,
`/api/auth/request-otp` returns **HTTP 200** with
`{ ok: false, configured: false }`. The storefront reads `configured: false` and
lets checkout proceed exactly as it does today, so the live store keeps working
before the keys are set.

`/api/account/*` needs `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` (service
role, never the anon key). Without them the order list returns
`{ ok: true, configured: false, orders: [] }`.

Order lookups match `customer_phone` against every stored spelling of the
session phone (`+233…`, `233…`, `0…`, bare 9 digits) via
[`src/auth/phone.ts`](src/auth/phone.ts). `api/_lib/phone.js` is a CommonJS copy
of that module — `src/` is excluded from the Vercel bundle and the serverless
functions run with zero dependencies, so **keep the two files in sync**. The
normaliser is unit-tested in [`tests/phone.test.ts`](tests/phone.test.ts).

Fetching an order the session does not own returns the same `404 Order not
found.` as a non-existent one, so order ids cannot be enumerated.

Local dev parity lives in [`server.py`](server.py): the same routes, cookie
names, signing scheme and JSON shapes, outside the CRM basic-auth gate.

```bash
export HUBTEL_CLIENT_ID=...
export HUBTEL_CLIENT_SECRET=...
export SESSION_SECRET=$(openssl rand -hex 32)
python3 server.py 8090
```

---

## Database migration

Migrations live in [`supabase/migrations/`](supabase/migrations/):

1. `20260329120000_gadgetboss_sync_core.sql` — schema, indexes, RLS, RPCs, realtime publication
2. `20260329120100_seed_catalogue.sql` — 22 catalogue rows from the live store

### Apply with Supabase CLI

```bash
# From project root
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

### Or SQL editor

Run the two migration files in order in the Supabase SQL editor.

### Realtime

The core migration adds `products`, `orders`, `order_items`, and `inventory_movements` to `supabase_realtime`. In the Supabase dashboard, confirm Realtime is enabled for those tables.

### Staff users

1. Create Auth users in Supabase Authentication.
2. Insert matching rows into `profiles`:

```sql
INSERT INTO public.profiles (id, full_name, role)
VALUES ('AUTH_USER_UUID', 'Store Manager', 'manager');
-- role: admin | manager | cashier
```

---

## Atomic checkout RPC

`public.complete_order_with_inventory_check(payload jsonb)`:

- Locks each product row (`FOR UPDATE`)
- Rejects the whole order if any line lacks stock (no partial deductions)
- Writes `orders`, `order_items`, `payments`, `inventory_movements`
- Decrements `products.qty_on_hand`
- Idempotent on `idempotency_key` (retries return the original order, no double stock hit)

Both channels call it:

| Channel | `source` | Default status |
|---------|----------|----------------|
| POS checkout | `POS` | `COMPLETED` |
| Website WhatsApp checkout | `ONLINE` | `PENDING` |

Manual stock changes use `adjust_inventory(product_id, qty_change, reason)` (manager/admin only; reason required). Cashiers cannot edit stock.

---

## Local development

```bash
# Optional TS toolchain (when Node is available)
npm install
npm run build      # rebuilds dist/gadgetboss-sync.js from src/sync
npm test           # contract tests for sync/oversell/idempotency
npm run typecheck

# Static + CRM server
python3 server.py 8090
```

Open:

- Storefront: http://127.0.0.1:8090/
- POS: http://127.0.0.1:8090/pos/

`dist/gadgetboss-sync.js` is committed so the site works without a Node build. TypeScript sources in `src/sync/` are the source of truth when you rebuild.

---

## End-to-end sync test checklist

1. **Migrate + seed** Supabase; set anon keys in both HTML shells.
2. **POS login** (local demo users still work offline; use Supabase Auth staff when syncing).
3. Sell 1 unit of a product in POS → website stock drops without refresh (Realtime).
4. Place an online WhatsApp checkout for another SKU → order appears in POS Transactions as **Online**; stock drops on POS.
5. Drive stock to 0 → website shows **OUT OF STOCK** and disables Add to Cart.
6. Attempt concurrent POS + online purchase of the last unit → one succeeds, one gets `INSUFFICIENT_STOCK`.
7. Retry the same online checkout with the same idempotency key → no second deduction.
8. Manager adjusts stock with a reason → movement row appears in `inventory_movements`.

---

## Security notes

- RLS: public may only `SELECT` `active` + `website_visible` products.
- Order inserts for the public path go through the SECURITY DEFINER RPC only.
- Service role key must never appear in `index.html`, `pos/`, or `dist/`.
- Cashiers: POS sales + view stock; no direct inventory edits.
