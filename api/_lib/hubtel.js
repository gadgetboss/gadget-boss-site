// Single place where the Hubtel OTP contract lives.
//
// The Hubtel docs are behind a login and their responses are wrapped
// inconsistently (top-level vs `data`/`Data`, PascalCase vs camelCase), so both
// the base URL and the parsing are deliberately forgiving. Nothing in here is
// ever returned to the browser: callers get booleans plus server-only
// requestId/prefix values.
const { requestJson } = require('./http');

const DEFAULT_BASE_URL = 'https://api-otp.hubtel.com';
const DEFAULT_SENDER_ID = 'GADGETBOSS';
const SUCCESS_CODES = new Set(['0', '0000', '0001']);
const SUCCESS_STATUSES = new Set(['0', '0000', 'success', 'ok', 'true']);

function config(env = process.env) {
  const clientId = String(env.HUBTEL_CLIENT_ID || '').trim();
  const clientSecret = String(env.HUBTEL_CLIENT_SECRET || '').trim();
  const senderId = String(env.HUBTEL_SENDER_ID || '').trim() || DEFAULT_SENDER_ID;
  const baseUrl = (String(env.HUBTEL_OTP_BASE_URL || '').trim() || DEFAULT_BASE_URL).replace(
    /\/+$/,
    '',
  );
  return {
    clientId,
    clientSecret,
    senderId,
    baseUrl,
    configured: Boolean(clientId && clientSecret),
  };
}

function authHeader(cfg) {
  const basic = Buffer.from(`${cfg.clientId}:${cfg.clientSecret}`, 'utf8').toString('base64');
  return `Basic ${basic}`;
}

/** Top level first, then any nested envelope Hubtel might have used. */
function containers(json) {
  if (!json || typeof json !== 'object') return [];
  const nested = [json.data, json.Data, json.result, json.Result, json.response, json.Response];
  return [json, ...nested.filter((value) => value && typeof value === 'object')];
}

function pick(json, keys) {
  for (const container of containers(json)) {
    for (const key of keys) {
      const value = container[key];
      if (value === undefined || value === null || value === '') continue;
      if (typeof value === 'object') continue;
      return value;
    }
  }
  return undefined;
}

function extractRequestId(json) {
  const value = pick(json, ['requestId', 'RequestId', 'request_id', 'requestID', 'otpRequestId']);
  return value === undefined ? '' : String(value);
}

function extractPrefix(json) {
  const value = pick(json, ['prefix', 'Prefix', 'otpPrefix', 'OtpPrefix', 'otp_prefix']);
  return value === undefined ? '' : String(value);
}

function extractCode(json) {
  return pick(json, ['code', 'Code', 'responseCode', 'ResponseCode', 'statusCode', 'StatusCode']);
}

function extractStatus(json) {
  return pick(json, ['status', 'Status']);
}

function extractMessage(json) {
  const value = pick(json, ['message', 'Message', 'description', 'Description', 'error', 'Error']);
  return value === undefined ? '' : String(value);
}

/**
 * 2xx plus a success-ish code/status. When Hubtel sends no code field at all we
 * fall back to the HTTP status.
 */
function isSuccess(response) {
  const { status, json } = response;
  if (!status || status < 200 || status >= 300) return false;

  const code = extractCode(json);
  const apiStatus = extractStatus(json);
  if (code === undefined && apiStatus === undefined) return true;

  if (code !== undefined && SUCCESS_CODES.has(String(code).trim().toLowerCase())) return true;
  if (apiStatus !== undefined && SUCCESS_STATUSES.has(String(apiStatus).trim().toLowerCase())) {
    return true;
  }
  return false;
}

function logFailure(label, response) {
  const detail = response && (response.text || JSON.stringify(response.json || null));
  console.error(
    `[hubtel] ${label} failed: http=${(response && response.status) || 'n/a'} body=${String(
      detail || '',
    ).slice(0, 500)}`,
  );
}

function post(cfg, path, body) {
  return requestJson(`${cfg.baseUrl}${path}`, {
    method: 'POST',
    headers: {
      Authorization: authHeader(cfg),
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(body),
  });
}

/** POST /otp/send — returns { ok, requestId, prefix }. */
async function sendOtp(phoneE164, cfg = config()) {
  let response;
  try {
    response = await post(cfg, '/otp/send', {
      senderId: cfg.senderId,
      phoneNumber: phoneE164,
      countryCode: 'GH',
    });
  } catch (err) {
    console.error(`[hubtel] send transport error: ${err && err.message}`);
    return { ok: false, requestId: '', prefix: '' };
  }

  if (!isSuccess(response)) {
    logFailure('send', response);
    return { ok: false, requestId: '', prefix: '' };
  }

  const requestId = extractRequestId(response.json);
  if (!requestId) {
    logFailure('send (missing requestId)', response);
    return { ok: false, requestId: '', prefix: '' };
  }
  return { ok: true, requestId, prefix: extractPrefix(response.json) };
}

/** POST /otp/resend — returns { ok, requestId, prefix } (ids may be unchanged). */
async function resendOtp(requestId, prefix, cfg = config()) {
  let response;
  try {
    response = await post(cfg, '/otp/resend', { requestId, prefix });
  } catch (err) {
    console.error(`[hubtel] resend transport error: ${err && err.message}`);
    return { ok: false, requestId: '', prefix: '' };
  }

  if (!isSuccess(response)) {
    logFailure('resend', response);
    return { ok: false, requestId: '', prefix: '' };
  }
  return {
    ok: true,
    requestId: extractRequestId(response.json) || requestId,
    prefix: extractPrefix(response.json) || prefix,
  };
}

function mentionsPrefix(response) {
  const haystack = `${extractMessage(response.json)} ${response.text || ''}`.toLowerCase();
  return haystack.includes('prefix');
}

/**
 * POST /otp/verify — returns { ok, upstreamError }.
 *
 * `ok:false` with `upstreamError:false` means "Hubtel answered and the code is
 * wrong"; `upstreamError:true` means we could not reach a verdict at all.
 * Some Hubtel products want the prefix concatenated onto the code, so a
 * prefix-related rejection is retried once as `PREFIX-CODE`.
 */
async function verifyOtp(requestId, prefix, code, cfg = config()) {
  let response;
  try {
    response = await post(cfg, '/otp/verify', { requestId, prefix, code });
  } catch (err) {
    console.error(`[hubtel] verify transport error: ${err && err.message}`);
    return { ok: false, upstreamError: true };
  }

  if (isSuccess(response)) return { ok: true, upstreamError: false };

  if (prefix && mentionsPrefix(response)) {
    logFailure('verify (retrying with concatenated prefix)', response);
    try {
      const retry = await post(cfg, '/otp/verify', {
        requestId,
        prefix,
        code: `${prefix}-${code}`,
      });
      if (isSuccess(retry)) return { ok: true, upstreamError: false };
      logFailure('verify retry', retry);
      return { ok: false, upstreamError: retry.status >= 500 };
    } catch (err) {
      console.error(`[hubtel] verify retry transport error: ${err && err.message}`);
      return { ok: false, upstreamError: true };
    }
  }

  logFailure('verify', response);
  return { ok: false, upstreamError: response.status >= 500 };
}

module.exports = {
  DEFAULT_BASE_URL,
  DEFAULT_SENDER_ID,
  config,
  sendOtp,
  resendOtp,
  verifyOtp,
  isSuccess,
  extractRequestId,
  extractPrefix,
};
