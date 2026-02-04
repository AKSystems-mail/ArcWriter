import React from 'react';
import { useNavigate } from 'react-router-dom';

const LandingPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-obsidian-black text-white font-sans selection:bg-arc-teal selection:text-white">
            {/* Navigation */}
            <nav className="fixed top-0 w-full z-50 bg-obsidian-black/50 backdrop-blur-xl border-b border-gray-900 px-8 py-4 flex justify-between items-center animate-fade-in">
                <div className="flex items-center gap-2">
                    <img src="/Arc%20Main.png" alt="ArcWriter" className="h-10" />
                </div>
                <button
                    onClick={() => navigate('/login')}
                    className="text-sm font-black uppercase tracking-widest text-white hover:text-arc-teal transition-colors"
                >
                    Sign In
                </button>
            </nav>

            {/* Hero Section */}
            <section className="relative h-screen flex flex-col items-center justify-center p-8 overflow-hidden">
                {/* Background Video/Image Overlay */}
                <div className="absolute inset-0 z-0">
                    <div className="absolute inset-0 bg-gradient-to-b from-obsidian-black via-transparent to-obsidian-black z-10"></div>
                    <div className="absolute inset-0 bg-gradient-to-r from-obsidian-black via-transparent to-obsidian-black z-10 opacity-80"></div>
                    <img
                        src="https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=2000&q=80"
                        alt="Cinematic background"
                        className="w-full h-full object-cover opacity-30 scale-110 animate-pulse duration-[10000ms]"
                    />
                </div>

                <div className="relative z-20 text-center max-w-5xl animate-fade-in">
                    <h1 className="text-7xl md:text-9xl font-black mb-8 tracking-tighter leading-none">
                        FROM <span className="text-arc-teal">BRAINSTORM</span><br />
                        TO <span className="text-arc-orange">BLOCKBUSTER</span>
                    </h1>
                    <p className="text-xl md:text-3xl text-gray-400 mb-12 font-light max-w-3xl mx-auto leading-relaxed">
                        The Structural Co-Pilot for the Professional Screenwriter.
                        Design worlds, stress-test plots, and render the future of cinema with Draft Assist.
                    </p>
                    <div className="flex flex-col md:flex-row gap-6 justify-center">
                        <button
                            onClick={() => navigate('/login')}
                            className="bg-arc-orange hover:bg-opacity-90 text-white font-black py-5 px-12 rounded-2xl text-xl transition-all transform hover:scale-105 shadow-2xl shadow-arc-orange/30 active:scale-95"
                        >
                            ACCESS THE STUDIO
                        </button>
                        <button className="bg-white/5 border border-white/10 hover:bg-white/10 text-white font-black py-5 px-12 rounded-2xl text-xl backdrop-blur-xl transition-all active:scale-95">
                            WATCH DEMO
                        </button>
                    </div>
                </div>

                {/* Floating Elements for depth */}
                <div className="absolute bottom-20 left-1/2 -translate-x-1/2 animate-bounce flex flex-col items-center">
                    <span className="text-[10px] font-black uppercase tracking-[0.5em] text-gray-500 mb-4">Discover More</span>
                    <div className="h-12 w-[1px] bg-gradient-to-b from-arc-teal to-transparent"></div>
                </div>
            </section>

            {/* Feature Grid */}
            <section className="py-32 px-8 bg-obsidian-black relative">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                        {/* Feature 1 */}
                        <div className="group p-10 bg-gray-900/40 backdrop-blur-md rounded-[3rem] border border-gray-800 hover:border-arc-teal transition-all duration-500 shadow-2xl">
                            <div className="h-16 w-16 bg-arc-teal/20 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                                <span className="text-arc-teal text-3xl font-black">⬡</span>
                            </div>
                            <h3 className="text-2xl font-black mb-4 text-white uppercase tracking-tight">Game Theory Logic</h3>
                            <p className="text-gray-400 text-lg leading-relaxed">
                                Our engine mathematically stress-tests your plot for holes, ensuring your narrative
                                structure is as unbreakable as a diamond.
                            </p>
                        </div>

                        {/* Feature 2 */}
                        <div className="group p-10 bg-gray-900/40 backdrop-blur-md rounded-[3rem] border border-gray-800 hover:border-arc-orange transition-all duration-500 shadow-2xl">
                            <div className="h-16 w-16 bg-arc-orange/20 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                                <span className="text-arc-orange text-3xl font-black">✧</span>
                            </div>
                            <h3 className="text-2xl font-black mb-4 text-white uppercase tracking-tight">Cinematic Visualization</h3>
                            <p className="text-gray-400 text-lg leading-relaxed">
                                Instantly generate high-fidelity posters, character anchors, and atmospheric mood boards
                                that capture the spirit of your script.
                            </p>
                        </div>

                        {/* Feature 3 */}
                        <div className="group p-10 bg-gray-900/40 backdrop-blur-md rounded-[3rem] border border-gray-800 hover:border-arc-teal transition-all duration-500 shadow-2xl">
                            <div className="h-16 w-16 bg-arc-teal/20 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                                <span className="text-arc-teal text-3xl font-black">▶</span>
                            </div>
                            <h3 className="text-2xl font-black mb-4 text-white uppercase tracking-tight">Motion Storyboards</h3>
                            <p className="text-gray-400 text-lg leading-relaxed">
                                Transform your beat sheet into a cinematic 30-second motion teaser. Pitch with the
                                power of motion before a single frame is shot.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Social Proof / Testimonial */}
            <section className="py-32 px-8 bg-gradient-to-b from-gray-900/20 to-obsidian-black relative overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-arc-teal/5 rounded-full blur-[120px] pointer-events-none"></div>
                <div className="max-w-4xl mx-auto text-center relative z-10">
                    <div className="text-arc-orange text-6xl mb-8 font-serif leading-none opacity-50">“</div>
                    <blockquote className="text-4xl md:text-5xl font-black text-white italic tracking-tighter leading-tight mb-12">
                        ArcWriter isn't just a tool; it's a co-pilot. I haven't seen a pitch deck this
                        complete since the last time I sat in a board room at Warner Bros.
                        It's the future of film development.
                    </blockquote>
                    <div className="flex flex-col items-center">
                        <div className="h-12 w-12 bg-gray-700 rounded-full mb-4 bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80')" }}></div>
                        <p className="font-black text-white uppercase tracking-widest text-sm">Marcus Vance</p>
                        <p className="text-arc-teal font-bold uppercase tracking-[0.2em] text-[10px]">Senior Studio Executive</p>
                    </div>
                </div>
            </section>

            {/* Footer / Final CTA */}
            <footer className="py-20 px-8 border-t border-gray-900 text-center">
                <img src="/Arc%20Main.png" alt="Arc" className="h-12 mx-auto mb-10 opacity-30" />
                <p className="text-gray-500 text-xs font-black uppercase tracking-[0.5em] mb-4">The Architect's chair is waiting.</p>
                <div className="flex justify-center gap-8 mb-12">
                    <button onClick={() => navigate('/login')} className="text-gray-400 hover:text-white transition-colors uppercase tracking-widest text-[10px] font-black">Login</button>
                    <button className="text-gray-400 hover:text-white transition-colors uppercase tracking-widest text-[10px] font-black">Terms</button>
                    <button className="text-gray-400 hover:text-white transition-colors uppercase tracking-widest text-[10px] font-black">Privacy</button>
                </div>
                <p className="text-gray-700 text-[10px] font-black uppercase tracking-widest">© 2026 ArcWriter Studio. All Rights Reserved.</p>
            </footer>
        </div>
    );
};

export default LandingPage;
