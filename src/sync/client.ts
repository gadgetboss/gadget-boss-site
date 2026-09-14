import { createClient, type RealtimeChannel, type SupabaseClient } from '@supabase/supabase-js';
import { dbProductToPos, dbProductToWebsite, posProductToDbPatch } from './mappers';
import type {
  CompleteOrderInput,
  CompleteOrderResult,
  DbProduct,
  PosProduct,
  SyncConfig,
  WebsiteProduct,
} from './types';

let client: SupabaseClient | null = null;
let lastConfig: SyncConfig | null = null;

export function isSyncConfigured(config?: Partial<SyncConfig> | null): boolean {
  const url = config?.supabaseUrl || getEnv('SUPABASE_URL') || getEnv('VITE_SUPABASE_URL') || getBrowserEnv('SUPABASE_URL');
  const key =
    config?.supabaseAnonKey ||
    getEnv('SUPABASE_ANON_KEY') ||
    getEnv('VITE_SUPABASE_ANON_KEY') ||
    getBrowserEnv('SUPABASE_ANON_KEY');
  return Boolean(url && key);
}

export function resolveConfig(config?: Partial<SyncConfig>): SyncConfig {
  const supabaseUrl =
    config?.supabaseUrl ||
    getEnv('SUPABASE_URL') ||
    getEnv('VITE_SUPABASE_URL') ||
    getBrowserEnv('SUPABASE_URL') ||
    '';
  const supabaseAnonKey =
    config?.supabaseAnonKey ||
    getEnv('SUPABASE_ANON_KEY') ||
    getEnv('VITE_SUPABASE_ANON_KEY') ||
    getBrowserEnv('SUPABASE_ANON_KEY') ||
    '';
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase is not configured. Set SUPABASE_URL and SUPABASE_ANON_KEY.');
  }
  return { supabaseUrl, supabaseAnonKey };
}

export function getSupabase(config?: Partial<SyncConfig>): SupabaseClient {
  const resolved = resolveConfig(config);
  if (
    client &&
    lastConfig &&
    lastConfig.supabaseUrl === resolved.supabaseUrl &&
    lastConfig.supabaseAnonKey === resolved.supabaseAnonKey
  ) {
    return client;
  }
  client = createClient(resolved.supabaseUrl, resolved.supabaseAnonKey, {
    auth: { persistSession: true, autoRefreshToken: true },
  });
  lastConfig = resolved;
  return client;
}

function getEnv(key: string): string {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const env = (typeof process !== 'undefined' ? (process as any).env : undefined) || {};
    return env[key] || '';
  } catch {
    return '';
  }
}

function getBrowserEnv(key: string): string {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = typeof window !== 'undefined' ? (window as any) : null;
    return (w?.__GADGETBOSS_ENV__ && w.__GADGETBOSS_ENV__[key]) || '';
  } catch {
    return '';
  }
}

export async function fetchStaffProducts(config?: Partial<SyncConfig>): Promise<PosProduct[]> {
  const sb = getSupabase(config);
  const { data, error } = await sb.from('products').select('*').order('name');
  if (error) throw error;
  return ((data || []) as DbProduct[]).map(dbProductToPos);
}

export async function fetchWebsiteProducts(config?: Partial<SyncConfig>): Promise<WebsiteProduct[]> {
  const sb = getSupabase(config);
  const { data, error } = await sb
    .from('products')
    .select('*')
    .eq('status', 'active')
    .eq('website_visible', true)
    .order('name');
  if (error) throw error;
  return ((data || []) as DbProduct[]).map(dbProductToWebsite);
}

export async function upsertPosProduct(product: PosProduct, config?: Partial<SyncConfig>): Promise<void> {
  const sb = getSupabase(config);
  const patch = posProductToDbPatch(product);
  // Cashiers must not change qty via product form — strip qty_on_hand from upserts.
  const { error } = await sb.from('products').upsert(
    {
      ...patch,
      // Do not write qty here; stock goes through RPC only
    },
    { onConflict: 'id' },
  );
  if (error) throw error;
}

export async function completeOrder(
  input: CompleteOrderInput,
  config?: Partial<SyncConfig>,
): Promise<CompleteOrderResult> {
  if (!input.idempotencyKey) {
    throw new Error('idempotencyKey is required');
  }
  if (!input.items?.length) {
    throw new Error('Order must include at least one item');
  }

  const sb = getSupabase(config);
  const payload = {
    idempotency_key: input.idempotencyKey,
    source: input.source,
    status: input.status,
    payment_method: input.paymentMethod,
    discount_pct: input.discountPct || 0,
    customer_name: input.customerName || '',
    customer_phone: input.customerPhone || '',
    customer_email: input.customerEmail || '',
    customer_location: input.customerLocation || '',
    cashier_name: input.cashierName || '',
    receipt_no: input.receiptNo || '',
    notes: input.notes || '',
    payment_reference: input.paymentReference || '',
    items: input.items.map((item) => ({
      product_id: item.productId,
      qty: item.qty,
      unit_price: item.unitPrice,
      cost_price: item.costPrice,
      discount_pct: item.discountPct || 0,
    })),
  };

  const { data, error } = await sb.rpc('complete_order_with_inventory_check', { payload });
  if (error) {
    console.error('[GadgetBossSync] complete_order failed', error);
    throw error;
  }
  return data as CompleteOrderResult;
}

export async function fetchRecentOrders(limit = 100, config?: Partial<SyncConfig>) {
  const sb = getSupabase(config);
  const { data, error } = await sb
    .from('orders')
    .select('*, order_items(*)')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data || [];
}

export function subscribeProducts(
  onChange: () => void,
  config?: Partial<SyncConfig>,
): RealtimeChannel {
  const sb = getSupabase(config);
  return sb
    .channel('gb-products')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => onChange())
    .subscribe();
}

export function subscribeOrders(
  onChange: (payload?: unknown) => void,
  config?: Partial<SyncConfig>,
): RealtimeChannel {
  const sb = getSupabase(config);
  return sb
    .channel('gb-orders')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => onChange(payload))
    .subscribe();
}

export function subscribeInventoryMovements(
  onChange: () => void,
  config?: Partial<SyncConfig>,
): RealtimeChannel {
  const sb = getSupabase(config);
  return sb
    .channel('gb-movements')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'inventory_movements' }, () => onChange())
    .subscribe();
}

export function mapOrderToPosSale(row: any) {
  const items = (row.order_items || []).map((it: any) => ({
    productId: it.product_id,
    name: it.product_name,
    qty: it.qty,
    unitPrice: Number(it.unit_price),
    costPrice: Number(it.cost_price),
    discountPct: Number(it.discount_pct || 0),
    lineTotal: Number(it.line_total),
  }));
  return {
    id: row.id,
    receiptNo: row.receipt_no,
    saleType: row.source === 'ONLINE' ? 'Online' : 'POS',
    paymentMethod: row.payment_method || 'Other',
    items,
    subtotal: Number(row.subtotal),
    orderDiscount: Number(row.discount_pct || 0),
    total: Number(row.total),
    customerName: row.customer_name || '',
    customerPhone: row.customer_phone || '',
    customerId: row.customer_id,
    cashierId: row.cashier_id,
    cashierName: row.cashier_name || (row.source === 'ONLINE' ? 'Online' : ''),
    createdAt: row.created_at,
    cogs: Number(row.cogs || 0),
    status: row.status,
    source: row.source,
  };
}

export async function staffSignIn(email: string, password: string, config?: Partial<SyncConfig>) {
  const sb = getSupabase(config);
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error) throw error;
  const userId = data.user?.id;
  let role = 'cashier';
  let name = data.user?.email || 'Staff';
  if (userId) {
    const { data: profile } = await sb.from('profiles').select('*').eq('id', userId).maybeSingle();
    if (profile) {
      role = profile.role;
      name = profile.full_name || name;
    }
  }
  return {
    id: userId,
    email: data.user?.email,
    name,
    role: String(role).charAt(0).toUpperCase() + String(role).slice(1),
    session: data.session,
  };
}

export async function staffSignOut(config?: Partial<SyncConfig>) {
  const sb = getSupabase(config);
  await sb.auth.signOut();
}
