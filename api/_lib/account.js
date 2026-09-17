// Shared pieces for the /api/account endpoints.
const { readSessionCookie } = require('./cookies');
const { normalizeGhanaPhone } = require('./phone');
const otp = require('./otp');

const SIGN_IN_ERROR = 'Sign in to view your orders.';
const NOT_FOUND_ERROR = 'Order not found.';
const LOOKUP_FAILED_ERROR = 'Could not load your orders. Try again.';

/** Returns the session's E.164 phone, or null when there is no trustworthy session. */
function sessionPhone(req) {
  const secret = otp.sessionSecret();
  if (!secret) return null;
  const session = readSessionCookie(req, secret);
  if (!session) return null;
  return normalizeGhanaPhone(session.phone);
}

/** Only the fields the account UI needs — no customer_phone/email echoed back. */
function shapeOrder(row) {
  return {
    id: row.id,
    receiptNo: row.receipt_no || null,
    status: row.status || null,
    total: Number(row.total || 0),
    subtotal: Number(row.subtotal || 0),
    paymentMethod: row.payment_method || null,
    createdAt: row.created_at || null,
    customerName: row.customer_name || null,
    customerLocation: row.customer_location || null,
    items: (Array.isArray(row.order_items) ? row.order_items : []).map((item) => ({
      productId: item.product_id,
      productName: item.product_name,
      qty: Number(item.qty || 0),
      unitPrice: Number(item.unit_price || 0),
      lineTotal: Number(item.line_total || 0),
    })),
  };
}

module.exports = {
  SIGN_IN_ERROR,
  NOT_FOUND_ERROR,
  LOOKUP_FAILED_ERROR,
  sessionPhone,
  shapeOrder,
};
