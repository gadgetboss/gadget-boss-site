// Policy shared by the OTP endpoints: config gating, limits, response shapes.
const hubtel = require('./hubtel');
const supabase = require('./supabase');
const { maskPhone, phoneVariants } = require('./phone');

const OTP_TTL_SECONDS = 300; // how long we tell the customer the code lives
const RESEND_COOLDOWN_SECONDS = 30;
const MAX_ATTEMPTS = 5;

const NOT_CONFIGURED_ERROR = 'Phone verification is not configured.';
const SEND_FAILED_ERROR = 'Could not send the code. Try again.';
const VERIFY_FAILED_ERROR = 'Could not verify the code. Try again.';
const INVALID_PHONE_ERROR = 'Enter a valid Ghana mobile number.';
const EXPIRED_ERROR = 'Your code expired. Request a new one.';
const TOO_MANY_ERROR = 'Too many attempts. Request a new code.';
const WRONG_CODE_ERROR = 'That code is not correct.';
const COOLDOWN_ERROR = 'Please wait before requesting another code.';

function sessionSecret(env = process.env) {
  return String(env.SESSION_SECRET || '').trim();
}

/** Auth is only live when Hubtel credentials *and* a session secret are present. */
function authConfig(env = process.env) {
  const secret = sessionSecret(env);
  const cfg = hubtel.config(env);
  return { secret, hubtel: cfg, configured: Boolean(secret && cfg.configured) };
}

/** Identical payload for request-otp and resend-otp so the frontend has one shape. */
function pendingResponse(phone) {
  return {
    ok: true,
    configured: true,
    phone,
    maskedPhone: maskPhone(phone),
    expiresInSeconds: OTP_TTL_SECONDS,
    resendInSeconds: RESEND_COOLDOWN_SECONDS,
  };
}

function normalizeCode(input) {
  const digits = String(input === undefined || input === null ? '' : input).replace(/\D/g, '');
  return /^\d{4,8}$/.test(digits) ? digits : '';
}

/** Never fails the sign-in: an unreachable/unset Supabase just yields empty fields. */
async function lookupCustomer(phone) {
  const blank = { phone, name: null, email: null, location: null };
  const cfg = supabase.config();
  if (!cfg.configured) return blank;
  try {
    const row = await supabase.findCustomerByPhones(phoneVariants(phone), cfg);
    if (!row) return blank;
    return {
      phone,
      name: row.name || null,
      email: row.email || null,
      location: row.location || null,
    };
  } catch (err) {
    console.error(`[account] customer lookup failed: ${err && err.message}`);
    return blank;
  }
}

module.exports = {
  OTP_TTL_SECONDS,
  RESEND_COOLDOWN_SECONDS,
  MAX_ATTEMPTS,
  NOT_CONFIGURED_ERROR,
  SEND_FAILED_ERROR,
  VERIFY_FAILED_ERROR,
  INVALID_PHONE_ERROR,
  EXPIRED_ERROR,
  TOO_MANY_ERROR,
  WRONG_CODE_ERROR,
  COOLDOWN_ERROR,
  sessionSecret,
  authConfig,
  pendingResponse,
  normalizeCode,
  lookupCustomer,
};
