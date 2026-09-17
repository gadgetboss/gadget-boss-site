// Small request/response helpers shared by the auth + account functions.
// Same conventions as api/paystack-verify.js: JSON in, JSON out, no deps.
const http = require('http');
const https = require('https');

function readBody(req) {
  if (req.body && typeof req.body === 'object') return Promise.resolve(req.body);
  if (typeof req.body === 'string') {
    try {
      return Promise.resolve(req.body ? JSON.parse(req.body) : {});
    } catch (err) {
      return Promise.reject(err);
    }
  }
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
    });
    req.on('end', () => {
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res, status, payload) {
  res.setHeader('Content-Type', 'application/json');
  res.statusCode = status;
  res.end(JSON.stringify(payload));
}

function methodNotAllowed(res, allowed) {
  res.setHeader('Allow', allowed.join(', '));
  sendJson(res, 405, { ok: false, error: 'Method not allowed' });
}

/** Minimal JSON fetch over Node builtins. Never throws on non-2xx. */
function requestJson(url, { method = 'GET', headers = {}, body, timeoutMs = 15000 } = {}) {
  return new Promise((resolve, reject) => {
    let target;
    try {
      target = new URL(url);
    } catch (err) {
      reject(err);
      return;
    }

    const lib = target.protocol === 'http:' ? http : https;
    const payload = body === undefined || body === null ? null : Buffer.from(body, 'utf8');
    const finalHeaders = { ...headers };
    if (payload) finalHeaders['Content-Length'] = String(payload.length);

    const request = lib.request(
      {
        protocol: target.protocol,
        hostname: target.hostname,
        port: target.port || (target.protocol === 'http:' ? 80 : 443),
        path: `${target.pathname}${target.search}`,
        method,
        headers: finalHeaders,
      },
      (response) => {
        let data = '';
        response.on('data', (chunk) => {
          data += chunk;
        });
        response.on('end', () => {
          let json = null;
          try {
            json = data ? JSON.parse(data) : null;
          } catch {
            json = null;
          }
          resolve({ status: response.statusCode || 0, headers: response.headers, text: data, json });
        });
        response.on('error', reject);
      },
    );

    request.setTimeout(timeoutMs, () => {
      request.destroy(new Error('Upstream request timed out'));
    });
    request.on('error', reject);
    if (payload) request.write(payload);
    request.end();
  });
}

module.exports = { readBody, sendJson, methodNotAllowed, requestJson };
