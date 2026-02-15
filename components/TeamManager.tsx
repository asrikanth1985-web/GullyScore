
import React, { useState } from 'react';
import { Team, Player } from '../types';

interface TeamManagerProps {
  tournamentName: string;
  teams: Team[];
  onCreateTeam: (team: Team) => void;
  onUpdateTeam: (team: Team) => void;
  onDeleteTeam: (id: string) => void;
}

const roleIcons: Record<Player['role'], string> = {
  'Batsman': 'fa-baseball-bat-ball',
  'Bowler': 'fa-baseball-ball',
  'All-Rounder': 'fa-star-half-stroke',
  'Wicketkeeper': 'fa-mitten'
};

const getInitials = (name: string) => name.substring(0, 2).toUpperCase();

const TeamManager: React.FC<TeamManagerProps> = ({ tournamentName, teams, onCreateTeam, onUpdateTeam, onDeleteTeam }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
  const [teamName, setTeamName] = useState('');
  const [teamLogo, setTeamLogo] = useState<string | undefined>(undefined);
  const [players, setPlayers] = useState<Player[]>([]);
  const [playerName, setPlayerName] = useState('');
  const [playerRole, setPlayerRole] = useState<Player['role']>('Batsman');
  const [playerLogo, setPlayerLogo] = useState<string | undefined>(undefined);

  const resetForm = () => {
    setTeamName('');
    setTeamLogo(undefined);
    setPlayers([]);
    setPlayerName('');
    setPlayerLogo(undefined);
    setIsAdding(false);
    setEditingTeamId(null);
  };

  const startEdit = (team: Team) => {
    setEditingTeamId(team.id);
    setTeamName(team.name);
    setTeamLogo(team.logo);
    setPlayers(team.players);
    setIsAdding(true);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>, target: 'team' | 'player') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (target === 'team') setTeamLogo(reader.result as string);
        else setPlayerLogo(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const addPlayer = () => {
    if (!playerName.trim()) return;
    const player: Player = {
      id: crypto.randomUUID(),
      name: playerName,
      role: playerRole,
      logo: playerLogo
    };
    setPlayers([...players, player]);
    setPlayerName('');
    setPlayerLogo(undefined);
  };

  const removePlayer = (id: string) => {
    setPlayers(players.filter(p => p.id !== id));
  };

  const saveTeam = () => {
    if (!teamName.trim() || players.length < 2) {
      alert("Please provide a team name and at least 2 players");
      return;
    }

    const teamData: Team = {
      id: editingTeamId || crypto.randomUUID(),
      name: teamName,
      logo: teamLogo,
      players
    };

    if (editingTeamId) {
      onUpdateTeam(teamData);
    } else {
      onCreateTeam(teamData);
    }
    resetForm();
  };

  const TeamLogoDisplay = ({ logo, name, size = "w-12 h-12" }: { logo?: string, name: string, size?: string }) => (
    <div className={`${size} rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 font-black overflow-hidden shadow-inner border border-white dark:border-slate-600`}>
      {logo ? (
        <img src={logo} alt={name} className="w-full h-full object-cover" />
      ) : (
        getInitials(name)
      )}
    </div>
  );

  const PlayerLogoDisplay = ({ logo, name, role, size = "w-10 h-10" }: { logo?: string, name: string, role: Player['role'], size?: string }) => (
    <div className={`${size} rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 font-bold overflow-hidden border border-white dark:border-slate-700 shadow-sm`}>
      {logo ? (
        <img src={logo} alt={name} className="w-full h-full object-cover" />
      ) : (
        <i className={`fas ${roleIcons[role]} text-xs`}></i>
      )}
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <div className="inline-block px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-lg font-black text-[10px] uppercase tracking-widest mb-2">
            League: {tournamentName}
          </div>
          <h2 className="text-4xl font-black text-slate-800 dark:text-white tracking-tight">Squads</h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Manage your squads and player identities</p>
        </div>
        <button
          onClick={() => isAdding ? resetForm() : setIsAdding(true)}
          className={`px-6 py-3 rounded-2xl font-black transition-all flex items-center gap-2 shadow-xl ${
            isAdding ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700' : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-200'
          }`}
        >
          <i className={`fas ${isAdding ? 'fa-times' : 'fa-plus'}`}></i>
          {isAdding ? 'Cancel' : 'Create Team'}
        </button>
      </div>

      {isAdding && (
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] shadow-xl border border-emerald-50 dark:border-slate-800 animate-in slide-in-from-top-4 duration-500">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="space-y-8">
              {/* Team Identity */}
              <div className="flex items-center gap-6">
                <div className="relative group">
                  <label className="w-24 h-24 bg-slate-50 dark:bg-slate-800 border-4 border-white dark:border-slate-700 shadow-lg rounded-[2rem] flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-all overflow-hidden relative">
                    {teamLogo ? (
                      <img src={teamLogo} alt="Logo" className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-center">
                        <i className="fas fa-camera text-slate-300 dark:text-slate-600 text-xl mb-1"></i>
                        <p className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-tighter">Team Logo</p>
                      </div>
                    )}
                    <input type="file" className="hidden" accept="image/*" onChange={(e) => handleLogoUpload(e, 'team')} />
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                       <i className="fas fa-edit text-white"></i>
                    </div>
                  </label>
                </div>
                <div className="flex-1">
                  <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Team Name</label>
                  <input
                    type="text"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    className="w-full px-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-emerald-500 dark:focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-700 outline-none font-bold text-slate-700 dark:text-white transition-all"
                    placeholder="Enter Team Name"
                  />
                </div>
              </div>

              {/* Add Players Section */}
              <div className="pt-8 border-t border-slate-50 dark:border-slate-800">
                <h4 className="text-xl font-black text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                  <i className="fas fa-user-plus text-emerald-500"></i> New Member
                </h4>
                <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-3xl space-y-4">
                  <div className="flex items-center gap-4">
                     <label className="w-16 h-16 flex-shrink-0 bg-white dark:bg-slate-700 border-2 border-slate-100 dark:border-slate-600 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-emerald-300 transition-all overflow-hidden relative group">
                        {playerLogo ? (
                          <img src={playerLogo} alt="Player" className="w-full h-full object-cover" />
                        ) : (
                          <i className="fas fa-portrait text-slate-300 dark:text-slate-500 text-lg"></i>
                        )}
                        <input type="file" className="hidden" accept="image/*" onChange={(e) => handleLogoUpload(e, 'player')} />
                        <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"><i className="fas fa-plus text-[10px] text-white"></i></div>
                     </label>
                     <input
                      type="text"
                      value={playerName}
                      onChange={(e) => setPlayerName(e.target.value)}
                      className="flex-1 px-4 py-4 rounded-xl bg-white dark:bg-slate-700 border border-slate-100 dark:border-slate-600 outline-none font-bold text-slate-700 dark:text-white"
                      placeholder="Enter Player Name"
                    />
                  </div>
                  <div className="flex gap-3">
                    <select
                      value={playerRole}
                      onChange={(e) => setPlayerRole(e.target.value as Player['role'])}
                      className="flex-1 px-4 py-4 rounded-xl bg-white dark:bg-slate-700 border border-slate-100 dark:border-slate-600 outline-none font-bold text-slate-600 dark:text-slate-400 appearance-none"
                    >
                      <option>Batsman</option>
                      <option>Bowler</option>
                      <option>All-Rounder</option>
                      <option>Wicketkeeper</option>
                    </select>
                    <button
                      onClick={addPlayer}
                      className="bg-slate-900 dark:bg-slate-950 text-emerald-400 px-8 py-4 rounded-xl font-black transition-all hover:bg-slate-800"
                    >
                      ADD
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col">
              <div className="flex justify-between items-end mb-6">
                <h4 className="text-xl font-black text-slate-800 dark:text-white">Squad Preview</h4>
                <span className="bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 px-3 py-1 rounded-full text-[10px] font-black uppercase">{players.length} Members</span>
              </div>
              <div className="flex-1 bg-slate-50 dark:bg-slate-800 rounded-[2rem] p-6 overflow-y-auto max-h-[450px] space-y-3 custom-scrollbar transition-colors">
                {players.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-slate-400 py-12">
                    <i className="fas fa-users-viewfinder text-4xl mb-4 opacity-20"></i>
                    <p className="font-bold text-sm uppercase tracking-widest">No players added yet</p>
                  </div>
                ) : (
                  players.map(p => (
                    <div key={p.id} className="bg-white dark:bg-slate-700 p-4 rounded-2xl flex justify-between items-center shadow-sm hover:shadow-md transition-shadow group">
                      <div className="flex items-center gap-4">
                        <PlayerLogoDisplay logo={p.logo} name={p.name} role={p.role} />
                        <div>
                          <p className="font-black text-slate-800 dark:text-white leading-none">{p.name}</p>
                          <p className="text-[9px] text-emerald-600 dark:text-emerald-400 font-black uppercase tracking-widest mt-1">{p.role}</p>
                        </div>
                      </div>
                      <button onClick={() => removePlayer(p.id)} className="text-slate-300 dark:text-slate-500 hover:text-red-500 p-2 transition-colors">
                        <i className="fas fa-times-circle"></i>
                      </button>
                    </div>
                  ))
                )}
              </div>
              <button
                onClick={saveTeam}
                className="mt-8 w-full bg-emerald-600 text-white py-5 rounded-[2rem] font-black text-xl hover:bg-emerald-700 transition-all shadow-2xl shadow-emerald-100 active:scale-95"
              >
                {editingTeamId ? 'Update Team' : 'Complete Registration'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {teams.length === 0 && !isAdding ? (
          <div className="col-span-full py-24 text-center bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="w-24 h-24 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-200 dark:text-slate-700">
              <i className="fas fa-users text-4xl"></i>
            </div>
            <h3 className="text-xl font-black text-slate-800 dark:text-white mb-2 uppercase tracking-tight">No Squads Registered</h3>
            <p className="text-slate-400 font-medium mb-8">Ready to start? Register your first team now.</p>
            <button
              onClick={() => setIsAdding(true)}
              className="bg-emerald-600 text-white px-10 py-4 rounded-2xl font-black hover:bg-emerald-700 shadow-xl shadow-emerald-100 transition-all"
            >
              Start Registration
            </button>
          </div>
        ) : (
          teams.map(team => (
            <div key={team.id} className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all group relative flex flex-col">
              <div className="flex justify-between items-start mb-6">
                <TeamLogoDisplay logo={team.logo} name={team.name} />
                <div className="flex gap-2">
                  <button
                    onClick={() => startEdit(team)}
                    className="w-10 h-10 bg-slate-50 dark:bg-slate-800 text-slate-400 hover:bg-emerald-50 dark:hover:bg-emerald-950 hover:text-emerald-500 rounded-xl transition-all flex items-center justify-center"
                  >
                    <i className="fas fa-pen text-sm"></i>
                  </button>
                  <button
                    onClick={() => onDeleteTeam(team.id)}
                    className="w-10 h-10 bg-slate-50 dark:bg-slate-800 text-slate-400 hover:bg-red-50 dark:hover:bg-red-950 hover:text-red-500 rounded-xl transition-all flex items-center justify-center"
                  >
                    <i className="fas fa-trash-alt text-sm"></i>
                  </button>
                </div>
              </div>
              <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-1">{team.name}</h3>
              <p className="text-emerald-600 dark:text-emerald-400 font-black text-[10px] uppercase tracking-widest mb-6">{team.players.length} Active Members</p>
              
              <div className="mt-auto pt-6 border-t border-slate-50 dark:border-slate-800 flex items-center gap-2 overflow-x-auto custom-scrollbar-hidden">
                {team.players.slice(0, 4).map(p => (
                  <div key={p.id} className="relative group/player" title={p.name}>
                    <PlayerLogoDisplay logo={p.logo} name={p.name} role={p.role} size="w-8 h-8" />
                  </div>
                ))}
                {team.players.length > 4 && (
                  <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-white dark:border-slate-700 flex items-center justify-center text-[10px] font-black text-slate-500 dark:text-slate-400">
                    +{team.players.length - 4}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TeamManager;
