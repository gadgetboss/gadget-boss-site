const { sendJson, methodNotAllowed } = require('../_lib/http');
const { maskPhone, normalizeGhanaPhone } = require('../_lib/phone');
const { readSessionCookie } = require('../_lib/cookies');
const otp = require('../_lib/otp');

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET' && req.method !== 'HEAD') return methodNotAllowed(res, ['GET']);

  const cfg = otp.authConfig();
  // The session cookie is signed with SESSION_SECRET, so without it there is
  // nothing we can trust: report signed-out rather than guessing.
  const session = cfg.secret ? readSessionCookie(req, cfg.secret) : null;
  const phone = session ? normalizeGhanaPhone(session.phone) : null;

  if (!phone) {
    return sendJson(res, 200, { authenticated: false, configured: cfg.configured });
  }

  return sendJson(res, 200, {
    authenticated: true,
    phone,
    maskedPhone: maskPhone(phone),
    configured: cfg.configured,
  });
};
