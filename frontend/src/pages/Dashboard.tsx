import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { collectionGroup, query, where, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Plus, Film, BookOpen, Clock, ChevronRight, Edit2, Trash2, RotateCcw, XCircle } from 'lucide-react';

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

    const fetchProjects = async () => {
        const user = auth.currentUser;
        if (!user) {
            setLoading(false);
            return;
        }

        try {
            const projectsQuery = query(
                collectionGroup(db, 'projects'),
                where('owner_id', '==', user.uid)
            );

            const querySnapshot = await getDocs(projectsQuery);
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
        } catch (error) {
            console.error("Error fetching projects:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProjects();
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
        if (window.confirm("Trigger the Inciting Incident? This will move the project to the Cutting Room Floor for 30 days.")) {
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
            alert("Redemption achieved. Project is back in your active list.");
        } catch (error) {
            console.error("Restore failed:", error);
        }
    };

    const handlePermanentDelete = async (e: React.MouseEvent, project: Project) => {
        e.stopPropagation();
        const confirmation = window.prompt(`This is the Point of No Return. To permanently delete this project, type its name: "${project.title}"`);
        
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
            <div className="min-h-screen bg-obsidian-black flex flex-col items-center justify-center">
                <div className="w-16 h-16 border-4 border-arc-teal border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-arc-teal font-black tracking-widest animate-pulse">OPENING STUDIO ARCHIVES...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-obsidian-black text-white p-8 md:p-12">
            <div className="max-w-7xl mx-auto">
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
                    <div>
                        <h1 className="text-5xl font-black tracking-tighter mb-2">
                            {view === 'active' ? <>My <span className="text-arc-teal">Projects</span></> : <>The <span className="text-red-500">Cutting Room Floor</span></>}
                        </h1>
                        <p className="text-gray-400 text-lg">
                            {view === 'active' ? "Manage your cinematic universes and scripts." : "Projects in the shadows. They will vanish in 30 days."}
                        </p>
                    </div>
                    
                    <div className="flex gap-4">
                        <button
                            onClick={() => setView(view === 'active' ? 'archived' : 'active')}
                            className="bg-gray-900 border border-gray-800 hover:bg-gray-800 text-gray-400 font-bold py-4 px-6 rounded-2xl flex items-center gap-3 transition-all"
                        >
                            {view === 'active' ? <Trash2 className="w-5 h-5" /> : <RotateCcw className="w-5 h-5" />}
                            {view === 'active' ? "VIEW ARCHIVE" : "BACK TO STUDIO"}
                        </button>
                        {view === 'active' && (
                            <button
                                onClick={() => navigate('/wizard')}
                                className="group bg-arc-teal hover:bg-opacity-90 text-black font-black py-4 px-8 rounded-2xl flex items-center gap-3 transition-all transform active:scale-95 shadow-xl shadow-arc-teal/20"
                            >
                                <Plus className="w-6 h-6" />
                                NEW PROJECT
                            </button>
                        )}
                    </div>
                </header>

                {filteredProjects.length === 0 ? (
                    <div className="bg-gray-900/30 border-2 border-dashed border-gray-800 rounded-[2.5rem] py-32 flex flex-col items-center justify-center text-center px-6">
                        <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mb-6">
                            <Film className="w-10 h-10 text-gray-600" />
                        </div>
                        <h2 className="text-3xl font-bold mb-4">{view === 'active' ? "No active projects." : "The floor is clean."}</h2>
                        <p className="text-gray-500 max-w-md mb-8 text-lg">
                            {view === 'active' ? "Every great film starts with a single idea. Use the Wizard to build your first story DNA." : "No projects are currently marked for deletion."}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredProjects.map((project) => (
                            <div
                                key={project.id}
                                onClick={() => view === 'active' && handleProjectClick(project)}
                                className={`group relative bg-gray-900/40 border border-gray-800 rounded-[2rem] overflow-hidden transition-all duration-500 shadow-2xl flex flex-col h-full ${view === 'active' ? 'hover:border-arc-teal cursor-pointer hover:shadow-arc-teal/10' : 'opacity-80'}`}
                            >
                                <div className="h-48 overflow-hidden relative">
                                    {project.poster_url && !project.poster_url.includes('placehold.co') ? (
                                        <img src={project.poster_url} alt={project.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-gray-900 to-black flex flex-col items-center justify-center p-6 text-center">
                                            <div className="w-12 h-12 border-2 border-arc-teal/20 border-t-arc-teal rounded-full animate-spin mb-4" />
                                            <span className="text-[10px] font-black uppercase tracking-widest text-arc-teal animate-pulse">Art Dept: Rendering...</span>
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent opacity-60" />
                                    <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-arc-teal">{project.genre}</span>
                                    </div>
                                    
                                    <div className="absolute top-4 left-4 flex gap-2">
                                        {view === 'active' ? (
                                            <button 
                                                onClick={(e) => handleArchiveProject(e, project)}
                                                className="p-2 bg-black/60 backdrop-blur-md rounded-full border border-white/10 text-gray-400 hover:text-red-400 transition-colors"
                                                title="Inciting Incident (Archive)"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        ) : (
                                            <>
                                                <button 
                                                    onClick={(e) => handleRestoreProject(e, project)}
                                                    className="p-2 bg-black/60 backdrop-blur-md rounded-full border border-white/10 text-green-400 hover:bg-green-400 hover:text-black transition-colors"
                                                    title="Redemption (Restore)"
                                                >
                                                    <RotateCcw className="w-4 h-4" />
                                                </button>
                                                <button 
                                                    onClick={(e) => handlePermanentDelete(e, project)}
                                                    className="p-2 bg-black/60 backdrop-blur-md rounded-full border border-white/10 text-red-500 hover:bg-red-500 hover:text-white transition-colors"
                                                    title="Point of No Return (Permanent Delete)"
                                                >
                                                    <XCircle className="w-4 h-4" />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>

                                <div className="p-8 flex-1 flex flex-col">
                                    <div className="flex justify-between items-start mb-2 group/title">
                                        <h3 className="text-2xl font-bold group-hover:text-arc-teal transition-colors line-clamp-1">
                                            {project.title}
                                        </h3>
                                        {view === 'active' && (
                                            <button onClick={(e) => handleEditTitle(e, project)} className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-gray-800 rounded-md text-gray-500 hover:text-white transition-all"><Edit2 className="w-4 h-4" /></button>
                                        )}
                                    </div>
                                    <p className="text-gray-500 text-sm mb-6 line-clamp-2 italic font-light">{project.logline || "No logline generated yet."}</p>
                                    
                                    <div className="mt-auto pt-6 border-t border-gray-800/50 flex justify-between items-center text-gray-500">
                                        <div className="flex items-center gap-2 text-xs uppercase font-black tracking-widest">
                                            <BookOpen className="w-4 h-4 text-arc-teal" />
                                            <span>{view === 'active' ? 'Editor' : 'Archived'}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold">
                                            <Clock className="w-3.5 h-3.5" />
                                            {project.created_at ? new Date(project.created_at.seconds * 1000).toLocaleDateString() : "Just now"}
                                        </div>
                                    </div>
                                </div>
                                {view === 'active' && <div className="absolute bottom-0 left-0 w-full h-1 bg-arc-teal scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;