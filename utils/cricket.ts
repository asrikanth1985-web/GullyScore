
import { Delivery, Innings, ExtraType, Match, Team, Player } from '../types';

export const formatOvers = (balls: number): string => {
  const overs = Math.floor(balls / 6);
  const remainingBalls = balls % 6;
  return `${overs}.${remainingBalls}`;
};

export const calculateInningsTotal = (deliveries: Delivery[]) => {
  return deliveries.reduce((total, d) => total + d.runs + d.extraRuns, 0);
};

export const calculateInningsWickets = (deliveries: Delivery[]) => {
  return deliveries.filter(d => d.isWicket).length;
};

export const calculateLegalBalls = (deliveries: Delivery[]) => {
  return deliveries.filter(d => d.extraType !== 'Wide' && d.extraType !== 'No Ball').length;
};

export const calculateTotalExtras = (deliveries: Delivery[]) => {
  return deliveries.reduce((sum, d) => sum + d.extraRuns, 0);
};

export const getExtrasBreakdown = (deliveries: Delivery[]) => {
  const counts = { Wide: 0, 'No Ball': 0, Bye: 0, 'Leg Bye': 0 };
  deliveries.forEach(d => {
    if (d.extraType !== 'None') {
      counts[d.extraType as keyof typeof counts]++;
    }
  });
  return counts;
};

export const getPlayerStats = (playerId: string, deliveries: Delivery[]) => {
  const batting = deliveries.filter(d => d.batsmanId === playerId);
  const runs = batting.reduce((sum, d) => sum + d.runs, 0);
  const balls = batting.filter(d => d.extraType !== 'Wide').length;
  
  const bowling = deliveries.filter(d => d.bowlerId === playerId);
  const bowlingRuns = bowling.reduce((sum, d) => sum + d.runs + d.extraRuns, 0);
  const bowlingWickets = bowling.filter(d => d.isWicket && d.wicketType !== 'Run Out').length;
  const bowlingBalls = bowling.filter(d => d.extraType !== 'Wide' && d.extraType !== 'No Ball').length;

  return {
    runs,
    balls,
    strikeRate: balls > 0 ? ((runs / balls) * 100).toFixed(2) : "0.00",
    wickets: bowlingWickets,
    economy: bowlingBalls > 0 ? ((bowlingRuns / (bowlingBalls / 6))).toFixed(2) : "0.00",
    overs: formatOvers(bowlingBalls),
    rawBowlingBalls: bowlingBalls
  };
};

export const getTournamentPerformers = (matches: Match[], teams: Team[]) => {
  const playerStats: Record<string, { name: string, teamName: string, logo?: string, runs: number, balls: number, wickets: number, runsConceded: number, bowlingBalls: number }> = {};

  matches.forEach(m => {
    m.innings.forEach(inn => {
      inn.deliveries.forEach(d => {
        // Batting update
        if (!playerStats[d.batsmanId]) {
          const team = teams.find(t => t.players.some(p => p.id === d.batsmanId));
          const player = team?.players.find(p => p.id === d.batsmanId);
          playerStats[d.batsmanId] = { 
            name: player?.name || 'Unknown', 
            teamName: team?.name || 'Unknown', 
            logo: player?.logo,
            runs: 0, balls: 0, wickets: 0, runsConceded: 0, bowlingBalls: 0 
          };
        }
        playerStats[d.batsmanId].runs += d.runs;
        if (d.extraType !== 'Wide') playerStats[d.batsmanId].balls += 1;

        // Bowling update
        if (!playerStats[d.bowlerId]) {
          const team = teams.find(t => t.players.some(p => p.id === d.bowlerId));
          const player = team?.players.find(p => p.id === d.bowlerId);
          playerStats[d.bowlerId] = { 
            name: player?.name || 'Unknown', 
            teamName: team?.name || 'Unknown', 
            logo: player?.logo,
            runs: 0, balls: 0, wickets: 0, runsConceded: 0, bowlingBalls: 0 
          };
        }
        playerStats[d.bowlerId].runsConceded += (d.runs + d.extraRuns);
        if (d.isWicket && d.wicketType !== 'Run Out') playerStats[d.bowlerId].wickets += 1;
        if (d.extraType !== 'Wide' && d.extraType !== 'No Ball') playerStats[d.bowlerId].bowlingBalls += 1;
      });
    });
  });

  const sortedBatsmen = Object.values(playerStats).sort((a, b) => b.runs - a.runs || a.balls - b.balls);
  const sortedBowlers = Object.values(playerStats).sort((a, b) => b.wickets - a.wickets || a.runsConceded - b.runsConceded);

  return {
    bestBatsman: sortedBatsmen[0],
    bestBowler: sortedBowlers[0],
    allStats: playerStats
  };
};
