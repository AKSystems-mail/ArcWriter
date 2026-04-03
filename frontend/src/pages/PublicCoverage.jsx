import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    FileUp, Sparkles, ShieldCheck, Mail, 
    Send, Loader2, CheckCircle2, ChevronRight, 
    Zap, AlertCircle, Terminal, Eye, BarChart3
} from 'lucide-react';
import { apiClient } from '../api/client';
import CoverageSampleModal from '../components/CoverageSampleModal';

const PublicCoverage = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1); // 1: Info/Upload, 2: Processing, 3: Capture/Result
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [analysisId, setAnalysisId] = useState(null);
    const [verdict, setVerdict] = useState(null);
    const [scores, setScores] = useState(null);
    const [email, setEmail] = useState('');
    const [scriptTitle, setScriptTitle] = useState('');
    const [isSampleOpen, setIsSampleOpen] = useState(false);
    const [loadingText, setLoadingText] = useState("Initializing Reading Room...");

    const handleFileChange = (e) => {
        const selected = e.target.files[0];
        if (selected && selected.type === 'application/pdf') {
            setFile(selected);
            setError('');
        } else {
            setError('Please provide a PDF screenplay.');
        }
    };

    const handleUpload = async () => {
        if (!file) return;
        setLoading(true);
        setStep(2);
        
        const formData = new FormData();
        formData.append('file', file);

        // Simulated phases for better UX
        const phases = [
            "Analyzing Narrative Geometry...",
            "Checking Character Arcs...",
            "Auditing Structural Integrity...",
            "Consulting Studio Executives...",
            "Finalizing Official Verdict..."
        ];

        let phaseIdx = 0;
        const interval = setInterval(() => {
            if (phaseIdx < phases.length) {
                setLoadingText(phases[phaseIdx]);
                phaseIdx++;
            }
        }, 3000);

        try {
            const response = await fetch('/api/public/coverage/generate', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.detail || "Analysis failed");
            }

            const data = await response.json();
            setAnalysisId(data.analysis_id);
            setVerdict(data.verdict);
            setScores(data.scores);
            setStep(3);
        } catch (err) {
            setError(err.message);
            setStep(1);
        } finally {
            clearInterval(interval);
            setLoading(false);
        }
    };

    const handleClaim = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await apiClient('/api/public/coverage/claim', {
                method: 'POST',
                body: JSON.stringify({
                    email,
                    script_title: scriptTitle,
                    analysis_id: analysisId
                })
            });

            if (response.ok) {
                setStep(4); // Success!
            } else {
                const err = await response.json();
                throw new Error(err.detail || "Transmission failed");
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white selection:bg-arc-teal/30 flex flex-col items-center justify-start overflow-y-auto custom-scrollbar p-6">
            
            <CoverageSampleModal isOpen={isSampleOpen} onClose={() => setIsSampleOpen(false)} />

            {/* 1. HEADER */}
            <header className="w-full max-w-6xl flex justify-between items-center py-12 border-b border-white/5 mb-20 animate-fade-in">
                <div className="flex items-center gap-4 cursor-pointer" onClick={() => navigate('/')}>
                    <img src="/ArcWriter_logo.png" alt="ArcWriter" className="h-8" />
                    <div className="h-4 w-px bg-gray-800"></div>
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40">Studio Reading Room</span>
                </div>
                <div className="hidden md:flex gap-8">
                    <span className="text-[9px] font-black uppercase tracking-widest text-arc-teal italic">V1.4 Launch Special</span>
                </div>
            </header>

            {/* 2. MAIN CONTENT AREA */}
            <main className="w-full max-w-4xl">
                
                {/* STEP 1: LANDING / UPLOAD */}
                {step === 1 && (
                    <div className="space-y-16 animate-fade-in">
                        <div className="text-center">
                            <div className="bg-arc-teal/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-8 border border-arc-teal/20 shadow-glow">
                                <FileUp className="w-10 h-10 text-arc-teal" />
                            </div>
                            <h1 className="text-6xl md:text-8xl font-black uppercase tracking-tighter leading-none mb-8">
                                Instant Studio <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-600 italic">Coverage.</span>
                            </h1>
                            <p className="max-w-2xl mx-auto text-xl text-gray-500 font-light leading-relaxed italic border-l-2 border-arc-teal pl-10 text-left">
                                Get a professional, objective script report in 60 seconds. Our Logic Engine audits your structure, character arcs, and marketability using studio-standard metrics.
                            </p>
                        </div>

                        <div className="bg-[#080808] border border-white/5 p-12 md:p-20 rounded-sm text-center relative overflow-hidden group transition-all hover:border-arc-teal/20 shadow-2xl">
                            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-arc-teal to-transparent opacity-20 group-hover:opacity-100 transition-opacity"></div>
                            
                            <input 
                                type="file" 
                                id="script-upload" 
                                className="hidden" 
                                accept=".pdf"
                                onChange={handleFileChange}
                            />
                            
                            <label htmlFor="script-upload" className="cursor-pointer">
                                <div className="space-y-8">
                                    {file ? (
                                        <div className="animate-bounce">
                                            <CheckCircle2 className="w-16 h-16 text-arc-teal mx-auto mb-4" />
                                            <p className="text-xl font-bold uppercase tracking-tight">{file.name}</p>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="bg-white/5 w-24 h-24 rounded-full flex items-center justify-center mx-auto border border-white/5 group-hover:border-arc-teal/30 transition-all">
                                                <Zap className="w-10 h-10 text-white/20 group-hover:text-arc-teal transition-all" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black uppercase tracking-[0.5em] text-white/40 mb-2">Drop your PDF here</p>
                                                <p className="text-sm text-gray-600 font-bold italic tracking-widest">Max 50MB | Industry Format Recommended</p>
                                            </div>
                                        </>
                                    )}
                                    
                                    <button 
                                        onClick={(e) => { e.preventDefault(); if(file) handleUpload(); else document.getElementById('script-upload').click(); }}
                                        className={`px-16 py-6 rounded-sm font-black text-xs uppercase tracking-[0.5em] transition-all shadow-glow ${file ? 'bg-white text-black hover:bg-arc-teal hover:text-white' : 'bg-white/5 text-white/40 border border-white/10 hover:border-white/30'}`}
                                    >
                                        {file ? "Begin Audit" : "Select Screenplay"}
                                    </button>
                                </div>
                            </label>
                        </div>

                        {/* Sample Trigger */}
                        <div className="text-center">
                            <button 
                                onClick={() => setIsSampleOpen(true)}
                                className="text-[10px] font-black uppercase tracking-[0.4em] text-white hover:text-arc-teal transition-all group"
                            >
                                <span className="border-b border-white/20 group-hover:border-arc-teal pb-1 transition-all">View Studio Sample Report</span>
                            </button>
                        </div>

                        {error && (
                            <div className="bg-red-500/5 border border-red-500/20 p-6 rounded-sm flex items-center gap-4 animate-bounce">
                                <AlertCircle className="w-5 h-5 text-red-500" />
                                <span className="text-xs font-black uppercase tracking-widest text-red-500/80">{error}</span>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <FeatureMini icon={<Terminal />} title="Logic Audit" desc="Identifies 'Fridge Logic' and structural gaps." />
                            <FeatureMini icon={<BarChart3 />} title="Score Grid" desc="Objective 1-10 rankings on all core metrics." />
                            <FeatureMini icon={<Eye />} title="Verdict" desc="Definitive PASS, CONSIDER, or RECOMMEND." />
                        </div>
                    </div>
                )}

                {/* STEP 2: PROCESSING */}
                {step === 2 && (
                    <div className="flex flex-col items-center justify-center py-40 animate-fade-in text-center">
                        <div className="relative w-32 h-32 mb-16">
                            <div className="absolute inset-0 border-2 border-arc-teal/20 rounded-full" />
                            <div className="absolute inset-0 border-t-2 border-arc-teal rounded-full animate-spin" />
                            <div className="absolute inset-4 border border-white/5 rounded-full flex items-center justify-center">
                                <Terminal className="w-8 h-8 text-arc-teal animate-pulse" />
                            </div>
                        </div>
                        <h2 className="text-4xl font-black uppercase tracking-tighter italic mb-4">{loadingText}</h2>
                        <p className="text-white/20 text-[10px] uppercase tracking-[0.5em] font-black">Reading room active | Do not refresh</p>
                    </div>
                )}

                {/* STEP 3: RESULT CAPTURE */}
                {step === 3 && (
                    <div className="space-y-12 animate-slide-up">
                        <div className="bg-[#080808] border border-white/5 p-12 rounded-sm relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-8 opacity-5">
                                <ShieldCheck className="w-32 h-32" />
                            </div>
                            
                            <div className="flex flex-col md:flex-row justify-between items-center gap-12 border-b border-white/5 pb-12 mb-12">
                                <div>
                                    <span className="text-arc-teal text-[10px] font-black uppercase tracking-[0.5em] mb-2 block">Logic Scan Result</span>
                                    <h2 className="text-5xl font-black uppercase tracking-tighter italic">First Look Complete.</h2>
                                </div>
                                <div className="text-center md:text-right">
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 block mb-2">Verdict Target</span>
                                    <div className={`px-8 py-3 rounded-full font-black text-xl tracking-tighter uppercase ${verdict === 'RECOMMEND' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : verdict === 'CONSIDER' ? 'bg-orange-500/10 text-orange-500 border border-orange-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
                                        {verdict}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
                                {Object.entries(scores || {}).map(([key, val]) => (
                                    <div key={key} className="bg-black/40 border border-white/5 p-6 rounded-sm text-center">
                                        <span className="text-[8px] font-black uppercase tracking-widest text-white/30 block mb-2">{key}</span>
                                        <span className="text-2xl font-black tracking-tighter text-arc-teal">{val}<span className="text-xs text-white/20">/10</span></span>
                                    </div>
                                ))}
                            </div>

                            <div className="max-w-xl mx-auto text-center">
                                <h3 className="text-2xl font-black uppercase tracking-tight mb-6">Receive Full PDF Report</h3>
                                <p className="text-gray-500 text-xs uppercase tracking-widest leading-relaxed mb-10 italic">
                                    Enter your details below to transmit the complete 5-page Studio Coverage Report to your inbox.
                                </p>
                                
                                <form onSubmit={handleClaim} className="space-y-6">
                                    <input 
                                        type="text" 
                                        placeholder="Script Title" 
                                        required
                                        value={scriptTitle}
                                        onChange={(e) => setScriptTitle(e.target.value)}
                                        className="w-full bg-black border border-white/10 rounded-sm p-5 text-sm uppercase tracking-widest focus:border-arc-teal outline-none transition-all placeholder:text-gray-800"
                                    />
                                    <input 
                                        type="email" 
                                        placeholder="Studio Email Address" 
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full bg-black border border-white/10 rounded-sm p-5 text-sm uppercase tracking-widest focus:border-arc-teal outline-none transition-all placeholder:text-gray-800"
                                    />
                                    <button 
                                        type="submit"
                                        disabled={loading}
                                        className="w-full bg-white text-black font-black py-6 rounded-sm text-xs uppercase tracking-[0.5em] hover:bg-arc-teal hover:text-white transition-all shadow-glow flex items-center justify-center gap-3"
                                    >
                                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-4 h-4" /> Transmit Full Report</>}
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                )}

                {/* STEP 4: SUCCESS / UPSELL */}
                {step === 4 && (
                    <div className="text-center py-20 animate-fade-in">
                        <div className="bg-arc-teal/10 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-12 border border-arc-teal/20 shadow-glow">
                            <CheckCircle2 className="w-12 h-12 text-arc-teal" />
                        </div>
                        <h2 className="text-5xl font-black uppercase tracking-tighter italic mb-6 text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-600">Transmission Successful.</h2>
                        <p className="max-w-xl mx-auto text-lg text-gray-500 font-light italic mb-16">
                            Your Studio Coverage Report is currently winging its way to your inbox. Check your spam folder if it doesn't arrive within 5 minutes.
                        </p>
                        
                        <div className="bg-[#080808] border border-white/5 p-16 rounded-sm max-w-2xl mx-auto shadow-2xl relative overflow-hidden group">
                            <div className="absolute top-0 left-0 w-full h-[2px] bg-arc-orange opacity-20 group-hover:opacity-100 transition-opacity"></div>
                            <Zap className="w-12 h-12 text-arc-orange mx-auto mb-8 animate-pulse" />
                            <h3 className="text-3xl font-black uppercase tracking-tighter mb-4 italic">Ready to fix the logic gaps?</h3>
                            <p className="text-gray-500 text-[10px] uppercase tracking-[0.3em] font-black mb-12 italic">Join the professional standard for structural screenwriting.</p>
                            
                            <button 
                                onClick={() => navigate('/login')}
                                className="bg-white text-black font-black px-16 py-6 rounded-sm text-xs uppercase tracking-[0.5em] hover:bg-arc-orange hover:text-white transition-all flex items-center justify-center mx-auto gap-3 group"
                            >
                                Enter The Studio <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    </div>
                )}

            </main>

            {/* 3. FOOTER */}
            <footer className="mt-auto py-20 text-center opacity-20 hover:opacity-50 transition-opacity duration-1000">
                <p className="text-[8px] font-black uppercase tracking-[0.6em]">ArcWriter AI Studio &copy; 2026 | Industry Standard Protocol</p>
            </footer>
        </div>
    );
};

const FeatureMini = ({ icon, title, desc }) => (
    <div className="bg-white/5 border border-white/5 p-8 rounded-sm text-center group hover:border-white/10 transition-all">
        <div className="text-white/20 group-hover:text-arc-teal transition-colors flex justify-center mb-4">{icon}</div>
        <h4 className="text-[10px] font-black uppercase tracking-widest mb-2 italic">{title}</h4>
        <p className="text-[10px] text-gray-600 font-medium uppercase tracking-tighter leading-relaxed">{desc}</p>
    </div>
);

export default PublicCoverage;
