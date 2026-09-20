// Server-side Supabase access over PostgREST.
//
// There is no node_modules in production ("installCommand": "" in vercel.json),
// so we talk HTTP directly instead of requiring @supabase/supabase-js. These
// endpoints use the service role key and must never run in a browser.
const { requestJson } = require('./http');

const ORDER_SELECT =
  'id,receipt_no,status,total,subtotal,payment_method,created_at,customer_name,customer_location,' +
  'order_items(product_id,product_name,qty,unit_price,line_total),payments(reference)';

// updated_at is the only other timestamp on the row, used to date the current
// step of the derived tracking timeline.
const ORDER_DETAIL_SELECT = `${ORDER_SELECT},updated_at`;

function config(env = process.env) {
  const url = String(env.SUPABASE_URL || '').trim().replace(/\/+$/, '');
  const serviceKey = String(env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
  return { url, serviceKey, configured: Boolean(url && serviceKey) };
}

/** PostgREST `in.("a","b")` — values are quoted, the whole param is URL-encoded. */
function inList(values) {
  const quoted = values.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(',');
  return `in.(${quoted})`;
}

async function select(table, params, cfg = config()) {
  const search = new URLSearchParams(params);
  const response = await requestJson(`${cfg.url}/rest/v1/${table}?${search.toString()}`, {
    method: 'GET',
    headers: {
      apikey: cfg.serviceKey,
      Authorization: `Bearer ${cfg.serviceKey}`,
      Accept: 'application/json',
    },
  });
  if (response.status < 200 || response.status >= 300) {
    console.error(
      `[supabase] ${table} query failed: http=${response.status} body=${String(
        response.text || '',
      ).slice(0, 500)}`,
    );
    throw new Error(`Supabase query failed with status ${response.status}`);
  }
  return Array.isArray(response.json) ? response.json : [];
}

function listOrdersByPhones(phones, cfg = config()) {
  return select(
    'orders',
    {
      select: ORDER_SELECT,
      customer_phone: inList(phones),
      order: 'created_at.desc',
      limit: '50',
    },
    cfg,
  );
}

/**
 * Looks the order up by id (or receipt number) *and* by the session's phone
 * variants, so a row belonging to somebody else is indistinguishable from one
 * that does not exist.
 */
function getOrderForPhones(idOrReceipt, phones, cfg = config()) {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    idOrReceipt,
  );
  const params = {
    select: ORDER_DETAIL_SELECT,
    customer_phone: inList(phones),
    limit: '1',
  };
  params[isUuid ? 'id' : 'receipt_no'] = `eq.${idOrReceipt}`;
  return select('orders', params, cfg).then((rows) => rows[0] || null);
}

function findOrderByPaymentReference(reference, phones, cfg = config()) {
  const ref = String(reference || '').trim();
  if (!ref) return Promise.resolve(null);
  return select(
    'payments',
    {
      select: 'order_id,reference',
      reference: `eq.${ref}`,
      limit: '1',
    },
    cfg,
  ).then((rows) => {
    const orderId = rows[0] && rows[0].order_id;
    if (!orderId) return null;
    return getOrderForPhones(orderId, phones, cfg);
  });
}

function findCustomerByPhones(phones, cfg = config()) {
  return select(
    'customers',
    {
      select: 'name,phone,email,location',
      phone: inList(phones),
      order: 'updated_at.desc',
      limit: '1',
    },
    cfg,
  ).then((rows) => rows[0] || null);
}

module.exports = {
  ORDER_SELECT,
  ORDER_DETAIL_SELECT,
  config,
  inList,
  select,
  listOrdersByPhones,
  getOrderForPhones,
  findOrderByPaymentReference,
  findCustomerByPhones,
};
