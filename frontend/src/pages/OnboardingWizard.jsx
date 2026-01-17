import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, Wand2, Film, User, CheckCircle2, FileUp } from 'lucide-react';
import { auth } from '../firebase'; // Import auth

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
        metadata: null,     // { genre, logline, structure_suggestion }
        vibe: null,
        poster_url: null,
        persona: null,      // 'studio_exec' | 'auteur' | 'script_doctor'
        is_script: false    // User toggle for uploaded file type
    });

    const nextStep = () => {
        setAnimateOut(true);
        setTimeout(() => {
            setStep(s => s + 1);
            setAnimateOut(false);
        }, 300);
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setLoading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const token = await auth.currentUser.getIdToken();
            const response = await fetch('/api/onboarding/analyze_file', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
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

        } catch (error) {
            console.error("Error uploading file:", error);
            alert(`Error: ${error.message}`);
        } finally {
            setLoading(false);
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
            const token = await auth.currentUser.getIdToken();
            const response = await fetch('/api/projects/initialize', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ pitch: data.pitch })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Failed to initialize project');
            }

            const metadata = await response.json();
            setData(prev => ({ ...prev, metadata }));
            console.log("Metadata generated:", metadata);
            nextStep();
        } catch (error) {
            console.error("Error initializing project:", error);
            alert(`Error: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleVibeSelect = async (vibe) => {
        setData(prev => ({ ...prev, vibe }));
        setLoading(true); // "Dreaming up your world..."

        // Trigger generic asset generation for poster
        try {
            const token = await auth.currentUser.getIdToken();
            // We use the existing asset generation endpoint but repurpose it or use a specialized one
            // Ideally we'd have a specific endpoint, but let's use the generic generate_asset for now
            // Or wait, we wanted immediate gratification. 
            // In a real app, we might fire this off and listen for a webhook, or await it if it's fast (Imagen is ~4-8s).

            const response = await fetch('/api/assets/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    type: 'poster', // or 'character_concepts' for speed? Poster is better for "Vibe"
                    title: data.metadata?.title || "Untitled", // We might need to ask LLM for a title too!
                    tagline: data.metadata?.logline || "A story waiting to be told.",
                    description: `A movie poster in ${vibe} style. ${data.pitch}`,
                    genre: data.metadata?.genre,
                    style: vibe
                })
            });
            const result = await response.json();

            if (result.url) {
                setData(prev => ({ ...prev, poster_url: result.url }));
            }
            nextStep();
        } catch (error) {
            console.error("Error generating poster:", error);
            // Proceed anyway, maybe without image
            nextStep();
        } finally {
            setLoading(false);
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
            const token = await auth.currentUser.getIdToken();
            const response = await fetch('/api/onboarding/finalize', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ ...data, persona }) // Ensure persona is included
            });
            const result = await response.json();

            // Redirect to Script Editor with the new project ID
            navigate(`/project/${result.project_id}/editor`, {
                state: {
                    project_id: result.project_id,
                    universe_id: result.universe_id
                }
            });
        } catch (error) {
            console.error("Error finalizing:", error);
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
                    <p className="text-gray-400 text-lg">"I have a vibe..."</p>
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
                    <p className="text-gray-400 text-lg">"I have a plan..."</p>
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
                <h2 className="text-4xl font-bold text-white mb-4">The Elevator Pitch</h2>
                <p className="text-xl text-gray-400">Tell us your story idea in a sentence or two.</p>
            </div>

            <div className="relative group">
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
                            {data.uploaded_file_name ? "Continue" : "Generate Magic"} <ArrowRight className="w-5 h-5" />
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
                <h2 className="text-4xl font-bold text-white mb-4">Set the Vibe</h2>
                <p className="text-xl text-gray-400 mb-12">Choose a visual style for your world.</p>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="w-24 h-24 mb-6 rounded-full border-4 border-white/20 border-t-arc-teal animate-spin" />
                        <h3 className="text-2xl font-light text-white animate-pulse">Dreaming up your world...</h3>
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
            { id: 'studio_exec', name: 'The Studio Exec', desc: 'Focus on commercial appeal, budget, and audience.' },
            { id: 'auteur', name: 'The Auteur', desc: 'Prioritize artistic vision, theme, and subtext.' },
            { id: 'script_doctor', name: 'The Doctor', desc: 'Rigorous approach to structure, logic, and efficiency.' },
        ];

        return (
            <div className="w-full max-w-4xl mx-auto px-4 z-10 text-center">
                <h2 className="text-4xl font-bold text-white mb-4">Choose Your Producer</h2>
                <p className="text-xl text-gray-400 mb-12">Who will guide you through this project?</p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {personas.map(persona => (
                        <button
                            key={persona.id}
                            onClick={() => handlePersonaSelect(persona.id)}
                            className="bg-gray-900/40 border border-gray-700 hover:border-arc-teal/50 hover:bg-gray-800/60 p-8 rounded-2xl transition-all duration-300 flex flex-col items-center text-center group"
                        >
                            <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <User className="w-8 h-8 text-white" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">{persona.name}</h3>
                            <p className="text-gray-400 text-sm">{persona.desc}</p>
                        </button>
                    ))}
                </div>
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
