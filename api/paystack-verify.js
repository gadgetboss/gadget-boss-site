const https = require('https');

function readBody(req) {
  if (req.body && typeof req.body === 'object') return Promise.resolve(req.body);
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

function paystackVerify(secret, reference) {
  return new Promise((resolve, reject) => {
    const request = https.request(
      {
        hostname: 'api.paystack.co',
        path: `/transaction/verify/${encodeURIComponent(reference)}`,
        method: 'GET',
        headers: { Authorization: `Bearer ${secret}` },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (err) {
            reject(err);
          }
        });
      },
    );
    request.on('error', reject);
    request.end();
  });
}

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.end(JSON.stringify({ verified: false, error: 'Method not allowed' }));
    return;
  }

  const secret = process.env.PAYSTACK_SECRET_KEY || '';
  if (!secret) {
    res.statusCode = 200;
    res.end(JSON.stringify({ configured: false, verified: false }));
    return;
  }

  let body;
  try {
    body = await readBody(req);
  } catch {
    res.statusCode = 400;
    res.end(JSON.stringify({ verified: false, error: 'Invalid JSON' }));
    return;
  }

  const reference = String(body.reference || '').trim();
  const expectedAmount = Number(body.amount);
  if (!reference) {
    res.statusCode = 400;
    res.end(JSON.stringify({ verified: false, error: 'Missing reference' }));
    return;
  }

  try {
    const payload = await paystackVerify(secret, reference);
    const tx = payload && payload.data;
    const paid =
      payload &&
      payload.status === true &&
      tx &&
      tx.status === 'success' &&
      String(tx.currency || '').toUpperCase() === 'GHS';
    const amountOk = !expectedAmount || Number(tx && tx.amount) === expectedAmount;
    res.statusCode = paid && amountOk ? 200 : 400;
    res.end(
      JSON.stringify({
        configured: true,
        verified: Boolean(paid && amountOk),
        reference,
        amount: tx && tx.amount,
        status: tx && tx.status,
        channel: tx && tx.channel,
      }),
    );
  } catch (err) {
    res.statusCode = 502;
    res.end(JSON.stringify({ verified: false, error: 'Paystack verification failed' }));
  }
};
