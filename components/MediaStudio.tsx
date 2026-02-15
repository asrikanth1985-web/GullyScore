
import React, { useState } from 'react';
import { editTournamentImage } from '../services/gemini';

const MediaStudio: React.FC = () => {
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>('');
  const [prompt, setPrompt] = useState('');
  const [editedImage, setEditedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMimeType(file.type);
      const reader = new FileReader();
      reader.onloadend = () => {
        setSourceImage(reader.result as string);
        setEditedImage(null);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEdit = async () => {
    if (!sourceImage || !prompt.trim()) return;

    setIsProcessing(true);
    setError(null);
    try {
      const result = await editTournamentImage(sourceImage, mimeType, prompt);
      setEditedImage(result);
    } catch (err) {
      setError("Failed to edit image. Please try a different prompt or image.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header>
        <h2 className="text-3xl font-black text-slate-800 tracking-tight">Tournament Media Studio</h2>
        <p className="text-slate-500">Use AI to create professional posters and team graphics</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
            <h3 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
              <i className="fas fa-upload text-emerald-500"></i> Step 1: Upload Image
            </h3>
            <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-slate-200 rounded-[2rem] cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors overflow-hidden">
              {sourceImage ? (
                <img src={sourceImage} alt="Source" className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <i className="fas fa-image text-4xl text-slate-300 mb-3"></i>
                  <p className="mb-2 text-sm text-slate-500 font-bold">Click to upload team photo or logo</p>
                  <p className="text-xs text-slate-400">PNG, JPG or WEBP</p>
                </div>
              )}
              <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
            </label>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
            <h3 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
              <i className="fas fa-wand-magic-sparkles text-emerald-500"></i> Step 2: AI Instructions
            </h3>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., 'Add a vintage retro filter and golden fireworks in the background', 'Make it look like a professional IPL match poster'..."
              className="w-full h-32 p-4 rounded-2xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none font-medium resize-none"
            />
            <button
              onClick={handleEdit}
              disabled={!sourceImage || !prompt.trim() || isProcessing}
              className="w-full mt-4 bg-slate-900 text-emerald-400 py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all disabled:opacity-50 flex items-center justify-center gap-3 shadow-xl"
            >
              {isProcessing ? (
                <><i className="fas fa-spinner fa-spin"></i> Processing with Gemini...</>
              ) : (
                <><i className="fas fa-magic"></i> Generate AI Edit</>
              )}
            </button>
            {error && <p className="mt-3 text-red-500 text-sm font-bold text-center">{error}</p>}
          </div>
        </div>

        <div className="bg-slate-900 rounded-[3rem] p-8 flex flex-col items-center justify-center text-center relative overflow-hidden ring-8 ring-slate-900/50">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-emerald-500/10 via-transparent to-transparent opacity-50 pointer-events-none"></div>
          
          <h3 className="text-white text-xl font-black mb-6 z-10">AI Result Preview</h3>
          
          <div className="w-full aspect-[4/5] md:aspect-square bg-slate-800 rounded-[2rem] overflow-hidden flex items-center justify-center border-2 border-slate-700 relative z-10">
            {editedImage ? (
              <img src={editedImage} alt="AI Result" className="w-full h-full object-contain animate-in zoom-in duration-500" />
            ) : isProcessing ? (
              <div className="text-slate-500 flex flex-col items-center gap-4">
                <div className="w-16 h-16 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
                <p className="font-bold uppercase tracking-widest text-xs">Generating Masterpiece...</p>
              </div>
            ) : (
              <div className="text-slate-600 px-8">
                <i className="fas fa-sparkles text-4xl mb-4 opacity-20"></i>
                <p className="font-bold uppercase tracking-widest text-xs">Your edited image will appear here</p>
              </div>
            )}
          </div>

          {editedImage && (
            <a
              href={editedImage}
              download="tournament-edit.png"
              className="mt-8 bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest transition-all z-10 flex items-center gap-2 shadow-lg shadow-emerald-900/40"
            >
              <i className="fas fa-download"></i> Save to Device
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

export default MediaStudio;
