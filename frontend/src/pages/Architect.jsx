import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import BeatSheetForm from '../components/BeatSheetForm';
import CharacterProfile from '../components/CharacterProfile';
import ProjectHeader from '../components/ProjectHeader';
import MobilePitchDeck from '../components/MobilePitchDeck';
import { useResponsive } from '../hooks/useResponsive';
import { auth } from '../firebase';

const Architect = () => {
    const location = useLocation();
    const { isMobile } = useResponsive();
    const [projectData, setProjectData] = useState(null);
    const [formData, setFormData] = useState({});
    const [loading, setLoading] = useState(true);

    const universeId = location.state?.universe_id || "default_universe";
    const projectId = location.state?.project_id || "default_project";

    useEffect(() => {
        const fetchProject = async () => {
            try {
                const token = await auth.currentUser?.getIdToken();
                if (!token) return;

                const response = await fetch(`/api/project/${universeId}/${projectId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (response.ok) {
                    const data = await response.json();
                    setProjectData(data);

                    // Pre-fill form if beat_sheet_data exists
                    if (data.beat_sheet_data) {
                        setFormData(data.beat_sheet_data);
                    } else if (data.beat_sheet) {
                        setFormData(data.beat_sheet);
                    }
                }
            } catch (error) {
                console.error("Error fetching project:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchProject();
    }, [universeId, projectId]);

    // If mobile, show pitch deck instead of editor
    if (isMobile) {
        return (
            <div className="min-h-screen bg-obsidian-black">
                <MobilePitchDeck
                    projectTitle={projectData?.title || "My Awesome Project"}
                    tagline={projectData?.logline || "A story worth telling"}
                    synopsis={projectData?.bible_content || "Loading synopsis..."}
                />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-obsidian-black p-8 relative overflow-hidden">
            <div className="absolute inset-0 z-0 bg-gradient-to-b from-arc-teal/5 to-transparent opacity-30"></div>

            <div className="relative z-10 animate-fade-in">
                <ProjectHeader
                    universeId={universeId}
                    projectId={projectId}
                    projectTitle={projectData?.title || "My Awesome Project"}
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
                {loading ? (
                    <div className="text-center py-20 text-gray-500">Loading your project structure...</div>
                ) : (
                    <BeatSheetForm
                        initialBeats={projectData?.beat_sheet_data || projectData?.beat_sheet}
                        universeId={universeId}
                        projectId={projectId}
                    />
                )}
                <CharacterProfile
                    initialCharacters={projectData?.characters}
                    universeId={universeId}
                    projectId={projectId}
                />
            </main>
        </div>
    );
};

export default Architect;