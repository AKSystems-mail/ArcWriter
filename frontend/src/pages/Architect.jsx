import React, { useState, useEffect } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import BeatSheetForm from '../components/BeatSheetForm';
import CharacterProfile from '../components/CharacterProfile';
import MobilePitchDeck from '../components/MobilePitchDeck';
import VisualsStudio from '../components/VisualsStudio';
import { useResponsive } from '../hooks/useResponsive';
import { auth } from '../firebase';
import { BookOpen, LogOut, ChevronLeft } from 'lucide-react';

const Architect = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const params = useParams();
    const { isMobile } = useResponsive();
    const [projectData, setProjectData] = useState(null);
    const [loading, setLoading] = useState(true);

    const projectId = params.projectId || location.state?.project_id || "default_project";
    const universeId = location.state?.universe_id || "default_universe"; 

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
            }
        } catch (error) {
            console.error("Error fetching project:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProject();
    }, [universeId, projectId]);

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center">
                <div className="animate-spin h-8 w-8 border-2 border-arc-teal border-t-transparent rounded-full mb-4"></div>
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-arc-teal animate-pulse">Synchronizing Blueprint...</span>
            </div>
        );
    }

    if (isMobile) {
        return (
            <div className="min-h-screen bg-black">
                <MobilePitchDeck
                    projectTitle={projectData?.title || "Untitled Project"}
                    tagline={projectData?.logline || "A story worth telling"}
                    synopsis={projectData?.synopsis || projectData?.bible_content || "No synopsis found."}
                    posterUrl={projectData?.poster_url}
                    teaserUrl={projectData?.teaser_url}
                    characters={projectData?.characters}
                />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white selection:bg-arc-teal/30 selection:text-arc-teal">
            {/* Professional Studio Header */}
            <nav className="fixed top-0 w-full z-[100] px-8 py-6 flex justify-between items-center bg-[#050505] border-b border-white/5">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-4 group cursor-pointer" onClick={() => navigate('/dashboard')}>
                        <img src="/ArcWriter_logo.png" alt="ArcWriter" className="h-8" />
                        <div className="h-4 w-px bg-gray-800"></div>
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400 group-hover:text-arc-teal transition-colors">Studio</span>
                    </div>
                    <div className="h-4 w-px bg-gray-800"></div>
                    <div className="flex items-center gap-3">
                        <span className="text-[9px] font-black uppercase tracking-widest text-gray-600 italic">Project</span>
                        <span className="text-xs font-black uppercase tracking-tight text-white">{projectData?.title || 'Initializing...'}</span>
                    </div>
                </div>
                
                <div className="flex items-center gap-8">
                    <button 
                        onClick={() => navigate(`/project/${projectId}/editor`, { state: { project_id: projectId, universe_id: universeId } })}
                        className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.2em] text-gray-500 hover:text-white transition-all group"
                    >
                        <BookOpen className="w-3.5 h-3.5 text-arc-teal group-hover:scale-110 transition-transform" />
                        <span>Script Editor</span>
                    </button>
                    <div className="h-4 w-px bg-gray-800"></div>
                    <button onClick={() => auth.signOut()} className="p-2 hover:bg-red-500/10 rounded-full text-gray-700 hover:text-red-500 transition-all">
                        <LogOut className="w-4 h-4" />
                    </button>
                </div>
            </nav>

            <main className="pt-32 px-8 md:px-12 pb-20 max-w-[1600px] mx-auto animate-fade-in">
                <header className="mb-16 flex justify-between items-end">
                    <div>
                        <span className="text-arc-teal text-[10px] font-black uppercase tracking-[0.5em] mb-4 block italic">Architecture Mode</span>
                        <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter leading-none mb-4">
                            The <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-600">Blueprint</span>
                        </h1>
                        <p className="text-gray-500 text-lg font-light italic border-l border-white/10 pl-6 py-1">
                            Structural engineering for professional narrative assets.
                        </p>
                    </div>
                    <div className="hidden md:flex flex-col items-end gap-2 text-right">
                        <span className="text-[9px] font-black uppercase tracking-widest text-gray-700">Studio Version</span>
                        <span className="text-xs font-black text-gray-500">ARC-ENGINE v2.5.4</span>
                    </div>
                </header>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-40 gap-6">
                        <div className="w-12 h-12 border-2 border-white/5 border-t-arc-teal rounded-full animate-spin" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-600 animate-pulse">Accessing Project DNA...</span>
                    </div>
                ) : (
                    <div className="space-y-24">
                        {/* Visuals Department */}
                        <section className="relative">
                            <VisualsStudio 
                                projectData={projectData} 
                                universeId={universeId} 
                                projectId={projectId} 
                                onRefresh={fetchProject}
                            />
                        </section>

                        <div className="h-px w-full bg-gradient-to-r from-transparent via-white/5 to-transparent" />

                        {/* Narrative Structure */}
                        <section className="relative">
                            <BeatSheetForm
                                initialBeats={projectData?.beat_sheet_data || projectData?.beat_sheet}
                                universeId={universeId}
                                projectId={projectId}
                            />
                        </section>

                        <div className="h-px w-full bg-gradient-to-r from-transparent via-white/5 to-transparent" />

                        {/* Personnel / Entities */}
                        <section className="relative">
                            <CharacterProfile
                                universeId={universeId}
                                projectId={projectId}
                                initialCharacters={projectData?.characters}
                            />
                        </section>
                    </div>
                )}
            </main>
        </div>
    );
};

export default Architect;