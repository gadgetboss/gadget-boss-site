const { sendJson, methodNotAllowed } = require('../_lib/http');
const { clearOtpCookie, clearSessionCookie } = require('../_lib/cookies');

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);

  clearSessionCookie(req, res);
  clearOtpCookie(req, res);
  return sendJson(res, 200, { ok: true });
};
