import { sha256Hex } from '../utils/token';

export function paymentIdempotencyKey(args: {
  matchId: string;
  userId: string;
  amount: number;
  dateBucket: string;
}): string {
  const base = `${args.matchId}:${args.userId}:${args.amount}:${args.dateBucket}`;
  return sha256Hex(base);
}

