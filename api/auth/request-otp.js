const { readBody, sendJson, methodNotAllowed } = require('../_lib/http');
const { normalizeGhanaPhone } = require('../_lib/phone');
const { sendOtp } = require('../_lib/hubtel');
const { setOtpCookie, nowSeconds, OTP_MAX_AGE_SECONDS } = require('../_lib/cookies');
const otp = require('../_lib/otp');

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);

  // Graceful degradation: the storefront keeps its current checkout when the
  // Hubtel/session keys are not set yet, so this is a 200, not an error.
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

  const phone = normalizeGhanaPhone(body && body.phone);
  if (!phone) {
    return sendJson(res, 400, { ok: false, error: otp.INVALID_PHONE_ERROR });
  }

  const sent = await sendOtp(phone, cfg.hubtel);
  if (!sent.ok) {
    return sendJson(res, 502, { ok: false, error: otp.SEND_FAILED_ERROR });
  }

  const issuedAt = nowSeconds();
  setOtpCookie(
    req,
    res,
    {
      phone,
      requestId: sent.requestId,
      prefix: sent.prefix,
      attempts: 0,
      lastSentAt: issuedAt,
      exp: issuedAt + OTP_MAX_AGE_SECONDS,
    },
    cfg.secret,
  );

  return sendJson(res, 200, otp.pendingResponse(phone));
};
