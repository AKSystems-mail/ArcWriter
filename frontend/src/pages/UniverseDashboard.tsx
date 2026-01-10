import React, { useState, useEffect } from 'react';

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

    const fetchUniverses = async () => {
        try {
            const response = await fetch('http://localhost:8000/api/universes');
            if (!response.ok) {
                throw new Error('Failed to fetch universes');
            }
            const data: Universe[] = await response.json();
            setUniverses(data);
        } catch (err: any) {
            setError(err.message);
        }
    };

    const fetchProjects = async (universeName: string) => {
        try {
            const response = await fetch(`http://localhost:8000/api/universe/${universeName}/projects`);
            if (!response.ok) {
                throw new Error(`Failed to fetch projects for universe ${universeName}`);
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
            const response = await fetch('http://localhost:8000/api/universe/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
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
            const response = await fetch(`http://localhost:8000/api/universe/${selectedUniverse}/project/create`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
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
        <div className="min-h-screen bg-gray-900 text-white p-8">
            <h1 className="text-3xl font-bold mb-8">Universe Dashboard</h1>

            {error && <div className="bg-red-500 p-3 rounded-md mb-4">{error}</div>}

            {/* Create Universe Section */}
            <div className="mb-8 p-4 bg-gray-800 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-4">Create New Universe</h2>
                <div className="flex gap-4">
                    <input
                        type="text"
                        placeholder="New Universe Name"
                        className="flex-1 p-2 rounded-md bg-gray-700 border border-gray-600 focus:ring-blue-500 focus:border-blue-500"
                        value={newUniverseName}
                        onChange={(e) => setNewUniverseName(e.target.value)}
                    />
                    <button
                        onClick={handleCreateUniverse}
                        className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-75"
                    >
                        Create Universe
                    </button>
                </div>
            </div>

            {/* Universes Grid */}
            <h2 className="text-2xl font-semibold mb-4">Your Universes</h2>
            {universes.length === 0 ? (
                <p className="text-gray-400">No universes found. Create one above!</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8">
                    {universes.map((universe) => (
                        <div
                            key={universe.name}
                            className={`bg-gray-800 p-6 rounded-xl border ${selectedUniverse === universe.name ? 'border-blue-500 ring-2 ring-blue-500' : 'border-gray-700'} hover:border-blue-500 cursor-pointer transition duration-200 ease-in-out`}
                            onClick={() => fetchProjects(universe.name)}
                        >
                            <h3 className="text-xl font-semibold">{universe.name}</h3>
                            <p className="text-gray-400">Click to view projects</p>
                        </div>
                    ))}
                </div>
            )}

            {/* Projects in Selected Universe */}
            {selectedUniverse && (
                <div className="mt-8 p-4 bg-gray-800 rounded-lg shadow-md">
                    <h2 className="text-2xl font-semibold mb-4">Projects in "{selectedUniverse}"</h2>
                    <div className="mb-4 flex gap-4">
                        <input
                            type="text"
                            placeholder="New Project Name"
                            className="flex-1 p-2 rounded-md bg-gray-700 border border-gray-600 focus:ring-blue-500 focus:border-blue-500"
                            value={newProjectName}
                            onChange={(e) => setNewProjectName(e.target.value)}
                        />
                        <button
                            onClick={handleCreateProject}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75"
                        >
                            Create Project
                        </button>
                    </div>

                    {projects.length === 0 ? (
                        <p className="text-gray-400">No projects in this universe. Create one above!</p>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {projects.map((project) => (
                                <div key={project.id} className="bg-gray-700 p-4 rounded-md border border-gray-600">
                                    <h4 className="text-lg font-medium">{project.name}</h4>
                                    <p className="text-gray-400">ID: {project.id}</p>
                                    {/* Link to editor or project details */}
                                    <button className="mt-2 text-sm text-arc-teal hover:underline">Open Editor</button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default UniverseDashboard;
