const { readBody, sendJson, methodNotAllowed } = require('./_lib/http');
const { verifyPaystackTransaction } = require('./_lib/paystack');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    methodNotAllowed(res, ['POST']);
    return;
  }

  const secret = process.env.PAYSTACK_SECRET_KEY || '';
  if (!secret) {
    sendJson(res, 200, { configured: false, verified: false });
    return;
  }

  let body;
  try {
    body = await readBody(req);
  } catch {
    sendJson(res, 400, { verified: false, error: 'Invalid JSON' });
    return;
  }

  const reference = String(body.reference || '').trim();
  const expectedAmount = body.amount;
  if (!reference) {
    sendJson(res, 400, { verified: false, error: 'Missing reference' });
    return;
  }

  try {
    const result = await verifyPaystackTransaction(secret, reference, { expectedAmount });
    sendJson(res, result.verified ? 200 : 400, {
      configured: true,
      verified: result.verified,
      reference,
      amount: result.amount,
      status: result.status,
      channel: result.channel,
    });
  } catch {
    sendJson(res, 502, { verified: false, error: 'Paystack verification failed' });
  }
};
