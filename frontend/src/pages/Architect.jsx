import React, { useState, useEffect } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import BeatSheetForm from '../components/BeatSheetForm';
import CharacterProfile from '../components/CharacterProfile';
import MobilePitchDeck from '../components/MobilePitchDeck';
import VisualsStudio from '../components/VisualsStudio';
import PitchTracker from '../components/PitchTracker';
import { useResponsive } from '../hooks/useResponsive';
import { auth, db } from '../firebase';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { BookOpen, LogOut, ChevronLeft, CreditCard, Activity, User } from 'lucide-react';

const Architect = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const params = useParams();
    const { isMobile } = useResponsive();
    const [projectData, setProjectData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [userProfile, setUserProfile] = useState(null);
    const characterSectionRef = React.useRef(null);

    const projectId = params.projectId || location.state?.project_id || "default_project";
    const universeId = location.state?.universe_id || "default_universe"; 

    const scrollToCharacters = () => {
        characterSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    useEffect(() => {
        if (!auth.currentUser) return;
        const unsub = onSnapshot(doc(db, 'users', auth.currentUser.uid), (doc) => {
            setUserProfile(doc.data());
        });
        return () => unsub();
    }, []);

    useEffect(() => {
        const fetchContinuity = async () => {
            if (projectData?.format === 'tv_series' && universeId) {
                try {
                    const token = await auth.currentUser?.getIdToken();
                    const response = await fetch(`/api/projects/${universeId}/continuity`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (response.ok) {
                        const data = await response.json();
                        // We could use this to suggest characters or auto-add them
                        console.log("Continuity Data Loaded:", data);
                    }
                } catch (err) {
                    console.error("Continuity Error:", err);
                }
            }
        };
        if (projectData) fetchContinuity();
    }, [projectData, universeId]);

    const fetchProject = async () => {
        try {
            const token = await auth.currentUser?.getIdToken();
            if (!token) return;

            // 1. Try API first
            try {
                const response = await fetch(`/api/project/${universeId}/${projectId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (response.ok) {
                    const data = await response.json();
                    setProjectData(data);
                    setLoading(false);
                    return;
                }
            } catch (apiErr) {
                console.warn("API Unavailable, falling back to direct Firestore fetch");
            }

            // 2. Fallback to direct Firestore if API fails
            const projectRef = doc(db, 'universes', universeId, 'projects', projectId);
            const snap = await getDoc(projectRef);
            if (snap.exists()) {
                setProjectData({ id: snap.id, ...snap.data() });
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
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white group-hover:text-arc-teal transition-colors">Studio</span>
                    </div>
                    <div className="h-4 w-px bg-gray-800"></div>
                    <div className="flex items-center gap-3">
                        <span className="text-[9px] font-black uppercase tracking-widest text-white/60 italic">Project</span>
                        <span className="text-xs font-black uppercase tracking-tight text-white">{projectData?.title || 'Initializing...'}</span>
                    </div>
                </div>
                
                <div className="flex items-center gap-8">
                    <button 
                        onClick={() => navigate('/billing')}
                        className="flex items-center gap-2 px-4 py-2 hover:bg-arc-teal/10 rounded-full border border-arc-teal/20 transition-all text-arc-teal hover:text-white"
                    >
                        <CreditCard className="w-3 h-3" />
                        <span className="text-[9px] font-black uppercase tracking-widest">Upgrade Plan</span>
                    </button>
                    <button 
                        onClick={() => navigate(`/project/${projectId}/editor`, { state: { project_id: projectId, universe_id: universeId } })}
                        className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.2em] text-white hover:text-arc-teal transition-all group"
                    >
                        <BookOpen className="w-3.5 h-3.5 text-arc-teal group-hover:scale-110 transition-transform" />
                        <span>Script Editor</span>
                    </button>
                    <div className="h-4 w-px bg-gray-800"></div>
                    <button onClick={() => auth.signOut()} className="p-2 hover:bg-red-500/10 rounded-full text-white/60 hover:text-red-500 transition-all">
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
                        <p className="text-white/80 text-lg font-normal italic border-l border-white/10 pl-6 py-1">
                            Structural engineering for professional narrative assets.
                        </p>
                    </div>
                    <div className="hidden md:flex flex-col items-end gap-2 text-right">
                        <span className="text-[9px] font-black uppercase tracking-widest text-white/40">Studio Version</span>
                        <span className="text-xs font-black text-white/60">ARC-ENGINE v2.5.4</span>
                    </div>
                </header>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-40 gap-6">
                        <div className="w-12 h-12 border-2 border-white/5 border-t-arc-teal rounded-full animate-spin" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-white/50 animate-pulse">Accessing Project DNA...</span>
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
                            <div className="flex justify-between items-center mb-8">
                                <div className="flex items-center gap-3">
                                    <span className="text-arc-teal text-[10px] font-black uppercase tracking-[0.5em] italic text-white/40">Section 03: Narrative Logic</span>
                                </div>
                                <button 
                                    onClick={scrollToCharacters}
                                    className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-arc-teal/20 border border-white/10 hover:border-arc-teal/30 rounded-sm transition-all group shadow-2xl"
                                >
                                    <User className="w-3.5 h-3.5 text-arc-teal group-hover:scale-110 transition-transform" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-white group-hover:text-white transition-colors">Add / Edit Characters</span>
                                </button>
                            </div>
                            <BeatSheetForm
                                initialBeats={projectData?.beat_sheet_data || projectData?.beat_sheet}
                                universeId={universeId}
                                projectId={projectId}
                                format={projectData?.format || 'movie'}
                            />
                        </section>

                        <div className="h-px w-full bg-gradient-to-r from-transparent via-white/5 to-transparent" />

                        {/* Personnel / Entities */}
                        <section ref={characterSectionRef} className="relative scroll-mt-32">
                            <CharacterProfile
                                universeId={universeId}
                                projectId={projectId}
                                initialCharacters={projectData?.characters}
                            />
                        </section>

                        <div className="h-px w-full bg-gradient-to-r from-transparent via-white/5 to-transparent" />

                        {/* Distribution & Intelligence */}
                        <section className="relative pb-20">
                            <div className="flex items-center gap-3 mb-12">
                                <span className="text-arc-teal text-[10px] font-black uppercase tracking-[0.5em] italic text-white/40">Section 05: Intelligence</span>
                            </div>
                            <div className="mb-12">
                                <h2 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter">
                                    Pitch <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-600">Tracker</span>
                                </h2>
                                <p className="text-white/60 mt-4 text-lg font-light italic">Monitor industry engagement and manage asset distribution.</p>
                            </div>
                            
                            <PitchTracker 
                                universeId={universeId} 
                                projectId={projectId} 
                                isSubscriber={userProfile?.subscription_status === 'active'} 
                            />
                        </section>
                    </div>
                )}
            </main>
        </div>
    );
};

export default Architect;