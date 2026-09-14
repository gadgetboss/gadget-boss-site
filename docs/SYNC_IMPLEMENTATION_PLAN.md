# GadgetBoss POS ↔ Website Sync — Implementation Plan

## Current state (inspected)

| Surface | Storage today | Inventory |
|---------|---------------|-----------|
| POS (`pos/app.jsx`) | `localStorage` key `gadgetboss_pos_v1` | Client-side qty decrement in `POSPage.completeSale` |
| Website (`app.js`) | Hardcoded `PRODUCTS` array | Decorative `stock`; WhatsApp checkout does not deduct |
| CRM (`server.py` + `crm.db`) | SQLite customers/leads/orders | No products/inventory |

Product IDs already align between `app.js` and `pos/seed-products.json` (22 SKUs).

## Principle

**Smallest safe change:** keep every POS screen/component. Replace the persistence boundary under existing hooks (`completeSale`, product save, dashboard sales list) with a shared Supabase PostgreSQL database. The website reads the same catalogue and places `ONLINE` orders through the same atomic RPC the POS uses.

## Target architecture

```
┌─────────────────┐     ┌──────────────────────────┐     ┌─────────────────┐
│  Website app.js │────▶│  Shared TS sync client   │◀────│  POS app.jsx    │
│  (catalogue +   │     │  @supabase/supabase-js   │     │  (UI unchanged) │
│   checkout)     │     └────────────┬─────────────┘     └─────────────────┘
└─────────────────┘                  │
                                     ▼
                    ┌────────────────────────────────┐
                    │  Supabase PostgreSQL           │
                    │  products, orders, order_items │
                    │  inventory_movements, RLS      │
                    │  RPC: complete_order_with_     │
                    │       inventory_check          │
                    │  Realtime on products/orders   │
                    └────────────────────────────────┘
```

## Phases delivered in this change set

1. **SQL migrations** — schema, indexes, RLS, atomic idempotent checkout RPC, seed from existing catalogue.
2. **TypeScript sync library** (`src/sync/`) — typed client, product mapping, checkout, realtime helpers; built to `dist/` for CDN-less use and browser POS.
3. **POS adapter** — when env is configured, hydrate products/orders from Supabase; `completeSale` and product mutations call RPC/API; Realtime refreshes stock; localStorage remains offline cache only.
4. **Website adapter** — load active+visible products; live stock; checkout creates `ONLINE` order via same RPC; out-of-stock disables Add to Cart.
5. **Tests** — Vitest coverage for oversell, rollback, idempotency (RPC SQL + client contract tests).
6. **README** — env vars, migrate, realtime, E2E checklist.

## What we deliberately do not change

- POS visual layout, navigation, Chart.js dashboard chrome, receipt print CSS.
- WhatsApp as a customer communication channel (after a successful online order is recorded, WhatsApp can still open with the confirmed receipt number).
- CRM Zoho sync path (orthogonal; can later join on phone).

## Auth model (Supabase)

- Staff: Supabase Auth users + `profiles.role` (`admin` | `manager` | `cashier`).
- Public: anon key may `SELECT` only `active` + `website_visible` products; order insert only via RPC with `source = ONLINE`.
- Service role: migrations and seed scripts only — never shipped to the browser.
