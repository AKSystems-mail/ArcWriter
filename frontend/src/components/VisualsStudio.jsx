import React, { useState, useEffect } from 'react';
import { ImageIcon, User, RefreshCw, Sparkles, CheckCircle2, Layout, UserCircle, Zap, Shield, Share2 } from 'lucide-react';
import { apiClient } from '../api/client';
import { storage, db, auth } from '../firebase';
import { doc, updateDoc, onSnapshot } from 'firebase/firestore';
import PricingModal from './PricingModal';
import ScriptIdentityModal from './ScriptIdentityModal';
import ShareProjectModal from './ShareProjectModal';
import ContextualHelp from './ContextualHelp';

const VisualsStudio = ({ projectData, universeId, projectId, onRefresh }) => {
    const [regenerating, setRegenerating] = useState(null); // 'poster' or character name
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [selectionVariants, setSelectionVariants] = useState(null); // { type, name, variants }
    const [isLocking, setIsLocking] = useState(false); // Feedback for selection click
    const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
    const [isIdentityModalOpen, setIsIdentityModalOpen] = useState(false);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [userProfile, setUserProfile] = useState(null);

    useEffect(() => {
        if (!auth.currentUser) return;
        const unsub = onSnapshot(doc(db, 'users', auth.currentUser.uid), (doc) => {
            setUserProfile(doc.data());
        });
        return () => unsub();
    }, []);

    const checkCredits = (cost) => {
        const credits = userProfile?.studio_credits || 0;
        const isSubscribed = userProfile?.subscription_status === 'active';
        if (!isSubscribed && credits < cost) {
            setIsPricingModalOpen(true);
            return false;
        }
        return true;
    };

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
        const cost = 25; // Standard regen cost
        if (!checkCredits(cost)) return;

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
            if (error.message === 'QUOTA_EXHAUSTED') {
                setError("System Busy: High traffic in the Art Dept. Please try again in 60 seconds.");
            } else {
                setError(`Art Dept Error: ${error.message}`);
            }
        } finally {
            setRegenerating(null);
            setTimeout(() => setError(''), 8000);
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
            setError(`Upload failed: ${err.message}`);
            setTimeout(() => setError(''), 5000);
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
        if (!checkCredits(50)) return; // Teasers cost 50
        
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
            if (error.message === 'QUOTA_EXHAUSTED') {
                setError("System Busy: Motion queue full. Please wait 60 seconds.");
            } else {
                setError(`Motion Dept Error: ${error.message}`);
            }
            setRegenerating(null);
            setTimeout(() => setError(''), 8000);
        }
    };

    const pollTeaserStatus = async (opId) => {
        console.log("Art Dept: Starting poll for operation:", opId);
        setMessage("Motion Dept: Rendering Cinematic Asset... (Est. 2-3 mins. You can safely navigate away; we'll sync the result automatically.)");
        
        const interval = setInterval(async () => {
            try {
                console.log("Art Dept: Polling status for:", opId);
                // Use query parameter and cache-buster to ensure fresh status
                const response = await apiClient(`/api/assets/teaser_status?operation_id=${encodeURIComponent(opId)}&t=${Date.now()}`);
                
                if (!response.ok) {
                    const errorBody = await response.text();
                    console.error(`Art Dept: Teaser status poll failed (${response.status}):`, errorBody);
                    throw new Error(`Server error: ${response.status}`);
                }
                const status = await response.json();
                console.log("Art Dept: Polling result:", status);

                // Check for terminal error state from backend
                if (status.status === 'error') {
                    clearInterval(interval);
                    setError(`Motion Error: ${status.message || 'Render failed'}`);
                    setRegenerating(null);
                    setTimeout(() => setError(''), 8000);
                    return;
                }

                if (status.done) {
                    clearInterval(interval);
                    if (status.video_uri) {
                        // 3. Finalize asset in Firestore
                        const projectRef = doc(db, 'universes', universeId, 'projects', projectId);
                        await updateDoc(projectRef, { teaser_url: status.video_uri });
                        setMessage("Studio Delivery: Teaser Completed!");
                        if (onRefresh) onRefresh();
                    } else {
                        setError("Art Dept Error: Render completed but no video data returned.");
                        setTimeout(() => setError(''), 8000);
                    }
                    setRegenerating(null);
                } else {
                    // Still working
                    console.log("Art Dept: Still rendering teaser...");
                }
            } catch (err) {
                console.warn("Poll failed, retrying...", err);
                // If it's a persistent failure (e.g., 404 or auth), we might want to stop
                if (err.message.includes('401') || err.message.includes('403')) {
                    clearInterval(interval);
                    setRegenerating(null);
                    setError("Auth Error: Please refresh.");
                    setTimeout(() => setError(''), 5000);
                }
            }
        }, 15000); // Check every 15 seconds
    };

    const handleDownloadPitchDeck = async (regData = {}) => {
        setRegenerating('download');
        setMessage("Studio: Compiling Custom Pitch Package...");
        
        try {
            const token = await auth.currentUser?.getIdToken();
            
            // Build section filter
            const sections = Object.keys(exportSettings).filter(k => exportSettings[k]).join(',');
            
            // Add recipient watermark if provided
            let url = `/api/pitchdeck/download/${universeId}/${projectId}?sections=${sections}`;
            if (regData.recipient) {
                url += `&recipient=${encodeURIComponent(regData.recipient)}`;
            }
            
            const response = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) throw new Error("Download failed");

            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = `${projectData?.title || 'Project'}_PitchPackage.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(downloadUrl);
            
            setMessage("Studio Delivery: Package Exported!");
            setTimeout(() => setMessage(''), 5000);
        } catch (error) {
            console.error("Export Error:", error);
            setError("Studio Error: Failed to compile pitch package.");
            setTimeout(() => setError(''), 5000);
        } finally {
            setRegenerating(null);
        }
    };

    // Updated threshold: Only requires Poster and Story content
    const isProjectComplete = projectData?.poster_url && (projectData?.source_material || projectData?.bible_content);

    return (
        <section className="bg-[#080808] border border-white/5 rounded-sm p-10 md:p-16 relative overflow-hidden shadow-2xl">
            <PricingModal 
                isOpen={isPricingModalOpen} 
                onClose={() => setIsPricingModalOpen(false)} 
            />
            <ScriptIdentityModal
                isOpen={isIdentityModalOpen}
                onClose={() => setIsIdentityModalOpen(false)}
                projectData={projectData}
                universeId={universeId}
                projectId={projectId}
                onConfirm={handleDownloadPitchDeck}
            />
            <ShareProjectModal
                isOpen={isShareModalOpen}
                onClose={() => setIsShareModalOpen(false)}
                universeId={universeId}
                projectId={projectId}
                projectTitle={projectData?.title || 'Untitled Project'}
            />
            <div className="absolute top-0 right-0 p-12 opacity-[0.03]">
                <Layout className="w-64 h-64 text-white" />
            </div>

            <div className="relative z-10">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 mb-16 border-b border-white/5 pb-12">
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <span className="text-arc-teal text-[10px] font-black uppercase tracking-[0.5em] italic">Department 04</span>
                            <ContextualHelp sectionId="VISUAL_SOUL" />
                        </div>
                        <h2 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter">
                            Visuals <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-600">Assets</span>
                        </h2>
                        <p className="text-white/70 mt-4 text-lg font-light italic">High-fidelity conceptual anchors for pitch-readiness.</p>
                    </div>
                    <div className="flex flex-col items-end gap-4">
                        {message && (
                            <div className="bg-arc-teal/5 border border-arc-teal/20 text-arc-teal px-6 py-2 rounded-sm text-[10px] font-black uppercase tracking-widest flex items-center gap-3 animate-pulse">
                                <Sparkles className="w-4 h-4" /> {message}
                            </div>
                        )}
                        {error && (
                            <div className="bg-arc-orange/5 border border-arc-orange/20 text-arc-orange px-6 py-2 rounded-sm text-[10px] font-black uppercase tracking-widest flex items-center gap-3 animate-bounce">
                                <Zap className="w-4 h-4" /> {error}
                            </div>
                        )}
                        <div className="flex items-center gap-4">
                            {/* Export Config Toggles */}
                            <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-sm border border-white/5 mr-2">
                                <span className="text-[8px] font-black uppercase tracking-widest text-white/40 mr-2 border-r border-white/10 pr-3">Include:</span>
                                {[
                                    { id: 'cover', label: 'Poster' },
                                    { id: 'story', label: 'Story' },
                                    { id: 'cast', label: 'Cast' },
                                    { id: 'script', label: 'Script' }
                                ].map(item => (
                                    <button
                                        key={item.id}
                                        onClick={() => toggleSetting(item.id)}
                                        className={`text-[8px] font-black uppercase tracking-tighter px-2 py-1 transition-all ${exportSettings[item.id] ? 'text-arc-teal bg-arc-teal/10' : 'text-white/40 bg-transparent'}`}
                                    >
                                        {item.label}
                                    </button>
                                ))}
                            </div>

                            <button
                                onClick={() => setIsShareModalOpen(true)}
                                disabled={!!regenerating}
                                className="text-[9px] font-black uppercase tracking-[0.2em] bg-white hover:bg-arc-teal text-black hover:text-white px-8 py-4 rounded-sm transition-all disabled:opacity-50 shadow-xl flex items-center gap-3"
                            >
                                <Share2 className="w-4 h-4" />
                                Share Studio Pitch
                            </button>

                            <button
                                onClick={() => setIsIdentityModalOpen(true)}
                                disabled={!!regenerating}
                                className={`text-[9px] font-black uppercase tracking-[0.2em] px-8 py-4 rounded-sm transition-all shadow-xl flex items-center gap-3 ${isProjectComplete ? 'bg-arc-orange text-white hover:bg-white hover:text-black animate-glow' : 'bg-white/5 text-white/40 cursor-not-allowed'}`}
                            >
                                <Shield className="w-4 h-4" />
                                {regenerating === 'download' ? "Compiling PDF..." : "Authorize Final Export"}
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
                                <button onClick={() => setSelectionVariants(null)} className="text-white/70 hover:text-arc-teal uppercase font-black text-[10px] tracking-widest transition-colors">Cancel</button>
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
                            <label className="text-[10px] uppercase font-black tracking-widest text-white/40 block">Production Assets</label>
                            <span className="text-[9px] font-black text-arc-orange uppercase tracking-widest italic">Phase 04 deliverables</span>
                        </div>

                        <div className="flex flex-col gap-12">
                            {/* Poster */}
                            <div className="space-y-4">
                                <span className="text-[8px] font-black text-white/40 uppercase tracking-widest ml-1">Official Poster</span>
                                <div className="aspect-[2/3] bg-black rounded-none overflow-hidden border border-white/5 group relative shadow-2xl">
                                    {projectData?.poster_url && !projectData.poster_url.includes('placehold.co') ? (
                                        <img src={projectData.poster_url} alt="Poster" className="w-full h-full object-cover transition-all duration-1000" />
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center text-white/20">
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
                                            <video 
                                                src={projectData.teaser_url} 
                                                className="w-full h-full object-cover" 
                                                autoPlay 
                                                loop 
                                                playsInline 
                                                controls
                                                onPlay={() => {
                                                    // Note: VisualsStudio is for the writer, but we can track their plays too
                                                    // or just leave it for the public PitchDeckView.
                                                    console.log("Teaser playback started");
                                                }}
                                            />
                                            {/* Discrete Control for Teaser */}
                                            <div className="absolute top-4 right-4 z-20">
                                                <button 
                                                    onClick={handleGenerateTeaser}
                                                    disabled={regenerating === 'teaser'}
                                                    title="Regenerate Teaser"
                                                    className="bg-black/40 hover:bg-arc-orange text-white p-3 rounded-full backdrop-blur-md border border-white/10 transition-all shadow-2xl group/btn"
                                                >
                                                    {regenerating === 'teaser' ? (
                                                        <RefreshCw className="w-4 h-4 animate-spin" />
                                                    ) : (
                                                        <div className="flex items-center gap-2">
                                                            <Zap className="w-4 h-4" />
                                                            <span className="text-[8px] font-black uppercase tracking-widest overflow-hidden w-0 group-hover/btn:w-20 transition-all duration-500 whitespace-nowrap">Regenerate</span>
                                                        </div>
                                                    )}
                                                </button>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center text-white/20">
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
                            <label className="text-[10px] uppercase font-black tracking-widest text-white/40 block">Personnel Dossiers</label>
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
                                                    <User className="w-8 h-8 text-white/20" />
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <h4 className="font-black text-white text-xl uppercase tracking-tighter group-hover:text-arc-teal transition-colors">{char.name}</h4>
                                            <p className="text-[9px] uppercase font-black tracking-[0.2em] text-arc-teal mt-1">{char.role}</p>
                                        </div>
                                    </div>
                                    <p className="text-sm text-white/60 font-light leading-relaxed italic line-clamp-3">"{char.description}"</p>
                                    <div className="mt-auto pt-4 flex justify-between items-center">
                                        <button 
                                            onClick={() => handleRegenerate('character', char.name)}
                                            disabled={regenerating === char.name}
                                            className="text-[9px] font-black uppercase tracking-[0.3em] text-white/70 hover:text-arc-teal flex items-center gap-2 transition-colors disabled:opacity-50"
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

