import React from 'react';
import { X, Tv, BookOpen, Layers, CheckCircle2, Info, Sparkles, ChevronRight, Layout } from 'lucide-react';

const TVShowrunnerGuide = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[300] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 animate-fade-in text-white selection:bg-arc-teal/30">
            <div className="bg-[#050505] border border-white/5 rounded-sm shadow-[0_0_100px_rgba(0,206,201,0.1)] max-w-4xl w-full p-12 relative overflow-hidden">
                {/* Brand Accent */}
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-arc-teal to-transparent opacity-50"></div>
                
                {/* Close Button */}
                <button 
                    onClick={onClose}
                    className="absolute top-8 right-8 text-gray-600 hover:text-white transition-colors text-2xl"
                >
                    &times;
                </button>

                {/* Header */}
                <div className="text-center mb-16">
                    <div className="bg-arc-teal/10 w-16 h-16 rounded-sm border border-arc-teal/20 flex items-center justify-center mx-auto mb-6 shadow-glow">
                        <Tv className="w-8 h-8 text-arc-teal animate-pulse" />
                    </div>
                    <span className="text-arc-teal text-[10px] font-black uppercase tracking-[0.5em] mb-4 block italic">Episodic Production Protocol</span>
                    <h2 className="text-5xl font-black text-white mb-4 tracking-tighter uppercase leading-tight">
                        TV Showrunner's <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-600 italic">Guide.</span>
                    </h2>
                </div>

                {/* Content Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                    {/* The Universe Bible */}
                    <div className="bg-black border border-white/5 hover:border-white/10 p-10 flex flex-col transition-all duration-500 group relative rounded-sm">
                        <div className="flex justify-between items-start mb-8">
                            <h3 className="text-2xl font-black text-white uppercase tracking-tight group-hover:text-arc-teal transition-colors">The Series Bible</h3>
                            <BookOpen className="w-5 h-5 text-gray-700 group-hover:text-arc-teal transition-colors" />
                        </div>
                        <p className="text-[11px] text-white leading-relaxed uppercase tracking-widest mb-8">
                            Treat the <span className="text-white font-bold">Cinematic Universe</span> as your Series Bible. Create one Universe for your show, then launch every episode as a new <span className="text-white font-bold">Project</span> within it to maintain consistency.
                        </p>
                        <div className="mt-auto flex items-center gap-2 text-[9px] font-black text-arc-teal uppercase tracking-[0.2em]">
                            <CheckCircle2 className="w-3 h-3" /> maintain character continuity
                        </div>
                    </div>

                    {/* Calibration */}
                    <div className="bg-black border border-white/5 hover:border-white/10 p-10 flex flex-col transition-all duration-500 group relative rounded-sm">
                        <div className="flex justify-between items-start mb-8">
                            <h3 className="text-2xl font-black text-white uppercase tracking-tight group-hover:text-arc-orange transition-colors">Format Notes</h3>
                            <Info className="w-5 h-5 text-gray-700 group-hover:text-arc-orange transition-colors" />
                        </div>
                        <p className="text-[11px] text-white leading-relaxed uppercase tracking-widest mb-8">
                            In your <span className="text-white font-bold">Story DNA</span> or <span className="text-white font-bold">PDF Upload</span>, explicitly state your format: e.g., "30-minute single-cam sitcom" or "60-minute prestige drama."
                        </p>
                        <div className="mt-auto flex items-center gap-2 text-[9px] font-black text-arc-orange uppercase tracking-[0.2em]">
                            <CheckCircle2 className="w-3 h-3" /> calibrates structural pacing
                        </div>
                    </div>
                </div>

                {/* Pro Tip - Full Width */}
                <div className="bg-arc-teal/5 border border-arc-teal/20 p-10 rounded-sm relative group overflow-hidden mb-12">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="bg-arc-teal/10 p-3 rounded-sm border border-arc-teal/20">
                            <Sparkles className="w-5 h-5 text-arc-teal animate-pulse" />
                        </div>
                        <h4 className="text-xs font-black uppercase tracking-[0.3em] text-white">Pro Tip: Episodic Act Structures</h4>
                    </div>
                    <p className="text-sm text-white leading-relaxed font-light italic border-l-2 border-arc-teal pl-6">
                        "For TV episodes, we recommend choosing <span className="text-arc-teal font-bold text-xs uppercase tracking-tighter">The Discovery</span> mode. This allows the AI to naturally adapt to TV’s 4-act or 5-act structures rather than the rigid 15-beat movie standard."
                    </p>
                </div>

                <div className="flex justify-center">
                    <button
                        onClick={onClose}
                        className="bg-white text-black font-black px-16 py-5 rounded-sm hover:bg-arc-teal hover:text-white transition-all text-[10px] uppercase tracking-[0.5em] shadow-2xl flex items-center gap-3 group"
                    >
                        Initialize Production <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>

                <p className="mt-12 text-center text-[8px] font-black text-white/40 uppercase tracking-[0.4em]">
                    ArcWriter Studio v2.5.4 | Episodic Continuity Engine Active
                </p>
            </div>
        </div>
    );
};

export default TVShowrunnerGuide;
