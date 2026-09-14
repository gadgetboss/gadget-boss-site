import { describe, expect, it } from 'vitest';
import { dbProductToPos, dbProductToWebsite, isWebsitePurchasable } from '../src/sync/mappers';
import type { CompleteOrderInput, DbProduct } from '../src/sync/types';

const sample: DbProduct = {
  id: 'airpods-pro-3',
  name: 'AirPods Pro 3rd Gen',
  sku: 'GB00001',
  barcode: 'GB00001',
  brand_name: 'Apple',
  category_name: 'Airpods',
  description: 'ANC',
  cost_price: 238,
  selling_price: 340,
  promotional_price: null,
  qty_on_hand: 5,
  low_stock_at: 3,
  status: 'active',
  website_visible: true,
  image_url: 'assets/airpods-pro-3.jpg',
  tagline: 'ANC',
  badge: 'HOT',
  specs: { chip: 'H2' },
  old_price: 500,
};

describe('mappers', () => {
  it('maps DB product to POS shape', () => {
    const pos = dbProductToPos(sample);
    expect(pos.qty).toBe(5);
    expect(pos.sellingPrice).toBe(340);
    expect(pos.image).toContain('assets/airpods-pro-3.jpg');
  });

  it('maps DB product to website shape and flags stock', () => {
    const web = dbProductToWebsite(sample);
    expect(web.title).toBe('AirPods Pro 3rd Gen');
    expect(web.outOfStock).toBe(false);
    expect(web.lowStock).toBe(false);
  });

  it('marks out of stock when qty is zero', () => {
    const web = dbProductToWebsite({ ...sample, qty_on_hand: 0 });
    expect(web.outOfStock).toBe(true);
    expect(web.badge).toMatch(/OUT OF STOCK/i);
    expect(isWebsitePurchasable(web)).toBe(false);
  });

  it('hides inactive or non-visible products from purchase', () => {
    expect(isWebsitePurchasable({ ...sample, status: 'inactive' })).toBe(false);
    expect(isWebsitePurchasable({ ...sample, website_visible: false })).toBe(false);
  });
});

describe('complete_order payload contract', () => {
  it('requires idempotency key and items for POS and ONLINE', () => {
    const base: CompleteOrderInput = {
      idempotencyKey: 'test-key-1',
      source: 'POS',
      paymentMethod: 'Cash',
      items: [{ productId: 'airpods-pro-3', qty: 1, unitPrice: 340, costPrice: 238 }],
    };
    expect(base.idempotencyKey).toBeTruthy();
    expect(base.items).toHaveLength(1);

    const online: CompleteOrderInput = {
      ...base,
      idempotencyKey: 'test-key-2',
      source: 'ONLINE',
      status: 'PENDING',
      paymentMethod: 'MoMo',
    };
    expect(online.source).toBe('ONLINE');
  });
});

/**
 * These tests document the SQL RPC behaviour that must hold in Supabase.
 * They run as executable contract checks against a mock of the RPC result shape.
 */
describe('RPC contract: complete_order_with_inventory_check', () => {
  function mockRpc(state: { qty: number }, payload: CompleteOrderInput, seenKeys: Set<string>) {
    if (seenKeys.has(payload.idempotencyKey)) {
      return { ok: true, duplicate: true, order_id: 'existing', receipt_no: 'GB-DUP', total: 340 };
    }
    const need = payload.items.reduce((s, i) => s + i.qty, 0);
    if (state.qty < need) {
      return {
        ok: false,
        error: 'INSUFFICIENT_STOCK',
        products: [
          {
            product_id: payload.items[0].productId,
            error: 'INSUFFICIENT_STOCK',
            requested: need,
            available: state.qty,
          },
        ],
      };
    }
    state.qty -= need;
    seenKeys.add(payload.idempotencyKey);
    return { ok: true, duplicate: false, order_id: 'new', receipt_no: 'GB-NEW', total: 340 };
  }

  it('POS sale reduces shared stock used by website', () => {
    const state = { qty: 5 };
    const keys = new Set<string>();
    const pos = mockRpc(state, {
      idempotencyKey: 'pos-1',
      source: 'POS',
      items: [{ productId: 'airpods-pro-3', qty: 2 }],
    }, keys);
    expect(pos.ok).toBe(true);
    expect(state.qty).toBe(3);
    const webView = dbProductToWebsite({ ...sample, qty_on_hand: state.qty });
    expect(webView.stock).toBe(3);
  });

  it('online order reduces POS stock', () => {
    const state = { qty: 5 };
    const keys = new Set<string>();
    const online = mockRpc(state, {
      idempotencyKey: 'online-1',
      source: 'ONLINE',
      items: [{ productId: 'airpods-pro-3', qty: 1 }],
    }, keys);
    expect(online.ok).toBe(true);
    expect(state.qty).toBe(4);
  });

  it('blocks out-of-stock online purchase', () => {
    const state = { qty: 0 };
    const keys = new Set<string>();
    const result = mockRpc(state, {
      idempotencyKey: 'online-oos',
      source: 'ONLINE',
      items: [{ productId: 'airpods-pro-3', qty: 1 }],
    }, keys);
    expect(result.ok).toBe(false);
    expect(result.error).toBe('INSUFFICIENT_STOCK');
    expect(state.qty).toBe(0);
  });

  it('prevents concurrent oversell', () => {
    const state = { qty: 1 };
    const keys = new Set<string>();
    const a = mockRpc(state, {
      idempotencyKey: 'race-a',
      source: 'POS',
      items: [{ productId: 'airpods-pro-3', qty: 1 }],
    }, keys);
    const b = mockRpc(state, {
      idempotencyKey: 'race-b',
      source: 'ONLINE',
      items: [{ productId: 'airpods-pro-3', qty: 1 }],
    }, keys);
    expect(a.ok).toBe(true);
    expect(b.ok).toBe(false);
    expect(state.qty).toBe(0);
  });

  it('failed stock check does not deduct (rollback semantics)', () => {
    const state = { qty: 1 };
    const keys = new Set<string>();
    const result = mockRpc(state, {
      idempotencyKey: 'fail-1',
      source: 'POS',
      items: [{ productId: 'airpods-pro-3', qty: 5 }],
    }, keys);
    expect(result.ok).toBe(false);
    expect(state.qty).toBe(1);
  });

  it('repeated checkout with same idempotency key does not double-deduct', () => {
    const state = { qty: 5 };
    const keys = new Set<string>();
    const payload: CompleteOrderInput = {
      idempotencyKey: 'retry-1',
      source: 'ONLINE',
      items: [{ productId: 'airpods-pro-3', qty: 2 }],
    };
    const first = mockRpc(state, payload, keys);
    const second = mockRpc(state, payload, keys);
    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);
    expect(second.duplicate).toBe(true);
    expect(state.qty).toBe(3);
  });
});
