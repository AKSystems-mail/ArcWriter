const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export const analyzeScene = async (sceneText) => {
    const response = await fetch(`${API_BASE_URL}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scene_text: sceneText }),
    });
    return response.json();
};

export const getCritique = async (sceneText, persona) => {
    const response = await fetch(`${API_BASE_URL}/critique`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scene_text: sceneText, persona }),
    });
    return response.json();
};

export const generateAsset = async (type, data) => {
    const response = await fetch(`${API_BASE_URL}/assets/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, ...data }),
    });
    return response.json();
};
