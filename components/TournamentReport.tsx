
import React, { useRef, useState } from 'react';
import { Tournament, Team, Match } from '../types';
import html2canvas from 'html2canvas';
import { getTournamentPerformers } from '../utils/cricket';

interface TournamentReportProps {
  tournament: Tournament;
  onBack: () => void;
}

const TournamentReport: React.FC<TournamentReportProps> = ({ tournament, onBack }) => {
  const reportRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  
  const stats = getTournamentPerformers(tournament.matches, tournament.teams);
  const teamsSorted = [...tournament.teams].sort((a, b) => {
    const winsA = tournament.matches.filter(m => m.winnerId === a.id).length;
    const winsB = tournament.matches.filter(m => m.winnerId === b.id).length;
    return winsB - winsA;
  });

  const downloadReport = async () => {
    if (!reportRef.current) return;
    setIsExporting(true);
    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        backgroundColor: '#0f172a',
        useCORS: true,
        logging: false
      });
      const link = document.createElement('a');
      link.download = `Summary_${tournament.name.replace(/\s+/g, '_')}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error(err);
      alert("Export failed. Please try again or take a screenshot.");
    } finally {
      setIsExporting(false);
    }
  };

  const PerformerCard = ({ title, performer, colorClass, icon }: any) => {
    const isBatsman = title.toLowerCase().includes('batsman');
    return (
      <div className={`p-4 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] border-2 flex items-center gap-4 md:gap-6 shadow-2xl ${colorClass}`}>
        <div className="w-12 h-12 md:w-20 md:h-20 rounded-xl bg-white/10 flex items-center justify-center text-xl md:text-3xl shadow-lg border border-white/20 flex-shrink-0">
          {performer?.logo ? <img src={performer.logo} className="w-full h-full object-cover rounded-lg" /> : <i className={`fas ${icon}`}></i>}
        </div>
        <div className="flex-1 min-w-0 text-left">
          <p className="text-[7px] md:text-[10px] font-black uppercase tracking-[0.2em] opacity-70 mb-0.5">{title}</p>
          <p className="text-base md:text-2xl font-black tracking-tight truncate leading-tight">{performer?.name || 'N/A'}</p>
          <p className="text-[7px] md:text-[10px] font-bold opacity-60 uppercase tracking-widest truncate">{performer?.teamName || 'N/A'}</p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-xl md:text-4xl font-black leading-none">{isBatsman ? performer?.runs || 0 : performer?.wickets || 0}</p>
          <p className="text-[7px] md:text-[10px] font-black opacity-60 uppercase tracking-tighter">{isBatsman ? 'Runs' : 'Wkts'}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 md:space-y-10 pb-24 animate-in fade-in duration-500 px-2">
      <header className="flex flex-col md:flex-row justify-between items-center gap-4 px-1 pt-4">
        <div className="text-center md:text-left">
          <button onClick={onBack} className="text-emerald-600 font-black text-xs mb-1 flex items-center justify-center md:justify-start gap-2">
            <i className="fas fa-arrow-left"></i> Back to Pulse
          </button>
          <h2 className="text-2xl md:text-4xl font-black text-slate-800 dark:text-white tracking-tight">Tournament Summary</h2>
        </div>
        <button onClick={downloadReport} className="w-full md:w-auto bg-slate-900 dark:bg-slate-800 text-emerald-400 px-6 py-3 md:px-8 md:py-4 rounded-xl md:rounded-2xl font-black text-[10px] md:text-sm uppercase tracking-widest shadow-xl flex items-center justify-center gap-2 active:scale-95 transition-all">
          {isExporting ? <i className="fas fa-circle-notch fa-spin"></i> : <i className="fas fa-download"></i>}
          Export Image
        </button>
      </header>

      {/* Report Canvas Container */}
      <div ref={reportRef} className="bg-slate-900 text-white p-5 md:p-16 rounded-[2rem] md:rounded-[4rem] shadow-2xl relative overflow-hidden flex flex-col gap-6 md:gap-12 w-full max-w-4xl mx-auto border-4 md:border-[12px] border-slate-800">
        <div className="absolute top-0 right-0 w-32 md:w-96 h-32 md:h-96 bg-emerald-500/10 rounded-full -mr-16 md:-mr-48 -mt-16 md:-mt-48 blur-[40px] md:blur-[100px] pointer-events-none"></div>

        <div className="text-center space-y-1 md:space-y-2 relative z-10">
          <div className="bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 px-3 py-1 md:px-6 md:py-2 rounded-full inline-block font-black text-[7px] md:text-[10px] uppercase tracking-[0.2em] md:tracking-[0.4em] mb-2 md:mb-4">Tournament Pulse Recap</div>
          <h1 className="text-2xl md:text-7xl font-black tracking-tighter uppercase mb-1 leading-tight">{tournament.name}</h1>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-[7px] md:text-sm">Final Board & Records</p>
        </div>

        {/* Performers - Stacks on mobile */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 relative z-10">
          <PerformerCard 
            title="Best Batsman" 
            performer={stats.bestBatsman} 
            colorClass="bg-gradient-to-br from-emerald-500 to-teal-600 border-emerald-400/30"
            icon="fa-baseball-bat-ball"
          />
          <PerformerCard 
            title="Best Bowler" 
            performer={stats.bestBowler} 
            colorClass="bg-gradient-to-br from-blue-600 to-indigo-700 border-blue-400/30"
            icon="fa-baseball-ball"
          />
        </div>

        {/* Leaderboard Table - Responsive */}
        <div className="bg-white/[0.03] backdrop-blur-xl rounded-[1.5rem] md:rounded-[3rem] p-4 md:p-12 border border-white/10 relative z-10">
          <h3 className="text-xs md:text-2xl font-black mb-4 md:mb-10 uppercase tracking-widest text-center flex items-center justify-center gap-3">
            <span className="h-px w-4 md:w-12 bg-white/20"></span>
            League Standings
            <span className="h-px w-4 md:w-12 bg-white/20"></span>
          </h3>
          <div className="overflow-x-auto scrollbar-hide">
            <table className="w-full min-w-[280px]">
              <thead>
                <tr className="text-[8px] md:text-[11px] font-black text-slate-500 uppercase tracking-widest border-b border-white/5">
                  <th className="pb-3 text-left">Squad</th>
                  <th className="pb-3 text-center">W</th>
                  <th className="pb-3 text-right">Pts</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {teamsSorted.slice(0, 5).map((t, i) => {
                  const wins = tournament.matches.filter(m => m.winnerId === t.id).length;
                  const isTop = i === 0;
                  return (
                    <tr key={t.id} className={`${isTop ? 'bg-emerald-500/10' : ''} transition-all`}>
                      <td className="py-4 md:py-7 font-black text-sm md:text-2xl flex items-center gap-3 md:gap-6">
                        <span className={`w-6 h-6 md:w-10 md:h-10 rounded-lg flex items-center justify-center text-[10px] md:text-sm font-black flex-shrink-0 ${isTop ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-900/40' : 'bg-slate-800 text-slate-400'}`}>
                          {i + 1}
                        </span>
                        <div className="flex items-center gap-2 truncate">
                          <span className={`${isTop ? 'text-emerald-400' : 'text-slate-100'} truncate max-w-[120px] md:max-w-none`}>{t.name}</span>
                          {isTop && <i className="fas fa-crown text-amber-500 text-[10px] md:text-base"></i>}
                        </div>
                      </td>
                      <td className="py-4 md:py-7 text-center text-slate-400 font-black text-xs md:text-lg">{wins}</td>
                      <td className="py-4 md:py-7 text-right">
                        <span className={`text-lg md:text-4xl font-black ${isTop ? 'text-emerald-400' : 'text-slate-300'}`}>
                           {wins * 2}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <footer className="text-center pt-4 md:pt-8 border-t border-white/5 relative z-10 flex flex-col items-center gap-1 md:gap-3">
          <div className="flex items-center gap-2 opacity-80">
            <div className="w-5 h-5 bg-emerald-600 rounded flex items-center justify-center text-white text-[8px]">
              <i className="fas fa-baseball-bat-ball"></i>
            </div>
            <span className="font-black tracking-tighter text-base md:text-2xl text-white">GullyScore</span>
          </div>
          <p className="text-[6px] md:text-[9px] font-black text-slate-500 uppercase tracking-[0.3em]">Professional League Manager</p>
        </footer>
      </div>
    </div>
  );
};

export default TournamentReport;
