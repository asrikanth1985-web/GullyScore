
export interface Player {
  id: string;
  name: string;
  role: 'Batsman' | 'Bowler' | 'All-Rounder' | 'Wicketkeeper';
  logo?: string;
}

export interface Team {
  id: string;
  name: string;
  players: Player[];
  logo?: string;
}

export type ExtraType = 'Wide' | 'No Ball' | 'Bye' | 'Leg Bye' | 'None';
export type WicketType = 'Bowled' | 'Caught' | 'LBW' | 'Run Out' | 'Stumped' | 'Hit Wicket' | 'None';

export interface Delivery {
  batsmanId: string;
  bowlerId: string;
  runs: number;
  extraType: ExtraType;
  extraRuns: number;
  isWicket: boolean;
  wicketType: WicketType;
  over: number;
  ball: number;
}

export interface Innings {
  battingTeamId: string;
  bowlingTeamId: string;
  deliveries: Delivery[];
  isCompleted: boolean;
  target?: number;
}

export interface MatchLiveState {
  strikerId: string;
  nonStrikerId: string;
  currentBowlerId: string;
}

export interface Match {
  id: string;
  team1Id: string;
  team2Id: string;
  totalOvers: number;
  tossWinnerId: string;
  tossChoice: 'Bat' | 'Bowl';
  innings: Innings[];
  status: 'Upcoming' | 'Live' | 'Completed';
  winnerId?: string;
  createdAt: number;
  liveState?: MatchLiveState;
}

export interface Tournament {
  id: string;
  name: string;
  teams: Team[];
  matches: Match[];
  createdAt: number;
  lastUpdated: number;
}

export type ViewType = 'Dashboard' | 'Tournaments' | 'Teams' | 'NewMatch' | 'LiveMatch' | 'MatchHistory' | 'MatchStats' | 'TournamentReport' | 'SharedScoreboard';
