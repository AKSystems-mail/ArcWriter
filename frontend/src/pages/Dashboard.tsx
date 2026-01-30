import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { collectionGroup, query, where, getDocs } from 'firebase/firestore';
import { Plus, Film, BookOpen, Clock, ChevronRight } from 'lucide-react';

interface Project {
    id: string;
    universe_id: string;
    title: string;
    genre: string;
    poster_url?: string;
    created_at?: any;
    logline?: string;
}

const Dashboard: React.FC = () => {
    const navigate = useNavigate();
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProjects = async () => {
            const user = auth.currentUser;
            if (!user) {
                setLoading(false);
                return;
            }

            try {
                // Use collectionGroup to find all 'projects' across all 'universes'
                const projectsQuery = query(
                    collectionGroup(db, 'projects'),
                    where('owner_id', '==', user.uid)
                );

                const querySnapshot = await getDocs(projectsQuery);
                const projectsList: Project[] = [];
                
                querySnapshot.forEach((doc) => {
                    const data = doc.data();
                    // The path is universes/{uni_id}/projects/{project_id}
                    // doc.ref.parent.parent.id gives the universe_id
                    const universeId = doc.ref.parent.parent?.id || "default";
                    
                    projectsList.push({
                        id: doc.id,
                        universe_id: universeId,
                        title: data.title || "Untitled Project",
                        genre: data.genre || "Unknown Genre",
                        poster_url: data.poster_url,
                        created_at: data.created_at,
                        logline: data.logline
                    });
                });

                // Sort by creation date (newest first)
                projectsList.sort((a, b) => {
                    const timeA = a.created_at?.seconds || 0;
                    const timeB = b.created_at?.seconds || 0;
                    return timeB - timeA;
                });

                setProjects(projectsList);
            } catch (error) {
                console.error("Error fetching projects:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchProjects();
    }, []);

    const handleProjectClick = (project: Project) => {
        // Navigate to editor with state
        navigate(`/project/${project.id}/editor`, {
            state: {
                project_id: project.id,
                universe_id: project.universe_id
            }
        });
    };

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
                {/* Header */}
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
                    <div>
                        <h1 className="text-5xl font-black tracking-tighter mb-2">
                            My <span className="text-arc-teal">Projects</span>
                        </h1>
                        <p className="text-gray-400 text-lg">Manage your cinematic universes and scripts.</p>
                    </div>
                    
                    <button
                        onClick={() => navigate('/wizard')}
                        className="group bg-arc-teal hover:bg-opacity-90 text-black font-black py-4 px-8 rounded-2xl flex items-center gap-3 transition-all transform active:scale-95 shadow-xl shadow-arc-teal/20"
                    >
                        <Plus className="w-6 h-6" />
                        NEW PROJECT
                    </button>
                </header>

                {/* Projects Grid */}
                {projects.length === 0 ? (
                    <div className="bg-gray-900/30 border-2 border-dashed border-gray-800 rounded-[2.5rem] py-32 flex flex-col items-center justify-center text-center px-6">
                        <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mb-6">
                            <Film className="w-10 h-10 text-gray-600" />
                        </div>
                        <h2 className="text-3xl font-bold mb-4">No projects yet.</h2>
                        <p className="text-gray-500 max-w-md mb-8 text-lg">
                            Every great film starts with a single idea. Use the Wizard to build your first story DNA.
                        </p>
                        <button
                            onClick={() => navigate('/wizard')}
                            className="text-arc-teal font-bold hover:underline flex items-center gap-2"
                        >
                            Launch Onboarding Wizard <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {projects.map((project) => (
                            <div
                                key={project.id}
                                onClick={() => handleProjectClick(project)}
                                className="group relative bg-gray-900/40 border border-gray-800 rounded-[2rem] overflow-hidden hover:border-arc-teal transition-all duration-500 cursor-pointer shadow-2xl hover:shadow-arc-teal/10 flex flex-col h-full"
                            >
                                {/* Poster Image / Vibe Area */}
                                <div className="h-48 overflow-hidden relative">
                                    {project.poster_url ? (
                                        <img 
                                            src={project.poster_url} 
                                            alt={project.title} 
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                                            <Film className="w-12 h-12 text-gray-700" />
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent opacity-60" />
                                    
                                    <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-arc-teal">{project.genre}</span>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-8 flex-1 flex flex-col">
                                    <h3 className="text-2xl font-bold mb-2 group-hover:text-arc-teal transition-colors line-clamp-1">
                                        {project.title}
                                    </h3>
                                    <p className="text-gray-500 text-sm mb-6 line-clamp-2 italic font-light">
                                        {project.logline || "No logline generated yet."}
                                    </p>
                                    
                                    <div className="mt-auto pt-6 border-t border-gray-800/50 flex justify-between items-center text-gray-500">
                                        <div className="flex items-center gap-2 text-xs uppercase font-black tracking-widest">
                                            <BookOpen className="w-4 h-4 text-arc-teal" />
                                            <span>Editor</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold">
                                            <Clock className="w-3.5 h-3.5" />
                                            {project.created_at ? new Date(project.created_at.seconds * 1000).toLocaleDateString() : "Just now"}
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Hover Indicator */}
                                <div className="absolute bottom-0 left-0 w-full h-1 bg-arc-teal scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;