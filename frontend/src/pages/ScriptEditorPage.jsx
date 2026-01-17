import React from 'react';
import { useLocation, useParams } from 'react-router-dom';
import ScriptEditor from '../components/ScriptEditor';

const ScriptEditorPage = () => {
    const location = useLocation();
    const { projectId: urlProjectId } = useParams();

    // Prefer URL param, fallback to location state, then default
    const projectId = urlProjectId || location.state?.project_id;
    const universeId = location.state?.universe_id || "default";

    // Show loading if projectId is missing
    if (!projectId) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin h-12 w-12 border-4 border-arc-teal border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-gray-400 text-lg">Loading Project...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900">
            <ScriptEditor
                universeId={universeId}
                projectId={projectId}
            />
        </div>
    );
};

export default ScriptEditorPage;
