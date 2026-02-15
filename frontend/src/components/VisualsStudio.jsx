import React, { useState } from 'react';
import { ImageIcon, User, RefreshCw, Sparkles, CheckCircle2 } from 'lucide-react';
import { apiClient } from '../api/client';
import { storage, db } from '../firebase';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc, getDoc } from 'firebase/firestore';

const VisualsStudio = ({ projectData, universeId, projectId, onRefresh }) => {
    const [regenerating, setRegenerating] = useState(null); // 'poster' or character name
    const [message, setMessage] = useState('');

    const handleRegenerate = async (type, charName = null) => {
        const id = charName || type;
        setRegenerating(id);
        setMessage(`Visuals Dept: Re-imagining ${id}...`);

        try {
            // 1. Get Base64 from Backend
            const response = await apiClient('/api/assets/regenerate', {
                method: 'POST',
                body: JSON.stringify({
                    universe_id: universeId,
                    project_id: projectId,
                    type: type,
                    character_name: charName
                })
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.detail || "Generation failed");
            }

            const { b64_data } = await response.json();
            
            // 2. Upload to Firebase Storage
            const path = type === 'poster' 
                ? `posters/${projectId}_${Date.now()}.jpg` 
                : `character_anchors/${projectId}_${charName}_${Date.now()}.jpg`;
            
            const storageRef = ref(storage, path);
            await uploadString(storageRef, b64_data, 'base64', { contentType: 'image/jpeg' });
            const downloadURL = await getDownloadURL(storageRef);

            // 3. Update Firestore
            const projectRef = doc(db, 'universes', universeId, 'projects', projectId);
            
            if (type === 'poster') {
                await updateDoc(projectRef, { poster_url: downloadURL });
            } else {
                const snap = await getDoc(projectRef);
                if (snap.exists()) {
                    const characters = snap.data().characters || [];
                    const updated = characters.map(c => 
                        c.name === charName ? { ...c, anchor_url: downloadURL } : c
                    );
                    await updateDoc(projectRef, { characters: updated });
                }
            }

            setMessage(`Studio Delivery: ${id} updated!`);
            if (onRefresh) onRefresh();
            setTimeout(() => setMessage(''), 5000);

        } catch (error) {
            console.error("Visuals Studio Error:", error);
            alert(`Art Dept Error: ${error.message}`);
        } finally {
            setRegenerating(null);
        }
    };

    return (
        <section className="bg-gray-900/40 border border-gray-800 rounded-[2.5rem] p-8 md:p-12 backdrop-blur-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10">
                <ImageIcon className="w-32 h-32 text-arc-teal" />
            </div>

            <div className="relative z-10">
                <div className="flex justify-between items-start mb-10">
                    <div>
                        <h2 className="text-3xl font-black text-white flex items-center gap-3">
                            Visuals Department
                        </h2>
                        <p className="text-gray-400 mt-2">Manage your project's cinematic assets and character anchors.</p>
                    </div>
                    {message && (
                        <div className="bg-arc-teal/20 border border-arc-teal/50 text-arc-teal px-4 py-2 rounded-xl flex items-center gap-2 animate-bounce">
                            <Sparkles className="w-4 h-4" /> {message}
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    {/* Poster Section */}
                    <div className="lg:col-span-1">
                        <label className="text-[10px] uppercase font-black tracking-widest text-arc-teal mb-4 block">Official Poster</label>
                        <div className="aspect-[2/3] bg-gray-950 rounded-2xl overflow-hidden border border-gray-800 group relative">
                            {projectData?.poster_url && !projectData.poster_url.includes('placehold.co') ? (
                                <img src={projectData.poster_url} alt="Poster" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center text-gray-600">
                                    <ImageIcon className="w-12 h-12 mb-4 opacity-20" />
                                    <span className="text-xs uppercase font-bold tracking-tighter">No Poster Delivered</span>
                                </div>
                            )}
                            
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                                <button 
                                    onClick={() => handleRegenerate('poster')}
                                    disabled={regenerating === 'poster'}
                                    className="bg-white text-black px-6 py-3 rounded-full font-bold flex items-center gap-2 hover:scale-105 transition-transform disabled:opacity-50"
                                >
                                    {regenerating === 'poster' ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                                    Regenerate Poster
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Characters Section */}
                    <div className="lg:col-span-2">
                        <label className="text-[10px] uppercase font-black tracking-widest text-arc-teal mb-4 block">Character Visual Anchors</label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {projectData?.characters?.map((char, idx) => (
                                <div key={idx} className="bg-gray-800/30 border border-gray-700 rounded-2xl p-6 flex flex-col gap-4 group">
                                    <div className="flex gap-4 items-center">
                                        <div className="w-16 h-16 rounded-full bg-gray-900 overflow-hidden border border-gray-700 shrink-0">
                                            {char.anchor_url ? (
                                                <img src={char.anchor_url} alt={char.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <User className="w-6 h-6 text-gray-700" />
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-white text-lg">{char.name}</h4>
                                            <p className="text-[10px] uppercase font-black tracking-widest text-arc-teal">{char.role}</p>
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-500 line-clamp-2 italic">"{char.description}"</p>
                                    <button 
                                        onClick={() => handleRegenerate('character', char.name)}
                                        disabled={regenerating === char.name}
                                        className="mt-2 text-xs font-bold text-gray-400 hover:text-white flex items-center gap-2 transition-colors disabled:opacity-50"
                                    >
                                        {regenerating === char.name ? <RefreshCw className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                                        Regenerate Visual Anchor
                                    </button>
                                </div>
                            ))}
                            {(!projectData?.characters || projectData.characters.length === 0) && (
                                <div className="col-span-2 text-center py-10 text-gray-600 italic">No characters defined in project bible.</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default VisualsStudio;
