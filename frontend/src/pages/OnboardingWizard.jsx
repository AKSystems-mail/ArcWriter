import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, Pencil, Film, User, CheckCircle2, FileUp } from 'lucide-react';
import { auth, db, storage } from '../firebase';
import { apiClient } from '../api/client';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc } from 'firebase/firestore';

const OnboardingWizard = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [loadingText, setLoadingText] = useState("Analyzing Narrative Core...");
    const [animateOut, setAnimateOut] = useState(false);
    const fileInputRef = React.useRef(null);

    // State Machine
    const [data, setData] = useState({
        mode: null,         // 'explorer' | 'architect'
        pitch: '',
        universe_name: '',  
        metadata: null,     
        vibe: null,
        poster_url: null,
        persona: null,      
        is_script: false    
    });

    const updateMetadataField = (field, value) => {
        setData(prev => ({
            ...prev,
            metadata: {
                ...prev.metadata,
                [field]: value
            }
        }));
    };

    const updateCharacter = (index, field, value) => {
        const newChars = [...data.metadata.character_descriptions];
        newChars[index] = { ...newChars[index], [field]: value };
        updateMetadataField('character_descriptions', newChars);
    };

    const [existingUniverses, setExistingUniverses] = useState([]);
    const [showNewUniverseInput, setShowNewUniverseInput] = useState(false);

    useEffect(() => {
        const fetchUniverses = async () => {
            try {
                const response = await apiClient('/api/universes');
                if (response.ok) {
                    const list = await response.json();
                    setExistingUniverses(list);
                    if (list.length > 0) {
                        setData(prev => ({ ...prev, universe_name: list[0].name }));
                    } else {
                        setShowNewUniverseInput(true);
                    }
                }
            } catch (err) {
                console.error("Error fetching universes:", err);
                setShowNewUniverseInput(true);
            }
        };
        fetchUniverses();
    }, []);

    const nextStep = () => {
        setAnimateOut(true);
        setTimeout(() => {
            setStep(s => s + 1);
            setAnimateOut(false);
            setLoading(false); 
        }, 300);
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setLoading(true);
        setLoadingText("Extracting Manuscript Data...");
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await apiClient('/api/onboarding/analyze_file', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Failed to analyze file');
            }

            const metadata = await response.json();

            setData(prev => ({
                ...prev,
                metadata: metadata,
                uploaded_file_name: file.name,
                pitch: metadata.logline || prev.pitch
            }));

            setLoading(false);
            nextStep();
        } catch (error) {
            console.error("Error uploading file:", error);
            alert(`Error: ${error.message}`);
            setLoading(false);
        } finally {
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleModeSelect = (mode) => {
        setData(prev => ({ ...prev, mode }));
        nextStep();
    };

    const handleGenerate = async () => {
        if (!data.pitch.trim()) return;
        setLoading(true);
        setLoadingText("Analyzing Narrative Core...");

        try {
            const response = await apiClient('/api/onboarding/initialize', {
                method: 'POST',
                body: JSON.stringify({ pitch: data.pitch })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Failed to initialize project');
            }

            const metadata = await response.json();
            
            if (metadata.error) {
                console.error("Story DNA Analysis failed:", metadata.error);
                alert(`Story DNA Analysis failed: ${metadata.error}`);
                setLoading(false);
                return;
            }

            setData(prev => ({ ...prev, metadata }));
            nextStep();
        } catch (error) {
            console.error("Error initializing project:", error);
            alert(`Error: ${error.message}`);
            setLoading(false);
        }
    };

    const handleVibeSelect = (vibe) => {
        setData(prev => ({ ...prev, vibe }));
        nextStep();
    };

    const handlePersonaSelect = (persona) => {
        setData(prev => ({ ...prev, persona }));
        finalizeOnboarding(persona);
    };

    const finalizeOnboarding = async (persona) => {
        setLoading(true);
        setLoadingText("Initializing Studio...");
        try {
            const cleanMetadata = Array.isArray(data.metadata) ? data.metadata[0] : data.metadata;

            // 1. Create Project
            const response = await apiClient('/api/onboarding/finalize', {
                method: 'POST',
                body: JSON.stringify({ 
                    ...data, 
                    metadata: cleanMetadata,
                    persona,
                    is_script: data.is_script,
                    script_content: cleanMetadata?.script_blocks || null
                })
            });            
            
            if (!response.ok) throw new Error('Failed to finalize');
            const result = await response.json();
            const { project_id, universe_id } = result;

            // 2. Generate Poster (Sync Hand-off)
            setLoadingText("Art Dept: Rendering Official Poster...");
            try {
                const assetResponse = await apiClient('/api/assets/generate', {
                    method: 'POST',
                    body: JSON.stringify({
                        type: 'poster',
                        title: cleanMetadata.title,
                        tagline: cleanMetadata.logline,
                        genre: cleanMetadata.genre,
                        style: data.vibe
                    })
                });

                if (assetResponse.ok) {
                    const { b64_data } = await assetResponse.json();
                    const storageRef = ref(storage, `posters/${project_id}_initial.jpg`);
                    await uploadString(storageRef, b64_data, 'base64', { contentType: 'image/jpeg' });
                    const url = await getDownloadURL(storageRef);
                    
                    const projectRef = doc(db, 'universes', universe_id, 'projects', project_id);
                    await updateDoc(projectRef, { poster_url: url });
                }
            } catch (err) {
                console.error("Initial visual gen failed, continuing to dashboard:", err);
            }

            const path = result.redirect_to === "editor" ? "editor" : "beat-sheet";
            navigate(`/project/${result.project_id}/${path}`, {
                state: { project_id, universe_id }
            });
        } catch (error) {
            console.error("Error finalizing:", error);
            alert(`Error creating project.`);
        } finally {
            setLoading(false);
        }
    };

    const renderStep1 = () => (
        <div className="w-full max-w-4xl mx-auto px-4 z-10">
            <div className="text-center mb-16 max-w-2xl mx-auto animate-fade-in">
                <h2 className="text-4xl font-bold text-white mb-6">Choose Your Path</h2>
                <p className="text-gray-400 text-lg leading-relaxed">
                    Every story begins differently. Whether you prefer to build from a rigorous structural foundation or discover your narrative through tone and loose concepts, ArcWriter adapts to your creative process. Select the method that best fits your current workflow.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <button
                    onClick={() => handleModeSelect('explorer')}
                    className="group relative h-96 rounded-3xl bg-gray-900/40 border border-gray-700/50 hover:border-violet-500/50 hover:bg-gray-900/60 transition-all duration-500 flex flex-col items-center justify-center p-8 overflow-hidden"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="relative z-10 text-center">
                        <div className="w-20 h-20 mb-6 mx-auto rounded-full bg-violet-500/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                            <Sparkles className="w-10 h-10 text-violet-400" />
                        </div>
                        <h3 className="text-3xl font-bold text-white mb-3">The Discovery</h3>
                        <p className="text-gray-400 text-lg">"Start with tone and loose concepts."</p>
                        <p className="text-sm text-gray-500 mt-4 opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0 duration-500">
                            Discover your story through visuals and mood.
                        </p>
                    </div>
                </button>

                <button
                    onClick={() => handleModeSelect('architect')}
                    className="group relative h-96 rounded-3xl bg-gray-900/40 border border-gray-700/50 hover:border-emerald-500/50 hover:bg-gray-900/60 transition-all duration-500 flex flex-col items-center justify-center p-8 overflow-hidden"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="relative z-10 text-center">
                        <div className="w-20 h-20 mb-6 mx-auto rounded-full bg-emerald-500/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                            <Pencil className="w-10 h-10 text-emerald-400" />
                        </div>
                        <h3 className="text-3xl font-bold text-white mb-3">The Blueprint</h3>
                        <p className="text-gray-400 text-lg">"Start with structure and plot points."</p>
                        <p className="text-sm text-gray-500 mt-4 opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0 duration-500">
                            Build from a strong foundation of structure.
                        </p>
                    </div>
                </button>
            </div>
        </div>
    );

    const renderStep2 = () => (
        <div className="w-full max-w-2xl mx-auto px-4 z-10">
            <div className="text-center mb-10">
                <h2 className="text-4xl font-bold text-white mb-4">Story & Universe</h2>
                <p className="text-xl text-gray-400">Select your universe and pitch your idea.</p>
            </div>

            <div className="flex flex-col gap-6">
                <div className="relative group">
                    <div className="flex justify-between items-center mb-2">
                        <label className="text-[10px] uppercase font-black tracking-widest text-arc-teal block">Cinematic Universe</label>
                        {existingUniverses.length > 0 && (
                            <button 
                                onClick={() => {
                                    const willShowNew = !showNewUniverseInput;
                                    if (willShowNew) {
                                        const isExisting = existingUniverses.some(u => u.name === data.universe_name);
                                        if (isExisting) setData(prev => ({ ...prev, universe_name: '' }));
                                    } else {
                                        if (existingUniverses.length > 0) setData(prev => ({ ...prev, universe_name: existingUniverses[0].name }));
                                    }
                                    setShowNewUniverseInput(willShowNew);
                                }}
                                className="text-[10px] uppercase font-bold text-gray-500 hover:text-white transition-colors"
                            >
                                {showNewUniverseInput ? "Select Existing" : "Create New +"}
                            </button>
                        )}
                    </div>

                    {!showNewUniverseInput && existingUniverses.length > 0 ? (
                        <select
                            value={data.universe_name}
                            onChange={(e) => setData(prev => ({ ...prev, universe_name: e.target.value }))}
                            className="w-full bg-gray-900/50 border border-gray-700 rounded-xl p-4 text-white focus:outline-none focus:border-arc-teal backdrop-blur-sm transition-all appearance-none cursor-pointer"
                        >
                            {existingUniverses.map(u => (
                                <option key={u.name} value={u.name}>{u.name}</option>
                            ))}
                        </select>
                    ) : (
                        <input
                            type="text"
                            value={data.universe_name}
                            onChange={(e) => setData(prev => ({ ...prev, universe_name: e.target.value }))}
                            placeholder="e.g. The Quantum Noir Saga"
                            className="w-full bg-gray-900/50 border border-gray-700 rounded-xl p-4 text-white focus:outline-none focus:border-arc-teal backdrop-blur-sm transition-all animate-fade-in"
                            autoFocus
                        />
                    )}
                </div>

                <div className="relative group">
                    <label className="text-[10px] uppercase font-black tracking-widest text-arc-teal mb-2 block">Story Notes & Brief</label>
                    <textarea
                        value={data.pitch}
                        onChange={(e) => setData(prev => ({ ...prev, pitch: e.target.value }))}
                        placeholder="In a world where..."
                        disabled={data.uploaded_file_name}
                        className={`w-full bg-gray-900/50 border border-gray-700 rounded-2xl p-6 text-xl text-white placeholder-gray-600 focus:outline-none focus:border-arc-teal min-h-[200px] resize-none backdrop-blur-sm transition-all ${data.uploaded_file_name ? 'opacity-50 cursor-not-allowed' : ''}`}
                    />

                    {data.uploaded_file_name && (
                        <div className="absolute bottom-4 right-4 bg-arc-teal/20 text-arc-teal px-3 py-1 rounded-full text-sm flex items-center gap-2 border border-arc-teal/30 z-20">
                            <CheckCircle2 className="w-4 h-4" /> {data.uploaded_file_name}
                        </div>
                    )}
                </div>
            </div>

            <div className="mt-8 flex justify-center gap-4">
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    className="hidden"
                    accept=".pdf"
                />

                <div className="flex flex-col gap-2">
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={loading}
                        className="bg-gray-800 text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-gray-700 transition-colors flex items-center gap-3 disabled:opacity-50 min-w-[200px] justify-center border border-gray-600"
                    >
                        <FileUp className="w-5 h-5" />
                        {loading ? "Analyzing..." : "Upload PDF"}
                    </button>
                    {data.uploaded_file_name && (
                        <div className="flex items-center gap-2 justify-center mt-2">
                            <input
                                type="checkbox"
                                id="is_script"
                                checked={data.is_script}
                                onChange={(e) => setData(prev => ({ ...prev, is_script: e.target.checked }))}
                                className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-arc-teal focus:ring-arc-teal focus:ring-offset-gray-900"
                            />
                            <label htmlFor="is_script" className="text-gray-300 text-sm cursor-pointer select-none">
                                This is a screenplay (import to editor)
                            </label>
                        </div>
                    )}
                </div>

                <button
                    onClick={data.uploaded_file_name ? nextStep : handleGenerate}
                    disabled={(!data.pitch.trim() && !data.uploaded_file_name) || loading}
                    className="bg-white text-black px-8 py-4 rounded-full font-bold text-lg hover:bg-gray-200 transition-colors flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed min-w-[200px] justify-center"
                >
                    {loading ? (
                        <>
                            <div className="animate-spin w-6 h-6 border-2 border-black border-t-transparent rounded-full" />
                            <span>{loadingText}</span>
                        </>
                    ) : (
                        <>
                            {data.uploaded_file_name ? "Continue" : "Analyze Concept"} <ArrowRight className="w-5 h-5" />
                        </>
                    )}
                </button>
            </div>
        </div>
    );

    const renderStep3 = () => (
        <div className="w-full max-w-4xl mx-auto px-4 z-10">
            <div className="text-center mb-10">
                <h2 className="text-4xl font-bold text-white mb-2">Narrative Blueprint</h2>
                <p className="text-lg text-gray-400">The AI has distilled your vision. Refine it before the studio initializes.</p>
                <div className="flex justify-center gap-4 mt-4">
                    <span className="bg-arc-teal/10 border border-arc-teal/30 text-arc-teal px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                        {data.metadata?.beat_sheet ? Object.keys(data.metadata.beat_sheet).length : 0} Narrative Beats Found
                    </span>
                    <span className="bg-purple-500/10 border border-purple-500/30 text-purple-400 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                        {data.metadata?.character_descriptions?.length || 0} Characters Distilled
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                <div className="flex flex-col gap-6">
                    <div className="bg-gray-900/40 border border-gray-700/50 rounded-2xl p-6 backdrop-blur-sm">
                        <label className="text-[10px] uppercase font-black tracking-widest text-arc-teal mb-3 block">Working Title</label>
                        <input
                            type="text"
                            value={data.metadata?.title || ""}
                            onChange={(e) => updateMetadataField('title', e.target.value)}
                            className="w-full bg-transparent border-b border-gray-700 focus:border-arc-teal py-2 text-2xl font-bold text-white outline-none transition-colors"
                        />
                    </div>

                    <div className="bg-gray-900/40 border border-gray-700/50 rounded-2xl p-6 backdrop-blur-sm">
                        <label className="text-[10px] uppercase font-black tracking-widest text-arc-teal mb-3 block">Distilled Logline</label>
                        <textarea
                            value={data.metadata?.logline || ""}
                            onChange={(e) => updateMetadataField('logline', e.target.value)}
                            className="w-full bg-transparent text-gray-300 leading-relaxed outline-none resize-none min-h-[80px]"
                        />
                    </div>

                    <div className="bg-gray-900/40 border border-gray-700/50 rounded-2xl p-6 backdrop-blur-sm">
                        <label className="text-[10px] uppercase font-black tracking-widest text-arc-teal mb-3 block">Story Structure</label>
                        <select
                            value={data.metadata?.structure_suggestion || ""}
                            onChange={(e) => updateMetadataField('structure_suggestion', e.target.value)}
                            className="w-full bg-transparent text-white font-bold outline-none appearance-none cursor-pointer"
                        >
                            <option value="Hero's Journey">Hero's Journey</option>
                            <option value="Save the Cat">Save the Cat</option>
                            <option value="Story Circle">Story Circle</option>
                            <option value="Three Act">Three Act</option>
                            <option value="Fichtean Curve">Fichtean Curve</option>
                        </select>
                    </div>
                </div>

                <div className="bg-gray-900/40 border border-gray-700/50 rounded-2xl p-6 backdrop-blur-sm flex flex-col">
                    <label className="text-[10px] uppercase font-black tracking-widest text-arc-teal mb-4 block">Key Cast (Visual Anchors)</label>
                    <div className="flex flex-col gap-4 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
                        {data.metadata?.character_descriptions?.map((char, idx) => (
                            <div key={idx} className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 group hover:border-gray-500 transition-colors">
                                <div className="flex gap-4 items-start">
                                    <div className="w-10 h-10 rounded-full bg-arc-teal/10 flex items-center justify-center shrink-0">
                                        <User className="w-5 h-5 text-arc-teal" />
                                    </div>
                                    <div className="flex-1">
                                        <input
                                            type="text"
                                            value={char.name}
                                            onChange={(e) => updateCharacter(idx, 'name', e.target.value)}
                                            className="bg-transparent text-white font-bold outline-none block w-full mb-1"
                                        />
                                        <input
                                            type="text"
                                            value={char.role}
                                            onChange={(e) => updateCharacter(idx, 'role', e.target.value)}
                                            className="bg-transparent text-[10px] text-arc-teal uppercase tracking-widest outline-none block w-full"
                                        />
                                        <textarea
                                            value={char.description}
                                            onChange={(e) => updateCharacter(idx, 'description', e.target.value)}
                                            className="bg-transparent text-xs text-gray-400 mt-2 w-full outline-none resize-none leading-relaxed"
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="flex justify-center">
                <button
                    onClick={nextStep}
                    className="bg-arc-teal text-black px-12 py-4 rounded-full font-bold text-lg hover:bg-opacity-90 transition-all flex items-center gap-3 shadow-[0_0_20px_rgba(45,212,191,0.3)]"
                >
                    Confirm Blueprint <ArrowRight className="w-5 h-5" />
                </button>
            </div>
        </div>
    );

    const renderStep4 = () => {
        const vibes = [
            { id: 'scifi', name: 'Sci-Fi', color: 'from-blue-900 to-cyan-500' },
            { id: 'fantasy', name: 'Fantasy', color: 'from-purple-900 to-pink-500' },
            { id: 'horror', name: 'Horror', color: 'from-red-950 to-red-600' },
            { id: 'comedy', name: 'Comedy', color: 'from-yellow-400 to-orange-500' },
            { id: 'indie', name: 'Indie Drama', color: 'from-stone-800 to-stone-400' },
            { id: 'noir', name: 'Neo Noir', color: 'from-gray-900 to-gray-600' },
            { id: 'western', name: 'Western', color: 'from-amber-900 to-orange-500' },
            { id: 'romance', name: 'Romance', color: 'from-pink-300 to-rose-400' },
        ];

        return (
            <div className="w-full max-w-6xl mx-auto px-4 z-10 text-center">
                <h2 className="text-4xl font-bold text-white mb-4">Define Visual Aesthetic</h2>
                <p className="text-xl text-gray-400 mb-12 max-w-3xl mx-auto">
                    Define the visual soul of your story. This selection will calibrate the AI's rendering engine for your concept art, posters, and atmospheric script feedback.
                </p>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="w-24 h-24 mb-6 rounded-full border-4 border-white/20 border-t-arc-teal animate-spin" />
                        <h3 className="text-2xl font-light text-white animate-pulse">{loadingText}</h3>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                        {vibes.map(vibe => (
                            <button
                                key={vibe.id}
                                onClick={() => handleVibeSelect(vibe.id)}
                                className={`group relative h-48 rounded-2xl overflow-hidden border border-white/10 hover:border-white/40 transition-all duration-300 shadow-xl`}
                            >
                                <div className={`absolute inset-0 bg-gradient-to-br ${vibe.color} opacity-60 group-hover:opacity-80 transition-opacity`} />
                                <span className="relative z-10 text-2xl font-bold text-white tracking-wider">{vibe.name}</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    const renderStep5 = () => {
        const personas = [
            { id: 'market_viability', name: 'Market Viability Mode', desc: 'Optimizes for high stakes, pacing, and commercial audience appeal.' },
            { id: 'thematic_consistency', name: 'Thematic Consistency Mode', desc: 'Focuses on subtext, emotional resonance, and narrative motifs.' },
            { id: 'structural_integrity', name: 'Structural Integrity Mode', desc: 'Rigorous stress-testing of plot logic, beat sheet adherence, and pacing.' },
        ];

        return (
            <div className="w-full max-w-4xl mx-auto px-4 z-10 text-center">
                <h2 className="text-4xl font-bold text-white mb-4">Select Analysis Lens</h2>
                <p className="text-xl text-gray-400 mb-12">How should the logic engine prioritize feedback?</p>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="w-24 h-24 mb-6 rounded-full border-4 border-white/20 border-t-arc-orange animate-spin" />
                        <h3 className="text-2xl font-light text-white animate-pulse text-center">{loadingText}</h3>
                        <p className="text-gray-500 mt-6 max-w-lg text-center leading-relaxed">
                            The Art Department is bringing your vision to life and currently rendering your world. Assets will be delivered to your Project Bible and studio archives as soon as they are ready.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {personas.map(persona => (
                            <button
                                key={persona.id}
                                onClick={() => handlePersonaSelect(persona.id)}
                                disabled={loading}
                                className="bg-gray-900/40 border border-gray-700 hover:border-arc-teal/50 hover:bg-gray-800/60 p-8 rounded-2xl transition-all duration-300 flex flex-col items-center text-center group disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                    <User className="w-8 h-8 text-white" />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">{persona.name}</h3>
                                <p className="text-gray-400 text-sm">{persona.desc}</p>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="fixed inset-0 bg-obsidian-black bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-900 via-obsidian-black to-black flex flex-col items-center justify-center overflow-hidden">
            <div className={`transition-all duration-500 transform ${animateOut ? 'opacity-0 scale-95 translate-y-4' : 'opacity-100 scale-100 translate-y-0'} w-full`}>
                {step === 1 && renderStep1()}
                {step === 2 && renderStep2()}
                {step === 3 && renderStep3()}
                {step === 4 && renderStep4()}
                {step === 5 && renderStep5()}
            </div>

            <div className="absolute bottom-10 flex gap-4">
                {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className={`h-1.5 rounded-full transition-all duration-500 ${i <= step ? 'w-12 bg-white' : 'w-2 bg-gray-700'}`} />
                ))}
            </div>
        </div>
    );
};

export default OnboardingWizard;