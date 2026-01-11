import React, { useState } from 'react';
import MobilePitchDeck from '../components/MobilePitchDeck';
import { useResponsive } from '../hooks/useResponsive';

const Explorer = () => {
    const { isMobile } = useResponsive();
    const [vibe, setVibe] = useState('');

    // If mobile, show pitch deck instead of editor
    if (isMobile) {
        return (
            <div className="min-h-screen bg-obsidian-black">
                <MobilePitchDeck
                    projectTitle="Explorer Project"
                    tagline="Discover your story"
                    synopsis="Year 2077. The megacity of Neo-Veridia thrives under the iron fist of the omniscient Aethel Corp, a company that controls every aspect of its citizens' lives through advanced neural implants. Kael, a former data architect now living off-grid, stumbles upon a suppressed historical archive revealing Aethel Corp's true origins: a brutal coup that erased the true founding principles of the city."
                />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-obsidian-black p-8 relative overflow-hidden">
            <div className="absolute inset-0 z-0 bg-gradient-to-tr from-arc-orange/5 to-transparent opacity-40"></div>

            <header className="relative z-10 mb-12 border-b border-gray-800 pb-8 flex justify-between items-end animate-fade-in">
                <div>
                    <h1 className="text-4xl font-black text-white tracking-tight flex items-center gap-3">
                        <span className="text-arc-orange text-5xl">✧</span> Explorer Mode
                    </h1>
                    <p className="text-gray-400 mt-2 text-lg font-light uppercase tracking-widest">Brainstorm and iterate freely.</p>
                </div>
                <img src="/Arc%20Main.png" alt="Arc" className="h-16 opacity-50 grayscale hover:grayscale-0 transition-all duration-500" />
            </header>

            <div className="relative z-10 flex flex-col gap-8 max-w-5xl animate-fade-in-delayed" style={{ animationDelay: '0.4s' }}>
                <div className="bg-gray-900/40 backdrop-blur-md rounded-[2.5rem] border border-gray-800 p-10 shadow-2xl">
                    <label className="block text-xs font-black uppercase tracking-[0.3em] text-gray-500 mb-6">Atmospheric Vector</label>
                    <textarea
                        className="w-full h-80 p-8 rounded-2xl bg-gray-800/30 border border-gray-700 text-white font-courier text-xl focus:ring-2 focus:ring-arc-orange focus:border-arc-orange outline-none shadow-inner transition-all leading-relaxed"
                        placeholder="Describe the 'vibe', a character fragment, or a haunting image..."
                        value={vibe}
                        onChange={(e) => setVibe(e.target.value)}
                    />

                    <div className="mt-10 flex justify-end">
                        <button className="bg-arc-orange hover:bg-opacity-90 text-white font-black py-4 px-12 rounded-xl transition-all shadow-xl shadow-arc-orange/20 active:scale-95 text-lg">
                            GENERATE PROJECT BIBLE
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Explorer;

