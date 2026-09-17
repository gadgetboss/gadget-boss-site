const { sendJson, methodNotAllowed } = require('../../_lib/http');
const { phoneVariants } = require('../../_lib/phone');
const supabase = require('../../_lib/supabase');
const account = require('../../_lib/account');
const { buildTracking } = require('../../_lib/tracking');

function orderIdFrom(req) {
  const fromQuery = req.query && req.query.id;
  const raw = Array.isArray(fromQuery) ? fromQuery[0] : fromQuery;
  if (raw) return String(raw);
  const path = String(req.url || '').split('?')[0];
  const last = path.split('/').filter(Boolean).pop() || '';
  try {
    return decodeURIComponent(last);
  } catch {
    return last;
  }
}

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET' && req.method !== 'HEAD') return methodNotAllowed(res, ['GET']);

  const phone = account.sessionPhone(req);
  if (!phone) {
    return sendJson(res, 401, { ok: false, error: account.SIGN_IN_ERROR });
  }

  const orderId = orderIdFrom(req);
  // Anti-enumeration: an order that exists but belongs to someone else, a bad
  // id, and an unconfigured backend all look identical from the outside.
  const notFound = () => sendJson(res, 404, { ok: false, error: account.NOT_FOUND_ERROR });
  if (!orderId || orderId.length > 64 || !/^[A-Za-z0-9._-]+$/.test(orderId)) return notFound();

  const cfg = supabase.config();
  if (!cfg.configured) return notFound();

  let row;
  try {
    row = await supabase.getOrderForPhones(orderId, phoneVariants(phone), cfg);
  } catch (err) {
    console.error(`[account] order detail failed: ${err && err.message}`);
    return sendJson(res, 502, { ok: false, error: account.LOOKUP_FAILED_ERROR });
  }

  if (!row) return notFound();

  return sendJson(res, 200, {
    ok: true,
    configured: true,
    order: { ...account.shapeOrder(row), tracking: buildTracking(row) },
  });
};
