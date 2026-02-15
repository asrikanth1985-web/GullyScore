
import React, { useState } from 'react';
import { Team, Match } from '../types';

interface MatchSetupProps {
  teams: Team[];
  onStartMatch: (match: Match) => void;
  tournamentName: string;
}

const MatchSetup: React.FC<MatchSetupProps> = ({ teams, onStartMatch, tournamentName }) => {
  const [team1Id, setTeam1Id] = useState('');
  const [team2Id, setTeam2Id] = useState('');
  const [overs, setOvers] = useState(5);
  const [tossWinner, setTossWinner] = useState('');
  const [tossChoice, setTossChoice] = useState<'Bat' | 'Bowl'>('Bat');

  const team1 = teams.find(t => t.id === team1Id);
  const team2 = teams.find(t => t.id === team2Id);
  const tossWinnerTeam = teams.find(t => t.id === tossWinner);

  const startMatch = () => {
    if (!team1Id || !team2Id || team1Id === team2Id || !tossWinner || overs <= 0) {
      alert("Please configure teams, toss, and overs correctly.");
      return;
    }

    const newMatch: Match = {
      id: crypto.randomUUID(),
      team1Id,
      team2Id,
      totalOvers: overs,
      tossWinnerId: tossWinner,
      tossChoice,
      innings: [
        {
          battingTeamId: tossChoice === 'Bat' ? tossWinner : (tossWinner === team1Id ? team2Id : team1Id),
          bowlingTeamId: tossChoice === 'Bowl' ? tossWinner : (tossWinner === team1Id ? team2Id : team1Id),
          deliveries: [],
          isCompleted: false
        }
      ],
      status: 'Live',
      createdAt: Date.now()
    };

    onStartMatch(newMatch);
  };

  const TeamLogo = ({ team, size = "w-10 h-10" }: { team?: Team, size?: string }) => (
    <div className={`${size} rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 font-black overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm`}>
      {team?.logo ? (
        <img src={team.logo} alt={team.name} className="w-full h-full object-cover" />
      ) : (
        <span className="text-xs uppercase font-black">{team?.name?.substring(0, 2) || '?'}</span>
      )}
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24 px-2">
      <header className="text-center space-y-2 md:space-y-3 px-4 pt-4">
        <div className="inline-block px-3 py-1 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 rounded-full font-black text-[9px] md:text-[10px] uppercase tracking-[0.2em]">
          League: {tournamentName}
        </div>
        <h2 className="text-3xl md:text-5xl font-black text-slate-800 dark:text-white tracking-tighter">New Match</h2>
        <p className="text-xs md:text-base text-slate-500 dark:text-slate-400 font-medium">Set the stage for the clash</p>
      </header>

      <div className="bg-white dark:bg-slate-900 p-5 md:p-10 rounded-[2rem] md:rounded-[3rem] shadow-xl border border-slate-100 dark:border-slate-800 space-y-6 md:space-y-10">
        <div className="space-y-4">
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Battle of Squads</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <div className="relative">
              <select
                value={team1Id}
                onChange={(e) => { setTeam1Id(e.target.value); setTossWinner(''); }}
                className={`w-full pl-12 pr-4 py-4 rounded-2xl border-2 outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all appearance-none font-black text-sm text-slate-700 dark:text-white dark:bg-slate-800 ${team1Id ? 'border-emerald-500' : 'border-slate-100 dark:border-slate-700'}`}
              >
                <option value="">Select Team A</option>
                {teams.map(t => <option key={t.id} value={t.id} disabled={t.id === team2Id}>{t.name}</option>)}
              </select>
              <div className="absolute left-3 top-1/2 -translate-y-1/2">
                <TeamLogo team={team1} size="w-7 h-7" />
              </div>
            </div>

            <div className="relative">
              <select
                value={team2Id}
                onChange={(e) => { setTeam2Id(e.target.value); setTossWinner(''); }}
                className={`w-full pl-12 pr-4 py-4 rounded-2xl border-2 outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all appearance-none font-black text-sm text-slate-700 dark:text-white dark:bg-slate-800 ${team2Id ? 'border-emerald-500' : 'border-slate-100 dark:border-slate-700'}`}
              >
                <option value="">Select Team B</option>
                {teams.map(t => <option key={t.id} value={t.id} disabled={t.id === team1Id}>{t.name}</option>)}
              </select>
              <div className="absolute left-3 top-1/2 -translate-y-1/2">
                <TeamLogo team={team2} size="w-7 h-7" />
              </div>
            </div>
          </div>
        </div>

        {/* Improved Overs Stepper UI */}
        <div className="space-y-4 pt-2">
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Match Format</label>
          <div className="flex items-center justify-center gap-6">
            <button 
              type="button"
              onClick={() => setOvers(prev => Math.max(1, prev - 1))}
              className="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-400 text-xl font-black border border-slate-100 dark:border-slate-700 flex items-center justify-center active:scale-90 transition-all"
            >
              <i className="fas fa-minus text-sm"></i>
            </button>
            <div className="text-center min-w-[80px]">
              <span className="block text-4xl md:text-6xl font-black text-slate-800 dark:text-white tracking-tighter">{overs}</span>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Overs</span>
            </div>
            <button 
              type="button"
              onClick={() => setOvers(prev => prev + 1)}
              className="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-xl font-black border border-emerald-200 dark:border-emerald-800 flex items-center justify-center active:scale-90 transition-all"
            >
              <i className="fas fa-plus text-sm"></i>
            </button>
          </div>
          <div className="flex flex-wrap justify-center gap-2 mt-4">
             {[2, 5, 8, 10, 20].map(val => (
               <button 
                 key={val} 
                 type="button"
                 onClick={() => setOvers(val)}
                 className={`px-4 py-2 rounded-xl font-black text-[10px] uppercase transition-all border ${overs === val ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-400 border-slate-100 dark:border-slate-700'}`}
               >
                 {val} Ov
               </button>
             ))}
          </div>
        </div>

        {team1Id && team2Id && team1Id !== team2Id && (
          <div className="pt-6 border-t border-slate-50 dark:border-slate-800 space-y-6 md:space-y-10 animate-in slide-in-from-top-4 duration-300">
            <div>
              <h4 className="text-xl font-black text-slate-800 dark:text-white mb-6 text-center flex items-center justify-center gap-3">
                <i className="fas fa-coins text-yellow-500"></i> Toss & Decision
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
                <div className="space-y-3">
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest text-center md:text-left">Toss Winner</label>
                  {[team1, team2].map((t) => (
                    <button
                      key={t?.id}
                      onClick={() => setTossWinner(t?.id || '')}
                      className={`w-full p-4 rounded-2xl flex items-center gap-4 border-2 transition-all ${
                        tossWinner === t?.id 
                          ? 'bg-emerald-50 dark:bg-emerald-950 border-emerald-500' 
                          : 'bg-slate-50 dark:bg-slate-800 border-transparent'
                      }`}
                    >
                      <TeamLogo team={t} size="w-8 h-8" />
                      <span className={`font-black text-sm md:text-lg truncate ${tossWinner === t?.id ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-400'}`}>
                        {t?.name}
                      </span>
                    </button>
                  ))}
                </div>

                <div className="space-y-3">
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest text-center md:text-left">Chose To</label>
                  <div className="grid grid-cols-2 gap-3 h-[112px]">
                    <button
                      onClick={() => setTossChoice('Bat')}
                      className={`rounded-2xl flex flex-col items-center justify-center gap-2 font-black text-lg border-2 transition-all ${
                        tossChoice === 'Bat' 
                          ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-900/20' 
                          : 'bg-slate-50 dark:bg-slate-800 border-transparent text-slate-400'
                      }`}
                    >
                      <i className="fas fa-baseball-bat-ball text-xl"></i>
                      BAT
                    </button>
                    <button
                      onClick={() => setTossChoice('Bowl')}
                      className={`rounded-2xl flex flex-col items-center justify-center gap-2 font-black text-lg border-2 transition-all ${
                        tossChoice === 'Bowl' 
                          ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-900/20' 
                          : 'bg-slate-50 dark:bg-slate-800 border-transparent text-slate-400'
                      }`}
                    >
                      <i className="fas fa-baseball-ball text-xl"></i>
                      BOWL
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {tossWinnerTeam && (
              <div className="bg-slate-900 dark:bg-slate-950 rounded-2xl p-4 md:p-6 flex items-center gap-4 md:gap-6 border-b-4 border-emerald-500 shadow-xl">
                <TeamLogo team={tossWinnerTeam} size="w-12 h-12 md:w-16 md:h-16" />
                <div className="flex-1 min-w-0">
                  <p className="text-emerald-400 text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] mb-1">Match Ready</p>
                  <p className="text-white text-xs md:text-lg font-bold leading-tight">
                    <span className="text-emerald-400 font-black">{tossWinnerTeam.name}</span> will <span className="text-emerald-400 font-black">{tossChoice.toUpperCase()}</span> first.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="pt-4">
          <button
            disabled={!team1Id || !team2Id || team1Id === team2Id || !tossWinner}
            onClick={startMatch}
            className="w-full bg-emerald-600 text-white py-5 rounded-[1.5rem] md:rounded-[2.5rem] font-black text-lg md:text-2xl hover:bg-emerald-700 disabled:opacity-50 transition-all shadow-xl active:scale-95"
          >
            Start Match
          </button>
        </div>
      </div>
    </div>
  );
};

export default MatchSetup;
