import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Cpu, PlayCircle, Layers, Fingerprint, Compass, ArrowRight } from 'lucide-react';
import { auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';

const LandingPage: React.FC = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (u) => {
            setUser(u);
        });
        return () => unsubscribe();
    }, []);

    const handleDownloadManual = async () => {
        try {
            const response = await fetch('/api/manual/download');
            if (!response.ok) throw new Error("Download failed");
            
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = "ArcWriter_Screenwriters_Guide.pdf";
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Manual Download Error:", error);
            alert("Failed to download the Screenwriter's Guide.");
        }
    };

    return (
        <div className="min-h-screen bg-black text-white selection:bg-arc-teal/30 selection:text-arc-teal">
            {/* Professional Navigation */}
            <nav className="fixed top-0 w-full z-[100] px-8 py-6 flex justify-between items-center transition-all duration-500 bg-black/50 backdrop-blur-md border-b border-white/5">
                <div className="flex items-center gap-4 group cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                    <img src="/ArcWriter_logo.png" alt="ArcWriter" className="h-8 group-hover:scale-105 transition-transform" />
                    <div className="h-4 w-px bg-gray-800"></div>
                    <span className="text-[10px] font-black tracking-[0.4em] uppercase text-gray-400 group-hover:text-arc-teal transition-colors">Architecture</span>
                </div>
                
                <div className="flex items-center gap-12">
                    <div className="hidden md:flex gap-10 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">
                        <a href="#logic" className="hover:text-white transition-colors">The Engine</a>
                        <a href="#visualization" className="hover:text-white transition-colors">Visual Anchors</a>
                        <a href="#pitch" className="hover:text-white transition-colors">Pitch Ready</a>
                    </div>
                    <button
                        onClick={() => navigate('/app')}
                        className="px-8 py-2 bg-white text-black rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-arc-teal hover:text-white transition-all duration-300 shadow-xl shadow-white/5"
                    >
                        {user ? 'Enter Studio' : 'Get Started'}
                    </button>
                </div>
            </nav>

            {/* Hero: The Showrunner */}
            <section className="relative h-screen flex items-center justify-start px-8 md:px-24 overflow-hidden pt-20">
                {/* Atmospheric Background */}
                <div className="absolute top-1/4 -left-20 w-[800px] h-[800px] bg-arc-teal/5 rounded-full blur-[150px] pointer-events-none animate-pulse"></div>
                <div className="absolute -bottom-40 -right-20 w-[600px] h-[600px] bg-arc-orange/5 rounded-full blur-[120px] pointer-events-none"></div>

                <div className="relative z-20 max-w-6xl w-full">
                    <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full border border-white/10 bg-white/5 mb-12 animate-fade-in">
                        <div className="w-1.5 h-1.5 rounded-full bg-arc-teal"></div>
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Professional Studio Access</span>
                    </div>

                    <h1 className="text-6xl md:text-[9rem] font-black mb-12 tracking-tighter leading-[0.8] animate-fade-in uppercase">
                        Stop Pitching <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-gray-600">A Script.</span> <br />
                        <span className="italic font-light tracking-normal lowercase">Pitch a movie.</span>
                    </h1>

                    <div className="flex flex-col md:flex-row items-start gap-12 animate-fade-in-delayed">
                        <div className="max-w-xl border-l-2 border-arc-teal/20 pl-8 py-2">
                            <p className="text-2xl text-gray-400 font-light leading-relaxed">
                                Turn your text file into a studio-ready package in minutes. In a stack of 500 PDFs, be the one that <span className="text-white font-medium text-transparent bg-clip-text bg-gradient-to-r from-arc-teal to-white">looks like a franchise.</span>
                            </p>
                        </div>
                        
                        <div className="flex flex-col gap-4">
                            <button
                                onClick={() => navigate('/app')}
                                className="group relative px-16 py-8 bg-white text-black font-black text-xs uppercase tracking-[0.4em] rounded-sm transition-all hover:bg-arc-teal hover:text-white"
                            >
                                {user ? 'ENTER THE STUDIO' : 'START YOUR PROJECT'}
                                <ArrowRight className="absolute right-6 opacity-0 group-hover:opacity-100 transition-all w-5 h-5 -translate-x-4 group-hover:translate-x-0" />
                            </button>
                            <button
                                onClick={() => navigate('/billing')}
                                className="px-16 py-8 bg-black border border-white/5 text-gray-500 font-black text-xs uppercase tracking-[0.4em] rounded-sm transition-all hover:bg-white/10 hover:text-white"
                            >
                                {user ? 'VIEW PLANS' : 'UPGRADE TO SHOWRUNNER'}
                            </button>
                            <button 
                                onClick={handleDownloadManual}
                                className="text-[9px] font-black text-gray-500 uppercase tracking-widest hover:text-arc-teal transition-colors"
                            >
                                DOWNLOAD THE SCREENWRITER'S GUIDE (PDF)
                            </button>
                        </div>
                    </div>
                </div>

                {/* Vertical Detail */}
                <div className="absolute right-10 bottom-24 hidden md:flex flex-col items-center">
                    <span className="text-[10px] font-black uppercase tracking-[1em] text-gray-700 [writing-mode:vertical-rl] rotate-180 mb-4">Production Ready</span>
                    <div className="h-32 w-px bg-gradient-to-b from-arc-teal to-transparent"></div>
                </div>
            </section>


            {/* The Insurance Policy Section */}
            <section id="logic" className="py-40 px-8 md:px-24 bg-[#050505] relative border-t border-white/5">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center mb-40">
                        <div>
                            <span className="text-arc-teal text-[10px] font-black uppercase tracking-[0.5em] mb-6 block italic">The Insurance Policy</span>
                            <h2 className="text-5xl md:text-8xl font-black uppercase tracking-tighter mb-10 leading-none">Find the plot hole <br /><span className="text-arc-orange italic font-light lowercase">before the producer does.</span></h2>
                            <p className="text-xl text-gray-500 leading-relaxed max-w-lg mb-12">
                                You’ve spent months on your draft. Don’t let a structural flaw kill your chances in the room. ArcWriter acts as your ruthless structural editor, scanning your script for logic gaps, unresolved character arcs, and weak motivations.
                            </p>
                            <div className="flex gap-8">
                                <div className="flex flex-col gap-2">
                                    <span className="text-2xl font-black text-white">Confidence</span>
                                    <span className="text-[9px] font-black uppercase tracking-widest text-gray-600">Risk Mitigation</span>
                                </div>
                                <div className="w-px h-12 bg-gray-800"></div>
                                <div className="flex flex-col gap-2">
                                    <span className="text-2xl font-black text-white">100%</span>
                                    <span className="text-[9px] font-black uppercase tracking-widest text-gray-600">Structural Safety Net</span>
                                </div>
                            </div>
                        </div>
                        <div className="relative">
                            <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden border border-white/10 shadow-2xl">
                                <img src="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1000&q=80" className="w-full h-full object-cover grayscale opacity-20" alt="Production Vision" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
                                <div className="absolute bottom-8 left-8 flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-arc-orange/20 flex items-center justify-center border border-arc-orange/50">
                                        <ShieldCheck className="w-6 h-6 text-arc-orange" />
                                    </div>
                                    <span className="text-xs font-black uppercase tracking-widest text-white">Logic Integrity Scanner Active</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div id="visualization" className="grid grid-cols-1 md:grid-cols-3 gap-px bg-white/5 border border-white/5">
                        <FeatureCard 
                            icon={<Zap className="w-6 h-6" />}
                            title="Cure the Sagging Middle"
                            desc="Diagnose pacing issues and inject tension where it matters most. Identify static scenes and low stakes instantly without tearing the whole script apart."
                        />
                        <FeatureCard 
                            icon={<Layers className="w-6 h-6" />}
                            title="The Silent Partner"
                            desc="Get the brutal honesty your friends won't give you. Objective, unbiased feedback on your story structure and character motivations, available 24/7."
                        />
                        <FeatureCard 
                            icon={<Compass className="w-6 h-6" />}
                            title="Engineering, not guessing"
                            desc="Great storytelling is architecture. Track your narrative threads to ensure every setup has a payoff and every Chekhov’s Gun is fired."
                        />
                    </div>
                </div>
            </section>

            {/* The Closer */}
            <section id="pitch" className="py-60 px-8 text-center bg-black relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-arc-teal/10 via-transparent to-transparent"></div>
                
                <div className="relative z-10 max-w-4xl mx-auto">
                    <span className="text-gray-600 text-[10px] font-black uppercase tracking-[1em] mb-12 block">Accelerate Your Career</span>
                    <h2 className="text-6xl md:text-[10rem] font-black uppercase tracking-tighter mb-12 leading-none">Hit <br /> <span className="text-arc-teal">Send.</span></h2>
                    <p className="text-2xl text-gray-400 font-light mb-16 max-w-2xl mx-auto leading-relaxed">
                        Walk into your next pitch meeting not just as a writer, but as a showrunner with a vision. Export structurally sound scripts and cinematic visual packages.
                    </p>
                    <button 
                        onClick={() => navigate('/app')}
                        className="px-24 py-10 bg-white text-black font-black uppercase tracking-[0.5em] text-xs hover:bg-arc-teal hover:text-white transition-all duration-500 shadow-2xl"
                    >
                        {user ? 'RETURN TO PROJECT' : 'Initialize Your Masterpiece'}
                    </button>
                </div>
            </section>

            {/* Minimal Footer */}
            <footer className="py-20 px-8 border-t border-white/5 bg-black flex flex-col md:flex-row justify-between items-center gap-10">
                <div className="flex items-center gap-4">
                    <img src="/ArcWriter_logo.png" alt="ArcWriter" className="h-6 opacity-50 grayscale hover:grayscale-0 transition-all" />
                    <span className="text-[10px] font-black tracking-widest uppercase text-gray-600">© 2026 Architectural Storytelling</span>
                </div>
                
                <div className="flex gap-12 text-[9px] font-bold uppercase tracking-[0.3em] text-gray-600">
                    <button onClick={handleDownloadManual} className="hover:text-arc-teal transition-colors">Screenwriter's Guide</button>
                    <a href="#" className="hover:text-white transition-colors">Privacy Protocol</a>
                    <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
                    <a href="#" className="hover:text-arc-teal transition-colors">API Docs</a>
                </div>
            </footer>
        </div>
    );
};

const FeatureCard = ({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) => (
    <div className="bg-black p-16 hover:bg-[#080808] transition-all duration-500 group relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-0 bg-arc-teal group-hover:h-full transition-all duration-500"></div>
        <div className="text-arc-teal mb-10 group-hover:scale-110 transition-transform duration-500 inline-block">
            {icon}
        </div>
        <h3 className="text-2xl font-black uppercase tracking-tight mb-6 group-hover:text-arc-teal transition-colors">{title}</h3>
        <p className="text-gray-500 text-lg leading-relaxed font-light">{desc}</p>
    </div>
);

export default LandingPage;

