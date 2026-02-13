import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, Wand2, Film, User, CheckCircle2, FileUp } from 'lucide-react';
import { auth } from '../firebase'; // Import auth
import { apiClient } from '../api/client';

const OnboardingWizard = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
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
            setLoading(false); // ALWAYS reset loading on step transition
        }, 300);
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setLoading(true);
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
                // If logline exists, use it as pitch to bypass validation or prefill
                pitch: metadata.logline || prev.pitch
            }));

            console.log("File analysis complete:", metadata);
            setLoading(false); // Reset loading after file analysis
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

        try {
            // Use apiClient to handle auth token attachment automatically
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
            console.log("Metadata generated:", metadata);
            nextStep();
        } catch (error) {
            console.error("Error initializing project:", error);
            alert(`Error: ${error.message}`);
            setLoading(false);
        }
    };

    const handleVibeSelect = async (vibe) => {
        setData(prev => ({ ...prev, vibe }));
        setLoading(true);

        // Create a timeout promise
        const timeoutPromise = new Promise((resolve) => {
            setTimeout(() => {
                console.warn("Image generation timed out. Proceeding without image.");
                resolve({ timeout: true });
            }, 15000); // 15 second timeout for visuals
        });

        // Trigger generic asset generation for poster
        try {
            const apiCall = apiClient('/api/assets/generate', {
                method: 'POST',
                body: JSON.stringify({
                    type: 'poster', 
                    title: data.metadata?.title || "Untitled", 
                    tagline: data.metadata?.logline || "A story waiting to be told.",
                    description: `A movie poster in ${vibe} style. ${data.pitch}`,
                    genre: data.metadata?.genre,
                    style: vibe
                })
            });

            // Race the API call against the timeout
            const response = await Promise.race([apiCall, timeoutPromise]);
            
            if (response && !response.timeout && response.ok) {
                const result = await response.json();
                if (result.url) {
                    setData(prev => ({ ...prev, poster_url: result.url }));
                }
            }
            
            nextStep();
        } catch (error) {
            console.error("Error generating poster:", error);
            nextStep();
        }
    };

    const handlePersonaSelect = (persona) => {
        setData(prev => ({ ...prev, persona }));
        // Auto-finalize after selection
        finalizeOnboarding(persona);
    };

    const finalizeOnboarding = async (persona) => {
        setLoading(true);
        try {
            // Defense-in-depth: Ensure metadata is an object, not a list
            const cleanMetadata = Array.isArray(data.metadata) ? data.metadata[0] : data.metadata;

            const response = await apiClient('/api/onboarding/finalize', {
                method: 'POST',
                body: JSON.stringify({ 
                    ...data, 
                    metadata: cleanMetadata,
                    persona 
                })
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                // LOG THE REAL ERROR TO CONSOLE
                console.error("Validation Error Details:", JSON.stringify(errorData, null, 2));
                throw new Error(errorData.detail ? JSON.stringify(errorData.detail) : 'Failed to finalize project');
            }

            const result = await response.json();

            // DYNAMIC ROUTING based on mode
            const path = result.redirect_to === "editor" ? "editor" : "beat-sheet";
            navigate(`/project/${result.project_id}/${path}`, {
                state: {
                    project_id: result.project_id,
                    universe_id: result.universe_id
                }
            });
        } catch (error) {
            console.error("Error finalizing:", error);
            // Show a more helpful alert (or check console)
            alert(`Error creating project. Check console for details.`);
        } finally {
            setLoading(false);
        }
    };


    // --- Render Steps ---

    const renderStep1 = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl mx-auto px-4 z-10">
            <button
                onClick={() => handleModeSelect('explorer')}
                className="group relative h-96 rounded-3xl bg-gray-900/40 border border-gray-700/50 hover:border-violet-500/50 hover:bg-gray-900/60 transition-all duration-500 flex flex-col items-center justify-center p-8 overflow-hidden"
            >
                <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative z-10 text-center">
                    <div className="w-20 h-20 mb-6 mx-auto rounded-full bg-violet-500/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                        <Sparkles className="w-10 h-10 text-violet-400" />
                    </div>
                    <h3 className="text-3xl font-bold text-white mb-3">The Explorer</h3>
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
                        <Wand2 className="w-10 h-10 text-emerald-400" />
                    </div>
                    <h3 className="text-3xl font-bold text-white mb-3">The Architect</h3>
                    <p className="text-gray-400 text-lg">"Start with structure and plot points."</p>
                    <p className="text-sm text-gray-500 mt-4 opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0 duration-500">
                        Build from a strong foundation of structure.
                    </p>
                </div>
            </button>
        </div>
    );

    const renderStep2 = () => (
        <div className="w-full max-w-2xl mx-auto px-4 z-10">
            <div className="text-center mb-10">
                <h2 className="text-4xl font-bold text-white mb-4">The DNA</h2>
                <p className="text-xl text-gray-400">Select your universe and pitch your idea.</p>
            </div>

            <div className="flex flex-col gap-6">
                <div className="relative group">
                    <div className="flex justify-between items-center mb-2">
                        <label className="text-[10px] uppercase font-black tracking-widest text-arc-teal block">Cinematic Universe</label>
                        <button 
                            onClick={() => {
                                setShowNewUniverseInput(!showNewUniverseInput);
                            }}
                            className="text-[10px] uppercase font-bold text-gray-500 hover:text-white transition-colors"
                        >
                            {showNewUniverseInput ? "Select Existing" : "Create New +"}
                        </button>
                    </div>

                    {!showNewUniverseInput && existingUniverses.length > 0 ? (
                        <select
                            value={data.universe_name}
                            onChange={(e) => setData(prev => ({ ...prev, universe_name: e.target.value }))}
                            className="w-full bg-gray-900/50 border border-gray-700 rounded-xl p-4 text-white focus:outline-none focus:border-arc-teal backdrop-blur-sm transition-all appearance-none"
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
                    <label className="text-[10px] uppercase font-black tracking-widest text-arc-teal mb-2 block">Elevator Pitch</label>
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
                            <span>Analyzing Story DNA...</span>
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

    const renderStep3 = () => {
        const vibes = [
            { id: 'noir', name: 'Neo Noir', color: 'from-gray-900 to-gray-600' },
            { id: 'scifi', name: 'Sci-Fi', color: 'from-blue-900 to-cyan-500' },
            { id: 'western', name: 'Western', color: 'from-amber-900 to-orange-500' },
            { id: 'fantasy', name: 'Fantasy', color: 'from-purple-900 to-pink-500' },
            { id: 'horror', name: 'Horror', color: 'from-red-950 to-red-600' },
            { id: 'indie', name: 'Indie Drama', color: 'from-stone-800 to-stone-400' },
            { id: 'comedy', name: 'Comedy', color: 'from-yellow-400 to-orange-500' },
            { id: 'romance', name: 'Romance', color: 'from-pink-300 to-rose-400' },
        ];

        return (
            <div className="w-full max-w-5xl mx-auto px-4 z-10 text-center">
                <h2 className="text-4xl font-bold text-white mb-4">Define Visual Aesthetic</h2>
                <p className="text-xl text-gray-400 mb-12">Choose a visual style for your world.</p>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="w-24 h-24 mb-6 rounded-full border-4 border-white/20 border-t-arc-teal animate-spin" />
                        <h3 className="text-2xl font-light text-white animate-pulse">Rendering Concept Art...</h3>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                        {vibes.map(vibe => (
                            <button
                                key={vibe.id}
                                onClick={() => handleVibeSelect(vibe.id)}
                                className={`group relative h-48 rounded-2xl overflow-hidden border border-white/10 hover:border-white/40 transition-all duration-300`}
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

    const renderStep4 = () => {
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
                        <h3 className="text-2xl font-light text-white animate-pulse">Initializing Studio...</h3>
                        <p className="text-gray-500 mt-4">Preparing your universe and generating initial scenes.</p>
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
            {/* Background Texture or Noise could go here */}

            <div className={`transition-all duration-500 transform ${animateOut ? 'opacity-0 scale-95 translate-y-4' : 'opacity-100 scale-100 translate-y-0'} w-full`}>
                {step === 1 && renderStep1()}
                {step === 2 && renderStep2()}
                {step === 3 && renderStep3()}
                {step === 4 && renderStep4()}
            </div>

            {/* Progress Indicator */}
            <div className="absolute bottom-10 flex gap-4">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className={`h-1.5 rounded-full transition-all duration-500 ${i <= step ? 'w-12 bg-white' : 'w-2 bg-gray-700'}`} />
                ))}
            </div>
        </div>
    );
};

export default OnboardingWizard;
