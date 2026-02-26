import React, { useState } from 'react';
import { Sparkles, Send, FileText, Mail, ChevronRight, Zap, ScrollText } from 'lucide-react';
import { apiClient } from '../api/client';

const Analyze = () => {
    const [input, setInput] = useState('');
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [analysisId, setAnalysisId] = useState(null);
    const [email, setEmail] = useState('');
    const [step, setStep] = useState('input'); // 'input' | 'processing' | 'gated' | 'complete'

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setInput(''); // Clear text if file is added
        }
    };

    const handleAnalyze = async () => {
        if (!input.trim() && !file) {
            alert("Please provide notes or upload a PDF script.");
            return;
        }
        
        setLoading(true);
        setStep('processing');

        try {
            const formData = new FormData();
            if (file) {
                formData.append('file', file);
            } else {
                formData.append('raw_input', input);
            }

            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || ''}/api/public/analyze`, {
                method: 'POST',
                body: formData,
                // Note: Don't set Content-Type header when using FormData
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.detail || "Analysis failed");
            }
            
            const data = await response.json();
            setResult(data.teaser_beats);
            setAnalysisId(data.analysis_id);
            setStep('gated');
        } catch (error) {
            console.error("Analysis failed:", error);
            alert(`Logic Engine Error: ${error.message}`);
            setStep('input');
        } finally {
            setLoading(false);
        }
    };

    const handleEmailSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        
        try {
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || ''}/api/public/capture_lead`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    email: email,
                    analysis_id: analysisId
                })
            });

            if (!response.ok) throw new Error("Capture failed");
            setStep('complete');
        } catch (error) {
            alert("Failed to send. Please check your email address.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#050505] text-white selection:bg-arc-teal/30">
            {/* Header / Nav */}
            <nav className="p-8 flex justify-between items-center border-b border-white/5">
                <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.location.href = '/'}>
                    <div className="w-8 h-8 bg-arc-orange rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(249,115,22,0.3)]">
                        <Zap className="w-5 h-5 text-black" fill="currentColor" />
                    </div>
                    <span className="font-black tracking-tighter text-2xl uppercase italic">Arc<span className="text-gray-600">Writer</span></span>
                </div>
                <a href="/login" className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 hover:text-white transition-colors">Sign In</a>
            </nav>

            <main className="max-w-4xl mx-auto px-8 py-20">
                {step === 'input' && (
                    <div className="space-y-12 animate-fade-in">
                        <div className="text-center md:text-left">
                            <span className="text-arc-teal text-[10px] font-black uppercase tracking-[0.5em] mb-4 block italic underline decoration-arc-teal/30 underline-offset-8">Public Laboratory</span>
                            <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter leading-[0.9]">
                                Distill Your <br/>
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-600 italic">Narrative Core.</span>
                            </h1>
                            <p className="text-gray-500 mt-8 text-xl font-light italic max-w-2xl">
                                Paste your movie notes or upload a PDF script. Our Logic Engine will extract a 15-point structural beat sheet.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Text Input */}
                            <div className="space-y-4">
                                <label className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-600 ml-2">Option A: Rough Notes</label>
                                <textarea 
                                    value={input}
                                    onChange={(e) => { setInput(e.target.value); if(e.target.value) setFile(null); }}
                                    placeholder="Once upon a time in a city under the sea..."
                                    className="w-full h-64 bg-white/5 border border-white/10 rounded-sm p-8 text-lg font-light focus:outline-none focus:border-arc-teal/50 transition-all placeholder:text-gray-800 resize-none"
                                />
                            </div>

                            {/* PDF Upload */}
                            <div className="space-y-4">
                                <label className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-600 ml-2">Option B: Upload PDF</label>
                                <div className={`relative h-64 border-2 border-dashed rounded-sm transition-all flex flex-col items-center justify-center p-8 text-center ${file ? 'border-arc-teal bg-arc-teal/5' : 'border-white/10 bg-white/5 hover:border-white/20'}`}>
                                    <input 
                                        type="file" 
                                        accept=".pdf"
                                        onChange={handleFileChange}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    />
                                    {file ? (
                                        <>
                                            <FileText className="w-12 h-12 text-arc-teal mb-4 animate-bounce" />
                                            <p className="text-white font-bold">{file.name}</p>
                                            <p className="text-gray-500 text-xs mt-2 uppercase tracking-widest">Click or drag to change</p>
                                        </>
                                    ) : (
                                        <>
                                            <ScrollText className="w-12 h-12 text-gray-800 mb-4" />
                                            <p className="text-gray-500 font-light">Drag your script PDF here</p>
                                            <p className="text-[9px] text-gray-700 mt-4 uppercase tracking-[0.2em]">Max 10MB</p>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Master Action Button */}
                        <div className="pt-8 border-t border-white/5 flex justify-center md:justify-end">
                            <button 
                                onClick={handleAnalyze}
                                disabled={(!input && !file) || loading}
                                className="bg-white text-black px-12 py-6 rounded-none font-black text-[11px] uppercase tracking-[0.4em] flex items-center gap-4 hover:bg-arc-teal hover:text-white transition-all shadow-[0_20px_50px_rgba(0,0,0,0.5)] disabled:opacity-20 transform hover:-translate-y-1 active:translate-y-0"
                            >
                                <Sparkles className="w-5 h-5" />
                                {loading ? "Analyzing Narrative..." : "Build Beat Sheet"}
                            </button>
                        </div>
                    </div>
                )}

                {step === 'processing' && (
                    <div className="py-40 flex flex-col items-center justify-center space-y-8 animate-pulse text-center">
                        <div className="w-24 h-24 border-t-2 border-arc-teal rounded-full animate-spin"></div>
                        <div>
                            <h2 className="text-2xl font-black uppercase tracking-widest text-arc-teal">Logic Engine Active</h2>
                            <p className="text-gray-600 mt-2 uppercase text-[10px] font-black tracking-[0.4em]">Identifying Opening Image & Theme...</p>
                        </div>
                    </div>
                )}

                {step === 'gated' && (
                    <div className="space-y-12 animate-fade-in">
                        <div className="text-center">
                            <span className="bg-arc-teal/10 text-arc-teal px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border border-arc-teal/20">Analysis Ready</span>
                            <h2 className="text-4xl font-black uppercase tracking-tighter mt-6">Structure Identified.</h2>
                            <p className="text-gray-500 mt-4 italic font-light">The Logic Engine has successfully mapped your narrative arc.</p>
                        </div>

                        <div className="space-y-8">
                            {/* Visible Teaser Beats */}
                            <div className="grid grid-cols-1 gap-8">
                                {result && result.map((beat, i) => (
                                    <div key={i} className="bg-white/5 border border-white/10 rounded-sm p-8 flex gap-8 items-start hover:border-arc-teal/30 transition-colors">
                                        <span className="text-arc-orange font-black text-2xl tabular-nums">0{beat.id}</span>
                                        <div>
                                            <h4 className="text-arc-teal font-black uppercase tracking-widest text-xs mb-2">{beat.title}</h4>
                                            <p className="text-gray-300 font-light text-sm italic leading-relaxed">{beat.content}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* The Gate */}
                            <div className="relative mt-12">
                                {/* Blurred Background Placeholders - more visible now */}
                                <div className="space-y-8 opacity-25 blur-[1.5px] pointer-events-none select-none pb-40">
                                    {[4, 5, 6, 7].map(i => (
                                        <div key={i} className="bg-white/5 border border-white/10 rounded-sm p-8 flex gap-8 items-start">
                                            <span className="text-arc-orange font-black text-2xl">0{i}</span>
                                            <div className="flex-1">
                                                <div className="h-4 w-32 bg-white/20 mb-3 rounded-full"></div>
                                                <div className="h-2 w-full bg-white/5 rounded-full"></div>
                                                <div className="h-2 w-3/4 bg-white/5 mt-2 rounded-full"></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Floating Email Form - adjusted gradient */}
                                <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-gradient-to-t from-[#050505] via-[#050505]/40 to-transparent">
                                    <form onSubmit={handleEmailSubmit} className="max-w-md w-full bg-black border border-arc-orange/30 rounded-sm p-10 shadow-[0_0_50px_rgba(249,115,22,0.15)] space-y-6 transform translate-y-4">
                                        <Mail className="w-12 h-12 text-arc-orange mx-auto mb-2" />
                                        <div>
                                            <h3 className="text-2xl font-black uppercase tracking-tight">Unlock All 15 Beats</h3>
                                            <p className="text-gray-400 text-sm mt-2 font-light leading-relaxed">
                                                We've generated the full structural breakdown. <br/>
                                                Enter your email to receive the complete PDF analysis.
                                            </p>
                                        </div>
                                        <div className="flex flex-col gap-4">
                                            <input 
                                                type="email" 
                                                required
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                placeholder="Your email address"
                                                className="bg-white/5 border border-white/10 rounded-sm px-6 py-4 text-center text-lg focus:outline-none focus:border-arc-orange transition-colors"
                                            />
                                            <button 
                                                type="submit"
                                                disabled={loading}
                                                className="bg-arc-orange text-white py-4 rounded-sm font-black uppercase tracking-[0.3em] text-[10px] hover:bg-white hover:text-black transition-all flex items-center justify-center gap-3 shadow-xl"
                                            >
                                                {loading ? "Sending..." : "Receive Full Breakdown"}
                                                <ChevronRight className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <p className="text-[8px] text-gray-600 uppercase tracking-widest">No credit card required. Pure narrative logic.</p>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {step === 'complete' && (
                    <div className="py-20 text-center space-y-12 animate-fade-in">
                        <div className="inline-flex items-center justify-center w-24 h-24 bg-arc-teal/10 rounded-full border border-arc-teal/20 mb-8">
                            <Send className="w-10 h-10 text-arc-teal" />
                        </div>
                        <div className="space-y-4">
                            <h2 className="text-5xl font-black uppercase tracking-tighter">Package Sent.</h2>
                            <p className="text-gray-500 text-xl font-light italic">Check your inbox for the structural breakdown of "{input.slice(0, 20)}...".</p>
                        </div>
                        
                        <div className="pt-12">
                            <div className="bg-gradient-to-b from-white/5 to-transparent border border-white/10 rounded-sm p-12 max-w-lg mx-auto">
                                <h3 className="text-xl font-black uppercase tracking-widest mb-6">Ready to visualize?</h3>
                                <p className="text-gray-400 text-sm mb-10 leading-relaxed font-light">Bring your characters to life and generate cinematic trailers using our full Studio suite.</p>
                                <a 
                                    href="/login" 
                                    className="block bg-white text-black py-5 rounded-sm font-black uppercase tracking-[0.4em] text-[10px] hover:bg-arc-teal hover:text-white transition-all"
                                >
                                    Enter The Writer's Room
                                </a>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            <footer className="py-20 text-center text-gray-800 text-[10px] font-black uppercase tracking-[0.5em]">
                Built by Arc Studio &copy; 2026
            </footer>
        </div>
    );
};

export default Analyze;
