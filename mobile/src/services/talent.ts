import {
  getTalentPool as getTalentPoolFromFirestore,
  getScoutReports as getScoutReportsFromFirestore,
  type TalentPoolItem,
  type ScoutReportItem,
} from './firestore';

export type { TalentPoolItem, ScoutReportItem };

export async function getTalentPool(teamId?: string): Promise<TalentPoolItem[]> {
  try {
    return await getTalentPoolFromFirestore(teamId);
  } catch (e) {
    console.warn('getTalentPool failed', e);
    return [];
  }
}

export async function getScoutReports(): Promise<ScoutReportItem[]> {
  try {
    return await getScoutReportsFromFirestore();
  } catch (e) {
    console.warn('getScoutReports failed', e);
    return [];
  }
}
