import React, { useState } from 'react';
import { ImageIcon, User, RefreshCw, Sparkles, CheckCircle2, Layout, UserCircle, Zap } from 'lucide-react';
import { apiClient } from '../api/client';
import { storage, db, auth } from '../firebase';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc, getDoc } from 'firebase/firestore';

const VisualsStudio = ({ projectData, universeId, projectId, onRefresh }) => {
    const [regenerating, setRegenerating] = useState(null); // 'poster' or character name
    const [message, setMessage] = useState('');
    const [selectionVariants, setSelectionVariants] = useState(null); // { type, name, variants }
    const [isLocking, setIsLocking] = useState(false); // Feedback for selection click

    // Pitch Package Configuration
    const [exportSettings, setExportSettings] = useState({
        cover: true,
        story: true,
        cast: true,
        script: true
    });

    const toggleSetting = (section) => {
        setExportSettings(prev => ({ ...prev, [section]: !prev[section] }));
    };

    const handleRegenerate = async (type, charName = null) => {
        const id = charName || type;
        setRegenerating(id);
        setMessage(`Art Dept: Rendering ${id}...`);

        try {
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

            const data = await response.json();
            
            if (type === 'poster') {
                await finalizeAsset('poster', null, data.b64_data);
            } else {
                // For characters, show selection modal first
                setSelectionVariants({
                    type: 'character',
                    name: charName,
                    variants: data.variants.map((b64) => `data:image/jpeg;base64,${b64}`)
                });
            }

        } catch (error) {
            console.error("Visuals Studio Error:", error);
            alert(`Art Dept Error: ${error.message}`);
        } finally {
            setRegenerating(null);
        }
    };

    const finalizeAsset = async (type, charName, b64) => {
        setIsLocking(true);
        setRegenerating(charName || type);
        setMessage(`Locking ${charName || type}...`);
        
        try {
            const path = type === 'poster' 
                ? `posters/${projectId}_${Date.now()}.jpg` 
                : `character_anchors/${projectId}_${charName}_${Date.now()}.jpg`;
            
            const storageRef = ref(storage, path);
            // Clean b64 string if it contains data URL prefix
            const cleanB64 = b64.includes('base64,') ? b64.split('base64,')[1] : b64;
            
            await uploadString(storageRef, cleanB64, 'base64', { contentType: 'image/jpeg' });
            const downloadURL = await getDownloadURL(storageRef);

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

            setMessage(`Studio Delivery: ${charName || type} updated!`);
            setSelectionVariants(null);
            setIsLocking(false);
            if (onRefresh) onRefresh();
            setTimeout(() => setMessage(''), 5000);
        } catch (err) {
            alert(`Upload failed: ${err.message}`);
            setIsLocking(false);
        } finally {
            setRegenerating(null);
        }
    };

    const handleBulkGenerateAnchors = async () => {
        if (!projectData?.characters || projectData.characters.length === 0) return;
        
        const charsToGenerate = projectData.characters.filter(c => !c.anchor_url);
        if (charsToGenerate.length === 0) {
            if (!window.confirm("All characters already have anchors. Regenerate all?")) return;
            charsToGenerate.push(...projectData.characters);
        }

        for (const char of charsToGenerate) {
            await handleRegenerate('character', char.name);
        }
    };

    const handleGenerateTeaser = async () => {
        setRegenerating('teaser');
        setMessage("Motion Dept: Initializing Render...");

        try {
            // 1. Start the render (Async)
            const response = await apiClient('/api/assets/generate_teaser', {
                method: 'POST',
                body: JSON.stringify({
                    universe_id: universeId,
                    project_id: projectId
                })
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.detail || "Motion render failed");
            }

            const { operation_id } = await response.json();
            
            // 2. Poll for completion
            pollTeaserStatus(operation_id);

        } catch (error) {
            console.error("Teaser Error:", error);
            alert(`Motion Dept Error: ${error.message}`);
            setRegenerating(null);
        }
    };

    const pollTeaserStatus = async (opId) => {
        setMessage("Motion Dept: Rendering Cinematic Asset... (Est. 2-3 mins. You can safely navigate away; we'll sync the result automatically.)");
        
        const interval = setInterval(async () => {
            try {
                // Use query parameter and cache-buster to ensure fresh status
                const response = await apiClient(`/api/assets/teaser_status?operation_id=${encodeURIComponent(opId)}&t=${Date.now()}`);
                
                if (!response.ok) {
                    const errorBody = await response.text(); // Get raw error response
                    console.error(`Art Dept: Teaser status poll failed (${response.status}):`, errorBody);
                    return; // Still retry, but log the error
                }
                const status = await response.json();

                if (status.done) {
                    clearInterval(interval);
                    if (status.video_uri) {
                        // 3. Finalize asset in Firestore
                        const projectRef = doc(db, 'universes', universeId, 'projects', projectId);
                        await updateDoc(projectRef, { teaser_url: status.video_uri });
                        setMessage("Studio Delivery: Teaser Completed!");
                        if (onRefresh) onRefresh();
                    } else {
                        setMessage("Art Dept: Render failed to return data.");
                    }
                    setRegenerating(null);
                } else {
                    // Still working
                    console.log("Art Dept: Still rendering teaser...");
                }
            } catch (err) {
                console.warn("Poll failed, retrying...", err);
            }
        }, 15000); // Check every 15 seconds
    };

    const handleDownloadPitchDeck = async () => {
        setRegenerating('download');
        setMessage("Studio: Compiling Custom Pitch Package...");
        
        try {
            const token = await auth.currentUser?.getIdToken();
            
            // Build section filter
            const sections = Object.keys(exportSettings).filter(k => exportSettings[k]).join(',');
            
            const response = await fetch(`/api/pitchdeck/download/${universeId}/${projectId}?sections=${sections}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) throw new Error("Download failed");

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${projectData?.title || 'Project'}_PitchPackage.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            
            setMessage("Studio Delivery: Package Exported!");
            setTimeout(() => setMessage(''), 5000);
        } catch (error) {
            console.error("Export Error:", error);
            alert("Studio Error: Failed to compile pitch package.");
        } finally {
            setRegenerating(null);
        }
    };

    // Updated threshold: Only requires Poster and Story content
    const isProjectComplete = projectData?.poster_url && (projectData?.source_material || projectData?.bible_content);

    return (
        <section className="bg-[#080808] border border-white/5 rounded-sm p-10 md:p-16 relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 p-12 opacity-[0.03]">
                <Layout className="w-64 h-64 text-white" />
            </div>

            <div className="relative z-10">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 mb-16 border-b border-white/5 pb-12">
                    <div>
                        <span className="text-arc-teal text-[10px] font-black uppercase tracking-[0.5em] mb-4 block italic">Department 04</span>
                        <h2 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter">
                            Visuals <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-600">Assets</span>
                        </h2>
                        <p className="text-gray-500 mt-4 text-lg font-light italic">High-fidelity conceptual anchors for pitch-readiness.</p>
                    </div>
                    <div className="flex flex-col items-end gap-4">
                        {message && (
                            <div className="bg-arc-teal/5 border border-arc-teal/20 text-arc-teal px-6 py-2 rounded-sm text-[10px] font-black uppercase tracking-widest flex items-center gap-3 animate-pulse">
                                <Sparkles className="w-4 h-4" /> {message}
                            </div>
                        )}
                        <div className="flex items-center gap-4">
                            {/* Export Config Toggles */}
                            <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-sm border border-white/5 mr-2">
                                <span className="text-[8px] font-black uppercase tracking-widest text-gray-600 mr-2 border-r border-white/10 pr-3">Include:</span>
                                {[
                                    { id: 'cover', label: 'Poster' },
                                    { id: 'story', label: 'Story' },
                                    { id: 'cast', label: 'Cast' },
                                    { id: 'script', label: 'Script' }
                                ].map(item => (
                                    <button
                                        key={item.id}
                                        onClick={() => toggleSetting(item.id)}
                                        className={`text-[8px] font-black uppercase tracking-tighter px-2 py-1 transition-all ${exportSettings[item.id] ? 'text-arc-teal bg-arc-teal/10' : 'text-gray-700 bg-transparent'}`}
                                    >
                                        {item.label}
                                    </button>
                                ))}
                            </div>

                            <button 
                                onClick={handleDownloadPitchDeck}
                                disabled={!!regenerating}
                                className={`text-[9px] font-black uppercase tracking-[0.2em] px-8 py-4 rounded-sm transition-all shadow-xl flex items-center gap-3 ${isProjectComplete ? 'bg-arc-orange text-white hover:bg-white hover:text-black animate-glow' : 'bg-white/5 text-gray-600 cursor-not-allowed'}`}
                            >
                                <Layout className="w-4 h-4" />
                                {regenerating === 'download' ? "Compiling PDF..." : "Export Package"}
                            </button>
                            <button 
                                onClick={handleBulkGenerateAnchors}
                                disabled={!!regenerating}
                                className="text-[9px] font-black uppercase tracking-[0.2em] bg-white hover:bg-arc-teal text-black hover:text-white px-8 py-4 rounded-sm transition-all disabled:opacity-50 shadow-xl"
                            >
                                {regenerating === 'character' ? "Art Dept Working..." : "Bulk Generate Anchors"}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Character Selection Modal */}
                {selectionVariants && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-md p-10 animate-fade-in">
                        <div className="max-w-5xl w-full bg-[#080808] border border-white/10 rounded-sm p-12 shadow-2xl">
                            <div className="flex justify-between items-center mb-10">
                                <div>
                                    <span className="text-arc-teal text-[10px] font-black uppercase tracking-[0.5em] mb-2 block italic">Selection Required</span>
                                    <h3 className="text-3xl font-black text-white uppercase tracking-tighter">Choose Anchor: {selectionVariants.name}</h3>
                                </div>
                                <button onClick={() => setSelectionVariants(null)} className="text-gray-500 hover:text-white uppercase font-black text-[10px] tracking-widest transition-colors">Cancel</button>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                                {selectionVariants.variants.map((v, i) => (
                                    <div 
                                        key={i} 
                                        onClick={() => !isLocking && finalizeAsset('character', selectionVariants.name, v)} 
                                        className={`group relative aspect-square bg-black border border-white/5 overflow-hidden transition-all ${isLocking ? 'cursor-wait opacity-50' : 'cursor-pointer hover:border-arc-teal/50'}`}
                                    >
                                        <img src={v} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 group-hover:scale-105" alt="Variant" />
                                        <div className="absolute inset-0 bg-arc-teal/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            {isLocking ? (
                                                <div className="flex flex-col items-center gap-2">
                                                    <RefreshCw className="w-6 h-6 animate-spin text-white" />
                                                    <span className="text-[8px] font-black text-white uppercase tracking-widest">Locking Anchor...</span>
                                                </div>
                                            ) : (
                                                <span className="bg-white text-black px-4 py-2 text-[9px] font-black uppercase tracking-widest">Select Face</span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
                    {/* Production Assets Section */}
                    <div className="lg:col-span-4 flex flex-col gap-12">
                        <div className="flex justify-between items-center">
                            <label className="text-[10px] uppercase font-black tracking-widest text-gray-600 block">Production Assets</label>
                            <span className="text-[9px] font-black text-arc-orange uppercase tracking-widest italic">Phase 04 deliverables</span>
                        </div>

                        <div className="flex flex-col gap-12">
                            {/* Poster */}
                            <div className="space-y-4">
                                <span className="text-[8px] font-black text-gray-700 uppercase tracking-widest ml-1">Official Poster</span>
                                <div className="aspect-[2/3] bg-black rounded-none overflow-hidden border border-white/5 group relative shadow-2xl">
                                    {projectData?.poster_url && !projectData.poster_url.includes('placehold.co') ? (
                                        <img src={projectData.poster_url} alt="Poster" className="w-full h-full object-cover transition-all duration-1000" />
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center text-gray-800">
                                            <ImageIcon className="w-12 h-12 mb-4 opacity-20" />
                                            <span className="text-[9px] font-black uppercase tracking-[0.3em]">Awaiting Render</span>
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-20">
                                        <button 
                                            onClick={() => handleRegenerate('poster')}
                                            disabled={regenerating === 'poster'}
                                            className="bg-white text-black px-6 py-3 rounded-sm font-black text-[9px] uppercase tracking-[0.3em] flex items-center gap-3 hover:bg-arc-teal hover:text-white transition-all shadow-2xl"
                                        >
                                            {regenerating === 'poster' ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                                            Render Poster
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Teaser */}
                            <div className="space-y-4">
                                <span className="text-[8px] font-black text-gray-700 uppercase tracking-widest ml-1">Cinematic Teaser</span>
                                <div className="aspect-video bg-black rounded-none overflow-hidden border border-white/5 group relative shadow-2xl border-dashed border-white/10">
                                    {projectData?.teaser_url ? (
                                        <>
                                            <video src={projectData.teaser_url} className="w-full h-full object-cover" autoPlay loop muted playsInline />
                                            {/* Hover overlay for existing teaser */}
                                            <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-20">
                                                <button 
                                                    onClick={handleGenerateTeaser}
                                                    disabled={regenerating === 'teaser'}
                                                    className="bg-white text-black px-8 py-4 rounded-sm font-black text-[10px] uppercase tracking-[0.3em] flex items-center gap-3 hover:bg-arc-orange hover:text-white transition-all shadow-2xl cursor-pointer"
                                                >
                                                    {regenerating === 'teaser' ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                                                    {regenerating === 'teaser' ? 'Rendering...' : 'Regenerate Teaser'}
                                                </button>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center text-gray-800">
                                            <Zap className="w-12 h-12 mb-4 opacity-20" />
                                            <span className="text-[9px] font-black uppercase tracking-[0.3em] mb-6">Awaiting Motion</span>
                                            <button 
                                                onClick={handleGenerateTeaser}
                                                disabled={regenerating === 'teaser'}
                                                className="relative z-30 bg-white text-black px-8 py-4 rounded-sm font-black text-[10px] uppercase tracking-[0.3em] flex items-center gap-3 hover:bg-arc-orange hover:text-white transition-all shadow-2xl cursor-pointer disabled:opacity-50"
                                            >
                                                {regenerating === 'teaser' ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                                                {regenerating === 'teaser' ? 'Rendering...' : 'Render Teaser'}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Characters Section */}
                    <div className="lg:col-span-8">
                        <div className="flex justify-between items-center mb-6">
                            <label className="text-[10px] uppercase font-black tracking-widest text-gray-600 block">Personnel Dossiers</label>
                            <span className="text-[9px] font-black text-arc-orange uppercase tracking-widest italic">{projectData?.characters?.length || 0} Entities</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {projectData?.characters?.map((char, idx) => (
                                <div key={idx} className="bg-black border border-white/5 rounded-sm p-8 flex flex-col gap-6 group hover:border-arc-teal/20 transition-all duration-500 shadow-xl relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-16 h-16 opacity-[0.02] -mr-4 -mt-4">
                                        <UserCircle className="w-full h-full text-white" />
                                    </div>
                                    <div className="flex gap-6 items-center border-b border-white/5 pb-6">
                                        <div className="w-20 h-20 rounded-full bg-gray-950 overflow-hidden border border-white/10 shrink-0 group-hover:border-arc-teal/50 transition-colors duration-500 shadow-inner">
                                            {char.anchor_url ? (
                                                <img src={char.anchor_url} alt={char.name} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <User className="w-8 h-8 text-gray-800" />
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <h4 className="font-black text-white text-xl uppercase tracking-tighter group-hover:text-arc-teal transition-colors">{char.name}</h4>
                                            <p className="text-[9px] uppercase font-black tracking-[0.2em] text-arc-teal mt-1">{char.role}</p>
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-500 font-light leading-relaxed italic line-clamp-3">"{char.description}"</p>
                                    <div className="mt-auto pt-4 flex justify-between items-center">
                                        <button 
                                            onClick={() => handleRegenerate('character', char.name)}
                                            disabled={regenerating === char.name}
                                            className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-600 hover:text-white flex items-center gap-2 transition-colors disabled:opacity-50"
                                        >
                                            {regenerating === char.name ? <RefreshCw className="w-3 h-3 animate-spin text-arc-teal" /> : <RefreshCw className="w-3 h-3" />}
                                            Regenerate Anchor
                                        </button>
                                        <div className="w-2 h-2 rounded-full bg-white/5 group-hover:bg-arc-teal transition-colors" />
                                    </div>
                                </div>
                            ))}
                            {(!projectData?.characters || projectData.characters.length === 0) && (
                                <div className="col-span-2 text-center py-20 bg-black/50 border border-dashed border-white/5 rounded-sm">
                                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-700 italic">No project personnel identified.</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default VisualsStudio;

