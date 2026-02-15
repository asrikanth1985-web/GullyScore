
import React, { useState, useRef } from 'react';
import { Tournament } from '../types';

interface TournamentManagerProps {
  tournaments: Tournament[];
  onSelectTournament: (id: string) => void;
  onCreateTournament: (name: string) => void;
  onDeleteTournament: (id: string) => void;
  onImportTournament: (imported: Tournament) => void;
}

const TournamentManager: React.FC<TournamentManagerProps> = ({ 
  tournaments, 
  onSelectTournament, 
  onCreateTournament, 
  onDeleteTournament,
  onImportTournament
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newTournamentName, setNewTournamentName] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCreate = () => {
    if (!newTournamentName.trim()) return;
    onCreateTournament(newTournamentName);
    setNewTournamentName('');
    setIsCreating(false);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        if (imported.name && Array.isArray(imported.teams) && Array.isArray(imported.matches)) {
          onImportTournament(imported);
        } else {
          alert("Invalid tournament data format");
        }
      } catch (err) {
        alert("Failed to parse the file. Please ensure it's a valid JSON tournament backup.");
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset for next import
  };

  const confirmDelete = () => {
    if (deletingId) {
      onDeleteTournament(deletingId);
      setDeletingId(null);
    }
  };

  const deletingTournament = tournaments.find(t => t.id === deletingId);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileImport} 
        accept=".json" 
        className="hidden" 
      />

      {/* Deletion Modal */}
      {deletingId && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] w-full max-w-md p-8 shadow-2xl animate-in zoom-in duration-300">
            <div className="w-20 h-20 bg-red-50 dark:bg-red-900/30 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl">
              <i className="fas fa-exclamation-triangle"></i>
            </div>
            <h3 className="text-2xl font-black text-slate-800 dark:text-white text-center mb-2">Delete Tournament?</h3>
            <p className="text-slate-500 dark:text-slate-400 text-center mb-8">
              Are you sure you want to delete <span className="font-bold text-slate-800 dark:text-white">"{deletingTournament?.name}"</span>? 
              This will permanently remove all teams, players, and match history.
            </p>
            <div className="flex gap-4">
              <button
                onClick={confirmDelete}
                className="flex-1 bg-red-600 text-white py-4 rounded-2xl font-black hover:bg-red-700 transition-all shadow-lg shadow-red-100"
              >
                Yes, Delete
              </button>
              <button
                onClick={() => setDeletingId(null)}
                className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 py-4 rounded-2xl font-black hover:bg-slate-200 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 dark:text-white">Tournament Leagues</h2>
          <p className="text-slate-500 dark:text-slate-400">Save, restore and manage your cricket events</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleImportClick}
            className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-6 py-3 rounded-xl font-bold hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
          >
            <i className="fas fa-file-import"></i> Restore
          </button>
          <button
            onClick={() => setIsCreating(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-emerald-200 transition-all flex items-center justify-center gap-2"
          >
            <i className="fas fa-plus"></i> New League
          </button>
        </div>
      </header>

      {isCreating && (
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-sm border border-emerald-100 dark:border-slate-800 max-w-lg mx-auto">
          <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-4 text-center">Create Tournament</h3>
          <input
            autoFocus
            type="text"
            value={newTournamentName}
            onChange={(e) => setNewTournamentName(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none mb-4"
            placeholder="Tournament Name (e.g. Summer Cup 2025)"
          />
          <div className="flex gap-2">
            <button
              onClick={handleCreate}
              className="flex-1 bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-700 transition-all"
            >
              Save & Start
            </button>
            <button
              onClick={() => setIsCreating(false)}
              className="px-6 py-3 rounded-xl font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tournaments.length === 0 && !isCreating ? (
          <div className="col-span-full py-24 text-center">
            <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300 dark:text-slate-700">
              <i className="fas fa-trophy text-4xl"></i>
            </div>
            <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300 mb-2">No Tournaments Found</h3>
            <p className="text-slate-400 dark:text-slate-500 mb-8 max-w-sm mx-auto">Create your first tournament or restore a backup to start tracking.</p>
            <button
              onClick={() => setIsCreating(true)}
              className="bg-emerald-600 text-white px-8 py-3 rounded-xl font-bold"
            >
              Get Started
            </button>
          </div>
        ) : (
          tournaments.map(t => (
            <div key={t.id} className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all group overflow-hidden flex flex-col">
              <div className="p-6 flex-1">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 bg-slate-900 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-emerald-400 text-xl shadow-lg">
                    <i className="fas fa-shield-halved"></i>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => { 
                      e.preventDefault();
                      e.stopPropagation(); 
                      setDeletingId(t.id);
                    }}
                    className="p-3 text-slate-300 dark:text-slate-600 hover:text-red-500 transition-all z-10"
                    title="Delete Tournament"
                  >
                    <i className="fas fa-trash-alt text-lg"></i>
                  </button>
                </div>
                <h3 className="text-xl font-black text-slate-800 dark:text-white mb-1">{t.name}</h3>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-4">
                  Created {new Date(t.createdAt).toLocaleDateString()}
                </p>
                
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-50 dark:border-slate-800">
                  <div className="text-center p-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100/50 dark:border-slate-700">
                    <p className="text-lg font-black text-slate-700 dark:text-slate-300">{t.teams.length}</p>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Teams</p>
                  </div>
                  <div className="text-center p-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100/50 dark:border-slate-700">
                    <p className="text-lg font-black text-slate-700 dark:text-slate-300">{t.matches.length}</p>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Matches</p>
                  </div>
                </div>
              </div>
              <button
                onClick={() => onSelectTournament(t.id)}
                className="w-full py-5 bg-slate-900 dark:bg-slate-950 text-emerald-400 font-black text-sm uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all mt-auto flex items-center justify-center gap-2"
              >
                Open Tournament <i className="fas fa-arrow-right text-[10px]"></i>
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TournamentManager;
