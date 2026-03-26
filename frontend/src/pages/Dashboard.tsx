import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { collectionGroup, query, where, getDocs, doc, updateDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { Plus, Film, BookOpen, Clock, ChevronRight, Edit2, Trash2, RotateCcw, XCircle, Target, LogOut, CreditCard, Activity } from 'lucide-react';
import ContextualHelp from '../components/ContextualHelp';

interface Project {
    id: string;
    universe_id: string;
    title: string;
    genre: string;
    poster_url?: string;
    created_at?: any;
    logline?: string;
    status?: string; // 'active' | 'archived'
}

const Dashboard: React.FC = () => {
    const navigate = useNavigate();
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState<'active' | 'archived'>('active');

    useEffect(() => {
        const user = auth.currentUser;
        if (!user) {
            setLoading(false);
            return;
        }

        const projectsQuery = query(
            collectionGroup(db, 'projects'),
            where('owner_id', '==', user.uid)
        );

        const unsubscribe = onSnapshot(projectsQuery, (querySnapshot) => {
            const projectsList: Project[] = [];
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                const universeId = doc.ref.parent.parent?.id || "default";
                
                projectsList.push({
                    id: doc.id,
                    universe_id: universeId,
                    title: data.title || "Untitled Project",
                    genre: data.genre || "Unknown Genre",
                    poster_url: data.poster_url,
                    created_at: data.created_at,
                    logline: data.logline,
                    status: data.status || 'active'
                });
            });

            projectsList.sort((a, b) => (b.created_at?.seconds || 0) - (a.created_at?.seconds || 0));
            setProjects(projectsList);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching projects with snapshot listener:", error);
            setLoading(false);
        });

        return () => unsubscribe(); // Cleanup the listener on unmount
    }, []);

    const handleEditTitle = async (e: React.MouseEvent, project: Project) => {
        e.stopPropagation();
        const newTitle = window.prompt("Enter new project title:", project.title);
        if (newTitle && newTitle !== project.title) {
            try {
                const projectRef = doc(db, 'universes', project.universe_id, 'projects', project.id);
                await updateDoc(projectRef, { title: newTitle });
                setProjects(prev => prev.map(p => p.id === project.id ? { ...p, title: newTitle } : p));
            } catch (error) {
                console.error("Error updating title:", error);
            }
        }
    };

    const handleArchiveProject = async (e: React.MouseEvent, project: Project) => {
        e.stopPropagation();
        if (window.confirm("Trigger Pinch Point 1? This will move the project to the Archive for 30 days.")) {
            try {
                const projectRef = doc(db, 'universes', project.universe_id, 'projects', project.id);
                await updateDoc(projectRef, { status: 'archived', archived_at: new Date() });
                setProjects(prev => prev.map(p => p.id === project.id ? { ...p, status: 'archived' } : p));
            } catch (error) {
                console.error("Archive failed:", error);
            }
        }
    };

    const handleRestoreProject = async (e: React.MouseEvent, project: Project) => {
        e.stopPropagation();
        try {
            const projectRef = doc(db, 'universes', project.universe_id, 'projects', project.id);
            await updateDoc(projectRef, { status: 'active' });
            setProjects(prev => prev.map(p => p.id === project.id ? { ...p, status: 'active' } : p));
            alert("Back to Production. Project is in your active list.");
        } catch (error) {
            console.error("Restore failed:", error);
        }
    };

    const handlePermanentDelete = async (e: React.MouseEvent, project: Project) => {
        e.stopPropagation();
        const confirmation = window.prompt(`Burn the Negative. To permanently delete this project, type its name: "${project.title}"`);
        
        if (confirmation === project.title) {
            try {
                const projectRef = doc(db, 'universes', project.universe_id, 'projects', project.id);
                await deleteDoc(projectRef);
                setProjects(prev => prev.filter(p => p.id !== project.id));
                alert("The story has ended. Project permanently removed.");
            } catch (error) {
                console.error("Delete failed:", error);
            }
        } else if (confirmation !== null) {
            alert("Names did not match. The story continues.");
        }
    };

    const handleProjectClick = (project: Project) => {
        navigate(`/project/${project.id}/editor`, {
            state: { project_id: project.id, universe_id: project.universe_id }
        });
    };

    const filteredProjects = projects.filter(p => p.status === view);

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center">
                <div className="w-16 h-16 border-4 border-arc-teal border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-arc-teal font-black tracking-widest animate-pulse">SYNCHRONIZING STUDIO...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white">
            {/* Top Navigation */}
            <nav className="w-full z-[100] px-8 py-6 flex justify-between items-center bg-[#050505] border-b border-white/5">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-4 group cursor-pointer" onClick={() => navigate('/')}>
                        <img src="/ArcWriter_logo.png" alt="ArcWriter" className="h-8" />
                        <div className="h-4 w-px bg-gray-800"></div>
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/70 group-hover:text-arc-teal transition-colors">Architecture</span>
                    </div>
                    <div className="h-4 w-px bg-gray-800"></div>
                    <button 
                        onClick={() => navigate('/tracker')}
                        className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.2em] text-white/60 hover:text-arc-teal transition-all group"
                    >
                        <Activity className="w-3.5 h-3.5 text-arc-teal group-hover:animate-pulse" />
                        <span>Pitch Tracker</span>
                    </button>
                </div>
                
                <div className="flex items-center gap-6">
                    <button 
                        onClick={() => navigate('/billing')}
                        className="flex items-center gap-2 px-4 py-2 hover:bg-arc-teal/10 rounded-full border border-arc-teal/20 transition-all text-arc-teal hover:text-white"
                    >
                        <CreditCard className="w-3 h-3" />
                        <span className="text-[9px] font-black uppercase tracking-widest">Upgrade Plan</span>
                    </button>
                    <div className="flex items-center gap-2 px-4 py-2 bg-gray-900/50 rounded-full border border-white/5">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                        <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">{auth.currentUser?.displayName || 'Studio Member'}</span>
                    </div>
                    <button onClick={() => auth.signOut()} className="p-2 hover:bg-red-500/10 rounded-full text-gray-500 hover:text-red-500 transition-all">
                        <LogOut className="w-4 h-4" />
                    </button>
                </div>
            </nav>

            <div className="max-w-7xl mx-auto p-8 md:p-12">
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-16 gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <span className="text-arc-teal text-[10px] font-black uppercase tracking-[0.5em] italic">Studio Archives | v2.5.4-REDR</span>
                            <ContextualHelp sectionId="DASHBOARD" />
                        </div>
                        <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase leading-[1.1] py-2">
                            {view === 'active' ? <>Active <br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-600 pr-4">Assets</span></> : <>Cutting <br /><span className="text-red-500">Room Floor</span></>}
                        </h1>
                    </div>
                    
                    <div className="flex gap-4">
                        <button
                            onClick={() => setView(view === 'active' ? 'archived' : 'active')}
                            className="bg-black border border-white/10 hover:border-white/20 text-gray-500 hover:text-white font-black text-[10px] uppercase tracking-widest py-4 px-8 rounded-sm transition-all"
                        >
                            {view === 'active' ? "Archives" : "Studio"}
                        </button>
                        {view === 'active' && (
                            <button
                                onClick={() => navigate('/wizard')}
                                className="group bg-white hover:bg-arc-teal text-black font-black py-4 px-10 rounded-sm flex items-center gap-3 transition-all transform active:scale-95 shadow-2xl shadow-white/5"
                            >
                                <Plus className="w-5 h-5" />
                                NEW PROJECT
                            </button>
                        )}
                    </div>
                </header>

                {filteredProjects.length === 0 ? (
                    <div className="bg-gray-900/20 border border-dashed border-white/10 rounded-lg py-40 flex flex-col items-center justify-center text-center px-6">
                        <Film className="w-16 h-16 text-gray-800 mb-8" />
                        <h2 className="text-3xl font-bold mb-4 opacity-50 uppercase tracking-tighter">{view === 'active' ? "No active assets." : "The floor is clean."}</h2>
                        <p className="text-gray-600 max-w-sm text-sm uppercase tracking-widest font-bold">
                            {view === 'active' ? "Initialize your perfect pitch to see it here." : "No projects are currently marked for deletion."}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
                        {filteredProjects.map((project) => (
                            <div
                                key={project.id}
                                onClick={() => view === 'active' && handleProjectClick(project)}
                                className={`group relative bg-[#080808] border border-white/5 rounded-sm overflow-hidden transition-all duration-500 flex flex-col h-full ${view === 'active' ? 'hover:border-white/20 cursor-pointer shadow-2xl hover:shadow-arc-teal/5' : 'opacity-60'}`}
                            >
                                <div className="h-64 overflow-hidden relative bg-black">
                                    {project.poster_url && !project.poster_url.includes('placehold.co') ? (
                                        <img src={project.poster_url} alt={project.title} className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-1000" />
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center">
                                            <div className="w-10 h-10 border-2 border-white/5 border-t-arc-teal rounded-full animate-spin mb-4" />
                                            <span className="text-[9px] font-black uppercase tracking-widest text-gray-600">Rendering Asset...</span>
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#080808] via-transparent to-transparent opacity-80" />
                                    <div className="absolute top-4 right-4 bg-black/80 backdrop-blur-md px-3 py-1 rounded-sm border border-white/5">
                                        <span className="text-[9px] font-black uppercase tracking-widest text-arc-teal">{project.genre}</span>
                                    </div>
                                    
                                    <div className="absolute top-4 left-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {view === 'active' ? (
                                            <button 
                                                onClick={(e) => handleArchiveProject(e, project)}
                                                className="p-2 bg-black/80 backdrop-blur-md rounded-full border border-white/10 text-gray-500 hover:text-red-500 transition-colors"
                                                title="Archive Asset"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        ) : (
                                            <>
                                                <button 
                                                    onClick={(e) => handleRestoreProject(e, project)}
                                                    className="p-2 bg-black/80 backdrop-blur-md rounded-full border border-white/10 text-green-500 hover:bg-green-500 hover:text-black transition-colors"
                                                    title="Restore Asset"
                                                >
                                                    <RotateCcw className="w-4 h-4" />
                                                </button>
                                                <button 
                                                    onClick={(e) => handlePermanentDelete(e, project)}
                                                    className="p-2 bg-black/80 backdrop-blur-md rounded-full border border-white/10 text-red-500 hover:bg-red-500 hover:text-white transition-colors"
                                                    title="Permanent Deletion"
                                                >
                                                    <XCircle className="w-4 h-4" />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>

                                <div className="p-10 flex-1 flex flex-col">
                                    <div className="flex justify-between items-start mb-4">
                                        <h3 className="text-2xl font-black uppercase tracking-tight group-hover:text-arc-teal transition-colors line-clamp-1">
                                            {project.title}
                                        </h3>
                                        {view === 'active' && (
                                            <button onClick={(e) => handleEditTitle(e, project)} className="p-1 text-gray-700 hover:text-white transition-colors"><Edit2 className="w-3 h-3" /></button>
                                        )}
                                    </div>
                                    <p className="text-gray-500 text-sm mb-8 line-clamp-2 italic font-light leading-relaxed">{project.logline || "Asset DNA initializing..."}</p>
                                    
                                    <div className="mt-auto pt-8 border-t border-white/5 flex justify-between items-center">
                                        <div className="flex items-center gap-6">
                                            <div onClick={(e) => { e.stopPropagation(); handleProjectClick(project); }} className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.2em] text-gray-500 hover:text-white cursor-pointer transition-colors">
                                                <BookOpen className="w-3 h-3 text-arc-teal" />
                                                <span>Editor</span>
                                            </div>
                                            <div onClick={(e) => { 
                                                e.stopPropagation(); 
                                                navigate(`/project/${project.id}/beat-sheet`, {
                                                    state: { project_id: project.id, universe_id: project.universe_id }
                                                });
                                            }} className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.2em] text-gray-500 hover:text-white cursor-pointer transition-colors">
                                                <Target className="w-3 h-3 text-arc-orange" />
                                                <span>Blueprint</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-[8px] font-black uppercase tracking-widest text-gray-700">
                                            <Clock className="w-3 h-3" />
                                            {project.created_at ? new Date(project.created_at.seconds * 1000).toLocaleDateString() : "New"}
                                        </div>
                                    </div>
                                </div>
                                <div className="absolute bottom-0 left-0 w-full h-[2px] bg-arc-teal scale-x-0 group-hover:scale-x-100 transition-transform duration-700 origin-left" />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;