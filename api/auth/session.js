const { sendJson, methodNotAllowed } = require('../_lib/http');
const { maskPhone, normalizeGhanaPhone } = require('../_lib/phone');
const { readSessionCookie } = require('../_lib/cookies');
const otp = require('../_lib/otp');
const supabase = require('../_lib/supabase');

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET' && req.method !== 'HEAD') return methodNotAllowed(res, ['GET']);

  const cfg = otp.authConfig();
  const ordersAvailable = supabase.config().configured;
  const session = cfg.secret ? readSessionCookie(req, cfg.secret) : null;
  const phone = session ? normalizeGhanaPhone(session.phone) : null;

  if (!phone) {
    return sendJson(res, 200, {
      authenticated: false,
      configured: cfg.configured,
      ordersAvailable,
    });
  }

  return sendJson(res, 200, {
    authenticated: true,
    phone,
    maskedPhone: maskPhone(phone),
    configured: cfg.configured,
    ordersAvailable,
  });
};
