import { paymentIdempotencyKey } from '../paymentIdempotency';

describe('paymentIdempotencyKey', () => {
  test('is deterministic for same inputs', () => {
    const a = paymentIdempotencyKey({ matchId: 'm1', userId: 'u1', amount: 100, dateBucket: '2026-02-23' });
    const b = paymentIdempotencyKey({ matchId: 'm1', userId: 'u1', amount: 100, dateBucket: '2026-02-23' });
    expect(a).toBe(b);
    expect(a).toHaveLength(64);
  });

  test('changes when amount changes', () => {
    const a = paymentIdempotencyKey({ matchId: 'm1', userId: 'u1', amount: 100, dateBucket: '2026-02-23' });
    const b = paymentIdempotencyKey({ matchId: 'm1', userId: 'u1', amount: 101, dateBucket: '2026-02-23' });
    expect(a).not.toBe(b);
  });
});

