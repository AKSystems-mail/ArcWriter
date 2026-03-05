import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { CreditCard, Zap, Sparkles, Film, Target, ArrowRight, Loader2 } from 'lucide-react';
import { apiClient } from '../api/client';

interface PricingModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const PricingModal: React.FC<PricingModalProps> = ({ isOpen, onClose }) => {
    const [userProfile, setUserProfile] = useState<any>(null);
    const [loadingTier, setLoadingTier] = useState<string | null>(null);

    useEffect(() => {
        if (!auth.currentUser || !isOpen) return;
        
        const unsub = onSnapshot(doc(db, 'users', auth.currentUser.uid), (doc) => {
            setUserProfile(doc.data());
        });
        
        return () => unsub();
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSelectPlan = async (tier: string) => {
        setLoadingTier(tier);
        try {
            const response = await apiClient('/api/billing/create-session', {
                method: 'POST',
                body: JSON.stringify({ tier })
            });
            const { url } = await response.json();
            window.location.href = url;
        } catch (error) {
            console.error("Billing Error:", error);
            alert("Failed to initiate checkout.");
        } finally {
            setLoadingTier(null);
        }
    };

    const isExplorer = !userProfile?.plan || userProfile.plan === 'explorer' || userProfile.plan === 'free';
    const isWriterRoom = userProfile?.plan?.includes('WRITER_ROOM');

    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-xl flex items-center justify-center z-[100] p-4 animate-fade-in">
            <div className="bg-[#050505] border border-white/5 rounded-sm shadow-[0_0_100px_rgba(0,0,0,0.5)] max-w-4xl w-full p-12 relative overflow-hidden animate-fade-in-delayed">
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-arc-teal to-transparent opacity-50"></div>

                <button
                    onClick={onClose}
                    className="absolute top-8 right-8 text-gray-600 hover:text-white transition-colors text-2xl"
                >
                    &times;
                </button>
                
                <button
                    onClick={() => {
                        onClose();
                        window.location.href = '/billing';
                    }}
                    className="absolute top-8 left-8 flex items-center gap-2 px-4 py-2 hover:bg-white/5 rounded-full border border-white/5 transition-all text-gray-500 hover:text-arc-teal"
                >
                    <CreditCard className="w-3 h-3" />
                    <span className="text-[9px] font-black uppercase tracking-widest">Full Command Center</span>
                </button>

                <div className="text-center mb-16">
                    <span className="text-arc-teal text-[10px] font-black uppercase tracking-[0.5em] mb-4 block italic">Production Authorization</span>
                    <h2 className="text-5xl font-black text-white mb-4 tracking-tighter uppercase">
                        Expand Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-600 italic">Reach.</span>
                    </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* OPTION 1: ALWAYS SHOW TOP-UP */}
                    <div className="bg-black border border-white/5 hover:border-white/10 p-10 flex flex-col justify-between transition-all duration-500 group relative">
                        <div>
                            <div className="flex justify-between items-start mb-8">
                                <h3 className="text-2xl font-black text-white uppercase tracking-tight group-hover:text-arc-teal transition-colors">Script Top-Up</h3>
                                <Zap className="w-5 h-5 text-gray-700 group-hover:text-arc-teal transition-colors" />
                            </div>
                            <p className="text-5xl font-black text-white mb-6 tracking-tighter">$10</p>
                            <ul className="text-[10px] text-gray-500 space-y-4 mb-12 font-black uppercase tracking-widest">
                                <li className="flex items-center gap-3"><span className="text-arc-teal">✦</span> 65 Studio Credits</li>
                                <li className="flex items-center gap-3"><span className="text-arc-teal">✦</span> Immediate Delivery</li>
                                <li className="flex items-center gap-3"><span className="text-arc-teal">✦</span> No Expiration</li>
                            </ul>
                        </div>
                        <button
                            onClick={() => handleSelectPlan('TOP_UP')}
                            disabled={!!loadingTier}
                            className="w-full bg-white/5 border border-white/10 hover:bg-white hover:text-black text-white font-black py-5 transition-all flex items-center justify-center gap-3 text-[10px] uppercase tracking-[0.3em]"
                        >
                            {loadingTier === 'TOP_UP' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Authorize Top-Up'}
                        </button>
                    </div>

                    {/* OPTION 2: DYNAMIC BASED ON PLAN */}
                    {isExplorer ? (
                        /* OFFER WRITER'S ROOM */
                        <div className="bg-black border border-arc-teal/30 hover:border-arc-teal p-10 flex flex-col justify-between transition-all duration-500 group relative shadow-2xl shadow-arc-teal/5">
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-arc-teal text-black text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-full">Recommended</div>
                            <div>
                                <div className="flex justify-between items-start mb-8">
                                    <h3 className="text-2xl font-black text-white uppercase tracking-tight">Writer's Room</h3>
                                    <Sparkles className="w-5 h-5 text-arc-teal" />
                                </div>
                                <p className="text-5xl font-black text-white mb-6 tracking-tighter">$19<span className="text-lg font-light text-gray-600">/mo</span></p>
                                <ul className="text-[10px] text-gray-500 space-y-4 mb-12 font-black uppercase tracking-widest">
                                    <li className="flex items-center gap-3"><span className="text-arc-teal">✦</span> 150 Credits / month</li>
                                    <li className="flex items-center gap-3"><span className="text-arc-teal">✦</span> Unlimited Critique</li>
                                    <li className="flex items-center gap-3"><span className="text-arc-teal">✦</span> Continuity Engine</li>
                                </ul>
                            </div>
                            <button
                                onClick={() => handleSelectPlan('WRITER_ROOM_MONTHLY')}
                                disabled={!!loadingTier}
                                className="w-full bg-arc-teal text-black font-black py-5 hover:bg-white transition-all flex items-center justify-center gap-3 text-[10px] uppercase tracking-[0.3em] shadow-xl"
                            >
                                {loadingTier === 'WRITER_ROOM_MONTHLY' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Join the Room'}
                            </button>
                        </div>
                    ) : (
                        /* OFFER STUDIO PASS */
                        <div className="bg-black border border-arc-orange/30 hover:border-arc-orange p-10 flex flex-col justify-between transition-all duration-500 group relative shadow-2xl shadow-arc-orange/5">
                            <div>
                                <div className="flex justify-between items-start mb-8">
                                    <h3 className="text-2xl font-black text-white uppercase tracking-tight group-hover:text-arc-orange transition-colors">Studio Pass</h3>
                                    <Film className="w-5 h-5 text-arc-orange" />
                                </div>
                                <p className="text-5xl font-black text-white mb-6 tracking-tighter">$49<span className="text-lg font-light text-gray-600">/once</span></p>
                                <ul className="text-[10px] text-gray-500 space-y-4 mb-12 font-black uppercase tracking-widest">
                                    <li className="flex items-center gap-3"><span className="text-arc-orange">✦</span> 600 Master Credits</li>
                                    <li className="flex items-center gap-3"><span className="text-arc-orange">✦</span> Priority Rendering</li>
                                    <li className="flex items-center gap-3"><span className="text-arc-orange">✦</span> Early Veo 3.0 Access</li>
                                </ul>
                            </div>
                            <button
                                onClick={() => handleSelectPlan('STUDIO_PASS')}
                                disabled={!!loadingTier}
                                className="w-full bg-arc-orange text-black font-black py-5 hover:bg-white transition-all flex items-center justify-center gap-3 text-[10px] uppercase tracking-[0.3em] shadow-xl"
                            >
                                {loadingTier === 'STUDIO_PASS' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Get Studio Pass'}
                            </button>
                        </div>
                    )}
                </div>
                
                <p className="mt-12 text-center text-[8px] font-black text-gray-700 uppercase tracking-[0.4em]">
                    Secure Compute Authorization Required for All Transactions
                </p>
            </div>
        </div>
    );
};

export default PricingModal;
