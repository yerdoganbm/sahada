import { Player } from '../types';

export interface BalancingResult {
  teamA: Player[];
  teamB: Player[];
  stats: {
    skillGap: number;
    teamASkill: number;
    teamBSkill: number;
  };
}

// Helper to calculate total skill of a team
const getTeamSkill = (team: Player[]) => Number(team.reduce((acc, p) => acc + p.rating, 0).toFixed(1));

export const generateBalancedTeams = (players: Player[]): BalancingResult => {
  // 1. Skill Normalization: Sort players by skill level (Descending)
  const sorted = [...players].sort((a, b) => b.rating - a.rating);

  let teamA: Player[] = [];
  let teamB: Player[] = [];

  // 2. Snake Distribution Logic (A-B-B-A)
  // This prevents the "top-heavy" bias.
  sorted.forEach((player, index) => {
    const round = Math.floor(index / 2);
    // Even rounds (0, 2, 4): Normal order
    // Odd rounds (1, 3, 5): Reverse order
    if (round % 2 === 0) {
      if (index % 2 === 0) teamA.push(player);
      else teamB.push(player);
    } else {
      if (index % 2 === 0) teamB.push(player);
      else teamA.push(player);
    }
  });

  // 3. Positional Logic (Simplified for this implementation)
  // Ensure defenses aren't lopsided.
  // In a full implementation, we would swap players within a 0.5 skill tolerance window.
  const defA = teamA.filter(p => p.position === 'DEF').length;
  const defB = teamB.filter(p => p.position === 'DEF').length;
  
  // Simple heuristic swap if imbalance > 1 (mock logic for demo)
  if (Math.abs(defA - defB) > 1) {
     // Find swap candidates...
  }

  // 4. Final Calculation for Output
  const skillA = getTeamSkill(teamA);
  const skillB = getTeamSkill(teamB);
  const gap = Number(Math.abs(skillA - skillB).toFixed(1));

  return {
    teamA,
    teamB,
    stats: {
      skillGap: gap,
      teamASkill: skillA,
      teamBSkill: skillB
    }
  };
};