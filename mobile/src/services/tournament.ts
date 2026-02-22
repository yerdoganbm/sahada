import {
  getTournamentTeams as getTeamsFromFirestore,
  getBracketMatches as getBracketsFromFirestore,
  type TournamentTeam,
  type BracketMatch,
} from './firestore';

export type { TournamentTeam, BracketMatch };

export async function getTournamentTeams(): Promise<TournamentTeam[]> {
  try {
    return await getTeamsFromFirestore();
  } catch (e) {
    console.warn('getTournamentTeams failed', e);
    return [];
  }
}

export async function getBracketMatches(): Promise<BracketMatch[]> {
  try {
    return await getBracketsFromFirestore();
  } catch (e) {
    console.warn('getBracketMatches failed', e);
    return [];
  }
}
