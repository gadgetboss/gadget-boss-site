const { sendJson, methodNotAllowed } = require('../../_lib/http');
const { phoneVariants } = require('../../_lib/phone');
const supabase = require('../../_lib/supabase');
const account = require('../../_lib/account');

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET' && req.method !== 'HEAD') return methodNotAllowed(res, ['GET']);

  const phone = account.sessionPhone(req);
  if (!phone) {
    return sendJson(res, 401, { ok: false, error: account.SIGN_IN_ERROR });
  }

  const cfg = supabase.config();
  if (!cfg.configured) {
    return sendJson(res, 200, { ok: true, configured: false, orders: [] });
  }

  try {
    const rows = await supabase.listOrdersByPhones(phoneVariants(phone), cfg);
    return sendJson(res, 200, {
      ok: true,
      configured: true,
      orders: rows.map(account.shapeOrder),
    });
  } catch (err) {
    console.error(`[account] order list failed: ${err && err.message}`);
    return sendJson(res, 502, { ok: false, error: account.LOOKUP_FAILED_ERROR });
  }
};
