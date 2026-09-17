const { sendJson, methodNotAllowed } = require('./_lib/http');

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    methodNotAllowed(res, ['GET']);
    return;
  }

  sendJson(res, 200, {
    PAYSTACK_PUBLIC_KEY: process.env.PAYSTACK_PUBLIC_KEY || '',
    SUPABASE_URL: process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '',
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '',
  });
};
