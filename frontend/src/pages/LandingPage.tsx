import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Cpu, PlayCircle, Layers, Fingerprint, Compass } from 'lucide-react';

const LandingPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-black text-white selection:bg-arc-teal/30 selection:text-arc-teal">
            {/* Minimalist Professional Navigation */}
            <nav className="fixed top-0 w-full z-[100] px-8 py-6 flex justify-between items-center transition-all duration-500">
                <div className="flex items-center gap-4 group cursor-pointer">
                    <div className="w-8 h-8 bg-arc-teal rounded-sm rotate-45 group-hover:rotate-90 transition-transform duration-500 flex items-center justify-center">
                        <div className="w-3 h-3 bg-black -rotate-45 group-hover:-rotate-90 transition-transform duration-500"></div>
                    </div>
                    <span className="text-sm font-black tracking-[0.3em] uppercase group-hover:text-arc-teal transition-colors">ArcWriter</span>
                </div>
                
                <div className="flex items-center gap-12">
                    <div className="hidden md:flex gap-10 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">
                        <a href="#logic" className="hover:text-white transition-colors">Logic Engine</a>
                        <a href="#visualization" className="hover:text-white transition-colors">Visualization</a>
                        <a href="#storyboards" className="hover:text-white transition-colors">Storyboards</a>
                    </div>
                    <button
                        onClick={() => navigate('/login')}
                        className="px-8 py-2 border border-white/10 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all duration-300"
                    >
                        Enter Studio
                    </button>
                </div>
            </nav>

            {/* Immersive Hero Section */}
            <section className="relative h-screen flex items-center justify-start px-8 md:px-24 overflow-hidden">
                {/* Atmospheric Glows */}
                <div className="absolute top-1/4 -left-20 w-[600px] h-[600px] bg-arc-teal/10 rounded-full blur-[120px] pointer-events-none animate-pulse"></div>
                <div className="absolute bottom-1/4 -right-20 w-[500px] h-[500px] bg-arc-orange/5 rounded-full blur-[100px] pointer-events-none"></div>

                {/* Vertical Branding Detail */}
                <div className="absolute left-10 bottom-24 hidden md:block">
                    <div className="h-32 w-[1px] bg-gradient-to-t from-arc-teal to-transparent mb-4"></div>
                    <span className="text-[10px] font-black uppercase tracking-[1em] text-gray-700 [writing-mode:vertical-rl] rotate-180">Structural Co-Pilot</span>
                </div>

                <div className="relative z-20 max-w-6xl w-full">
                    <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full border border-arc-teal/30 bg-arc-teal/5 mb-8 animate-fade-in">
                        <div className="w-1.5 h-1.5 rounded-full bg-arc-teal animate-ping"></div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-arc-teal">Draft Assist v2.4 Active</span>
                    </div>

                    <h1 className="text-6xl md:text-[10rem] font-black mb-12 tracking-tighter leading-[0.85] animate-fade-in uppercase">
                        Master the <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-gray-500">Science</span> <br />
                        <span className="italic font-light">of Story</span>
                    </h1>

                    <div className="flex flex-col md:flex-row items-end gap-12 animate-fade-in-delayed">
                        <p className="text-xl text-gray-400 font-light max-w-lg leading-relaxed border-l border-gray-800 pl-8">
                            High-precision logic engine for professional screenwriters. 
                            Stress-test your narrative structure with Game Theory 
                            before you write a single line of dialogue.
                        </p>
                        
                        <div className="flex gap-4">
                            <button
                                onClick={() => navigate('/login')}
                                className="group relative px-12 py-6 bg-white text-black font-black text-sm uppercase tracking-widest rounded-sm transition-all hover:pr-16"
                            >
                                START PROJECT
                                <PlayCircle className="absolute right-6 opacity-0 group-hover:opacity-100 transition-all w-5 h-5" />
                            </button>
                            <button className="px-12 py-6 border border-white/10 text-white font-black text-sm uppercase tracking-widest rounded-sm hover:bg-white/5 transition-all">
                                Documentation
                            </button>
                        </div>
                    </div>
                </div>

                {/* Decorative Technical Overlay */}
                <div className="absolute right-0 top-0 h-full w-1/3 opacity-20 hidden lg:block pointer-events-none">
                    <div className="absolute inset-0 bg-gradient-to-l from-black to-transparent z-10"></div>
                    <img 
                        src="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1000&q=80" 
                        alt="Technical Grid" 
                        className="h-full w-full object-cover grayscale"
                    />
                </div>
            </section>

            {/* Diagnostic Grid (Features) */}
            <section id="logic" className="py-40 px-8 md:px-24 bg-[#050505] relative border-t border-white/5">
                <div className="max-w-7xl mx-auto">
                    <div className="mb-32 flex flex-col md:flex-row justify-between items-end gap-8">
                        <div>
                            <span className="text-arc-teal text-[10px] font-black uppercase tracking-[0.5em] mb-4 block">Precision Instruments</span>
                            <h2 className="text-5xl md:text-7xl font-black uppercase tracking-tighter">Diagnostic Panel</h2>
                        </div>
                        <p className="text-gray-500 max-w-md text-sm leading-relaxed text-right">
                            Every scene is analyzed line-by-line using mathematical models to ensure motivation consistency and structural integrity.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-white/5">
                        <FeatureCard 
                            icon={<Cpu className="w-6 h-6" />}
                            title="Logic Engine"
                            desc="Game Theory algorithms analyze character strategies to detect irrational behavior or motivation gaps in real-time."
                        />
                        <FeatureCard 
                            icon={<Layers className="w-6 h-6" />}
                            title="Cinematic Visualization"
                            desc="High-fidelity conceptual anchors that bridge the gap between text and screen, rendered with professional aesthetic precision."
                        />
                        <FeatureCard 
                            icon={<Fingerprint className="w-6 h-6" />}
                            title="Motion Storyboards"
                            desc="Automated sequence generation from beat sheets, providing a cinematic motion preview of your project's rhythm."
                        />
                        <FeatureCard 
                            icon={<Compass className="w-6 h-6" />}
                            title="Analysis Lenses"
                            desc="Toggle between Market Viability, Thematic Consistency, and Structural Integrity diagnostics for comprehensive coverage."
                        />
                        <FeatureCard 
                            icon={<ShieldCheck className="w-6 h-6" />}
                            title="Universe Integrity"
                            desc="Our Project Bible maintains continuity across complex timelines and multiple characters, ensuring logic never breaks."
                        />
                        <div className="bg-black p-12 flex items-center justify-center">
                            <button className="text-[10px] font-black uppercase tracking-[0.3em] text-arc-teal hover:text-white transition-colors flex items-center gap-4">
                                Explore the API <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Professional Social Proof */}
            <section className="py-40 px-8 bg-black relative overflow-hidden">
                <div className="max-w-5xl mx-auto relative z-10">
                    <div className="flex flex-col md:flex-row gap-20 items-center">
                        <div className="relative">
                            <div className="w-48 h-64 bg-gray-900 border border-white/10 rounded-sm overflow-hidden grayscale hover:grayscale-0 transition-all duration-700">
                                <img 
                                    src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80" 
                                    className="w-full h-full object-cover"
                                    alt="Testimonial"
                                />
                            </div>
                            <div className="absolute -bottom-4 -right-4 w-20 h-20 bg-arc-teal flex items-center justify-center font-black text-black">
                                <span className="text-2xl">“</span>
                            </div>
                        </div>
                        
                        <div className="flex-1 text-left">
                            <p className="text-3xl md:text-5xl font-light text-white leading-tight mb-12 italic">
                                "The first serious instrument for script analysis. ArcWriter removes the guesswork from development."
                            </p>
                            <div>
                                <h4 className="font-black uppercase tracking-widest text-sm text-arc-teal mb-1">Marcus Vance</h4>
                                <p className="text-gray-500 uppercase tracking-widest text-[10px] font-bold">Principal Executive, Vance Media Group</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Cinematic CTA */}
            <section className="py-60 px-8 text-center bg-[#050505] relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-arc-teal/5 via-transparent to-transparent"></div>
                
                <div className="relative z-10 max-w-3xl mx-auto">
                    <span className="text-gray-600 text-[10px] font-black uppercase tracking-[1em] mb-12 block">The future is structural</span>
                    <h2 className="text-6xl md:text-8xl font-black uppercase tracking-tighter mb-12 leading-none">Ready for the <br /> <span className="text-arc-teal">Analysis?</span></h2>
                    <button 
                        onClick={() => navigate('/login')}
                        className="px-20 py-8 bg-arc-teal text-black font-black uppercase tracking-[0.3em] text-sm hover:bg-white transition-all duration-300"
                    >
                        Initialize Studio
                    </button>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-20 px-8 border-t border-white/5 bg-black flex flex-col md:flex-row justify-between items-center gap-10">
                <div className="flex items-center gap-4">
                    <div className="w-6 h-6 bg-gray-900 rotate-45 border border-white/20"></div>
                    <span className="text-[10px] font-black tracking-widest uppercase">ArcWriter Studio © 2026</span>
                </div>
                
                <div className="flex gap-12 text-[9px] font-bold uppercase tracking-[0.2em] text-gray-600">
                    <a href="#" className="hover:text-white transition-colors">Privacy Protocol</a>
                    <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
                    <a href="#" className="hover:text-white transition-colors">Neural Assets</a>
                </div>

                <div className="flex gap-6">
                    <div className="w-8 h-px bg-gray-800 self-center"></div>
                    <span className="text-[9px] font-black uppercase tracking-widest text-gray-800">Designed for Screenwriters</span>
                </div>
            </footer>
        </div>
    );
};

const FeatureCard = ({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) => (
    <div className="bg-black p-12 hover:bg-[#080808] transition-all duration-500 group border border-transparent hover:border-arc-teal/30">
        <div className="text-arc-teal mb-8 group-hover:scale-110 transition-transform duration-500 inline-block">
            {icon}
        </div>
        <h3 className="text-xl font-black uppercase tracking-tight mb-4 group-hover:text-arc-teal transition-colors">{title}</h3>
        <p className="text-gray-500 text-sm leading-relaxed font-light">{desc}</p>
    </div>
);

const ArrowRight = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
    </svg>
);

export default LandingPage;
