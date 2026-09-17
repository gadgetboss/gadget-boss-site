import { describe, expect, it } from 'vitest';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { assessPaystackVerification } = require('../api/_lib/paystack.js');

describe('assessPaystackVerification', () => {
  const successPayload = {
    status: true,
    data: {
      status: 'success',
      currency: 'GHS',
      amount: 34000,
      channel: 'mobile_money',
    },
  };

  it('accepts a successful GHS payment with matching amount', () => {
    const result = assessPaystackVerification(successPayload, { expectedAmount: 34000 });
    expect(result.verified).toBe(true);
    expect(result.amount).toBe(34000);
    expect(result.channel).toBe('mobile_money');
  });

  it('rejects when amount does not match', () => {
    const result = assessPaystackVerification(successPayload, { expectedAmount: 100 });
    expect(result.verified).toBe(false);
  });

  it('rejects non-GHS currency', () => {
    const result = assessPaystackVerification(
      {
        status: true,
        data: { status: 'success', currency: 'NGN', amount: 34000 },
      },
      { expectedAmount: 34000 },
    );
    expect(result.verified).toBe(false);
  });

  it('rejects failed transaction status', () => {
    const result = assessPaystackVerification(
      {
        status: true,
        data: { status: 'failed', currency: 'GHS', amount: 34000 },
      },
      { expectedAmount: 34000 },
    );
    expect(result.verified).toBe(false);
  });
});
