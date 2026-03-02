import React, { useState } from 'react';
import { auth } from '../firebase'; // Import your Firebase auth instance

interface PricingModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const PricingModal: React.FC<PricingModalProps> = ({ isOpen, onClose }) => {
    const [loadingSubscription, setLoadingSubscription] = useState(false);
    const [loadingPack, setLoadingPack] = useState(false);

    if (!isOpen) return null;

    const handleSelectPlan = async (planType: 'subscription' | 'pack') => {
        const currentUser = auth.currentUser;
        if (!currentUser) {
            console.error("No user logged in.");
            // Optionally redirect to login or show a message
            return;
        }

        const idToken = await currentUser.getIdToken();
        const setLoading = planType === 'subscription' ? setLoadingSubscription : setLoadingPack;
        setLoading(true);

        try {
            const response = await fetch(`/api/stripe/create-checkout-session/${planType}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${idToken}`, // Send Firebase ID token
                },
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            if (data.checkout_url) {
                window.location.href = data.checkout_url; // Redirect to Stripe Checkout
            } else {
                console.error("No checkout URL received.");
            }
        } catch (error: any) {
            console.error(`Error selecting ${planType} plan:`, error.message);
            // Display error to user
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-obsidian-black/80 backdrop-blur-xl flex items-center justify-center z-[100] p-4 animate-fade-in">
            <div className="bg-gray-900 border border-gray-800 rounded-[2.5rem] shadow-[0_0_100px_rgba(0,0,0,0.8)] max-w-5xl w-full p-12 relative overflow-hidden animate-fade-in-delayed">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-arc-teal via-arc-orange to-arc-teal"></div>

                <button
                    onClick={onClose}
                    className="absolute top-8 right-8 text-gray-500 hover:text-white transition-colors text-4xl leading-none"
                >
                    &times;
                </button>
                
                {/* View Plans Button */}
                <button
                    onClick={() => {
                        onClose(); // Close the modal first
                        window.location.href = '/billing'; // Navigate to billing page
                    }}
                    className="absolute top-8 left-8 flex items-center gap-2 px-4 py-2 hover:bg-white/5 rounded-full border border-white/5 transition-all text-gray-400 hover:text-arc-teal"
                >
                    <CreditCard className="w-3 h-3" />
                    <span className="text-[9px] font-black uppercase tracking-widest">View All Plans</span>
                </button>

                <div className="text-center mb-16">
                    <h2 className="text-5xl font-black text-white mb-4 tracking-tighter">
                        Elevate Your <span className="text-arc-teal">Craft</span>
                    </h2>
                    <p className="text-gray-400 text-lg font-medium uppercase tracking-[0.2em]">Unlock the Full Studio Experience</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    {/* Writer's Room Plan */}
                    <div className="bg-obsidian-black border border-arc-teal/30 hover:border-arc-teal rounded-[2rem] p-10 flex flex-col justify-between transition-all duration-500 group shadow-2xl hover:shadow-arc-teal/10">
                        <div>
                            <div className="flex justify-between items-start mb-8">
                                <h3 className="text-3xl font-bold text-white group-hover:text-arc-teal transition-colors tracking-tight">The Writer's Room</h3>
                                <span className="bg-arc-teal/10 text-arc-teal text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-arc-teal/20">SaaS</span>
                            </div>
                            <p className="text-6xl font-black text-white mb-8 tracking-tighter">
                                $15<span className="text-xl font-medium text-gray-500"> /mo</span>
                            </p>
                            <ul className="text-gray-400 space-y-4 mb-12">
                                <li className="flex items-center gap-3">
                                    <span className="text-arc-teal">✦</span> Unlimited Critique Engine
                                </li>
                                <li className="flex items-center gap-3">
                                    <span className="text-arc-teal">✦</span> 150 Studio Credits /mo
                                </li>
                                <li className="flex items-center gap-3">
                                    <span className="text-arc-teal">✦</span> Priority Rendering Pipeline
                                </li>
                            </ul>
                        </div>
                        <button
                            onClick={() => handleSelectPlan('subscription')}
                            disabled={loadingSubscription}
                            className="w-full bg-arc-teal hover:bg-opacity-90 text-white font-black py-5 px-8 rounded-2xl text-lg transition-all transform active:scale-95 shadow-xl shadow-arc-teal/20"
                        >
                            {loadingSubscription ? 'INITIALIZING...' : 'SELECT WRITER\'S ROOM'}
                        </button>
                    </div>

                    {/* Studio Top-Up Pack */}
                    <div className="bg-obsidian-black border border-arc-orange/30 hover:border-arc-orange rounded-[2rem] p-10 flex flex-col justify-between transition-all duration-500 group shadow-2xl hover:shadow-arc-orange/10">
                        <div>
                            <div className="flex justify-between items-start mb-8">
                                <h3 className="text-3xl font-bold text-white group-hover:text-arc-orange transition-colors tracking-tight">Studio Pass</h3>
                                <span className="bg-arc-orange/10 text-arc-orange text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-arc-orange/20">LIFETIME</span>
                            </div>
                            <p className="text-6xl font-black text-white mb-8 tracking-tighter">
                                $49<span className="text-xl font-medium text-gray-500"> /once</span>
                            </p>
                            <ul className="text-gray-400 space-y-4 mb-12">
                                <li className="flex items-center gap-3">
                                    <span className="text-arc-orange">✦</span> 600 Studio Credits
                                </li>
                                <li className="flex items-center gap-3">
                                    <span className="text-arc-orange">✦</span> High-Fidelity PDF Exports
                                </li>
                                <li className="flex items-center gap-3">
                                    <span className="text-arc-orange">✦</span> Early Access to Veo 3.0
                                </li>
                            </ul>
                        </div>
                        <button
                            onClick={() => handleSelectPlan('pack')}
                            disabled={loadingPack}
                            className="w-full bg-arc-orange hover:bg-opacity-90 text-white font-black py-5 px-8 rounded-2xl text-lg transition-all transform active:scale-95 shadow-xl shadow-arc-orange/20"
                        >
                            {loadingPack ? 'PROCESSING...' : 'GET STUDIO PACK'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PricingModal;
