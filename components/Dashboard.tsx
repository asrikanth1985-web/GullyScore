
import React from 'react';
import { Team, Match } from '../types';
import { calculateInningsTotal, calculateInningsWickets, calculateLegalBalls, formatOvers } from '../utils/cricket';

interface DashboardProps {
  tournamentName: string;
  teams: Team[];
  matches: Match[];
  onNewMatch: () => void;
  onRegisterSquads: () => void;
  onViewStats: (id: string) => void;
  onContinueMatch: (id: string) => void;
  onViewTournamentReport: () => void;
  onExportData: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ 
  tournamentName, 
  teams, 
  matches, 
  onNewMatch, 
  onRegisterSquads, 
  onViewStats, 
  onContinueMatch, 
  onViewTournamentReport,
  onExportData
}) => {
  const completedMatches = matches.filter(m => m.status === 'Completed');
  const liveMatches = matches.filter(m => m.status === 'Live');
  const recentMatches = [...matches]
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 5);

  const needsTeams = teams.length < 2;

  const getMatchResultText = (match: Match) => {
    if (match.status !== 'Completed') return match.status;
    if (!match.winnerId) return "Match Tied";
    const winner = teams.find(t => t.id === match.winnerId);
    if (!winner) return "Match Ended";
    const inn1 = match.innings[0];
    const inn2 = match.innings[1];
    if (inn1 && inn2) {
      const score1 = calculateInningsTotal(inn1.deliveries);
      const score2 = calculateInningsTotal(inn2.deliveries);
      if (match.winnerId === inn1.battingTeamId) {
        return `${winner.name} won by ${score1 - score2} runs`;
      } else {
        const wicketsLost = calculateInningsWickets(inn2.deliveries);
        const battingTeamObj = teams.find(t => t.id === inn2.battingTeamId);
        const totalPlayers = battingTeamObj?.players.length || 11;
        return `${winner.name} won by ${totalPlayers - wicketsLost - 1} wickets`;
      }
    }
    return `${winner.name} won`;
  };

  const TeamBadge = ({ teamId }: { teamId: string }) => {
    const team = teams.find(t => t.id === teamId);
    return (
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-md bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-black text-slate-400 border border-slate-200 dark:border-slate-700">
          {team?.logo ? <img src={team.logo} alt={team.name} className="w-full h-full object-cover rounded-md" /> : team?.name?.[0]}
        </div>
        <span className="text-xs md:text-sm font-black text-slate-700 dark:text-slate-200 truncate max-w-[100px]">{team?.name}</span>
      </div>
    );
  };

  return (
    <div className="space-y-6 md:space-y-10 animate-in fade-in duration-500 pb-24">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-1">
        <div>
          <div className="inline-block px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-lg font-black text-[9px] md:text-[10px] uppercase tracking-widest mb-2">
            League: {tournamentName}
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-slate-800 dark:text-white tracking-tight">Tournament Summary</h2>
          <p className="text-xs md:text-base text-slate-500 dark:text-slate-400 font-medium">Tournament pulse and high-level summaries</p>
        </div>
        <div className="flex flex-wrap gap-2 md:gap-4">
          <button onClick={onViewTournamentReport} className="flex-1 md:flex-none bg-slate-900 dark:bg-slate-800 text-emerald-400 px-6 py-4 rounded-xl font-black text-[10px] md:text-sm uppercase tracking-widest shadow-xl flex items-center justify-center gap-2">
            <i className="fas fa-chart-line"></i> Summary
          </button>
          <button onClick={onExportData} className="flex-1 md:flex-none bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-6 py-4 rounded-xl font-black text-[10px] md:text-sm uppercase tracking-widest shadow-sm hover:bg-slate-200 transition-all flex items-center justify-center gap-2">
            <i className="fas fa-download"></i> Backup
          </button>
          <button 
            onClick={needsTeams ? onRegisterSquads : onNewMatch} 
            className={`flex-1 md:flex-none px-6 py-4 rounded-xl font-black text-[10px] md:text-sm uppercase tracking-widest shadow-xl transition-all flex items-center justify-center gap-2 ${needsTeams ? 'bg-amber-600 text-white shadow-amber-200' : 'bg-emerald-600 text-white shadow-emerald-200'}`}
          >
            <i className={`fas ${needsTeams ? 'fa-users-plus' : 'fa-plus'}`}></i>
            {needsTeams ? 'Add Teams' : 'Start Match'}
          </button>
        </div>
      </header>

      {/* Highlights / Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        {[
          { label: 'Total Matches', value: matches.length, icon: 'fa-cricket-bat-ball', color: 'text-blue-500' },
          { label: 'Completed', value: completedMatches.length, icon: 'fa-check-double', color: 'text-emerald-500' },
          { label: 'Live Now', value: liveMatches.length, icon: 'fa-tower-broadcast', color: 'text-orange-500' },
          { label: 'Teams', value: teams.length, icon: 'fa-users', color: 'text-indigo-500' }
        ].map((stat, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 p-4 md:p-6 rounded-2xl md:rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className={`w-8 h-8 md:w-10 md:h-10 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center ${stat.color} mb-3`}>
              <i className={`fas ${stat.icon} text-sm`}></i>
            </div>
            <p className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
            <p className="text-xl md:text-2xl font-black text-slate-800 dark:text-white leading-none mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-10">
        <div className="space-y-4">
          <h3 className="text-sm md:text-xl font-black text-slate-800 dark:text-white uppercase tracking-wider px-1">Live Matches</h3>
          {liveMatches.length > 0 ? (
            <div className="space-y-4">
              {liveMatches.map(match => (
                <div 
                  key={match.id}
                  onClick={() => onContinueMatch(match.id)}
                  className="bg-slate-900 dark:bg-slate-950 p-6 rounded-[2rem] border-b-8 border-emerald-500 shadow-xl cursor-pointer hover:scale-[1.02] transition-transform"
                >
                  <div className="flex justify-between mb-4">
                    <span className="text-emerald-400 font-black text-[9px] uppercase tracking-widest">Ongoing</span>
                    <span className="text-white/40 font-black text-[9px] uppercase tracking-widest">
                      {formatOvers(calculateLegalBalls(match.innings[match.innings.length - 1].deliveries))} / {match.totalOvers} Ov
                    </span>
                  </div>
                  <div className="space-y-3 mb-6">
                    <TeamBadge teamId={match.team1Id} />
                    <TeamBadge teamId={match.team2Id} />
                  </div>
                  <div className="flex justify-between items-end border-t border-white/10 pt-4">
                    <span className="text-white text-3xl font-black">
                      {calculateInningsTotal(match.innings[match.innings.length - 1].deliveries)}/{calculateInningsWickets(match.innings[match.innings.length - 1].deliveries)}
                    </span>
                    <i className="fas fa-circle-play text-emerald-500 text-2xl"></i>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-200 mb-3">
                <i className="fas fa-play"></i>
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No active games</p>
            </div>
          )}
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center px-1">
            <h3 className="text-sm md:text-xl font-black text-slate-800 dark:text-white uppercase tracking-wider">Matches Summary</h3>
          </div>
          {recentMatches.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 p-12 rounded-[2rem] border-2 border-dashed border-slate-100 dark:border-slate-800 text-center">
              <i className="fas fa-calendar-xmark text-3xl text-slate-200 mb-4"></i>
              <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">No match records yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentMatches.map(match => (
                <div 
                  key={match.id} 
                  onClick={() => match.status === 'Live' ? onContinueMatch(match.id) : onViewStats(match.id)}
                  className="bg-white dark:bg-slate-900 p-4 md:p-5 rounded-2xl md:rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all cursor-pointer group"
                >
                  <div className="flex justify-between items-center gap-4">
                    <div className="flex-1 flex flex-col md:flex-row md:items-center gap-4">
                      <div className="flex items-center gap-4">
                        <TeamBadge teamId={match.team1Id} />
                        <span className="text-[10px] font-black text-slate-300">VS</span>
                        <TeamBadge teamId={match.team2Id} />
                      </div>
                      <div className="h-px w-full md:w-px md:h-8 bg-slate-50 dark:bg-slate-800"></div>
                      <div className="min-w-0">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Result</p>
                        <p className={`text-xs md:text-sm font-black truncate ${match.status === 'Live' ? 'text-orange-500' : 'text-slate-700 dark:text-slate-300'}`}>
                          {getMatchResultText(match)}
                        </p>
                      </div>
                    </div>
                    <div className={`px-3 py-1.5 rounded-xl flex items-center justify-center font-black text-[8px] md:text-[10px] uppercase tracking-widest ${match.status === 'Live' ? 'bg-orange-500 text-white animate-pulse' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                      {match.status}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
