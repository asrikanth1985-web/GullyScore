
import React, { useState, useEffect } from 'react';
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
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallGuide, setShowInstallGuide] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isGitHubRepo, setIsGitHubRepo] = useState(false);

  useEffect(() => {
    // Check if viewing code vs viewing app
    if (window.location.hostname.includes('github.com') && !window.location.hostname.includes('github.io')) {
      setIsGitHubRepo(true);
    }

    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      setIsStandalone(true);
    }

    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (isGitHubRepo) {
      alert("You are viewing the CODE on GitHub. To install the APP, you must first enable GitHub Pages in Settings and visit the live link.");
      setShowInstallGuide(true);
      return;
    }
    if (!deferredPrompt) {
      setShowInstallGuide(true);
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setDeferredPrompt(null);
  };

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
      {/* Installation Banner */}
      {!isStandalone && (
        <div className={`p-4 md:p-6 rounded-[1.5rem] md:rounded-[2rem] flex items-center justify-between shadow-2xl relative overflow-hidden text-white ${isGitHubRepo ? 'bg-orange-600' : 'bg-emerald-600'}`}>
          <div className="absolute top-0 right-0 p-4 opacity-10 rotate-12">
            <i className={`fas ${isGitHubRepo ? 'fa-triangle-exclamation' : 'fa-mobile-screen-button'} text-6xl`}></i>
          </div>
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-white/20 rounded-full flex items-center justify-center">
              <i className={`fas ${isGitHubRepo ? 'fa-globe' : 'fa-download'} text-lg`}></i>
            </div>
            <div>
              <p className="font-black text-xs md:text-sm uppercase tracking-widest leading-none mb-1">
                {isGitHubRepo ? 'Deployment Required' : 'Use as Mobile App'}
              </p>
              <p className="text-[10px] md:text-xs opacity-80 font-medium">
                {isGitHubRepo ? 'You are viewing code. Enable GitHub Pages to install.' : 'Install to home screen for faster access.'}
              </p>
            </div>
          </div>
          <button 
            onClick={handleInstallClick} 
            className="bg-white text-slate-900 px-5 py-2 md:px-8 md:py-3 rounded-xl font-black text-[10px] md:text-xs uppercase tracking-widest shadow-lg hover:bg-emerald-50 transition-colors relative z-10 whitespace-nowrap"
          >
            {isGitHubRepo ? 'Learn How' : (deferredPrompt ? 'Install App' : 'Guide')}
          </button>
        </div>
      )}

      {/* Manual Install Guide Modal */}
      {showInstallGuide && (
        <div className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[2.5rem] md:rounded-[3.5rem] p-8 md:p-12 shadow-2xl border border-white/10 relative overflow-y-auto max-h-[90vh]">
            <button onClick={() => setShowInstallGuide(false)} className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400">
              <i className="fas fa-times"></i>
            </button>
            
            <div className="text-center mb-8">
              <div className={`w-20 h-20 ${isGitHubRepo ? 'bg-orange-600' : 'bg-emerald-600'} text-white rounded-[1.5rem] flex items-center justify-center text-3xl mx-auto mb-6 shadow-xl`}>
                <i className={`fas ${isGitHubRepo ? 'fa-rocket' : 'fa-mobile-screen'}`}></i>
              </div>
              <h3 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight mb-2">
                {isGitHubRepo ? 'Almost There!' : 'Install GullyScore'}
              </h3>
              <p className="text-slate-500 dark:text-slate-400 font-medium">
                {isGitHubRepo ? 'Enable hosting to run the app on your phone' : 'Follow these steps to add it to your phone'}
              </p>
            </div>

            <div className="space-y-6">
              {isGitHubRepo ? (
                <>
                  <div className="p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-800 rounded-2xl">
                    <p className="text-xs text-orange-800 dark:text-orange-400 font-bold leading-relaxed">
                      You are currently looking at the <strong>GitHub Files</strong>. Browsers only show the "Install" option on <strong>Live Websites</strong>.
                    </p>
                  </div>
                  <div className="flex gap-6">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center font-black text-emerald-500 shadow-sm shrink-0">1</div>
                    <div>
                      <h4 className="font-black text-slate-800 dark:text-white uppercase text-xs tracking-widest mb-1">GitHub Settings</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Go to your Repository <strong>Settings</strong> > <strong>Pages</strong>.</p>
                    </div>
                  </div>
                  <div className="flex gap-6">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center font-black text-emerald-500 shadow-sm shrink-0">2</div>
                    <div>
                      <h4 className="font-black text-slate-800 dark:text-white uppercase text-xs tracking-widest mb-1">Enable Pages</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Select <strong>"Deploy from a branch"</strong> and pick <strong>"main"</strong>. Save.</p>
                    </div>
                  </div>
                  <div className="flex gap-6">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center font-black text-emerald-500 shadow-sm shrink-0">3</div>
                    <div>
                      <h4 className="font-black text-slate-800 dark:text-white uppercase text-xs tracking-widest mb-1">Visit App</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Open the <strong>.github.io</strong> link provided. <strong>Install from there!</strong></p>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex gap-6">
                    <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center font-black text-emerald-500 shadow-sm shrink-0">1</div>
                    <div>
                      <h4 className="font-black text-slate-800 dark:text-white uppercase text-xs tracking-widest mb-1">Android / Chrome</h4>
                      <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Tap <i className="fas fa-ellipsis-v mx-1"></i> (Top Right) and select <span className="font-bold text-emerald-600">"Install App"</span>.</p>
                    </div>
                  </div>
                  <div className="flex gap-6">
                    <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center font-black text-emerald-500 shadow-sm shrink-0">2</div>
                    <div>
                      <h4 className="font-black text-slate-800 dark:text-white uppercase text-xs tracking-widest mb-1">iPhone / Safari</h4>
                      <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Tap <i className="fas fa-share-square mx-1"></i> (Bottom) and select <span className="font-bold text-emerald-600">"Add to Home Screen"</span>.</p>
                    </div>
                  </div>
                </>
              )}
            </div>

            <button 
              onClick={() => setShowInstallGuide(false)}
              className="w-full mt-10 bg-slate-900 dark:bg-emerald-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-sm hover:opacity-90 transition-all shadow-xl"
            >
              Understand
            </button>
          </div>
        </div>
      )}

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
