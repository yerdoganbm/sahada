import type { Poll } from '../types';
import {
  getPolls as getPollsFromFirestore,
  votePoll as votePollInFirestore,
} from './firestore';

export async function getPolls(teamId?: string): Promise<Poll[]> {
  try {
    const list = await getPollsFromFirestore(teamId);
    return list;
  } catch (e) {
    console.warn('getPolls failed', e);
    return [];
  }
}

export async function votePoll(pollId: string, optionId: string, userId: string): Promise<void> {
  await votePollInFirestore(pollId, optionId, userId);
}
