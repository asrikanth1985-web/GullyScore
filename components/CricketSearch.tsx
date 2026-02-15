
import React, { useState } from 'react';
import { searchCricketInfo } from '../services/gemini';

const CricketSearch: React.FC = () => {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState<{ text: string, sources: { title: string, uri: string }[] } | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setIsSearching(true);
    setError(null);
    try {
      const result = await searchCricketInfo(query);
      setResponse(result);
    } catch (err) {
      setError("Search failed. Check your internet connection.");
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <header>
        <h2 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-3">
          <i className="fas fa-magnifying-glass text-blue-500"></i> Cricket Intelligence
        </h2>
        <p className="text-slate-500 dark:text-slate-400">Ask Gemini anything about real-world cricket stats, teams, or schedules</p>
      </header>

      <div className="bg-white dark:bg-slate-900 p-2 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-800 flex flex-col md:flex-row gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="e.g. 'Who has the most runs in the IPL 2024?', 'What is the schedule for Australia vs India?'..."
          className="flex-1 px-8 py-5 rounded-2xl bg-transparent outline-none font-bold text-slate-700 dark:text-white"
        />
        <button
          onClick={handleSearch}
          disabled={!query.trim() || isSearching}
          className="bg-slate-900 dark:bg-blue-600 text-white px-10 py-5 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-800 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
        >
          {isSearching ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-paper-plane"></i>}
          Search
        </button>
      </div>

      <div className="space-y-6">
        {isSearching && (
          <div className="bg-white dark:bg-slate-900 p-12 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 text-center space-y-4">
             <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mx-auto"></div>
             <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Grounding with Google Search...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 dark:bg-red-950/30 p-6 rounded-2xl border border-red-100 dark:border-red-900 text-red-600 dark:text-red-400 font-bold text-center">
            {error}
          </div>
        )}

        {response && !isSearching && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 p-8 md:p-12 rounded-[3rem] shadow-sm border border-slate-100 dark:border-slate-800">
               <div className="prose prose-slate dark:prose-invert max-w-none text-slate-700 dark:text-slate-200 font-medium whitespace-pre-wrap">
                 {response.text}
               </div>
            </div>

            {response.sources.length > 0 && (
              <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-700">
                 <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                   <i className="fas fa-link"></i> Verified Sources
                 </h4>
                 <div className="flex flex-wrap gap-2">
                    {response.sources.map((source, i) => (
                      <a
                        key={i}
                        href={source.uri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-white dark:bg-slate-700 px-4 py-2 rounded-xl text-xs font-bold text-blue-600 dark:text-blue-400 border border-slate-100 dark:border-slate-600 hover:shadow-md transition-all flex items-center gap-2"
                      >
                        <span className="truncate max-w-[200px]">{source.title}</span>
                        <i className="fas fa-external-link-alt text-[8px] opacity-50"></i>
                      </a>
                    ))}
                 </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CricketSearch;
