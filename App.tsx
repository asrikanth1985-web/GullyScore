
import React, { useState, useEffect } from 'react';
import { Team, Match, ViewType, Tournament } from './types';
import Dashboard from './components/Dashboard';
import TeamManager from './components/TeamManager';
import MatchSetup from './components/MatchSetup';
import Scorer from './components/Scorer';
import MatchHistory from './components/MatchHistory';
import StatsView from './components/StatsView';
import TournamentManager from './components/TournamentManager';
import TournamentReport from './components/TournamentReport';
import ReadOnlyScoreboard from './components/ReadOnlyScoreboard';

const STORAGE_KEYS = {
  TOURNAMENTS: 'crictrack_tournaments_v4',
  ACTIVE_ID: 'crictrack_active_tournament_id',
  THEME: 'crictrack_theme',
  VIEW: 'crictrack_current_view',
  MATCH_ID: 'crictrack_selected_match_id'
};

const App: React.FC = () => {
  const [view, setView] = useState<ViewType>('Tournaments');
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [activeTournamentId, setActiveTournamentId] = useState<string | null>(null);
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [sharedMatchData, setSharedMatchData] = useState<{ match: Match, team1: Team, team2: Team } | null>(null);

  const handleSharedLink = () => {
    const hash = window.location.hash;
    if (hash.startsWith('#share=')) {
      try {
        const encoded = hash.substring(7);
        const json = decodeURIComponent(Array.prototype.map.call(atob(encoded), (c: string) => {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        
        const data = JSON.parse(json);
        if (data.match && data.team1 && data.team2) {
          setSharedMatchData(data);
          setView('SharedScoreboard');
        }
      } catch (e) {
        console.error("Failed to decode shared match:", e);
      }
    }
  };

  useEffect(() => {
    handleSharedLink();
    window.addEventListener('hashchange', handleSharedLink);

    const savedTournaments = localStorage.getItem(STORAGE_KEYS.TOURNAMENTS);
    const savedActiveId = localStorage.getItem(STORAGE_KEYS.ACTIVE_ID);
    const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME);
    const savedView = localStorage.getItem(STORAGE_KEYS.VIEW) as ViewType;
    const savedMatchId = localStorage.getItem(STORAGE_KEYS.MATCH_ID);
    
    if (savedTheme === 'dark') setIsDarkMode(true);
    
    if (savedTournaments) {
      try {
        const parsed = JSON.parse(savedTournaments);
        if (Array.isArray(parsed)) {
          setTournaments(parsed);
          if (savedActiveId && parsed.find((t: Tournament) => t.id === savedActiveId)) {
            setActiveTournamentId(savedActiveId);
            if (!window.location.hash.startsWith('#share=')) {
              if (savedView && savedView !== 'SharedScoreboard') setView(savedView);
              if (savedMatchId) setSelectedMatchId(savedMatchId);
            }
          }
        }
      } catch (e) { console.error(e); }
    }

    return () => window.removeEventListener('hashchange', handleSharedLink);
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TOURNAMENTS, JSON.stringify(tournaments));
  }, [tournaments]);

  useEffect(() => {
    if (activeTournamentId) localStorage.setItem(STORAGE_KEYS.ACTIVE_ID, activeTournamentId);
    localStorage.setItem(STORAGE_KEYS.VIEW, view);
    if (selectedMatchId) localStorage.setItem(STORAGE_KEYS.MATCH_ID, selectedMatchId);
    else localStorage.removeItem(STORAGE_KEYS.MATCH_ID);
  }, [activeTournamentId, view, selectedMatchId]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.THEME, isDarkMode ? 'dark' : 'light');
    if (isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDarkMode]);

  const activeTournament = tournaments.find(t => t.id === activeTournamentId);
  const teams = activeTournament?.teams || [];
  const matches = activeTournament?.matches || [];

  const updateActiveTournament = (updates: Partial<Tournament>) => {
    if (!activeTournamentId) return;
    setTournaments(prev => prev.map(t => t.id === activeTournamentId ? { ...t, ...updates, lastUpdated: Date.now() } : t));
  };

  const handleExportTournament = () => {
    if (!activeTournament) return;
    const blob = new Blob([JSON.stringify(activeTournament, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${activeTournament.name.replace(/\s+/g, '_')}_backup.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportTournament = (imported: Tournament) => {
    setTournaments(prev => {
      const exists = prev.some(t => t.id === imported.id);
      if (exists) return prev.map(t => t.id === imported.id ? imported : t);
      return [...prev, imported];
    });
    setActiveTournamentId(imported.id);
    setView('Dashboard');
  };

  const activeMatch = matches.find(m => m.id === selectedMatchId);

  return (
    <div className={`min-h-[100dvh] flex flex-col md:flex-row ${isDarkMode ? 'dark' : ''} bg-slate-50 dark:bg-slate-950`}>
      {/* Sidebar for Desktop / Bottom Nav for Mobile */}
      <nav className="fixed bottom-0 left-0 right-0 md:relative md:w-64 bg-slate-900 text-white flex-shrink-0 flex flex-row md:flex-col border-t md:border-t-0 md:border-r border-white/5 z-50 md:z-20">
        <div className="hidden md:block p-10">
          <h1 className="text-3xl font-black tracking-tighter flex items-center gap-3 text-white">
            <span className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white text-lg">
              <i className="fas fa-baseball-bat-ball"></i>
            </span>
            GullyScore
          </h1>
          {activeTournament && (
            <div className="mt-4 bg-white/5 p-3 rounded-2xl border border-white/5">
              <p className="text-[9px] font-black uppercase text-slate-500 tracking-widest mb-1">League Active</p>
              <p className="text-xs font-black text-emerald-400 truncate">{activeTournament.name}</p>
            </div>
          )}
        </div>
        
        <ul className="flex-1 flex flex-row md:flex-col items-center justify-around md:justify-start overflow-x-auto md:overflow-y-auto px-2 md:px-4 py-2 md:pb-4 space-x-1 md:space-x-0 md:space-y-1">
          {[
            { id: 'Tournaments', icon: 'fa-trophy', label: 'Leagues' },
            { id: 'Dashboard', icon: 'fa-chart-pie', label: 'Home' },
            { id: 'Teams', icon: 'fa-users-gear', label: 'Squads' },
            { id: 'NewMatch', icon: 'fa-circle-plus', label: 'New' },
            { id: 'MatchHistory', icon: 'fa-scroll', label: 'History' }
          ].map((item) => (
            <li key={item.id} className="flex-1 md:w-full">
              <button
                disabled={!activeTournamentId && item.id !== 'Tournaments'}
                onClick={() => { 
                  setView(item.id as ViewType); 
                  setSelectedMatchId(null);
                  window.location.hash = ''; 
                }}
                className={`w-full text-center md:text-left px-2 md:px-6 py-2 md:py-3 rounded-xl md:rounded-2xl flex flex-col md:flex-row items-center gap-1 md:gap-4 transition-all ${
                  view === item.id ? 'bg-emerald-600 text-white shadow-lg md:shadow-xl' : 'hover:bg-white/5 text-slate-400 font-bold'
                } ${(!activeTournamentId && item.id !== 'Tournaments') ? 'opacity-20 cursor-not-allowed' : ''}`}
              >
                <i className={`fas ${item.icon} text-lg md:text-base md:w-5`}></i>
                <span className="text-[10px] md:text-sm">{item.label}</span>
              </button>
            </li>
          ))}
        </ul>

        <div className="hidden md:block p-4 border-t border-white/5 mt-auto">
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="w-full bg-white/5 hover:bg-white/10 text-slate-400 py-3 rounded-xl flex items-center justify-center gap-3 font-bold transition-all text-xs"
          >
            <i className={`fas ${isDarkMode ? 'fa-sun text-amber-400' : 'fa-moon text-indigo-400'}`}></i>
            {isDarkMode ? 'Light' : 'Dark'}
          </button>
        </div>
      </nav>

      <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950 p-4 md:p-12 transition-colors duration-300 pb-24 md:pb-12">
        <div className="max-w-6xl mx-auto">
          {/* Mobile Header */}
          <div className="md:hidden flex justify-between items-center mb-6 px-1">
             <h1 className="text-xl font-black tracking-tighter flex items-center gap-2 text-slate-900 dark:text-white">
                <span className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white text-xs">
                  <i className="fas fa-baseball-bat-ball"></i>
                </span>
                GullyScore
             </h1>
             <button onClick={() => setIsDarkMode(!isDarkMode)} className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400">
               <i className={`fas ${isDarkMode ? 'fa-sun' : 'fa-moon'}`}></i>
             </button>
          </div>

          {view === 'SharedScoreboard' && sharedMatchData ? (
            <ReadOnlyScoreboard 
              match={sharedMatchData.match} 
              team1={sharedMatchData.team1} 
              team2={sharedMatchData.team2} 
              onClose={() => { setView(activeTournamentId ? 'Dashboard' : 'Tournaments'); window.location.hash = ''; }} 
            />
          ) : !activeTournamentId && view !== 'Tournaments' ? (
            <TournamentManager 
              tournaments={tournaments} 
              onSelectTournament={(id) => { setActiveTournamentId(id); setView('Dashboard'); }} 
              onCreateTournament={(n) => { const nt = { id: crypto.randomUUID(), name: n, teams: [], matches: [], createdAt: Date.now(), lastUpdated: Date.now() }; setTournaments([...tournaments, nt]); setActiveTournamentId(nt.id); setView('Dashboard'); }} 
              onDeleteTournament={(id) => setTournaments(tournaments.filter(t => t.id !== id))} 
              onImportTournament={handleImportTournament}
            />
          ) : (
            <>
              {view === 'Dashboard' && (
                <Dashboard 
                  tournamentName={activeTournament?.name || ''}
                  teams={teams} 
                  matches={matches} 
                  onNewMatch={() => setView('NewMatch')} 
                  onRegisterSquads={() => setView('Teams')}
                  onViewStats={(id) => { setSelectedMatchId(id); setView('MatchStats'); }} 
                  onContinueMatch={(id) => { setSelectedMatchId(id); setView('LiveMatch'); }}
                  onViewTournamentReport={() => setView('TournamentReport')}
                  onExportData={handleExportTournament}
                />
              )}
              {view === 'TournamentReport' && activeTournament && <TournamentReport tournament={activeTournament} onBack={() => setView('Dashboard')} />}
              {view === 'Tournaments' && (
                <TournamentManager 
                  tournaments={tournaments} 
                  onSelectTournament={(id) => { setActiveTournamentId(id); setView('Dashboard'); }} 
                  onCreateTournament={(n) => { const nt = { id: crypto.randomUUID(), name: n, teams: [], matches: [], createdAt: Date.now(), lastUpdated: Date.now() }; setTournaments([...tournaments, nt]); setActiveTournamentId(nt.id); setView('Dashboard'); }} 
                  onDeleteTournament={(id) => setTournaments(tournaments.filter(t => t.id !== id))} 
                  onImportTournament={handleImportTournament}
                />
              )}
              {view === 'Teams' && <TeamManager tournamentName={activeTournament?.name || ''} teams={teams} onCreateTeam={(t) => updateActiveTournament({ teams: [...teams, t] })} onUpdateTeam={(ut) => updateActiveTournament({ teams: teams.map(t => t.id === ut.id ? ut : t) })} onDeleteTeam={(id) => updateActiveTournament({ teams: teams.filter(t => t.id !== id) })} />}
              {view === 'NewMatch' && <MatchSetup tournamentName={activeTournament?.name || ''} teams={teams} onStartMatch={(m) => { updateActiveTournament({ matches: [...matches, m] }); setSelectedMatchId(m.id); setView('LiveMatch'); }} />}
              {view === 'LiveMatch' && activeMatch && (
                <Scorer 
                  match={activeMatch} 
                  teams={teams} 
                  onUpdateMatch={(um) => updateActiveTournament({ matches: matches.map(m => m.id === um.id ? um : m) })} 
                  onComplete={() => setView('MatchStats')} 
                  onPause={() => setView('Dashboard')}
                />
              )}
              {view === 'MatchHistory' && <MatchHistory matches={matches} teams={teams} onViewStats={(id) => { 
                const match = matches.find(m => m.id === id);
                setSelectedMatchId(id); 
                setView(match?.status === 'Live' ? 'LiveMatch' : 'MatchStats'); 
              }} />}
              {view === 'MatchStats' && activeMatch && <StatsView match={activeMatch} teams={teams} onBack={() => setView('MatchHistory')} />}
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
