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

            {/* Hero: The Perfect Pitch */}
            <section className="relative h-screen flex items-center justify-start px-8 md:px-24 overflow-hidden pt-20">
                {/* Atmospheric Background */}
                <div className="absolute top-1/4 -left-20 w-[800px] h-[800px] bg-arc-teal/5 rounded-full blur-[150px] pointer-events-none animate-pulse"></div>
                <div className="absolute -bottom-40 -right-20 w-[600px] h-[600px] bg-arc-orange/5 rounded-full blur-[120px] pointer-events-none"></div>

                <div className="relative z-20 max-w-6xl w-full">
                    <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full border border-arc-teal/20 bg-arc-teal/5 mb-12 animate-fade-in">
                        <div className="w-1.5 h-1.5 rounded-full bg-arc-teal"></div>
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-arc-teal">Logic Engine v2.5 Stable</span>
                    </div>

                    <h1 className="text-6xl md:text-[9rem] font-black mb-12 tracking-tighter leading-[0.8] animate-fade-in uppercase">
                        The Perfect <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-gray-600">Pitch</span> <br />
                        <span className="italic font-light tracking-normal lowercase">Engineered.</span>
                    </h1>

                    <div className="flex flex-col md:flex-row items-start gap-12 animate-fade-in-delayed">
                        <div className="max-w-xl border-l-2 border-arc-teal/20 pl-8 py-2">
                            <p className="text-2xl text-gray-400 font-light leading-relaxed">
                                Don't just write a script. Build a <span className="text-white font-medium">narrative asset.</span> ArcWriter uses Game Theory to stress-test your structure and creates cinematic visuals to help you sell your vision.
                            </p>
                        </div>
                        
                        <div className="flex flex-col gap-4">
                            <button
                                onClick={() => navigate('/app')}
                                className="group relative px-16 py-8 bg-white text-black font-black text-xs uppercase tracking-[0.4em] rounded-sm transition-all hover:bg-arc-teal hover:text-white"
                            >
                                {user ? 'RESUME ANALYSIS' : 'BEGIN ANALYSIS'}
                                <ArrowRight className="absolute right-6 opacity-0 group-hover:opacity-100 transition-all w-5 h-5 -translate-x-4 group-hover:translate-x-0" />
                            </button>
                            <button
                                onClick={() => navigate('/billing')}
                                className="px-16 py-8 bg-black border border-white/5 text-gray-500 font-black text-xs uppercase tracking-[0.4em] rounded-sm transition-all hover:bg-white/10 hover:text-white"
                            >
                                {user ? 'VIEW PLANS' : 'UNLOCK FULL POWER'}
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
                    <span className="text-[10px] font-black uppercase tracking-[1em] text-gray-700 [writing-mode:vertical-rl] rotate-180 mb-4">Structural Integrity</span>
                    <div className="h-32 w-px bg-gradient-to-b from-arc-teal to-transparent"></div>
                </div>
            </section>


            {/* Precision Section */}
            <section id="logic" className="py-40 px-8 md:px-24 bg-[#050505] relative border-t border-white/5">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center mb-40">
                        <div>
                            <span className="text-arc-teal text-[10px] font-black uppercase tracking-[0.5em] mb-6 block italic">Phase 01: The Blueprint</span>
                            <h2 className="text-5xl md:text-8xl font-black uppercase tracking-tighter mb-10 leading-none">Kill the <br /><span className="text-arc-orange italic font-light lowercase">plot holes.</span></h2>
                            <p className="text-xl text-gray-500 leading-relaxed max-w-lg mb-12">
                                Our Logic Engine analyzes character motivation using mathematical game theory models. If a character acts irrationally, you'll know exactly where the logic breaks before the reader does.
                            </p>
                            <div className="flex gap-8">
                                <div className="flex flex-col gap-2">
                                    <span className="text-2xl font-black text-white">15</span>
                                    <span className="text-[9px] font-black uppercase tracking-widest text-gray-600">Narrative Beats</span>
                                </div>
                                <div className="w-px h-12 bg-gray-800"></div>
                                <div className="flex flex-col gap-2">
                                    <span className="text-2xl font-black text-white">100%</span>
                                    <span className="text-[9px] font-black uppercase tracking-widest text-gray-600">Logic Verified</span>
                                </div>
                            </div>
                        </div>
                        <div className="relative">
                            <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden border border-white/10 shadow-2xl">
                                <img src="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1000&q=80" className="w-full h-full object-cover grayscale opacity-40" alt="Logic Matrix" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
                                <div className="absolute bottom-8 left-8 flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-arc-teal/20 flex items-center justify-center border border-arc-teal/50">
                                        <Cpu className="w-6 h-6 text-arc-teal" />
                                    </div>
                                    <span className="text-xs font-black uppercase tracking-widest text-white">Nash Equilibrium Audit Active</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div id="visualization" className="grid grid-cols-1 md:grid-cols-3 gap-px bg-white/5 border border-white/5">
                        <FeatureCard 
                            icon={<Fingerprint className="w-6 h-6" />}
                            title="Story DNA"
                            desc="Distill rough notes into a 15-beat master structure instantly. Every beat is logically connected to ensure professional pacing."
                        />
                        <FeatureCard 
                            icon={<Layers className="w-6 h-6" />}
                            title="Visual Anchors"
                            desc="Generate cinematic character portraits and official posters. Give your pitch the visual weight of a produced studio film."
                        />
                        <FeatureCard 
                            icon={<Compass className="w-6 h-6" />}
                            title="Dialogue Polish"
                            desc="Use our assistant to suggest direct, subtextual, or conflict-heavy dialogue variants that stay true to your character's voice."
                        />
                    </div>
                </div>
            </section>

            {/* The Closer */}
            <section id="pitch" className="py-60 px-8 text-center bg-black relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-arc-teal/10 via-transparent to-transparent"></div>
                
                <div className="relative z-10 max-w-4xl mx-auto">
                    <span className="text-gray-600 text-[10px] font-black uppercase tracking-[1em] mb-12 block">Final Phase: The Delivery</span>
                    <h2 className="text-6xl md:text-[10rem] font-black uppercase tracking-tighter mb-12 leading-none">Win the <br /> <span className="text-arc-teal">Room.</span></h2>
                    <p className="text-2xl text-gray-400 font-light mb-16 max-w-2xl mx-auto leading-relaxed">
                        Export structurally sound scripts, cinematic pitch decks, and visual character sheets designed to move executives to a "Yes."
                    </p>
                    <button 
                        onClick={() => navigate('/app')}
                        className="px-24 py-10 bg-white text-black font-black uppercase tracking-[0.5em] text-xs hover:bg-arc-teal hover:text-white transition-all duration-500 shadow-2xl"
                    >
                        {user ? 'RETURN TO STUDIO' : 'Initialize Your Perfect Pitch'}
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

