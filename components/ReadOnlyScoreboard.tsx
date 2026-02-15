
import React from 'react';
import { Match, Team, Player } from '../types';
import { calculateInningsTotal, calculateInningsWickets, calculateLegalBalls, formatOvers, getPlayerStats } from '../utils/cricket';

interface ReadOnlyScoreboardProps {
  match: Match;
  team1: Team;
  team2: Team;
  onClose: () => void;
}

const ReadOnlyScoreboard: React.FC<ReadOnlyScoreboardProps> = ({ match, team1, team2, onClose }) => {
  const currentInningsIndex = Math.max(0, match.innings.length - 1);
  const currentInnings = match.innings[currentInningsIndex];
  
  const teams = [team1, team2];
  const battingTeam = teams.find(t => t.id === currentInnings.battingTeamId)!;
  const bowlingTeam = teams.find(t => t.id === currentInnings.bowlingTeamId)!;

  const totalRuns = calculateInningsTotal(currentInnings.deliveries);
  const wickets = calculateInningsWickets(currentInnings.deliveries);
  const legalBalls = calculateLegalBalls(currentInnings.deliveries);
  const currentOverIndex = Math.floor(legalBalls / 6);
  const overDeliveries = currentInnings.deliveries.filter(d => d.over === currentOverIndex);

  const strikerId = match.liveState?.strikerId;
  const nonStrikerId = match.liveState?.nonStrikerId;
  const currentBowlerId = match.liveState?.currentBowlerId;

  const PlayerLogo = ({ player, size = "w-10 h-10 md:w-12 md:h-12" }: { player?: Player, size?: string }) => (
    <div className={`${size} rounded-full bg-white/20 dark:bg-slate-800 flex items-center justify-center text-white/50 dark:text-slate-500 font-bold overflow-hidden border-2 border-white/20 dark:border-slate-700`}>
      {player?.logo ? <img src={player.logo} className="w-full h-full object-cover" /> : <span className="text-[10px] md:text-xs uppercase">{player?.name?.substring(0,2) || '?'}</span>}
    </div>
  );

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500 max-w-4xl mx-auto pb-10">
      <header className="flex justify-between items-center px-1">
        <div>
          <span className="bg-orange-500 text-white text-[8px] md:text-[10px] font-black px-2 md:px-3 py-0.5 md:py-1 rounded-full uppercase tracking-widest animate-pulse">Live Scoreboard</span>
          <h2 className="text-xl md:text-3xl font-black text-slate-800 dark:text-white mt-1 md:mt-2 uppercase tracking-tight">Match Score</h2>
        </div>
        <button onClick={onClose} className="px-4 md:px-6 py-2 md:py-3 bg-slate-900 dark:bg-slate-800 text-white rounded-xl md:rounded-2xl font-black text-[10px] md:text-xs uppercase tracking-widest hover:bg-slate-800">
           My League
        </button>
      </header>

      {/* Primary Score Card */}
      <div className="bg-slate-900 dark:bg-slate-950 text-white rounded-[2rem] md:rounded-[3rem] p-8 md:p-10 shadow-2xl relative overflow-hidden border-b-[8px] md:border-b-[12px] border-emerald-500">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 md:gap-6 relative z-10">
          <div className="text-center md:text-left">
            <span className="text-emerald-400 font-black text-[9px] md:text-[10px] uppercase tracking-widest">{battingTeam.name} BATTING</span>
            <div className="flex items-baseline justify-center md:justify-start gap-2 md:gap-4 mt-2">
              <span className="text-6xl md:text-8xl font-black tracking-tighter">{totalRuns}<span className="text-emerald-500 mx-1">/</span>{wickets}</span>
              <span className="text-lg md:text-2xl text-slate-400 font-bold">({formatOvers(legalBalls)})</span>
            </div>
          </div>
          <div className="text-center md:text-right">
            <div className="text-3xl md:text-4xl font-black text-emerald-500">CRR: {(totalRuns / (legalBalls / 6 || 1)).toFixed(2)}</div>
            {currentInnings.target && (
              <p className="text-white/60 font-black mt-1 uppercase text-xs md:text-sm tracking-widest">Target: {currentInnings.target}</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
        {/* Batsmen */}
        <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-[2rem] md:rounded-[3rem] shadow-xl border border-slate-100 dark:border-slate-800">
          <h4 className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 md:mb-6">Current Partnership</h4>
          <div className="space-y-3 md:space-y-4">
            {[strikerId, nonStrikerId].map((id, i) => {
              if (!id) return null;
              const p = battingTeam.players.find(pl => pl.id === id);
              const stats = getPlayerStats(id, currentInnings.deliveries);
              const isStriker = i === 0;
              return (
                <div key={id} className={`p-3 md:p-4 rounded-[1.5rem] md:rounded-[2rem] flex items-center gap-3 md:gap-4 transition-all ${isStriker ? 'bg-emerald-50 dark:bg-emerald-950/20 ring-2 ring-emerald-500 shadow-lg' : 'bg-slate-50 dark:bg-slate-800'}`}>
                  <PlayerLogo player={p} />
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-slate-800 dark:text-white text-sm md:text-lg truncate">{p?.name} {isStriker && '*'}</p>
                    <p className="text-[8px] md:text-[10px] text-slate-400 font-black uppercase">SR: {stats.strikeRate}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xl md:text-2xl font-black text-slate-900 dark:text-white leading-none">{stats.runs}</p>
                    <p className="text-[8px] md:text-[10px] text-slate-400 font-black">({stats.balls})</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bowler */}
        <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-[2rem] md:rounded-[3rem] shadow-xl border border-slate-100 dark:border-slate-800">
          <h4 className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 md:mb-6">Current Bowler</h4>
          {currentBowlerId ? (
            <div className="flex flex-col h-full justify-between gap-4">
              <div className="flex items-center gap-3 md:gap-4 p-3 md:p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl md:rounded-3xl border border-slate-100 dark:border-slate-700">
                <PlayerLogo player={bowlingTeam.players.find(p => p.id === currentBowlerId)} />
                <div className="flex-1 min-w-0">
                  <p className="font-black text-slate-800 dark:text-white text-base md:text-xl truncate">{bowlingTeam.players.find(p => p.id === currentBowlerId)?.name}</p>
                  <p className="text-[9px] md:text-[10px] text-slate-400 font-black uppercase tracking-widest">Active Bowler</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 md:gap-4">
                {[ { l: 'Overs', v: getPlayerStats(currentBowlerId, currentInnings.deliveries).overs }, { l: 'Wkts', v: getPlayerStats(currentBowlerId, currentInnings.deliveries).wickets }, { l: 'Econ', v: getPlayerStats(currentBowlerId, currentInnings.deliveries).economy } ].map((s, i) => (
                  <div key={i} className="bg-slate-50 dark:bg-slate-800 p-2 md:p-4 rounded-xl text-center">
                    <p className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase mb-0.5 tracking-tighter">{s.l}</p>
                    <p className="text-xl md:text-2xl font-black text-slate-800 dark:text-white">{s.v}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : <p className="text-slate-400 italic text-sm">Waiting for bowler...</p>}
        </div>
      </div>
    </div>
  );
};

export default ReadOnlyScoreboard;
