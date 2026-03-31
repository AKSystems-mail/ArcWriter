import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Check, Shield, CreditCard, Sparkles, ArrowRight, Loader2, ArrowLeft } from 'lucide-react';
import { apiClient } from '../api/client';
import { auth, db } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';

const Billing = () => {
    const navigate = useNavigate();
    const [isAnnual, setIsAnnual] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [userProfile, setUserProfile] = useState(null);

    useEffect(() => {
        if (!auth.currentUser) return;
        const unsub = onSnapshot(doc(db, 'users', auth.currentUser.uid), (doc) => {
            setUserProfile(doc.data());
        });
        return () => unsub();
    }, []);

    const handleSubscribe = async (tier) => {
        setIsLoading(true);
        try {
            const response = await apiClient('/api/billing/create-session', {
                method: 'POST',
                body: JSON.stringify({ tier })
            });
            if (!response.ok) throw new Error("Checkout failed");
            const { url } = await response.json();
            window.location.href = url;
        } catch (error) {
            console.error("Billing Error:", error);
            alert("Studio Error: Could not initiate secure checkout.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenPortal = async () => {
        setIsLoading(true);
        try {
            const response = await apiClient('/api/billing/create-portal-session', {
                method: 'POST'
            });
            if (!response.ok) throw new Error("Failed to open portal");
            const { url } = await response.json();
            window.location.href = url;
        } catch (error) {
            console.error("Portal Error:", error);
            alert("Studio Error: Could not open billing portal.");
        } finally {
            setIsLoading(false);
        }
    };

    const plans = [
        {
            id: 'explorer',
            name: 'Explorer',
            price: '$0',
            period: '/mo',
            description: 'The foundation for narrative brainstorming.',
            features: [
                'Limited Logic & Critique',
                '25 Studio Credits',
                'Basic PDF Export',
                '1 Active Universe'
            ],
            cta: 'Current Plan',
            tier: 'FREE',
            disabled: true,
            featured: false
        },
        {
            id: 'writer_room',
            name: "Writer's Room",
            price: isAnnual ? '$15' : '$19',
            period: '/mo',
            description: 'The professional standard for structural screenwriting.',
            features: [
                'Unlimited Logic & Critique',
                '150 Studio Credits / mo',
                'Pitch Tracker (Engagement Intelligence)',
                'Time Machine (50 Snapshots)',
                'High-Fidelity PDF Exports',
                'Universe Continuity Engine'
            ],
            cta: 'Join The Room',
            tier: isAnnual ? 'WRITER_ROOM_ANNUAL' : 'WRITER_ROOM_MONTHLY',
            disabled: false,
            featured: true
        },
        {
            id: 'studio_pass',
            name: 'Studio Pass',
            price: '$49',
            period: ' once',
            description: 'Perfect for completing a heavy visual production.',
            features: [
                '600 Credits (No expiration)',
                'Full Intelligence Vault Access',
                'Permanent Time Machine Unlock',
                'Permanent PDF Unlock',
                'Priority Rendering Queue',
                'Early Access to Veo 3.0'
            ],
            cta: 'Get Studio Pass',
            tier: 'STUDIO_PASS',
            disabled: false,
            featured: false
        }
    ];

    return (
        <div className="min-h-screen bg-black text-white selection:bg-arc-teal/30 selection:text-arc-teal">
            <div className="max-w-7xl mx-auto px-8 py-20 animate-fade-in">
                
                {/* User Stats Bar */}
                <div className="flex flex-col md:flex-row items-center justify-between bg-[#080808] border border-white/5 p-8 rounded-sm mb-20 shadow-2xl">
                    <div className="flex items-center gap-8 mb-6 md:mb-0">
                        <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                            <CreditCard className="w-6 h-6 text-white/40" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 mb-1">Current Balance</p>
                            <h2 className="text-3xl font-black tabular-nums">{userProfile?.studio_credits?.toLocaleString() || '0'} <span className="text-sm font-light text-white/20">Credits</span></h2>
                        </div>
                    </div>
                    <div className="h-12 w-px bg-white/10 hidden md:block" />
                    <div className="text-center md:text-right">
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 mb-1">Active Plan</p>
                        <h3 className="text-xl font-black uppercase text-arc-teal tracking-tighter italic mb-3">
                            {userProfile?.plan?.replace('_', ' ') || 'Explorer (Free)'}
                        </h3>
                        {userProfile?.subscription_status === 'active' && (
                            <button 
                                onClick={handleOpenPortal}
                                className="text-[9px] font-black uppercase tracking-widest text-white/40 hover:text-white border-b border-white/10 hover:border-white transition-all pb-0.5"
                            >
                                Manage Subscription
                            </button>
                        )}
                    </div>
                </div>

                {/* Grace Period Notification */}
                {userProfile?.pending_cancellation && (
                    <div className="mb-12 bg-arc-orange/5 border border-arc-orange/20 p-6 rounded-sm flex items-center gap-6 animate-pulse">
                        <AlertCircle className="w-6 h-6 text-arc-orange" />
                        <div>
                            <p className="text-xs font-black uppercase tracking-widest text-white">Subscription Ending Soon</p>
                            <p className="text-[10px] text-white/60 uppercase tracking-widest mt-1">
                                Your 'Writer's Room' access will remain active until {userProfile.next_billing_date ? new Date(userProfile.next_billing_date).toLocaleDateString() : 'the end of your period'}.
                            </p>
                        </div>
                    </div>
                )}

                {/* Header */}
                <div className="text-center mb-16">
                    <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter leading-none mb-6">
                        Choose Your <br/>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-600 italic">Production Tier.</span>
                    </h1>
                    
                    {/* Toggle */}
                    <div className="flex items-center justify-center gap-6 mt-12">
                        <span className={`text-xs font-black uppercase tracking-widest ${!isAnnual ? 'text-white' : 'text-white/40'}`}>Monthly</span>
                        <button 
                            onClick={() => setIsAnnual(!isAnnual)}
                            className="w-14 h-7 bg-white/10 rounded-full relative p-1 transition-colors hover:bg-white/20"
                        >
                            <div className={`w-5 h-5 bg-arc-teal rounded-full transition-transform duration-300 ${isAnnual ? 'translate-x-7' : 'translate-x-0'}`} />
                        </button>
                        <div className="flex items-center gap-3">
                            <span className={`text-xs font-black uppercase tracking-widest ${isAnnual ? 'text-white' : 'text-white/40'}`}>Annual</span>
                            <span className="bg-arc-orange text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter italic shadow-lg">Save $48/yr</span>
                        </div>
                    </div>
                </div>

                {/* Plans Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {plans.map((plan) => (
                        <div key={plan.id} className={`relative flex flex-col p-12 rounded-sm border transition-all duration-500 bg-[#080808] ${plan.featured ? 'border-arc-teal/30 shadow-[0_0_100px_rgba(0,206,201,0.05)] scale-105 z-10' : 'border-white/5 hover:border-white/10'}`}>
                            {plan.featured && (
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-arc-teal text-black px-6 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.3em] shadow-glow">
                                    Recommended
                                </div>
                            )}

                            <div className="mb-10">
                                <h3 className="text-2xl font-black uppercase tracking-tighter mb-2 italic">{plan.name}</h3>
                                <p className="text-white/40 text-sm font-light italic leading-relaxed">{plan.description}</p>
                            </div>

                            <div className="mb-10">
                                <span className="text-5xl font-black tracking-tighter">{plan.price}</span>
                                <span className="text-white/20 font-light text-lg italic">{plan.period}</span>
                            </div>

                            <div className="space-y-4 mb-12 flex-1">
                                {plan.features.map((feat, i) => (
                                    <div key={i} className="flex items-center gap-3">
                                        <Check className="w-4 h-4 text-arc-teal shrink-0" />
                                        <span className="text-xs text-white/60 font-light uppercase tracking-widest">{feat}</span>
                                    </div>
                                ))}
                            </div>

                            <button
                                onClick={() => handleSubscribe(plan.tier)}
                                disabled={plan.disabled || isLoading}
                                className={`w-full py-5 rounded-sm font-black text-[10px] uppercase tracking-[0.4em] transition-all flex items-center justify-center gap-3 ${plan.featured ? 'bg-white text-black hover:bg-arc-teal hover:text-white' : 'bg-white/5 border border-white/10 text-white hover:bg-white hover:text-black hover:border-white'} disabled:opacity-50 disabled:cursor-default`}
                            >
                                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : plan.cta}
                            </button>
                        </div>
                    ))}
                </div>

                <div className="mt-32 text-center border-t border-white/5 pt-20">
                    <button 
                        onClick={() => navigate('/app')}
                        className="inline-flex items-center gap-3 text-gray-600 hover:text-white transition-colors text-[10px] font-black uppercase tracking-[0.4em]"
                    >
                        <ArrowLeft className="w-4 h-4" /> Return to Studio
                    </button>
                    <p className="mt-8 text-gray-700 text-[10px] uppercase tracking-widest font-medium max-w-md mx-auto leading-relaxed shadow-md">
                        Secure checkout via Stripe. All generations are processed on encrypted compute clusters.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Billing;
