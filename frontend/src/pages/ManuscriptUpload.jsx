import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
    Upload, FileText, Loader2, CheckCircle2, 
    Shield, Sparkles, Wand2, ArrowLeft, Crown 
} from 'lucide-react';
import { auth, db } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { apiClient } from '../api/client';

const ManuscriptUpload = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [userProfile, setUserProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const [processingText, setProcessingText] = useState("Initializing Ingestion Protocol...");
    const fileInputRef = React.useRef(null);

    useEffect(() => {
        if (!auth.currentUser) {
            navigate('/login');
            return;
        }
        const unsub = onSnapshot(doc(db, 'users', auth.currentUser.uid), (doc) => {
            const data = doc.data();
            setUserProfile(data);
            
            // SECURITY: If user doesn't have the credit and isn't just returning from Stripe, boot them
            if (loading && !data?.has_adaptation_credit && !searchParams.get('session_id')) {
                // navigate('/dashboard');
            }
            setLoading(false);
        });
        return () => unsub();
    }, [navigate, searchParams, loading]);

    const handleFileUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        setProcessingText("Ingesting Manuscript... (Extracting Narrative Spine)");
        
        const formData = new FormData();
        formData.append('file', file);

        try {
            // 1. First, we need to extract the raw text (re-using analyze_file for speed)
            const analyzeRes = await apiClient('/api/onboarding/analyze_file', {
                method: 'POST',
                body: formData
            });
            if (!analyzeRes.ok) throw new Error("Failed to read PDF.");
            const analysis = await analyzeRes.json();

            // 2. Trigger the heavy adaptation engine
            setProcessingText("Translating to Cinematic Format... (Generating 40-60 Scenes)");
            const processRes = await apiClient('/api/projects/process_adaptation', {
                method: 'POST',
                body: JSON.stringify({
                    universe_name: "Adapted Universe",
                    raw_text: analysis.raw_text
                })
            });

            if (processRes.ok) {
                const result = await processRes.json();
                setProcessingText("Finalizing Project Bible...");
                setTimeout(() => {
                    navigate(`/project/${result.project_id}/editor`, { 
                        state: { project_id: result.project_id, universe_id: result.universe_id } 
                    });
                }, 2000);
            } else {
                throw new Error("Adaptation engine failed.");
            }

        } catch (err) {
            console.error("Upload Error:", err);
            alert(`Studio Error: ${err.message}`);
            setIsUploading(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center">
            <Loader2 className="w-10 h-10 text-arc-teal animate-spin" />
        </div>
    );

    return (
        <div className="min-h-screen bg-black text-white selection:bg-arc-teal/30 flex flex-col items-center justify-center p-6">
            
            {/* Background Detail */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-arc-teal/5 via-transparent to-transparent pointer-events-none" />

            {isUploading ? (
                <div className="text-center animate-fade-in max-w-xl">
                    <div className="relative w-32 h-32 mx-auto mb-16">
                        <div className="absolute inset-0 border-2 border-arc-teal/20 rounded-full" />
                        <div className="absolute inset-0 border-t-2 border-arc-teal rounded-full animate-spin" />
                        <Wand2 className="absolute inset-0 m-auto w-10 h-10 text-arc-teal animate-pulse" />
                    </div>
                    <h2 className="text-4xl font-black uppercase tracking-tighter italic mb-6">Processing Masterwork</h2>
                    <p className="text-white/60 text-sm uppercase tracking-[0.3em] animate-pulse leading-loose">
                        {processingText}<br/>
                        <span className="text-[10px] mt-6 block opacity-40 italic">This is an intensive studio operation. Do not close this browser.</span>
                    </p>
                </div>
            ) : (
                <div className="max-w-2xl w-full bg-[#050505] border border-white/5 p-16 rounded-sm relative overflow-hidden shadow-[0_0_100px_rgba(0,206,201,0.1)] text-center animate-slide-up">
                    <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-arc-teal to-transparent" />
                    
                    <div className="mb-12">
                        <div className="bg-arc-teal/10 w-20 h-20 rounded-sm border border-arc-teal/20 flex items-center justify-center mx-auto mb-8 shadow-glow">
                            <Crown className="w-10 h-10 text-arc-teal animate-pulse" />
                        </div>
                        <span className="text-arc-teal text-[10px] font-black uppercase tracking-[0.5em] block mb-2 italic">Vault Credit Authorized</span>
                        <h2 className="text-5xl font-black text-white uppercase tracking-tighter italic leading-none">The Master <br/>Ingestion</h2>
                    </div>

                    <p className="text-white/60 text-lg font-light italic mb-12 leading-relaxed px-10">
                        "Your cinematic blueprint is ready to be born. Upload your full manuscript PDF to begin the translation."
                    </p>

                    <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="group bg-white/5 border-2 border-dashed border-white/10 hover:border-arc-teal/50 p-16 rounded-sm transition-all duration-700 flex flex-col items-center justify-center gap-8 cursor-pointer shadow-2xl relative overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-arc-teal/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                        <div className="relative z-10 text-center">
                            <div className="w-24 h-24 mb-6 mx-auto rounded-full bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-700 border border-white/5">
                                <Upload className="w-10 h-10 text-white/40 group-hover:text-arc-teal transition-colors" />
                            </div>
                            <h3 className="text-xl font-black text-white uppercase tracking-tighter italic">Upload Manuscript</h3>
                            <p className="text-gray-600 text-[10px] uppercase font-black tracking-widest mt-2">Maximum 500 Pages | PDF Only</p>
                        </div>
                    </div>

                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        accept=".pdf"
                        className="hidden"
                    />

                    <div className="mt-12 flex items-center justify-center gap-4">
                        <button 
                            onClick={() => navigate('/dashboard')}
                            className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-white/20 hover:text-white transition-colors"
                        >
                            <ArrowLeft className="w-3 h-3" /> Cancel & Return
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManuscriptUpload;
