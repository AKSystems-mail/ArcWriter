import React, { useState, useEffect } from 'react';
import { Zap, Check, Shield, CreditCard, Sparkles, ArrowRight, Loader2 } from 'lucide-react';
import { apiClient } from '../api/client';
import { auth, db } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';

const Billing = () => {
    const [userProfile, setUserProfile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [isAnnual, setIsAnnual] = useState(false);

    useEffect(() => {
        if (!auth.currentUser) return;
        
        // Real-time listener for credits and plan status
        const unsub = onSnapshot(doc(db, 'users', auth.currentUser.uid), (doc) => {
            setUserProfile(doc.data());
        });
        
        return () => unsub();
    }, []);

    const handleSubscribe = async (tier) => {
        setLoading(true);
        try {
            const response = await apiClient('/api/billing/create-session', {
                method: 'POST',
                body: JSON.stringify({ tier })
            });
            const { url } = await response.json();
            window.location.href = url; // Redirect to Stripe
        } catch (error) {
            console.error("Billing Error:", error);
            alert("Failed to initiate checkout. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const plans = [
        {
            id: 'free',
            name: 'Explorer',
            price: '$0',
            description: 'Test the logic engine and build your first beat sheet.',
            features: ['Public Beat Sheet Builder', '25 Starter Credits', 'Discourse Access'],
            cta: 'Current Plan',
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
        <div className="min-h-screen bg-obsidian-black text-white py-20 px-8">
            <div className="max-w-6xl mx-auto">
                {/* Status Bar */}
                <div className="flex flex-col md:flex-row justify-between items-center bg-white/5 border border-white/10 rounded-sm p-8 mb-20">
                    <div className="flex items-center gap-6 mb-6 md:mb-0">
                        <div className="w-16 h-16 bg-arc-orange/10 rounded-full flex items-center justify-center border border-arc-orange/20">
                            <Zap className="w-8 h-8 text-arc-orange" fill="currentColor" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 mb-1">Current Balance</p>
                            <h2 className="text-3xl font-black tabular-nums">{userProfile?.studio_credits?.toLocaleString() || '0'} <span className="text-sm font-light text-gray-600">Credits</span></h2>
                        </div>
                    </div>
                    <div className="h-12 w-px bg-white/10 hidden md:block" />
                    <div className="text-center md:text-right">
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 mb-1">Active Plan</p>
                        <h3 className="text-xl font-black uppercase text-arc-teal tracking-tighter italic">
                            {userProfile?.plan?.replace('_', ' ') || 'Explorer (Free)'}
                        </h3>
                    </div>
                </div>

                {/* Header */}
                <div className="text-center mb-16">
                    <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter leading-none mb-6">
                        Choose Your <br/>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-600 italic">Production Tier.</span>
                    </h1>
                    
                    {/* Toggle */}
                    <div className="flex items-center justify-center gap-4 mt-12">
                        <span className={`text-[10px] font-black uppercase tracking-widest ${!isAnnual ? 'text-white' : 'text-gray-600'}`}>Monthly</span>
                        <button 
                            onClick={() => setIsAnnual(!isAnnual)}
                            className="w-14 h-7 bg-white/10 rounded-full relative p-1 transition-colors hover:bg-white/20"
                        >
                            <div className={`w-5 h-5 bg-arc-teal rounded-full transition-transform duration-300 ${isAnnual ? 'translate-x-7' : 'translate-x-0'}`} />
                        </button>
                        <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-black uppercase tracking-widest ${isAnnual ? 'text-white' : 'text-gray-600'}`}>Annual</span>
                            <span className="bg-arc-orange/20 text-arc-orange text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter">Save 20%</span>
                        </div>
                    </div>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {plans.map((plan) => (
                        <div 
                            key={plan.id}
                            className={`relative bg-black border ${plan.featured ? 'border-arc-teal shadow-[0_0_50px_rgba(0,206,201,0.1)]' : 'border-white/5'} rounded-sm p-10 flex flex-col transition-all hover:border-white/20`}
                        >
                            {plan.featured && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-arc-teal text-black text-[9px] font-black uppercase tracking-[0.3em] px-4 py-1.5 rounded-full">
                                    Most Popular
                                </div>
                            )}

                            <div className="mb-10">
                                <h3 className="text-2xl font-black uppercase tracking-tighter mb-2 italic">{plan.name}</h3>
                                <p className="text-gray-500 text-sm font-light italic leading-relaxed">{plan.description}</p>
                            </div>

                            <div className="mb-10">
                                <span className="text-5xl font-black tracking-tighter">{plan.price}</span>
                                <span className="text-gray-600 font-light text-lg italic">{plan.period}</span>
                            </div>

                            <div className="space-y-4 mb-12 flex-1">
                                {plan.features.map((feat, i) => (
                                    <div key={i} className="flex items-center gap-3">
                                        <Check className="w-4 h-4 text-arc-teal shrink-0" />
                                        <span className="text-xs text-gray-400 font-light uppercase tracking-widest">{feat}</span>
                                    </div>
                                ))}
                            </div>

                            <button
                                onClick={() => !plan.disabled && handleSubscribe(plan.tier)}
                                disabled={plan.disabled || loading}
                                className={`w-full py-5 rounded-none font-black text-[10px] uppercase tracking-[0.4em] transition-all flex items-center justify-center gap-3 ${
                                    plan.featured 
                                    ? 'bg-arc-teal text-white hover:bg-white hover:text-black shadow-xl' 
                                    : 'bg-white/5 text-white hover:bg-white hover:text-black'
                                } disabled:opacity-30`}
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : plan.cta}
                                {!plan.disabled && <ArrowRight className="w-4 h-4" />}
                            </button>
                        </div>
                    ))}
                </div>

                {/* Beta Code Redemption Section */}
                <div className="mt-20 max-w-md mx-auto p-8 bg-white/5 border border-dashed border-white/10 rounded-sm text-center group hover:border-arc-teal/30 transition-all">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-500 mb-6">Authorized Beta Access</h4>
                    <div className="flex gap-2">
                        <input 
                            id="beta-code-input"
                            type="text" 
                            placeholder="ENTER SECRET CODE" 
                            className="bg-black border border-white/10 px-4 py-3 rounded-none text-xs font-black tracking-widest uppercase focus:outline-none focus:border-arc-teal w-full"
                        />
                        <button 
                            onClick={async () => {
                                const code = document.getElementById('beta-code-input').value;
                                if(!code) return;
                                try {
                                    const response = await apiClient('/api/billing/redeem-beta', {
                                        method: 'POST',
                                        body: JSON.stringify({ code })
                                    });
                                    const data = await response.json();
                                    if (response.ok) {
                                        alert(data.message);
                                        window.location.reload();
                                    } else {
                                        alert(data.detail || "Invalid Code");
                                    }
                                } catch (e) { alert("Redemption failed."); }
                            }}
                            className="bg-white text-black px-6 py-3 font-black text-[9px] uppercase tracking-widest hover:bg-arc-teal hover:text-white transition-all"
                        >
                            Redeem
                        </button>
                    </div>
                    <p className="mt-4 text-[8px] text-gray-700 font-bold uppercase tracking-tighter italic">One-time claim for authorized studio testers.</p>
                </div>

                {/* Footer Security Note */}
                <div className="mt-20 flex flex-col items-center gap-6 opacity-30">
                    <div className="flex items-center gap-8">
                        <Shield className="w-10 h-10" />
                        <CreditCard className="w-10 h-10" />
                    </div>
                    <p className="text-[9px] font-black uppercase tracking-[0.5em] text-center max-w-md">
                        Secure checkout via Stripe. All generations are processed on encrypted compute clusters.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Billing;
