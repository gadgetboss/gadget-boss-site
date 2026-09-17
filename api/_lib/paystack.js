const { requestJson } = require('./http');

function assessPaystackVerification(payload, { expectedAmount } = {}) {
  const tx = payload && payload.data;
  const paid =
    payload &&
    payload.status === true &&
    tx &&
    tx.status === 'success' &&
    String(tx.currency || '').toUpperCase() === 'GHS';
  const amountOk =
    expectedAmount === undefined ||
    expectedAmount === null ||
    expectedAmount === '' ||
    Number(tx && tx.amount) === Number(expectedAmount);

  return {
    verified: Boolean(paid && amountOk),
    amount: tx && tx.amount,
    status: tx && tx.status,
    channel: tx && tx.channel,
  };
}

async function verifyPaystackTransaction(secret, reference, { expectedAmount } = {}) {
  const encoded = encodeURIComponent(String(reference || '').trim());
  const { status, json } = await requestJson(`https://api.paystack.co/transaction/verify/${encoded}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${secret}` },
    timeoutMs: 20000,
  });

  if (!json) {
    const err = new Error('Paystack verification failed');
    err.code = status >= 500 ? 'UPSTREAM' : 'INVALID_RESPONSE';
    throw err;
  }

  const result = assessPaystackVerification(json, { expectedAmount });
  return { payload: json, ...result };
}

module.exports = { assessPaystackVerification, verifyPaystackTransaction };
