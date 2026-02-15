
import React, { useRef, useState } from 'react';
import { Match, Team, Delivery, Player } from '../types';
import html2canvas from 'html2canvas';
import { 
  calculateInningsTotal, 
  calculateInningsWickets, 
  calculateLegalBalls, 
  getPlayerStats, 
  formatOvers, 
  calculateTotalExtras, 
  getExtrasBreakdown 
} from '../utils/cricket';

interface StatsViewProps {
  match: Match;
  teams: Team[];
  onBack: () => void;
}

const StatsView: React.FC<StatsViewProps> = ({ match, teams, onBack }) => {
  const reportRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const winner = teams.find(t => t.id === match.winnerId);
  const isTied = match.status === 'Completed' && !match.winnerId;

  const downloadReport = async () => {
    if (!reportRef.current) return;
    setIsExporting(true);
    try {
      await new Promise(r => setTimeout(r, 150));
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        backgroundColor: '#0f172a',
        useCORS: true,
        logging: false
      });
      const link = document.createElement('a');
      link.download = `Match_Report_${match.id.substring(0, 8)}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error("Export failed:", err);
    } finally {
      setIsExporting(false);
    }
  };

  const getWicketsForBowler = (bowlerId: string, deliveries: Delivery[]) => {
    return deliveries
      .filter(d => d.bowlerId === bowlerId && d.isWicket && d.wicketType !== 'Run Out')
      .map(d => {
        const p = teams.flatMap(t => t.players).find(pl => pl.id === d.batsmanId);
        return { name: p?.name || 'Unknown', type: d.wicketType };
      });
  };

  const getBoundaryCount = (playerId: string, deliveries: Delivery[], runs: number) => {
    return deliveries.filter(d => d.batsmanId === playerId && d.runs === runs).length;
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-500 pb-24">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <button onClick={onBack} className="text-emerald-600 font-black text-sm mb-2 flex items-center gap-2 hover:translate-x-[-4px] transition-transform">
            <i className="fas fa-arrow-left"></i> Match History
          </button>
          <h2 className="text-4xl font-black text-slate-800 dark:text-white tracking-tight">Match Insights</h2>
        </div>
        <div className="flex gap-4">
          <button
            onClick={downloadReport}
            className="bg-slate-900 dark:bg-slate-800 text-emerald-400 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center gap-2 transition-all hover:bg-slate-800"
          >
            {isExporting ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-camera"></i>}
            Snapshot
          </button>
        </div>
      </header>

      <div ref={reportRef} className="space-y-12 bg-white dark:bg-slate-900 p-8 md:p-12 rounded-[3.5rem] border border-slate-100 dark:border-slate-800 transition-colors shadow-sm overflow-hidden relative">
        {/* Match Hero Section */}
        <div className={`relative overflow-hidden p-10 rounded-[2.5rem] border-b-[16px] flex flex-col items-center justify-center text-center space-y-4 shadow-xl ${isTied ? 'bg-indigo-600 border-indigo-800' : 'bg-emerald-600 border-emerald-800'}`}>
           <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12">
             <i className={`fas ${isTied ? 'fa-scale-balanced' : 'fa-trophy'} text-9xl text-white`}></i>
           </div>
           
           <h3 className="text-white font-black text-6xl tracking-tighter uppercase drop-shadow-lg">
             {isTied ? 'Match Tied!' : `${winner?.name} Won!`}
           </h3>
           
           {match.status === 'Completed' && !isTied && winner && (
             <div className="bg-white/20 backdrop-blur-md px-6 py-2 rounded-full border border-white/20">
               <p className="text-white font-black text-sm uppercase tracking-widest">
                  Result: {winner.name} won by {
                    match.innings.length > 1 ? (
                      calculateInningsTotal(match.innings[1].deliveries) >= (match.innings[0].target || 0) 
                      ? `${(teams.find(t => t.id === match.innings[1].battingTeamId)?.players.length || 0) - calculateInningsWickets(match.innings[1].deliveries) - 1} Wickets`
                      : `${calculateInningsTotal(match.innings[0].deliveries) - calculateInningsTotal(match.innings[1].deliveries)} Runs`
                    ) : 'Default'
                  }
               </p>
             </div>
           )}
           {isTied && (
             <p className="text-white/80 font-black text-sm uppercase tracking-widest">Both teams finished level on runs</p>
           )}
        </div>

        {match.innings.map((inn, idx) => {
          const battingTeam = teams.find(t => t.id === inn.battingTeamId);
          const totalRuns = calculateInningsTotal(inn.deliveries);
          const wickets = calculateInningsWickets(inn.deliveries);
          const legalBalls = calculateLegalBalls(inn.deliveries);
          const extras = getExtrasBreakdown(inn.deliveries);

          return (
            <div key={idx} className="space-y-8 animate-in slide-in-from-bottom-4" style={{ animationDelay: `${idx * 150}ms` }}>
              <div className="flex flex-col md:flex-row md:items-end justify-between border-b-2 border-slate-50 dark:border-slate-800 pb-6 gap-4">
                <div>
                  <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.3em] mb-1">Innings {idx + 1}</p>
                  <h3 className="text-4xl font-black text-slate-800 dark:text-white tracking-tighter">{battingTeam?.name}</h3>
                </div>
                <div className="flex items-baseline gap-6">
                  <div className="text-right">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Score</p>
                    <p className="text-5xl font-black text-slate-900 dark:text-white">{totalRuns}/{wickets}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Overs</p>
                    <p className="text-3xl font-black text-slate-500 dark:text-slate-400">{formatOvers(legalBalls)}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {/* Batting Scorecard */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <i className="fas fa-baseball-bat-ball text-emerald-500"></i>
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Batting Record</h4>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-950/50 rounded-3xl overflow-hidden border border-slate-100 dark:border-slate-800">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-100 dark:bg-slate-800/50 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-tighter border-b border-slate-200 dark:border-slate-800">
                          <th className="px-6 py-4">Batsman</th>
                          <th className="px-4 py-4 text-center w-12">R</th>
                          <th className="px-4 py-4 text-center w-12">B</th>
                          <th className="px-4 py-4 text-center w-12">4s/6s</th>
                          <th className="px-6 py-4 text-right w-20">SR</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {battingTeam?.players.map(p => {
                          const stats = getPlayerStats(p.id, inn.deliveries);
                          if (stats.balls === 0) return null;
                          const fours = getBoundaryCount(p.id, inn.deliveries, 4);
                          const sixes = getBoundaryCount(p.id, inn.deliveries, 6);
                          return (
                            <tr key={p.id} className="hover:bg-white dark:hover:bg-slate-800 transition-colors">
                              <td className="px-6 py-4">
                                <span className="font-bold text-slate-800 dark:text-slate-200">{p.name}</span>
                              </td>
                              <td className="px-4 py-4 text-center">
                                <span className="font-black text-slate-900 dark:text-white font-mono text-lg">{stats.runs}</span>
                              </td>
                              <td className="px-4 py-4 text-center">
                                <span className="text-sm font-bold text-slate-400 dark:text-slate-500 font-mono">{stats.balls}</span>
                              </td>
                              <td className="px-4 py-4 text-center">
                                <span className="text-[10px] font-black text-slate-400 font-mono">{fours}/{sixes}</span>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <span className="text-xs font-black text-emerald-600 dark:text-emerald-500 font-mono">{stats.strikeRate}</span>
                              </td>
                            </tr>
                          );
                        })}
                        <tr className="bg-emerald-50/30 dark:bg-emerald-950/10 font-black">
                          <td className="px-6 py-4 text-xs uppercase text-emerald-700 dark:text-emerald-400">Total Extras</td>
                          <td colSpan={3} className="px-4 py-4 text-center text-[10px] text-slate-400 dark:text-slate-500 italic">
                            (W:{extras.Wide} NB:{extras['No Ball']} B/LB:{extras.Bye + extras['Leg Bye']})
                          </td>
                          <td className="px-6 py-4 text-right text-emerald-700 dark:text-emerald-400 font-mono">{calculateTotalExtras(inn.deliveries)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Bowling Scorecard */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <i className="fas fa-baseball-ball text-emerald-500"></i>
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Bowling Analysis</h4>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-950/50 rounded-3xl overflow-hidden border border-slate-100 dark:border-slate-800">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-100 dark:bg-slate-800/50 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-tighter border-b border-slate-200 dark:border-slate-800">
                          <th className="px-6 py-4">Bowler</th>
                          <th className="px-4 py-4 text-center w-16">O</th>
                          <th className="px-4 py-4 text-center w-16">W</th>
                          <th className="px-6 py-4 text-right w-24">ECON</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {teams.find(t => t.id === inn.bowlingTeamId)?.players.map(p => {
                          const stats = getPlayerStats(p.id, inn.deliveries);
                          if (stats.overs === "0.0") return null;
                          const dismissals = getWicketsForBowler(p.id, inn.deliveries);
                          return (
                            <React.Fragment key={p.id}>
                              <tr className="hover:bg-white dark:hover:bg-slate-800 transition-colors">
                                <td className="px-6 py-4">
                                  <span className="font-bold text-slate-800 dark:text-slate-200">{p.name}</span>
                                </td>
                                <td className="px-4 py-4 text-center">
                                  <span className="text-sm font-bold text-slate-400 dark:text-slate-500 font-mono">{stats.overs}</span>
                                </td>
                                <td className="px-4 py-4 text-center">
                                  <span className="font-black text-red-600 dark:text-red-500 font-mono text-lg">{stats.wickets}</span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                  <span className="text-xs font-black text-slate-700 dark:text-slate-300 font-mono">{stats.economy}</span>
                                </td>
                              </tr>
                              {dismissals.length > 0 && (
                                <tr>
                                  <td colSpan={4} className="px-6 py-2 pb-4">
                                    <div className="flex flex-wrap gap-1.5">
                                      {dismissals.map((w, wi) => (
                                        <span key={wi} className="text-[8px] font-black text-slate-400 bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-100 dark:border-slate-800 uppercase italic">
                                          {w.name} ({w.type})
                                        </span>
                                      ))}
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        
        <footer className="pt-8 border-t border-slate-50 dark:border-slate-800 flex justify-between items-center text-slate-300 dark:text-slate-600">
          <div className="flex items-center gap-2">
             <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white text-sm">
                <i className="fas fa-baseball-bat-ball"></i>
             </div>
             <span className="font-black tracking-tighter text-slate-900 dark:text-slate-400">GullyScore V2</span>
          </div>
          <p className="text-[10px] font-bold uppercase tracking-widest italic">Parallel Match Tracking System</p>
        </footer>
      </div>
    </div>
  );
};

export default StatsView;
