
import React, { useState, useEffect, useRef } from 'react';
import { Match, Team, Delivery, ExtraType, WicketType, Player, MatchLiveState } from '../types';
import { calculateInningsTotal, calculateInningsWickets, calculateLegalBalls, formatOvers, getPlayerStats } from '../utils/cricket';

interface ScorerProps {
  match: Match;
  teams: Team[];
  onUpdateMatch: (m: Match) => void;
  onComplete: () => void;
  onPause: () => void;
}

const Scorer: React.FC<ScorerProps> = ({ match, teams, onUpdateMatch, onComplete, onPause }) => {
  const audioCtxRef = useRef<AudioContext | null>(null);

  const currentInningsIndex = Math.max(0, match.innings.length - 1);
  const currentInnings = match.innings[currentInningsIndex];
  
  const team1 = teams.find(t => t.id === match.team1Id)!;
  const team2 = teams.find(t => t.id === match.team2Id)!;
  const battingTeam = teams.find(t => t.id === currentInnings.battingTeamId)!;
  const bowlingTeam = teams.find(t => t.id === currentInnings.bowlingTeamId)!;

  const [strikerId, setStrikerId] = useState(match.liveState?.strikerId || '');
  const [batsman1Id, setBatsman1Id] = useState(match.liveState?.strikerId || '');
  const [batsman2Id, setBatsman2Id] = useState(match.liveState?.nonStrikerId || '');
  const [currentBowlerId, setCurrentBowlerId] = useState(match.liveState?.currentBowlerId || '');
  
  const [showBowlerModal, setShowBowlerModal] = useState(false);
  const [showWicketTypeModal, setShowWicketTypeModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isInningsTransition, setIsInningsTransition] = useState(false);
  const [lastInningsSummary, setLastInningsSummary] = useState<{runs: number, wkts: number} | null>(null);

  useEffect(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }, []);

  const playSound = (type: 'run' | 'wicket' | 'over' | 'boundary') => {
    if (!audioCtxRef.current) return;
    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') ctx.resume();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    const now = ctx.currentTime;
    if (type === 'run') {
      osc.type = 'sine'; osc.frequency.setValueAtTime(880, now);
      gain.gain.setValueAtTime(0.1, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
      osc.start(now); osc.stop(now + 0.1);
    } else if (type === 'wicket') {
      osc.type = 'square'; osc.frequency.setValueAtTime(440, now);
      gain.gain.setValueAtTime(0.1, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
      osc.start(now); osc.stop(now + 0.5);
    } else if (type === 'boundary') {
      osc.type = 'triangle'; osc.frequency.setValueAtTime(523.25, now);
      gain.gain.setValueAtTime(0.1, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
      osc.start(now); osc.stop(now + 0.4);
    } else if (type === 'over') {
      osc.type = 'sine'; osc.frequency.setValueAtTime(220, now);
      gain.gain.setValueAtTime(0.1, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
      osc.start(now); osc.stop(now + 0.2);
    }
  };

  const generateShareLink = () => {
    const payload = { match, team1, team2 };
    try {
      const json = JSON.stringify(payload);
      const encoded = btoa(encodeURIComponent(json).replace(/%([0-9A-F]{2})/g, (match, p1) => {
          return String.fromCharCode(parseInt(p1, 16));
      }));
      let origin = window.location.origin;
      if (origin.startsWith('blob:')) origin = origin.replace('blob:', '');
      let pathname = window.location.pathname;
      const parts = pathname.split('/');
      if (parts.some(p => p.length > 24)) pathname = '/';
      return `${origin}${pathname.endsWith('/') ? pathname : pathname + '/'}#share=${encoded}`;
    } catch (e) {
      console.error("Link generation failed:", e);
      return "";
    }
  };

  const handleCopyLinkOnly = () => {
    const link = generateShareLink();
    if (!link) return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(link).then(() => alert("Live Scoreboard link copied!")).catch(() => prompt("Copy link:", link));
    } else {
      prompt("Copy link:", link);
    }
  };

  const syncLiveState = (updates: Partial<MatchLiveState>) => {
    const newState: MatchLiveState = {
      strikerId: updates.strikerId ?? strikerId,
      nonStrikerId: updates.nonStrikerId ?? (strikerId === batsman1Id ? batsman2Id : batsman1Id),
      currentBowlerId: updates.currentBowlerId ?? currentBowlerId
    };
    onUpdateMatch({ ...match, liveState: newState });
  };

  const totalRuns = calculateInningsTotal(currentInnings.deliveries);
  const wickets = calculateInningsWickets(currentInnings.deliveries);
  const legalBalls = calculateLegalBalls(currentInnings.deliveries);
  const currentOverIndex = Math.floor(legalBalls / 6);
  const overDeliveries = currentInnings.deliveries.filter(d => d.over === currentOverIndex);
  
  const maxWickets = (battingTeam?.players?.length || 0) - 1;
  const remainingBalls = Math.max(0, (match.totalOvers * 6) - legalBalls);
  const outPlayerIds = currentInnings.deliveries.filter(d => d.isWicket).map(d => d.batsmanId);
  const bowlerStats = currentBowlerId ? getPlayerStats(currentBowlerId, currentInnings.deliveries) : null;

  const recordBall = (runs: number, extra: ExtraType = 'None', isWicket: boolean = false, wicketType: WicketType = 'None') => {
    // Safety: Close modal immediately if we are processing a wicket
    if (isWicket) setShowWicketTypeModal(false);

    if (!strikerId || !currentBowlerId || !batsman1Id || !batsman2Id) {
      if (!batsman1Id || !batsman2Id) alert("Please select both batsmen.");
      else if (!currentBowlerId) setShowBowlerModal(true);
      return;
    }

    if (isWicket) playSound('wicket');
    else if (runs >= 4) playSound('boundary');
    else playSound('run');

    const newDelivery: Delivery = {
      batsmanId: strikerId, bowlerId: currentBowlerId,
      runs, extraType: extra, extraRuns: (extra === 'Wide' || extra === 'No Ball' ? 1 : 0),
      isWicket, wicketType,
      over: Math.floor(legalBalls / 6),
      ball: (legalBalls % 6) + 1
    };

    const updatedDeliveries = [...currentInnings.deliveries, newDelivery];
    const newInnings = { ...currentInnings, deliveries: updatedDeliveries };
    const newTotal = calculateInningsTotal(updatedDeliveries);
    const newWickets = calculateInningsWickets(updatedDeliveries);
    const newLegal = calculateLegalBalls(updatedDeliveries);

    if (newLegal > 0 && newLegal % 6 === 0 && !isWicket && (extra === 'None' || extra === 'Bye' || extra === 'Leg Bye')) {
      playSound('over');
    }

    const updatedMatchInnings = match.innings.map((inn, idx) => idx === currentInningsIndex ? newInnings : inn);
    const isLastInnings = match.innings.length > 1;
    const maxBalls = match.totalOvers * 6;
    
    if (isLastInnings) {
      const target = currentInnings.target || 0;
      if (newTotal >= target || newWickets >= maxWickets || newLegal >= maxBalls) {
        let winnerId: string | undefined = undefined;
        if (newTotal >= target) winnerId = currentInnings.battingTeamId;
        else if (newTotal < target - 1) winnerId = currentInnings.bowlingTeamId;
        onUpdateMatch({ ...match, status: 'Completed', winnerId, innings: updatedMatchInnings, liveState: undefined });
        onComplete();
        return;
      }
    } else {
      if (newLegal >= maxBalls || newWickets >= maxWickets) {
        onUpdateMatch({ ...match, innings: updatedMatchInnings, liveState: undefined });
        setLastInningsSummary({ runs: newTotal, wkts: newWickets });
        setIsInningsTransition(true);
        return;
      }
    }

    let nextStrikerId = strikerId;
    let nextBatsman1Id = batsman1Id;
    let nextBatsman2Id = batsman2Id;

    if (isWicket) {
      if (strikerId === batsman1Id) nextBatsman1Id = ''; else nextBatsman2Id = '';
      nextStrikerId = '';
    } else {
      if ([1, 3, 5].includes(runs)) {
        nextStrikerId = strikerId === batsman1Id ? batsman2Id : batsman1Id;
      }
      if (newLegal > 0 && newLegal % 6 === 0 && (extra === 'None' || extra === 'Bye' || extra === 'Leg Bye')) {
        nextStrikerId = nextStrikerId === nextBatsman1Id ? nextBatsman2Id : nextBatsman1Id;
        setShowBowlerModal(true);
      }
    }

    setStrikerId(nextStrikerId); setBatsman1Id(nextBatsman1Id); setBatsman2Id(nextBatsman2Id);
    onUpdateMatch({ 
      ...match, 
      innings: updatedMatchInnings, 
      liveState: { 
        strikerId: nextStrikerId, 
        nonStrikerId: nextStrikerId === nextBatsman1Id ? nextBatsman2Id : nextBatsman1Id, 
        currentBowlerId 
      } 
    });
  };

  const handleUndo = () => {
    if (currentInnings.deliveries.length === 0) return;
    const updatedDeliveries = [...currentInnings.deliveries.slice(0, -1)];
    const newInnings = { ...currentInnings, deliveries: updatedDeliveries };
    onUpdateMatch({ ...match, innings: match.innings.map((inn, idx) => idx === currentInningsIndex ? newInnings : inn) });
  };

  const PlayerLogo = ({ player, size = "w-8 h-8 md:w-12 md:h-12" }: { player?: Player, size?: string }) => (
    <div className={`${size} rounded-full bg-white/20 dark:bg-slate-800 flex items-center justify-center text-white/50 dark:text-slate-500 font-bold overflow-hidden border-2 border-white/20 dark:border-slate-700`}>
      {player?.logo ? <img src={player.logo} alt={player.name} className="w-full h-full object-cover" /> : <span className="text-[8px] md:text-xs uppercase font-black">{player?.name?.substring(0,2) || '?'}</span>}
    </div>
  );

  if (isInningsTransition) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-6 bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-xl text-center space-y-6">
        <div className="w-20 h-20 bg-emerald-600 text-white rounded-full flex items-center justify-center text-3xl shadow-xl animate-bounce"><i className="fas fa-flag-checkered"></i></div>
        <h2 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">Innings Complete!</h2>
        <div className="bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-400 px-6 py-3 rounded-3xl font-black text-xl">Target: {lastInningsSummary!.runs + 1}</div>
        <button onClick={() => {
          setShowWicketTypeModal(false); // Double safety
          onUpdateMatch({ ...match, innings: [...match.innings, { battingTeamId: currentInnings.bowlingTeamId, bowlingTeamId: currentInnings.battingTeamId, deliveries: [], isCompleted: false, target: lastInningsSummary!.runs + 1 }], liveState: undefined });
          setIsInningsTransition(false); setBatsman1Id(''); setBatsman2Id(''); setStrikerId(''); setCurrentBowlerId('');
        }} className="bg-slate-900 dark:bg-emerald-600 text-white px-8 py-4 rounded-2xl font-black text-lg shadow-lg hover:scale-105 transition-transform">Start 2nd Innings</button>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6 pb-24 px-2">
      <header className="flex justify-between items-center px-1 pt-2">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 md:w-3 md:h-3 bg-emerald-500 rounded-full animate-pulse"></div>
          <h2 className="text-[10px] md:text-xl font-black text-slate-800 dark:text-white uppercase tracking-[0.05em] flex items-center gap-2">
            Live Match - <span className="text-emerald-500">{team1.name}</span> <span className="text-slate-400 text-[8px] md:text-xs">vs</span> <span className="text-emerald-500">{team2.name}</span>
          </h2>
        </div>
        <div className="flex gap-2">
          <button onClick={handleCopyLinkOnly} className="w-10 h-10 md:w-12 md:h-12 bg-emerald-600 text-white rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg active:scale-95 transition-all">
            <i className="fas fa-share-alt text-xs md:text-base"></i>
          </button>
          <button onClick={() => setShowSettings(!showSettings)} className="w-10 h-10 md:w-12 md:h-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl md:rounded-2xl flex items-center justify-center text-slate-400">
            <i className="fas fa-cog text-xs md:text-base"></i>
          </button>
        </div>
      </header>

      {/* Primary Score Display */}
      <div className="bg-slate-900 dark:bg-slate-950 text-white rounded-[2rem] md:rounded-[3rem] p-5 md:p-10 shadow-2xl relative overflow-hidden border-b-8 md:border-b-[12px] border-emerald-500">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 md:gap-6 relative z-10">
          <div className="text-center md:text-left">
            <span className="text-emerald-400 font-black text-[8px] md:text-[10px] uppercase tracking-widest">{battingTeam.name} BATTING</span>
            <div className="flex items-baseline justify-center md:justify-start gap-1 md:gap-4 mt-1">
              <span className="text-4xl md:text-8xl font-black tracking-tighter">{totalRuns}<span className="text-emerald-500 mx-0.5">/</span>{wickets}</span>
              <span className="text-sm md:text-2xl text-slate-400 font-bold ml-1">({formatOvers(legalBalls)})</span>
            </div>
          </div>
          <div className="flex flex-col items-center md:items-end gap-1 md:gap-2">
            <div className="flex gap-1.5">
              <div className="bg-white/10 px-2.5 py-1 rounded-full font-black text-[7px] md:text-[10px] uppercase">
                {remainingBalls} Balls Left
              </div>
              {currentInnings.target && (
                <div className="bg-emerald-600 px-2.5 py-1 rounded-full font-black text-[7px] md:text-[10px] uppercase">
                  Target {currentInnings.target}
                </div>
              )}
            </div>
            <div className="text-xl md:text-4xl font-black text-emerald-500 mt-1 tracking-tight">CRR: {(totalRuns / (legalBalls / 6 || 1)).toFixed(2)}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 dark:from-slate-900 dark:to-slate-950 p-4 md:p-8 rounded-[1.5rem] md:rounded-[3rem] shadow-xl border-t-2 border-emerald-500/30">
          <h4 className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">On the Crease</h4>
          <div className="space-y-3">
            {[ { id: batsman1Id, setId: setBatsman1Id }, { id: batsman2Id, setId: setBatsman2Id } ].map((b, i) => {
              const isStriker = b.id !== '' && b.id === strikerId;
              const p = battingTeam.players.find(pl => pl.id === b.id);
              const stats = b.id ? getPlayerStats(b.id, currentInnings.deliveries) : null;
              return (
                <div key={i} className={`p-3 rounded-2xl flex items-center gap-3 transition-all duration-300 ${isStriker ? 'bg-emerald-600/20 ring-2 ring-emerald-500 shadow-lg' : 'bg-white/5'}`}>
                  <PlayerLogo player={p} size="w-8 h-8 md:w-10 md:h-10" />
                  <div className="flex-1 min-w-0">
                    <select value={b.id} onChange={(e) => { const newId = e.target.value; b.setId(newId); if(!strikerId) setStrikerId(newId); syncLiveState({ strikerId: strikerId || newId }); }} className="bg-transparent text-white font-black text-xs md:text-base outline-none w-full appearance-none truncate">
                      <option value="" className="text-slate-900">Select Player</option>
                      {battingTeam.players.map(pl => <option key={pl.id} value={pl.id} disabled={outPlayerIds.includes(pl.id)} className="text-slate-900">{pl.name}</option>)}
                    </select>
                    {stats && <p className="text-[7px] md:text-[9px] text-emerald-400 font-black uppercase">SR: {stats.strikeRate}</p>}
                  </div>
                  {b.id && <div className="text-right flex-shrink-0"><p className="text-base md:text-xl font-black text-white">{stats?.runs}</p><p className="text-[7px] text-white/30 font-black">({stats?.balls})</p></div>}
                  <button onClick={() => { setStrikerId(b.id); syncLiveState({ strikerId: b.id }); }} className={`w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center transition-all ${isStriker ? 'bg-emerald-500 text-white shadow-md' : 'text-white/20'}`}><i className="fas fa-circle-dot text-[8px]"></i></button>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-gradient-to-br from-indigo-900 to-indigo-950 dark:from-slate-900 dark:to-slate-950 p-4 md:p-8 rounded-[1.5rem] md:rounded-[3rem] shadow-xl border-t-2 border-indigo-500/30">
          <h4 className="text-[8px] md:text-[10px] font-black text-indigo-300 uppercase tracking-[0.2em] mb-4">Attack</h4>
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3 p-3 bg-white/5 rounded-2xl border border-white/10">
              <PlayerLogo player={bowlingTeam.players.find(p => p.id === currentBowlerId)} size="w-8 h-8 md:w-10 md:h-10" />
              <div className="flex-1 min-w-0">
                <select value={currentBowlerId} onChange={(e) => { setCurrentBowlerId(e.target.value); syncLiveState({ currentBowlerId: e.target.value }); }} className="bg-transparent text-white font-black text-xs md:text-base outline-none w-full appearance-none truncate">
                  <option value="" disabled className="text-slate-900">Select Bowler</option>
                  {bowlingTeam.players.map(p => <option key={p.id} value={p.id} className="text-slate-900">{p.name}</option>)}
                </select>
              </div>
              <button onClick={() => setShowBowlerModal(true)} className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center text-white"><i className="fas fa-sync text-[10px]"></i></button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[ { l: 'Overs', v: bowlerStats?.overs || '0.0' }, { l: 'Wkts', v: bowlerStats?.wickets || '0' }, { l: 'Econ', v: bowlerStats?.economy || '0.0' } ].map((s, i) => (
                <div key={i} className="bg-white/5 p-2 rounded-xl text-center border border-white/5">
                  <p className="text-[7px] md:text-[8px] font-black text-indigo-300 uppercase mb-0.5 tracking-tighter truncate">{s.l}</p>
                  <p className="text-base md:text-xl font-black text-white">{s.v}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800">
        <div className="flex justify-between items-center mb-3">
          <h4 className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">Recent Balls</h4>
          <span className="text-[8px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-0.5 rounded-full font-black">Over #{(currentOverIndex + 1)}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {overDeliveries.map((d, i) => (
            <div key={i} className={`w-8 h-8 md:w-10 md:h-10 rounded-lg flex flex-col items-center justify-center font-black text-xs md:text-base shadow-sm border-b-2 transition-all ${ d.isWicket ? 'bg-red-600 border-red-800 text-white' : d.runs === 4 ? 'bg-emerald-600 border-emerald-800 text-white' : d.runs === 6 ? 'bg-indigo-600 border-indigo-800 text-white' : d.extraType !== 'None' ? 'bg-amber-100 dark:bg-amber-900 text-amber-700' : 'bg-slate-100 dark:bg-slate-800 text-slate-600' }`}>
              <span className="leading-none">{d.isWicket ? 'W' : d.extraType === 'Wide' ? 'wd' : d.extraType === 'No Ball' ? 'nb' : d.runs}</span>
            </div>
          ))}
          {Array.from({ length: Math.max(0, 6 - overDeliveries.filter(d => d.extraType === 'None' || d.extraType === 'Bye' || d.extraType === 'Leg Bye').length) }).map((_, i) => (
            <div key={`fill-${i}`} className="w-8 h-8 md:w-10 md:h-10 rounded-lg border-2 border-dashed border-slate-200 dark:border-slate-800"></div>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 p-4 md:p-8 rounded-[2rem] md:rounded-[3rem] shadow-xl border border-slate-100 dark:border-slate-800">
        <div className="grid grid-cols-4 gap-2 md:gap-4 mb-4 md:mb-8">
          {[0, 1, 2, 3, 4, 6].map(r => ( <button key={r} onClick={() => recordBall(r)} className={`py-4 md:py-6 rounded-xl md:rounded-3xl font-black text-xl md:text-4xl shadow-md active:scale-95 transition-all ${[4,6].includes(r) ? 'bg-emerald-600 text-white' : 'bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white border-b-2 md:border-b-4 border-slate-200 dark:border-slate-950'}`}>{r}</button> ))}
          <button onClick={() => recordBall(0, 'Wide')} className="py-4 md:py-6 rounded-xl md:rounded-3xl font-black text-xs md:text-2xl bg-amber-50 dark:bg-amber-950 text-amber-600 border-b-2 md:border-b-4 border-amber-200 uppercase">Wide</button>
          <button onClick={() => recordBall(0, 'No Ball')} className="py-4 md:py-6 rounded-xl md:rounded-3xl font-black text-xs md:text-2xl bg-amber-50 dark:bg-amber-950 text-amber-600 border-b-2 md:border-b-4 border-amber-200 uppercase">NoB</button>
        </div>
        <div className="flex flex-col md:flex-row gap-2 md:gap-4">
          <button 
            onClick={() => setShowWicketTypeModal(true)} 
            disabled={!strikerId}
            className={`flex-[2] py-5 md:py-8 rounded-2xl md:rounded-[2.5rem] text-white font-black text-xl md:text-4xl shadow-lg border-b-4 md:border-b-[10px] active:translate-y-1 transition-all uppercase tracking-widest ${strikerId ? 'bg-red-600 border-red-800' : 'bg-slate-300 border-slate-400 cursor-not-allowed'}`}
          >
            Out!
          </button>
          <div className="flex-1 flex gap-2 md:gap-4">
             <button onClick={handleUndo} className="flex-1 py-5 md:py-8 rounded-2xl md:rounded-[2.5rem] bg-slate-900 dark:bg-slate-800 text-white font-black text-xs md:text-2xl shadow-lg border-b-4 md:border-b-[10px] border-black transition-all uppercase">Undo</button>
             <button onClick={onPause} className="flex-1 py-5 md:py-8 rounded-2xl md:rounded-[2.5rem] bg-slate-400 dark:bg-slate-600 text-white font-black text-xs md:text-xl shadow-lg border-b-4 md:border-b-[10px] border-slate-500 transition-all uppercase">Pause</button>
          </div>
        </div>
      </div>

      {/* Wicket Modal */}
      {showWicketTypeModal && (
        <div className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[3rem] p-8 shadow-2xl border border-red-500/20 overflow-hidden relative">
            <div className="absolute top-0 right-0 p-8 text-red-500/5 rotate-12"><i className="fas fa-person-walking-arrow-right text-9xl"></i></div>
            <h3 className="text-3xl font-black text-slate-800 dark:text-white mb-2 tracking-tight">How was he out?</h3>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mb-8">Record dismissal for {battingTeam.players.find(p => p.id === strikerId)?.name}</p>
            
            <div className="grid grid-cols-2 gap-4 mb-8">
              {['Bowled', 'Caught', 'LBW', 'Run Out', 'Stumped', 'Hit Wicket'].map((type) => (
                <button
                  key={type}
                  onClick={() => recordBall(0, 'None', true, type as WicketType)}
                  className="bg-slate-50 dark:bg-slate-800 hover:bg-red-600 hover:text-white p-6 rounded-3xl font-black text-lg transition-all border-b-4 border-slate-200 dark:border-slate-950 active:translate-y-1"
                >
                  {type}
                </button>
              ))}
            </div>
            <button onClick={() => setShowWicketTypeModal(false)} className="w-full py-4 text-slate-400 font-black uppercase tracking-widest text-xs hover:text-slate-600 transition-colors">Cancel</button>
          </div>
        </div>
      )}

      {/* Bowler Selection Modal */}
      {showBowlerModal && (
        <div className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[3rem] p-8 shadow-2xl border border-emerald-500/20 overflow-hidden relative">
            <h3 className="text-3xl font-black text-slate-800 dark:text-white mb-2 tracking-tight">Change Bowler</h3>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mb-8">Select bowler for the next over</p>
            
            <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
              {bowlingTeam.players.map((p) => (
                <button
                  key={p.id}
                  onClick={() => { setCurrentBowlerId(p.id); setShowBowlerModal(false); syncLiveState({ currentBowlerId: p.id }); }}
                  className={`w-full p-4 rounded-2xl flex items-center gap-4 border-2 transition-all ${currentBowlerId === p.id ? 'bg-emerald-50 dark:bg-emerald-950 border-emerald-500' : 'bg-slate-50 dark:bg-slate-800 border-transparent hover:border-emerald-200'}`}
                >
                  <PlayerLogo player={p} size="w-10 h-10" />
                  <span className="font-black text-lg text-slate-700 dark:text-slate-200">{p.name}</span>
                  {currentBowlerId === p.id && <i className="fas fa-check-circle text-emerald-500 ml-auto"></i>}
                </button>
              ))}
            </div>
            <button onClick={() => setShowBowlerModal(false)} className="w-full mt-6 py-4 text-slate-400 font-black uppercase tracking-widest text-xs hover:text-slate-600 transition-colors">Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Scorer;
