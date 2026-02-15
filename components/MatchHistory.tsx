
import React from 'react';
import { Match, Team } from '../types';

interface MatchHistoryProps {
  matches: Match[];
  teams: Team[];
  onViewStats: (id: string) => void;
}

const MatchHistory: React.FC<MatchHistoryProps> = ({ matches, teams, onViewStats }) => {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-800">Match History</h2>
      
      <div className="grid grid-cols-1 gap-4">
        {matches.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-100">
            <p className="text-slate-400">No matches recorded yet</p>
          </div>
        ) : (
          [...matches].reverse().map(match => {
            const team1 = teams.find(t => t.id === match.team1Id);
            const team2 = teams.find(t => t.id === match.team2Id);
            const winner = teams.find(t => t.id === match.winnerId);
            
            return (
              <div 
                key={match.id}
                onClick={() => onViewStats(match.id)}
                className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all cursor-pointer group flex flex-col md:flex-row justify-between items-center gap-6"
              >
                <div className="flex items-center gap-8 flex-1 w-full md:w-auto">
                  <div className="text-center">
                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-tighter mb-1">
                        {new Date(match.createdAt).toLocaleDateString()}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${match.status === 'Live' ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-500'}`}>
                        {match.status}
                    </span>
                  </div>
                  <div className="flex-1 text-center md:text-left">
                    <p className="text-lg font-bold text-slate-800">{team1?.name} vs {team2?.name}</p>
                    <p className="text-sm text-slate-500 font-medium">Format: {match.totalOvers} Overs</p>
                  </div>
                </div>
                
                <div className="text-center md:text-right w-full md:w-auto">
                  {match.status === 'Completed' ? (
                    <div>
                      <span className="text-xs text-emerald-600 font-bold uppercase tracking-widest block mb-1">Winner</span>
                      <span className="text-xl font-black text-slate-800">{winner?.name}</span>
                    </div>
                  ) : (
                    <span className="text-emerald-600 font-bold group-hover:underline">Continue Match <i className="fas fa-arrow-right ml-1"></i></span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default MatchHistory;
