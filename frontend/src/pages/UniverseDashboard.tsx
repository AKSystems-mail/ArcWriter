import React, { useState, useEffect } from 'react';
import { auth } from '../firebase'; // Import auth from firebase.js
import PricingModal from '../components/PricingModal'; // Import PricingModal

interface Universe {
    name: string;
}

interface Project {
    id: string;
    name: string;
}

const UniverseDashboard: React.FC = () => {
    const [universes, setUniverses] = useState<Universe[]>([]);
    const [selectedUniverse, setSelectedUniverse] = useState<string | null>(null);
    const [projects, setProjects] = useState<Project[]>([]);
    const [newUniverseName, setNewUniverseName] = useState<string>('');
    const [newProjectName, setNewProjectName] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    const [isPricingModalOpen, setIsPricingModalOpen] = useState<boolean>(false); // State for modal visibility

    const getAuthHeaders = async (): Promise<Record<string, string>> => {
        const currentUser = auth.currentUser;
        if (!currentUser) {
            // This should ideally not happen if ProtectedRoute is working, but as a fallback
            return {};
        }
        const idToken = await currentUser.getIdToken();
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`,
        };
    };

    const fetchUniverses = async () => {
        try {
            setError(null);
            const headers = await getAuthHeaders();
            const response = await fetch('/api/universes', { headers });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Failed to fetch universes');
            }
            const data: Universe[] = await response.json();
            setUniverses(data);
        } catch (err: any) {
            setError(err.message);
        }
    };

    const fetchProjects = async (universeName: string) => {
        try {
            setError(null);
            const headers = await getAuthHeaders();
            const response = await fetch(`/api/universe/${universeName}/projects`, { headers });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || `Failed to fetch projects for universe ${universeName}`);
            }
            const data: Project[] = await response.json();
            setProjects(data);
            setSelectedUniverse(universeName);
        } catch (err: any) {
            setError(err.message);
        }
    };

    const handleCreateUniverse = async () => {
        if (!newUniverseName.trim()) {
            setError("Universe name cannot be empty.");
            return;
        }
        try {
            setError(null);
            const headers = await getAuthHeaders();
            const response = await fetch('/api/universe/create', {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({ universe_name: newUniverseName }),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Failed to create universe');
            }
            setNewUniverseName('');
            fetchUniverses(); // Refresh list
        } catch (err: any) {
            setError(err.message);
        }
    };

    const handleCreateProject = async () => {
        if (!selectedUniverse) {
            setError("Please select a universe first.");
            return;
        }
        if (!newProjectName.trim()) {
            setError("Project name cannot be empty.");
            return;
        }
        try {
            setError(null);
            const headers = await getAuthHeaders();
            const response = await fetch(`/api/universe/${selectedUniverse}/project/create`, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({ project_name: newProjectName }),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Failed to create project');
            }
            setNewProjectName('');
            fetchProjects(selectedUniverse); // Refresh project list
        } catch (err: any) {
            setError(err.message);
        }
    };

    useEffect(() => {
        fetchUniverses();
    }, []);

    return (
        <div className="min-h-screen bg-obsidian-black text-white p-8">
            <div className="flex justify-between items-center mb-8 animate-fade-in">
                <h1 className="text-4xl font-bold text-arc-teal">Universe Dashboard</h1>
                <button
                    onClick={() => setIsPricingModalOpen(true)}
                    className="bg-arc-orange hover:bg-opacity-80 text-white font-bold py-2 px-6 rounded-md focus:outline-none focus:ring-2 focus:ring-arc-orange focus:ring-opacity-75 transition-all shadow-lg hover:shadow-arc-orange/50"
                >
                    Upgrade
                </button>
            </div>

            {error && <div className="bg-red-500/20 border border-red-500 text-red-200 p-3 rounded-md mb-4 animate-fade-in">{error}</div>}

            {/* Create Universe Section */}
            <div className="mb-8 p-6 bg-gray-900/50 rounded-xl border border-gray-800 shadow-xl animate-fade-in-delayed">
                <h2 className="text-xl font-semibold mb-4 text-gray-200">Create New Universe</h2>
                <div className="flex gap-4">
                    <input
                        type="text"
                        placeholder="New Universe Name"
                        className="flex-1 p-3 rounded-md bg-gray-800 border border-gray-700 focus:ring-2 focus:ring-arc-teal focus:border-arc-teal outline-none transition-all"
                        value={newUniverseName}
                        onChange={(e) => setNewUniverseName(e.target.value)}
                    />
                    <button
                        onClick={handleCreateUniverse}
                        className="bg-arc-teal hover:bg-opacity-80 text-white font-bold py-2 px-6 rounded-md focus:outline-none focus:ring-2 focus:ring-arc-teal focus:ring-opacity-75 transition-all shadow-lg hover:shadow-arc-teal/50"
                    >
                        Create
                    </button>
                </div>
            </div>

            {/* Universes Grid */}
            <h2 className="text-2xl font-semibold mb-6 text-gray-200 animate-fade-in-delayed">Your Universes</h2>
            {universes.length === 0 ? (
                <p className="text-gray-400 animate-fade-in-delayed">No universes found. Create one above!</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8">
                    {universes.map((universe, index) => (
                        <div
                            key={universe.name}
                            className={`bg-gray-900/50 p-6 rounded-xl border ${selectedUniverse === universe.name ? 'border-arc-teal ring-2 ring-arc-teal/50' : 'border-gray-800'} hover:border-arc-teal cursor-pointer transition-all duration-300 animate-fade-in shadow-lg`}
                            style={{ animationDelay: `${index * 0.1}s` }}
                            onClick={() => fetchProjects(universe.name)}
                        >
                            <h3 className="text-xl font-semibold text-arc-teal">{universe.name}</h3>
                            <p className="text-gray-400 mt-2 text-sm">Click to view projects</p>
                        </div>
                    ))}
                </div>
            )}

            {/* Projects in Selected Universe */}
            {selectedUniverse && (
                <div key={selectedUniverse} className="mt-12 p-10 bg-gray-900/40 backdrop-blur-md rounded-[2rem] border border-gray-800 shadow-2xl animate-fade-in">
                    <div className="flex justify-between items-center mb-10">
                        <h2 className="text-3xl font-black text-white tracking-tight">
                            Projects in <span className="text-arc-teal">{selectedUniverse}</span>
                        </h2>
                        <span className="text-xs font-black uppercase tracking-[0.3em] text-gray-500">Universe Archive</span>
                    </div>

                    <div className="mb-10 flex gap-4">
                        <input
                            type="text"
                            placeholder="New Project Title..."
                            className="flex-1 p-4 rounded-xl bg-gray-800/50 border border-gray-700 text-white focus:ring-2 focus:ring-arc-orange focus:border-arc-orange outline-none transition-all shadow-inner"
                            value={newProjectName}
                            onChange={(e) => setNewProjectName(e.target.value)}
                        />
                        <button
                            onClick={handleCreateProject}
                            className="bg-arc-orange hover:bg-opacity-90 text-white font-black py-4 px-10 rounded-xl transition-all shadow-xl shadow-arc-orange/20 active:scale-95"
                        >
                            CREATE PROJECT
                        </button>
                    </div>

                    {projects.length === 0 ? (
                        <div className="py-20 text-center border-2 border-dashed border-gray-800 rounded-3xl">
                            <p className="text-gray-500 text-xl font-light">Your universe is expanding. Start the first project.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {projects.map((project, index) => (
                                <div
                                    key={project.id}
                                    className="group bg-gray-800/30 p-8 rounded-3xl border border-gray-700 hover:border-arc-teal transition-all duration-500 animate-fade-in shadow-lg hover:shadow-arc-teal/10 cursor-default"
                                    style={{ animationDelay: `${index * 0.1}s` }}
                                >
                                    <h4 className="text-2xl font-bold text-white mb-2 group-hover:text-arc-teal transition-colors tracking-tight">{project.name}</h4>
                                    <p className="text-gray-600 text-[10px] font-black uppercase tracking-widest mb-6">Archive ID: {project.id}</p>
                                    <button className="w-full py-3 bg-gray-800 hover:bg-arc-teal text-white font-bold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 group/btn">
                                        ENTER STUDIO <span className="group-hover:translate-x-1 transition-transform">→</span>
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            <PricingModal
                isOpen={isPricingModalOpen}
                onClose={() => setIsPricingModalOpen(false)}
            />
        </div>
    );
};

export default UniverseDashboard;

