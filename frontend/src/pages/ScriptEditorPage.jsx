import React from 'react';
import { useLocation } from 'react-router-dom';
import ScriptEditor from '../components/ScriptEditor';

const ScriptEditorPage = () => {
    const location = useLocation();
    const universeId = location.state?.universe_id || "default";
    const projectId = location.state?.project_id || "operation_blackout";

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
