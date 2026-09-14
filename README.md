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

Inject keys in:

- [`index.html`](index.html) → `window.__GADGETBOSS_ENV__`
- [`pos/index.html`](pos/index.html) → `window.__GADGETBOSS_ENV__`

When URL/key are empty, POS and website keep working offline with local seed data (no shared sync).

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
