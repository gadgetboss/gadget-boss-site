const { readBody, sendJson, methodNotAllowed } = require('../_lib/http');
const { maskPhone } = require('../_lib/phone');
const { verifyOtp } = require('../_lib/hubtel');
const {
  readOtpCookie,
  setOtpCookie,
  clearOtpCookie,
  setSessionCookie,
} = require('../_lib/cookies');
const otp = require('../_lib/otp');

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);

  const cfg = otp.authConfig();
  if (!cfg.configured) {
    return sendJson(res, 200, {
      ok: false,
      configured: false,
      error: otp.NOT_CONFIGURED_ERROR,
    });
  }

  let body;
  try {
    body = await readBody(req);
  } catch {
    return sendJson(res, 400, { ok: false, error: 'Invalid JSON' });
  }

  const pending = readOtpCookie(req, cfg.secret);
  if (!pending || !pending.phone || !pending.requestId) {
    clearOtpCookie(req, res);
    return sendJson(res, 400, { ok: false, error: otp.EXPIRED_ERROR, expired: true });
  }

  const attempts = Number(pending.attempts) || 0;
  if (attempts >= otp.MAX_ATTEMPTS) {
    return sendJson(res, 429, { ok: false, error: otp.TOO_MANY_ERROR });
  }

  const code = otp.normalizeCode(body && body.code);
  if (!code) {
    return sendJson(res, 400, {
      ok: false,
      error: 'Enter the code we sent you.',
      attemptsLeft: otp.MAX_ATTEMPTS - attempts,
    });
  }

  const result = await verifyOtp(pending.requestId, pending.prefix || '', code, cfg.hubtel);

  if (!result.ok && result.upstreamError) {
    return sendJson(res, 502, { ok: false, error: otp.VERIFY_FAILED_ERROR });
  }

  if (!result.ok) {
    const nextAttempts = attempts + 1;
    setOtpCookie(req, res, { ...pending, attempts: nextAttempts }, cfg.secret);
    if (nextAttempts >= otp.MAX_ATTEMPTS) {
      return sendJson(res, 429, { ok: false, error: otp.TOO_MANY_ERROR });
    }
    return sendJson(res, 400, {
      ok: false,
      error: otp.WRONG_CODE_ERROR,
      attemptsLeft: otp.MAX_ATTEMPTS - nextAttempts,
    });
  }

  const phone = pending.phone;
  clearOtpCookie(req, res);
  setSessionCookie(req, res, phone, cfg.secret);

  const customer = await otp.lookupCustomer(phone);
  return sendJson(res, 200, {
    ok: true,
    configured: true,
    phone,
    maskedPhone: maskPhone(phone),
    customer,
  });
};
