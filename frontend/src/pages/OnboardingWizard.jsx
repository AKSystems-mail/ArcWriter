import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, Pencil, Film, User, CheckCircle2, FileUp, Zap, Hexagon, Compass, Target } from 'lucide-react';
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
        is_script: false,
        script_blocks: null // Moved out of metadata for stability
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
        if (!data.metadata?.character_descriptions) return;
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
                script_blocks: metadata.script_blocks, // Store blocks separately
                uploaded_file_name: file.name,
                pitch: metadata.logline || prev.pitch,
                is_script: metadata.source_type === "script"
            }));

            setLoading(false);
            // DO NOT auto-advance. Let user check "Screenplay Mode" box if needed.
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
                    script_content: data.script_blocks // Use the separate blocks state
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
        <div className="w-full max-w-5xl mx-auto px-4 z-10">
            <div className="text-center mb-20 max-w-3xl mx-auto animate-fade-in">
                <img src="/ArcWriter_logo.png" alt="ArcWriter" className="h-10 mx-auto mb-12" />
                <span className="text-arc-teal text-[10px] font-black uppercase tracking-[0.5em] mb-4 block">Initialization Phase</span>
                <h2 className="text-5xl md:text-7xl font-black text-white mb-8 tracking-tighter uppercase leading-none">Choose Your <br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-600">Workflow</span></h2>
                <p className="text-gray-500 text-xl font-light leading-relaxed">
                    Select the architectural path that fits your current creative phase.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <button
                    onClick={() => handleModeSelect('explorer')}
                    className="group relative h-[450px] rounded-sm bg-[#080808] border border-white/5 hover:border-arc-teal/30 transition-all duration-700 flex flex-col items-center justify-center p-12 overflow-hidden shadow-2xl"
                >
                    <div className="absolute top-0 left-0 w-full h-[2px] bg-arc-teal scale-x-0 group-hover:scale-x-100 transition-transform duration-700 origin-left" />
                    <div className="relative z-10 text-center">
                        <div className="w-24 h-24 mb-10 mx-auto rounded-full bg-arc-teal/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-700 border border-white/5">
                            <Compass className="w-10 h-10 text-arc-teal" />
                        </div>
                        <h3 className="text-3xl font-black text-white mb-4 uppercase tracking-tighter">The Discovery</h3>
                        <p className="text-gray-500 text-lg font-light italic mb-8">"Start with tone and loose concepts."</p>
                        <div className="h-px w-12 bg-gray-800 mx-auto mb-8" />
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-600 group-hover:text-arc-teal transition-colors">
                            CALIBRATE MOOD & AESTHETIC
                        </p>
                    </div>
                </button>

                <button
                    onClick={() => handleModeSelect('architect')}
                    className="group relative h-[450px] rounded-sm bg-[#080808] border border-white/5 hover:border-arc-orange/30 transition-all duration-700 flex flex-col items-center justify-center p-12 overflow-hidden shadow-2xl"
                >
                    <div className="absolute top-0 left-0 w-full h-[2px] bg-arc-orange scale-x-0 group-hover:scale-x-100 transition-transform duration-700 origin-left" />
                    <div className="relative z-10 text-center">
                        <div className="w-24 h-24 mb-10 mx-auto rounded-full bg-arc-orange/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-700 border border-white/5">
                            <Target className="w-10 h-10 text-arc-orange" />
                        </div>
                        <h3 className="text-3xl font-black text-white mb-4 uppercase tracking-tighter">The Blueprint</h3>
                        <p className="text-gray-500 text-lg font-light italic mb-8">"Start with structure and plot points."</p>
                        <div className="h-px w-12 bg-gray-800 mx-auto mb-8" />
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-600 group-hover:text-arc-orange transition-colors">
                            ENGINEER NARRATIVE LOGIC
                        </p>
                    </div>
                </button>
            </div>
        </div>
    );

    const renderStep2 = () => (
        <div className="w-full max-w-3xl mx-auto px-4 z-10">
            <div className="text-center mb-10">
                <span className="text-arc-teal text-[10px] font-black uppercase tracking-[0.5em] mb-4 block italic">Asset Configuration</span>
                <h2 className="text-5xl md:text-6xl font-black text-white mb-4 tracking-tighter uppercase leading-none text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-600">Story DNA</h2>
            </div>

            <div className="flex flex-col gap-6">
                <div className="relative group bg-[#080808] p-8 border border-white/5 rounded-sm shadow-2xl">
                    <div className="flex justify-between items-center mb-4">
                        <label className="text-[10px] uppercase font-black tracking-widest text-gray-500 block">Cinematic Universe</label>
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
                                className="text-xs font-black uppercase tracking-widest text-arc-teal hover:text-white transition-colors"
                            >
                                {showNewUniverseInput ? "Select Existing" : "Initialize New +"}
                            </button>
                        )}
                    </div>

                    {!showNewUniverseInput && existingUniverses.length > 0 ? (
                        <div className="relative">
                            <select
                                value={data.universe_name}
                                onChange={(e) => setData(prev => ({ ...prev, universe_name: e.target.value }))}
                                className="w-full bg-black border border-white/10 rounded-sm p-4 text-white focus:outline-none focus:border-arc-teal backdrop-blur-sm transition-all appearance-none cursor-pointer text-lg font-bold uppercase tracking-tight"
                            >
                                {existingUniverses.map(u => (
                                    <option key={u.name} value={u.name}>{u.name}</option>
                                ))}
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-600">
                                <ArrowRight className="w-4 h-4 rotate-90" />
                            </div>
                        </div>
                    ) : (
                        <input
                            type="text"
                            value={data.universe_name}
                            onChange={(e) => setData(prev => ({ ...prev, universe_name: e.target.value }))}
                            placeholder="e.g. THE QUANTUM NOIR SAGA"
                            className="w-full bg-black border border-white/10 rounded-sm p-4 text-white focus:outline-none focus:border-arc-teal backdrop-blur-sm transition-all animate-fade-in text-lg font-bold uppercase tracking-tight placeholder:text-gray-800"
                            autoFocus
                        />
                    )}
                </div>

                <div className="relative group bg-[#080808] p-8 border border-white/5 rounded-sm shadow-2xl">
                    <label className="text-[10px] uppercase font-black tracking-widest text-gray-500 mb-4 block">Narrative Brief (Pitch Notes)</label>
                    <textarea
                        value={data.pitch}
                        onChange={(e) => setData(prev => ({ ...prev, pitch: e.target.value }))}
                        placeholder="Distill your vision here. Focus on stakes, conflict, and the core mystery..."
                        disabled={data.uploaded_file_name}
                        className={`w-full bg-black border border-white/10 rounded-sm p-6 text-lg text-white placeholder-gray-800 focus:outline-none focus:border-arc-teal min-h-[200px] resize-none backdrop-blur-sm transition-all font-light leading-relaxed ${data.uploaded_file_name ? 'opacity-50 cursor-not-allowed' : ''}`}
                    />

                    {data.uploaded_file_name && (
                        <div className="absolute bottom-10 right-10 bg-arc-teal/10 text-arc-teal px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border border-arc-teal/30 z-20">
                            <CheckCircle2 className="w-4 h-4" /> {data.uploaded_file_name}
                        </div>
                    )}
                </div>
            </div>

            <div className="mt-10 flex justify-center gap-6">
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
                        className="bg-black text-gray-500 px-10 py-5 rounded-sm font-black text-[10px] uppercase tracking-[0.3em] hover:text-white border border-white/10 transition-all disabled:opacity-50 min-w-[220px] justify-center flex items-center gap-3"
                    >
                        <FileUp className="w-4 h-4" />
                        {loading ? "PROCESSING..." : "IMPORT MANUSCRIPT"}
                    </button>
                    {data.uploaded_file_name && (
                        <div className="flex items-center gap-2 justify-center mt-2">
                            <input
                                type="checkbox"
                                id="is_script"
                                checked={data.is_script}
                                onChange={(e) => setData(prev => ({ ...prev, is_script: e.target.checked }))}
                                className="w-3 h-3 rounded-none border-white/10 bg-black text-arc-teal focus:ring-0"
                            />
                            <label htmlFor="is_script" className="text-gray-600 text-xs font-black uppercase tracking-widest cursor-pointer select-none">
                                Screenplay Mode
                            </label>
                        </div>
                    )}
                </div>

                <button
                    onClick={data.uploaded_file_name ? nextStep : handleGenerate}
                    disabled={(!data.pitch.trim() && !data.uploaded_file_name) || loading}
                    className="bg-white text-black px-12 py-5 rounded-sm font-black text-[10px] uppercase tracking-[0.4em] hover:bg-arc-teal hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed min-w-[220px] justify-center flex items-center gap-3 shadow-2xl shadow-white/5"
                >
                    {loading ? (
                        <>
                            <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
                            <span>{loadingText}</span>
                        </>
                    ) : (
                        <>
                            {data.uploaded_file_name ? "CONTINUE" : "ANALYZE CONCEPT"} <ArrowRight className="w-4 h-4" />
                        </>
                    )}
                </button>
            </div>
        </div>
    );

    const renderStep3 = () => (
        <div className="w-full max-w-6xl mx-auto px-4 z-10">
            <div className="text-center mb-16">
                <span className="text-arc-orange text-[10px] font-black uppercase tracking-[0.5em] mb-4 block italic">Phase 02: Verification</span>
                <h2 className="text-5xl md:text-7xl font-black text-white mb-4 tracking-tighter uppercase leading-none">The Blueprint</h2>
                <p className="text-gray-500 text-lg font-light">Refine the distilled Story DNA before initializing the studio.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 mb-16 items-start">
                <div className="lg:col-span-3 flex flex-col gap-8">
                    <div className="bg-[#080808] border border-white/5 rounded-sm p-10 shadow-2xl">
                        <label className="text-xs uppercase font-black tracking-widest text-gray-500 mb-4 block">Asset Title</label>
                        <input
                            type="text"
                            value={data.metadata?.title || ""}
                            onChange={(e) => updateMetadataField('title', e.target.value)}
                            className="w-full bg-transparent border-b border-white/10 focus:border-arc-teal py-4 text-4xl font-black text-white outline-none transition-colors uppercase tracking-tighter"
                        />
                    </div>

                    <div className="bg-[#080808] border border-white/5 rounded-sm p-10 shadow-2xl">
                        <label className="text-xs uppercase font-black tracking-widest text-gray-500 mb-4 block">Distilled Logline</label>
                        <textarea
                            value={data.metadata?.logline || ""}
                            onChange={(e) => updateMetadataField('logline', e.target.value)}
                            className="w-full bg-transparent text-xl text-gray-300 font-normal leading-relaxed outline-none resize-none min-h-[120px] italic"
                        />
                    </div>

                    <div className="bg-[#080808] border border-white/5 rounded-sm p-10 shadow-2xl">
                        <label className="text-xs uppercase font-black tracking-widest text-gray-500 mb-6 block">Structural Framework</label>
                        <div className="relative">
                            <select
                                value={data.metadata?.structure_suggestion || ""}
                                onChange={(e) => updateMetadataField('structure_suggestion', e.target.value)}
                                className="w-full bg-black border border-white/10 rounded-sm p-5 text-white font-black text-xs uppercase tracking-widest outline-none cursor-pointer appearance-none"
                            >
                                {[
                                    "Hero's Journey",
                                    "Save the Cat",
                                    "Story Circle",
                                    "Three Act",
                                    "Fichtean Curve"
                                ].map(structure => (
                                    <option key={structure} value={structure} className="bg-black text-white">{structure}</option>
                                ))}
                                {data.metadata?.structure_suggestion && ![
                                    "Hero's Journey", "Save the Cat", "Story Circle", "Three Act", "Fichtean Curve"
                                ].includes(data.metadata.structure_suggestion) && (
                                    <option value={data.metadata.structure_suggestion} className="bg-black text-white">
                                        {data.metadata.structure_suggestion}
                                    </option>
                                )}
                            </select>
                            <ArrowRight className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 rotate-90 text-gray-600 pointer-events-none" />
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-2 bg-[#080808] border border-white/5 rounded-sm p-10 shadow-2xl flex flex-col h-full max-h-[700px]">
                    <div className="flex justify-between items-center mb-8">
                        <label className="text-xs uppercase font-black tracking-widest text-gray-500 block">Identified Cast</label>
                        <span className="text-[10px] font-black text-arc-teal uppercase tracking-widest">{data.metadata?.character_descriptions?.length || 0} Entities</span>
                    </div>
                    <div className="flex flex-col gap-6 overflow-y-auto pr-4 custom-scrollbar">
                        {data.metadata?.character_descriptions?.map((char, idx) => (
                            <div key={idx} className="bg-black border border-white/5 rounded-sm p-6 group hover:border-arc-teal/20 transition-all duration-500">
                                <div className="flex flex-col gap-4">
                                    <div className="flex items-center gap-4 border-b border-white/5 pb-4">
                                        <div className="w-8 h-8 rounded-full bg-arc-teal/5 flex items-center justify-center border border-white/5">
                                            <User className="w-4 h-4 text-arc-teal" />
                                        </div>
                                        <input
                                            type="text"
                                            value={char.name}
                                            onChange={(e) => updateCharacter(idx, 'name', e.target.value)}
                                            className="bg-transparent text-white font-black uppercase text-sm tracking-tight outline-none w-full"
                                        />
                                    </div>
                                    <input
                                        type="text"
                                        value={char.role}
                                        onChange={(e) => updateCharacter(idx, 'role', e.target.value)}
                                        className="bg-transparent text-[10px] text-arc-teal uppercase font-black tracking-[0.2em] outline-none block w-full mb-2"
                                    />
                                    <textarea
                                        value={char.description}
                                        rows={4}
                                        onChange={(e) => updateCharacter(idx, 'description', e.target.value)}
                                        className="bg-transparent text-sm text-gray-300 font-normal leading-relaxed outline-none resize-none min-h-[6rem] border-t border-white/5 pt-4"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="flex justify-center">
                <button
                    onClick={nextStep}
                    className="bg-white text-black px-20 py-8 rounded-sm font-black text-[10px] uppercase tracking-[0.5em] hover:bg-arc-teal hover:text-white transition-all duration-500 flex items-center gap-4 shadow-2xl shadow-white/5"
                >
                    Confirm Architecture <ArrowRight className="w-5 h-5" />
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
                <span className="text-arc-teal text-[10px] font-black uppercase tracking-[0.5em] mb-4 block italic">Phase 03: Atmosphere</span>
                <h2 className="text-5xl md:text-7xl font-black text-white mb-8 tracking-tighter uppercase leading-none">Visual Soul</h2>
                <p className="text-xl text-gray-500 font-light mb-16 max-w-3xl mx-auto leading-relaxed">
                    Define the aesthetic profile. This selection calibrates the AI rendering engine for concept art, posters, and atmospheric script feedback.
                </p>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="w-20 h-20 mb-8 rounded-full border-2 border-white/5 border-t-arc-teal animate-spin" />
                        <h3 className="text-xl font-black uppercase tracking-widest text-white animate-pulse">{loadingText}</h3>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-white/5 border border-white/5 shadow-2xl">
                        {vibes.map(vibe => (
                            <button
                                key={vibe.id}
                                onClick={() => handleVibeSelect(vibe.id)}
                                className={`group relative h-56 overflow-hidden bg-black transition-all duration-500`}
                            >
                                <div className={`absolute inset-0 bg-gradient-to-br ${vibe.color} opacity-0 group-hover:opacity-40 transition-all duration-700`} />
                                <div className="absolute top-0 left-0 w-full h-[1px] bg-white/10" />
                                <span className="relative z-10 text-lg font-black uppercase tracking-widest text-gray-500 group-hover:text-white group-hover:scale-110 transition-all duration-500 block">{vibe.name}</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    const renderStep5 = () => {
        const personas = [
            { id: 'market_viability', name: 'Market Viability', icon: <Compass className="w-8 h-8" />, desc: 'Optimizes for high stakes, commercial appeal, and executive interest.' },
            { id: 'thematic_consistency', name: 'Thematic Consistency', icon: <Hexagon className="w-8 h-8" />, desc: 'Focuses on subtext, emotional resonance, and consistent motifs.' },
            { id: 'structural_integrity', name: 'Structural Integrity', icon: <Target className="w-8 h-8" />, desc: 'Rigorous stress-testing of plot logic, pacing, and beat sheet adherence.' },
        ];

        return (
            <div className="w-full max-w-5xl mx-auto px-4 z-10 text-center">
                <span className="text-arc-orange text-[10px] font-black uppercase tracking-[0.5em] mb-4 block italic">Final Phase: Analysis</span>
                <h2 className="text-5xl md:text-7xl font-black text-white mb-8 tracking-tighter uppercase leading-none">Diagnostic Lens</h2>
                <p className="text-xl text-gray-500 font-light mb-16">How should the logic engine prioritize feedback during the script review?</p>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="w-24 h-24 mb-10 rounded-full border-2 border-white/5 border-t-arc-orange animate-spin" />
                        <h3 className="text-xl font-black uppercase tracking-[0.3em] text-white animate-pulse text-center">{loadingText}</h3>
                        <p className="text-gray-600 mt-10 max-w-md text-sm font-bold uppercase tracking-widest mx-auto leading-loose">
                            The Art Department is rendering your world. Assets will be delivered to your Project Bible as soon as they are ready.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {personas.map(persona => (
                            <button
                                key={persona.id}
                                onClick={() => handlePersonaSelect(persona.id)}
                                disabled={loading}
                                className="bg-[#080808] border border-white/5 hover:border-arc-teal/30 p-12 rounded-sm transition-all duration-700 flex flex-col items-center text-center group disabled:opacity-50 disabled:cursor-not-allowed shadow-2xl relative overflow-hidden"
                            >
                                <div className="absolute top-0 left-0 w-1 h-0 bg-arc-teal group-hover:h-full transition-all duration-700" />
                                <div className="w-20 h-20 rounded-full bg-black flex items-center justify-center mb-8 border border-white/5 group-hover:scale-110 transition-transform duration-700">
                                    <div className="text-arc-teal opacity-50 group-hover:opacity-100 transition-opacity">
                                        {persona.icon}
                                    </div>
                                </div>
                                <h3 className="text-xl font-black text-white mb-4 uppercase tracking-tighter group-hover:text-arc-teal transition-colors">{persona.name}</h3>
                                <p className="text-gray-600 text-sm font-light leading-relaxed">{persona.desc}</p>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="fixed inset-0 bg-black bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-gray-900/40 via-black to-black flex flex-col items-center justify-start overflow-y-auto custom-scrollbar">
            <div className={`transition-all duration-700 transform ${animateOut ? 'opacity-0 scale-95 translate-y-8' : 'opacity-100 scale-100 translate-y-0'} w-full pt-20 pb-40 flex flex-col items-center`}>
                {step === 1 && renderStep1()}
                {step === 2 && renderStep2()}
                {step === 3 && renderStep3()}
                {step === 4 && renderStep4()}
                {step === 5 && renderStep5()}
            </div>

            {/* Fixed Progress Navigation */}
            <div className="fixed bottom-12 left-1/2 -translate-x-1/2 flex gap-6 z-[100] bg-black/50 backdrop-blur-md p-4 rounded-full border border-white/5 shadow-2xl">
                {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className={`h-[2px] transition-all duration-1000 ${i <= step ? 'w-16 bg-white' : 'w-4 bg-white/10'}`} />
                ))}
            </div>
        </div>
    );
};

export default OnboardingWizard;