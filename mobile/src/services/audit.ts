import firestore from '@react-native-firebase/firestore';
import type { Scope } from '../domain/model';

export type AuditDecision = { allowed: boolean; reason: string };

export async function writeAudit(args: {
  actorId: string;
  action: string;
  scope: Scope;
  scopeId: string;
  target?: { type: string; id: string };
  decision?: AuditDecision;
  meta?: Record<string, unknown>;
}): Promise<void> {
  const { actorId, action, scope, scopeId, target, decision, meta } = args;
  await firestore()
    .collection('audits')
    .doc()
    .set({
      at: firestore.FieldValue.serverTimestamp(),
      actorId,
      action,
      scope,
      scopeId,
      ...(target ? { target } : {}),
      ...(decision ? { decision } : {}),
      ...(meta ? { meta } : {}),
    });
}

