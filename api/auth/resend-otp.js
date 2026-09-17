const { sendJson, methodNotAllowed } = require('../_lib/http');
const { resendOtp } = require('../_lib/hubtel');
const {
  readOtpCookie,
  setOtpCookie,
  clearOtpCookie,
  nowSeconds,
  OTP_MAX_AGE_SECONDS,
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

  const pending = readOtpCookie(req, cfg.secret);
  if (!pending || !pending.phone || !pending.requestId) {
    clearOtpCookie(req, res);
    return sendJson(res, 400, { ok: false, error: otp.EXPIRED_ERROR, expired: true });
  }

  const elapsed = nowSeconds() - (Number(pending.lastSentAt) || 0);
  if (elapsed < otp.RESEND_COOLDOWN_SECONDS) {
    const remaining = otp.RESEND_COOLDOWN_SECONDS - elapsed;
    return sendJson(res, 429, {
      ok: false,
      error: otp.COOLDOWN_ERROR,
      // Clamped so a skewed clock can never advertise a nonsense wait.
      retryAfterSeconds: Math.min(otp.RESEND_COOLDOWN_SECONDS, Math.max(1, remaining)),
    });
  }

  const resent = await resendOtp(pending.requestId, pending.prefix || '', cfg.hubtel);
  if (!resent.ok) {
    return sendJson(res, 502, { ok: false, error: otp.SEND_FAILED_ERROR });
  }

  const issuedAt = nowSeconds();
  setOtpCookie(
    req,
    res,
    {
      phone: pending.phone,
      requestId: resent.requestId || pending.requestId,
      prefix: resent.prefix || pending.prefix || '',
      attempts: 0,
      lastSentAt: issuedAt,
      exp: issuedAt + OTP_MAX_AGE_SECONDS,
    },
    cfg.secret,
  );

  return sendJson(res, 200, otp.pendingResponse(pending.phone));
};
