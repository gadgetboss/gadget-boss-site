const { readBody, sendJson, methodNotAllowed } = require('../_lib/http');
const { maskPhone, normalizeGhanaPhone, phoneVariants } = require('../_lib/phone');
const { setSessionCookie } = require('../_lib/cookies');
const { verifyPaystackTransaction } = require('../_lib/paystack');
const supabase = require('../_lib/supabase');
const account = require('../_lib/account');
const otp = require('../_lib/otp');

const NEED_PROOF_ERROR = 'Enter your receipt number or Paystack reference.';
const NOT_MATCHED_ERROR = 'No order matches that number and receipt.';

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);

  const secret = otp.sessionSecret();
  if (!secret) {
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

  const reference = String((body && body.reference) || '').trim();
  const receiptNo = String((body && body.receiptNo) || '').trim();
  if (!reference && !receiptNo) {
    return sendJson(res, 400, { ok: false, error: NEED_PROOF_ERROR });
  }

  const cfg = supabase.config();
  if (!cfg.configured) {
    return sendJson(res, 200, { ok: false, ordersAvailable: false, error: account.LOOKUP_FAILED_ERROR });
  }

  const phones = phoneVariants(phone);
  let row = null;

  try {
    if (reference) {
      const paystackSecret = String(process.env.PAYSTACK_SECRET_KEY || '').trim();
      let paystackOk = !paystackSecret;
      if (paystackSecret) {
        try {
          const verified = await verifyPaystackTransaction(paystackSecret, reference);
          paystackOk = !!verified.verified;
        } catch (err) {
          paystackOk = false;
        }
      }
      if (paystackOk) {
        row = await supabase.findOrderByPaymentReference(reference, phones, cfg);
      }
    }
    if (!row && receiptNo) {
      row = await supabase.getOrderForPhones(receiptNo, phones, cfg);
    }
  } catch (err) {
    console.error(`[account] claim-order failed: ${err && err.message}`);
    return sendJson(res, 502, { ok: false, error: account.LOOKUP_FAILED_ERROR });
  }

  if (!row) {
    return sendJson(res, 404, { ok: false, error: NOT_MATCHED_ERROR });
  }

  setSessionCookie(req, res, phone, secret);
  const customer = await otp.lookupCustomer(phone);
  return sendJson(res, 200, {
    ok: true,
    authenticated: true,
    phone,
    maskedPhone: maskPhone(phone),
    customer,
    order: account.shapeOrder(row),
  });
};
