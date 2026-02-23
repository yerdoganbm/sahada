import type { Actor } from '../model';
import { MembershipStatus as MS } from '../model';
import { validateTransition, MembershipTransitionError, COOLDOWN_MS } from '../membershipStateMachine';

const dummyActor: Actor = {
  uid: 'u1',
  teamRoles: new Map(),
  orgRoles: new Map(),
  membershipStatusByTenant: new Map(),
  subscription: 'free',
};

describe('membershipStateMachine.validateTransition', () => {
  test('enforces LEFT -> REQUESTED cooldown (72h)', () => {
    const now = new Date();
    const leftAt = new Date(now.getTime() - (COOLDOWN_MS.LEFT_TO_REQUESTED - 60_000));

    expect(() =>
      validateTransition({
        current: MS.LEFT,
        next: MS.REQUESTED,
        actor: dummyActor,
        meta: { now, leftAt },
      })
    ).toThrow(MembershipTransitionError);
  });

  test('TEMP_BANNED -> ACTIVE requires banEnd <= now unless override', () => {
    const now = new Date();
    const banEnd = new Date(now.getTime() + 60_000);

    expect(() =>
      validateTransition({
        current: MS.TEMP_BANNED,
        next: MS.ACTIVE,
        actor: dummyActor,
        meta: { now, banEnd },
      })
    ).toThrow(MembershipTransitionError);
  });
});

