
import React, { useState } from 'react';
import { generateTournamentArt } from '../services/gemini';

const ASPECT_RATIOS = [
  { label: '1:1', value: '1:1', icon: 'fa-square' },
  { label: '2:3', value: '2:3', icon: 'fa-rectangle-portrait' },
  { label: '3:2', value: '3:2', icon: 'fa-rectangle-landscape' },
  { label: '3:4', value: '3:4', icon: 'fa-rectangle-portrait' },
  { label: '4:3', value: '4:3', icon: 'fa-rectangle-landscape' },
  { label: '9:16', value: '9:16', icon: 'fa-mobile-screen' },
  { label: '16:9', value: '16:9', icon: 'fa-desktop' },
  { label: '21:9', value: '21:9', icon: 'fa-tv' },
];

const AIMedia: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    // Check for API Key selection (required for gemini-3-pro-image-preview)
    const hasKey = await (window as any).aistudio?.hasSelectedApiKey();
    if (!hasKey) {
      await (window as any).aistudio?.openSelectKey();
      // Proceeding assuming user selected a key as per instructions
    }

    setIsProcessing(true);
    setError(null);
    try {
      const result = await generateTournamentArt(prompt, aspectRatio);
      setGeneratedImage(result);
    } catch (err) {
      if (err instanceof Error && err.message.includes("entity was not found")) {
        setError("API Key issue. Please re-select your paid API key.");
        await (window as any).aistudio?.openSelectKey();
      } else {
        setError("Failed to generate art. Try a different prompt.");
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header>
        <h2 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-3">
          <i className="fas fa-wand-magic-sparkles text-emerald-500"></i> AI Art Studio
        </h2>
        <p className="text-slate-500 dark:text-slate-400">Create stunning tournament posters and team graphics with Gemini 3 Pro</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800">
            <h3 className="text-lg font-black text-slate-800 dark:text-white mb-4">Prompt Description</h3>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe your vision: 'A cinematic shot of a batsman hitting a six under stadium lights with golden dust in the air, professional sports poster style'..."
              className="w-full h-40 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none font-medium resize-none dark:text-white"
            />
          </div>

          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800">
            <h3 className="text-lg font-black text-slate-800 dark:text-white mb-4">Aspect Ratio</h3>
            <div className="grid grid-cols-4 gap-3">
              {ASPECT_RATIOS.map((ratio) => (
                <button
                  key={ratio.value}
                  onClick={() => setAspectRatio(ratio.value)}
                  className={`flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all ${
                    aspectRatio === ratio.value 
                      ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-500 text-emerald-600' 
                      : 'bg-slate-50 dark:bg-slate-800 border-transparent text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  <i className={`fas ${ratio.icon} mb-1`}></i>
                  <span className="text-[10px] font-black uppercase">{ratio.label}</span>
                </button>
              ))}
            </div>
            
            <button
              onClick={handleGenerate}
              disabled={!prompt.trim() || isProcessing}
              className="w-full mt-8 bg-slate-900 dark:bg-emerald-600 text-emerald-400 dark:text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-emerald-700 transition-all disabled:opacity-50 flex items-center justify-center gap-3 shadow-xl"
            >
              {isProcessing ? (
                <><i className="fas fa-spinner fa-spin"></i> Painting with AI...</>
              ) : (
                <><i className="fas fa-palette"></i> Generate Art</>
              )}
            </button>
            <p className="mt-4 text-[10px] text-slate-400 dark:text-slate-500 text-center font-bold uppercase tracking-widest">
              Gemini 3 Pro Image Generation <i className="fas fa-gem ml-1"></i>
            </p>
            {error && <p className="mt-3 text-red-500 text-sm font-bold text-center">{error}</p>}
          </div>
        </div>

        <div className="bg-slate-900 dark:bg-slate-950 rounded-[3rem] p-8 flex flex-col items-center justify-center text-center relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-emerald-500/10 via-transparent to-transparent opacity-50 pointer-events-none"></div>
          
          <div className="w-full h-full min-h-[400px] bg-slate-800 dark:bg-slate-900 rounded-[2rem] overflow-hidden flex items-center justify-center border-2 border-slate-700 relative z-10 shadow-inner">
            {generatedImage ? (
              <img src={generatedImage} alt="Generated Art" className="w-full h-full object-contain animate-in zoom-in duration-700" />
            ) : isProcessing ? (
              <div className="text-slate-500 flex flex-col items-center gap-4">
                <div className="w-20 h-20 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
                <p className="font-black uppercase tracking-[0.2em] text-xs text-emerald-500 animate-pulse">Igniting Creation Engine...</p>
              </div>
            ) : (
              <div className="text-slate-600 p-12">
                <i className="fas fa-wand-magic text-6xl mb-6 opacity-20"></i>
                <p className="font-black uppercase tracking-widest text-xs opacity-50">Your masterpiece will appear here</p>
              </div>
            )}
          </div>

          {generatedImage && (
            <div className="flex gap-4 mt-8 z-10 w-full">
              <a
                href={generatedImage}
                download="gullyscore-ai-art.png"
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/40"
              >
                <i className="fas fa-download"></i> Download
              </a>
              <button
                onClick={() => setGeneratedImage(null)}
                className="bg-white/10 hover:bg-white/20 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest transition-all"
              >
                Clear
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIMedia;
