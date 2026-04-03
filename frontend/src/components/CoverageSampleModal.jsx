import React from 'react';
import { X, ShieldCheck, BarChart3, Terminal, CheckCircle2, ChevronRight, FileText } from 'lucide-react';

const CoverageSampleModal = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    const sampleReport = {
        title: "NEON VELVET",
        verdict: "CONSIDER",
        scores: {
            "Concept": 9,
            "Logic": 8,
            "Character": 7,
            "Dialogue": 6
        },
        executive_summary: "Neon Velvet is a high-concept noir thriller with a gripping central premise. While the structural geometry is sound, the protagonist's internal motivation in Act 2 needs a deeper 'Logic Anchor' to justify the final confrontation. The dialogue is functional but requires a more cinematic cadence to match the visual ambition."
    };

    return (
        <div className="fixed inset-0 z-[500] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-4 animate-fade-in text-white">
            <div className="bg-[#050505] border border-white/10 rounded-sm shadow-[0_0_150px_rgba(0,206,201,0.1)] max-w-4xl w-full p-12 relative overflow-hidden max-h-[90vh] overflow-y-auto custom-scrollbar">
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-arc-teal to-transparent opacity-50"></div>
                
                <button 
                    onClick={onClose}
                    className="absolute top-8 right-8 text-gray-600 hover:text-white transition-colors text-2xl"
                >
                    &times;
                </button>

                <div className="text-center mb-16">
                    <span className="text-arc-teal text-[10px] font-black uppercase tracking-[0.5em] mb-4 block italic">Studio Sample Report</span>
                    <h2 className="text-5xl font-black text-white mb-4 tracking-tighter uppercase leading-tight italic">
                        The Standard.
                    </h2>
                    <p className="text-gray-500 text-xs uppercase tracking-widest font-black italic">This is a replica of the report transmitted to your inbox.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
                    {/* Left: Metadata & Verdict */}
                    <div className="md:col-span-5 space-y-8">
                        <div className="bg-black border border-white/5 p-8 rounded-sm">
                            <label className="text-[10px] uppercase font-black tracking-widest text-white/20 mb-2 block italic">Script Title</label>
                            <h3 className="text-2xl font-black uppercase tracking-tight mb-8">{sampleReport.title}</h3>
                            
                            <label className="text-[10px] uppercase font-black tracking-widest text-white/20 mb-2 block italic">Studio Verdict</label>
                            <div className="bg-orange-500/10 border border-orange-500/20 px-6 py-3 rounded-full text-orange-500 text-lg font-black uppercase tracking-widest text-center shadow-glow">
                                {sampleReport.verdict}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {Object.entries(sampleReport.scores).map(([key, val]) => (
                                <div key={key} className="bg-black border border-white/5 p-4 rounded-sm text-center">
                                    <span className="text-[8px] font-black uppercase tracking-widest text-white/20 block mb-1">{key}</span>
                                    <span className="text-xl font-black text-arc-teal">{val}<span className="text-[10px] opacity-20">/10</span></span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right: Executive Analysis */}
                    <div className="md:col-span-7 space-y-8">
                        <div className="bg-white/[0.02] border border-white/5 p-10 rounded-sm relative group overflow-hidden">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="bg-arc-teal/10 p-3 rounded-sm border border-arc-teal/20 text-arc-teal">
                                    <Terminal className="w-5 h-5" />
                                </div>
                                <h4 className="text-xs font-black uppercase tracking-[0.3em] text-white">Executive Summary</h4>
                            </div>
                            
                            <p className="text-sm text-white/80 leading-relaxed font-light italic border-l-2 border-arc-teal pl-8 mb-8">
                                "{sampleReport.executive_summary}"
                            </p>

                            <div className="flex items-start gap-4">
                                <CheckCircle2 className="w-4 h-4 text-arc-teal shrink-0 mt-1" />
                                <p className="text-[10px] text-white/40 uppercase tracking-widest leading-relaxed">
                                    Full 5-page PDF includes deep-dives into <b>Setup/Payoff logic</b>, <b>Dialogue Cadence</b>, and <b>Marketability Projections</b>.
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={onClose}
                            className="w-full bg-white text-black font-black py-6 rounded-sm hover:bg-arc-teal hover:text-white transition-all text-[10px] uppercase tracking-[0.5em] shadow-2xl flex items-center justify-center gap-3 group"
                        >
                            Begin Your Audit <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                </div>

                <div className="mt-16 pt-8 border-t border-white/5 flex justify-between items-center opacity-20">
                    <div className="flex items-center gap-3">
                        <FileText className="w-4 h-4" />
                        <span className="text-[8px] font-black uppercase tracking-[0.4em]">v1.4 Coverage Protocol</span>
                    </div>
                    <span className="text-[8px] font-black uppercase tracking-[0.4em]">ArcWriter Studio &copy; 2026</span>
                </div>
            </div>
        </div>
    );
};

export default CoverageSampleModal;
