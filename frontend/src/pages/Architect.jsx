import React from 'react';
import BeatSheetForm from '../components/BeatSheetForm';
import CharacterProfile from '../components/CharacterProfile';
import ProjectHeader from '../components/ProjectHeader';
import MobilePitchDeck from '../components/MobilePitchDeck';
import { useResponsive } from '../hooks/useResponsive';

const Architect = () => {
    const { isMobile } = useResponsive();

    // Placeholder values for universeName and projectId
    // In a real application, these would come from routing parameters or global state
    const currentUniverseName = "default";
    const currentProjectId = "operation_blackout";

    // If mobile, show pitch deck instead of editor
    if (isMobile) {
        return (
            <div className="min-h-screen bg-obsidian-black">
                <MobilePitchDeck
                    projectTitle="My Awesome Project"
                    tagline="A story worth telling"
                    synopsis="Year 2077. The megacity of Neo-Veridia thrives under the iron fist of the omniscient Aethel Corp, a company that controls every aspect of its citizens' lives through advanced neural implants. Kael, a former data architect now living off-grid, stumbles upon a suppressed historical archive revealing Aethel Corp's true origins: a brutal coup that erased the true founding principles of the city."
                />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-obsidian-black p-8 relative overflow-hidden">
            <div className="absolute inset-0 z-0 bg-gradient-to-b from-arc-teal/5 to-transparent opacity-30"></div>

            <div className="relative z-10 animate-fade-in">
                <ProjectHeader
                    universeName={currentUniverseName}
                    projectId={currentProjectId}
                    projectTitle="My Awesome Project"
                />
            </div>

            <header className="relative z-10 mb-12 border-b border-gray-800 pb-8 flex justify-between items-end animate-fade-in-delayed">
                <div>
                    <h1 className="text-4xl font-black text-white tracking-tight flex items-center gap-3">
                        <span className="text-arc-teal text-5xl">⬡</span> Architect Mode
                    </h1>
                    <p className="text-gray-400 mt-2 text-lg">Structure your narrative using the Save the Cat framework.</p>
                </div>
                <img src="/Arc%20Main.png" alt="Arc" className="h-16 opacity-50 grayscale hover:grayscale-0 transition-all duration-500" />
            </header>

            <main className="relative z-10 space-y-12 pb-20 animate-fade-in-delayed" style={{ animationDelay: '0.4s' }}>
                <BeatSheetForm />
                <CharacterProfile />
            </main>
        </div>
    );
};

export default Architect;