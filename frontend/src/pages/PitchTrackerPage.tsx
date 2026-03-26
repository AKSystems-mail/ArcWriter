import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Activity, ArrowLeft, BarChart3, Shield, 
    Lock, ChevronRight, Loader2, Globe, TrendingUp
} from 'lucide-react';
import { auth, db } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import PitchTracker from '../components/PitchTracker';

const PitchTrackerPage = () => {
    const navigate = useNavigate();
    const [userProfile, setUserProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!auth.currentUser) {
            navigate('/login');
            return;
        }
        const unsub = onSnapshot(doc(db, 'users', auth.currentUser.uid), (doc) => {
            setUserProfile(doc.data());
            setLoading(false);
        });
        return () => unsub();
    }, [navigate]);

    if (loading) return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center">
            <Loader2 className="w-10 h-10 text-arc-teal animate-spin mb-4" />
            <span className="text-[10px] font-black uppercase tracking-[0.5em] text-arc-teal animate-pulse">Accessing Intelligence Vault...</span>
        </div>
    );

    return (
        <div className="min-h-screen bg-black text-white selection:bg-arc-teal/30">
            {/* Command Header */}
            <nav className="fixed top-0 w-full z-[100] px-8 py-6 flex justify-between items-center bg-[#050505] border-b border-white/5">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-4 group cursor-pointer" onClick={() => navigate('/dashboard')}>
                        <img src="/ArcWriter_logo.png" alt="ArcWriter" className="h-8" />
                        <div className="h-4 w-px bg-gray-800"></div>
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white group-hover:text-arc-teal transition-colors">Studio</span>
                    </div>
                    <div className="h-4 w-px bg-gray-800"></div>
                    <button 
                        onClick={() => navigate('/dashboard')}
                        className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.2em] text-white/60 hover:text-white transition-all group"
                    >
                        <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
                        <span>Return to Dashboard</span>
                    </button>
                </div>

                <div className="flex items-center gap-4">
                    <span className="text-[9px] font-black uppercase tracking-widest text-arc-teal bg-arc-teal/10 px-4 py-2 rounded-full border border-arc-teal/20">
                        Writer's Room Authorized
                    </span>
                </div>
            </nav>

            <main className="pt-32 px-8 md:px-12 pb-20 max-w-[1600px] mx-auto animate-fade-in">
                <header className="mb-16 flex justify-between items-end">
                    <div className="max-w-3xl">
                        <span className="text-arc-teal text-[10px] font-black uppercase tracking-[0.5em] mb-4 block italic">Intelligence Command</span>
                        <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter leading-none mb-6">
                            Pitch <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-600">Tracker</span>
                        </h1>
                        <p className="text-white/60 text-lg font-normal italic border-l border-white/10 pl-6 py-1 max-w-2xl leading-relaxed">
                            A centralized ledger of all distributed narrative assets. Monitor engagement, detect forwarding signals, and manage IP protection from a single terminal.
                        </p>
                    </div>
                    <div className="hidden md:flex flex-col items-end gap-2 text-right">
                        <div className="flex items-center gap-2 mb-2">
                            <Globe className="w-4 h-4 text-white/20" />
                            <span className="text-[9px] font-black uppercase tracking-widest text-white/40">Global Monitoring Active</span>
                        </div>
                        <span className="text-xs font-black text-white/60">INTELLIGENCE-V1.0</span>
                    </div>
                </header>

                <div className="bg-[#080808] border border-white/5 rounded-sm p-10 md:p-16 relative shadow-2xl overflow-hidden min-h-[600px]">
                    {/* Background Detail */}
                    <div className="absolute bottom-0 right-0 p-12 opacity-[0.03] pointer-events-none">
                        <BarChart3 className="w-96 h-96 text-white" />
                    </div>

                    <div className="relative z-10">
                        {/* We use the same PitchTracker component but we need to update it slightly to support 'global' mode */}
                        <PitchTracker 
                            universeId="all" 
                            projectId="all" 
                            isSubscriber={userProfile?.subscription_status === 'active'} 
                        />
                    </div>
                </div>
            </main>
        </div>
    );
};

export default PitchTrackerPage;
