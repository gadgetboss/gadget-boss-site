// HMAC-signed HttpOnly cookies. No database: the pending-OTP state and the
// customer session both live in signed cookies so Hubtel's requestId/prefix
// never reach the browser in readable form.
const crypto = require('crypto');

const OTP_COOKIE = 'gb_otp';
const SESSION_COOKIE = 'gb_session';
const OTP_MAX_AGE_SECONDS = 600; // 10 minutes
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

function b64urlEncode(buf) {
  return Buffer.from(buf)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function b64urlDecode(str) {
  const padded = String(str).replace(/-/g, '+').replace(/_/g, '/');
  return Buffer.from(padded, 'base64');
}

function hmac(secret, payload) {
  return b64urlEncode(crypto.createHmac('sha256', secret).update(payload).digest());
}

/** `base64url(json).base64url(hmacSha256)` */
function signPayload(obj, secret) {
  const payload = b64urlEncode(Buffer.from(JSON.stringify(obj), 'utf8'));
  return `${payload}.${hmac(secret, payload)}`;
}

/** Returns the payload object, or null when the signature/format/expiry is bad. */
function verifyPayload(token, secret) {
  if (!token || typeof token !== 'string' || !secret) return null;
  const dot = token.lastIndexOf('.');
  if (dot <= 0 || dot === token.length - 1) return null;

  const payload = token.slice(0, dot);
  const provided = Buffer.from(token.slice(dot + 1), 'utf8');
  const expected = Buffer.from(hmac(secret, payload), 'utf8');
  if (provided.length !== expected.length) return null;
  if (!crypto.timingSafeEqual(provided, expected)) return null;

  let parsed;
  try {
    parsed = JSON.parse(b64urlDecode(payload).toString('utf8'));
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== 'object') return null;
  if (typeof parsed.exp !== 'number' || parsed.exp <= nowSeconds()) return null;
  return parsed;
}

function nowSeconds() {
  return Math.floor(Date.now() / 1000);
}

function parseCookies(req) {
  const header = (req && req.headers && req.headers.cookie) || '';
  const out = {};
  for (const part of String(header).split(';')) {
    const eq = part.indexOf('=');
    if (eq < 1) continue;
    const name = part.slice(0, eq).trim();
    if (!name) continue;
    try {
      out[name] = decodeURIComponent(part.slice(eq + 1).trim());
    } catch {
      out[name] = part.slice(eq + 1).trim();
    }
  }
  return out;
}

// Local dev runs plain HTTP on 127.0.0.1, where a Secure cookie would be dropped.
function isSecureRequest(req) {
  const proto = (req && req.headers && req.headers['x-forwarded-proto']) || '';
  const first = String(Array.isArray(proto) ? proto[0] : proto)
    .split(',')[0]
    .trim()
    .toLowerCase();
  if (first) return first === 'https';
  return Boolean(req && req.socket && req.socket.encrypted);
}

function buildCookie(name, value, maxAgeSeconds, req) {
  const parts = [
    `${name}=${value}`,
    'HttpOnly',
    'Path=/',
    'SameSite=Lax',
    `Max-Age=${Math.max(0, Math.floor(maxAgeSeconds))}`,
  ];
  if (maxAgeSeconds <= 0) parts.push('Expires=Thu, 01 Jan 1970 00:00:00 GMT');
  if (isSecureRequest(req)) parts.push('Secure');
  return parts.join('; ');
}

function clearCookie(name, req) {
  return buildCookie(name, '', 0, req);
}

function appendSetCookie(res, cookie) {
  const existing = res.getHeader('Set-Cookie');
  const list = existing ? (Array.isArray(existing) ? existing.slice() : [existing]) : [];
  list.push(cookie);
  res.setHeader('Set-Cookie', list);
}

/** Pending-OTP state: { phone, requestId, prefix, attempts, lastSentAt, exp }. */
function setOtpCookie(req, res, state, secret) {
  appendSetCookie(
    res,
    buildCookie(OTP_COOKIE, signPayload(state, secret), OTP_MAX_AGE_SECONDS, req),
  );
}

function readOtpCookie(req, secret) {
  return verifyPayload(parseCookies(req)[OTP_COOKIE], secret);
}

/** Customer session: { phone, iat, exp }. */
function setSessionCookie(req, res, phone, secret) {
  const iat = nowSeconds();
  const state = { phone, iat, exp: iat + SESSION_MAX_AGE_SECONDS };
  appendSetCookie(
    res,
    buildCookie(SESSION_COOKIE, signPayload(state, secret), SESSION_MAX_AGE_SECONDS, req),
  );
  return state;
}

function readSessionCookie(req, secret) {
  return verifyPayload(parseCookies(req)[SESSION_COOKIE], secret);
}

function clearOtpCookie(req, res) {
  appendSetCookie(res, clearCookie(OTP_COOKIE, req));
}

function clearSessionCookie(req, res) {
  appendSetCookie(res, clearCookie(SESSION_COOKIE, req));
}

module.exports = {
  OTP_COOKIE,
  SESSION_COOKIE,
  OTP_MAX_AGE_SECONDS,
  SESSION_MAX_AGE_SECONDS,
  b64urlEncode,
  b64urlDecode,
  signPayload,
  verifyPayload,
  nowSeconds,
  parseCookies,
  isSecureRequest,
  appendSetCookie,
  setOtpCookie,
  readOtpCookie,
  setSessionCookie,
  readSessionCookie,
  clearOtpCookie,
  clearSessionCookie,
};
