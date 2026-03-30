import React, { useState } from 'react';
import { X, Send, AlertCircle, Sparkles, Loader2, CheckCircle2, MessageSquare } from 'lucide-react';
import { apiClient } from '../api/client';

const FeedbackModal = ({ isOpen, onClose, type = 'bug' }) => {
    const [subject, setSubject] = useState('');
    const [body, setBody] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await apiClient('/api/user/feedback', {
                method: 'POST',
                body: JSON.stringify({
                    subject,
                    body,
                    type,
                    metadata: {
                        user_agent: navigator.userAgent,
                        url: window.location.href
                    }
                })
            });

            if (response.ok) {
                setSubmitted(true);
                setTimeout(() => {
                    onClose();
                    setSubmitted(false);
                    setSubject('');
                    setBody('');
                }, 2000);
            }
        } catch (error) {
            console.error("Feedback error:", error);
            alert("Studio Error: Could not transmit feedback.");
        } finally {
            setLoading(false);
        }
    };

    const isVIP = type === 'feature';

    return (
        <div className="fixed inset-0 z-[400] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 animate-fade-in text-white selection:bg-arc-teal/30">
            <div className="bg-[#050505] border border-white/5 rounded-sm shadow-[0_0_100px_rgba(0,206,201,0.1)] max-w-2xl w-full p-12 relative overflow-hidden">
                <div className={`absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-${isVIP ? 'arc-teal' : 'arc-orange'} to-transparent opacity-50`}></div>
                
                <button 
                    onClick={onClose}
                    className="absolute top-8 right-8 text-gray-600 hover:text-white transition-colors text-2xl"
                >
                    &times;
                </button>

                {submitted ? (
                    <div className="text-center py-12 animate-fade-in">
                        <div className="bg-arc-teal/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-8 border border-arc-teal/20">
                            <CheckCircle2 className="w-10 h-10 text-arc-teal" />
                        </div>
                        <h3 className="text-3xl font-black uppercase tracking-tighter italic mb-4">Transmission Received</h3>
                        <p className="text-white/40 text-[10px] uppercase tracking-widest font-black italic">The Production Team has been notified.</p>
                    </div>
                ) : (
                    <>
                        <div className="text-center mb-12">
                            <div className={`bg-${isVIP ? 'arc-teal' : 'arc-orange'}/10 w-16 h-16 rounded-sm border border-${isVIP ? 'arc-teal' : 'arc-orange'}/20 flex items-center justify-center mx-auto mb-6`}>
                                {isVIP ? <Sparkles className="w-8 h-8 text-arc-teal animate-pulse" /> : <AlertCircle className="w-8 h-8 text-arc-orange" />}
                            </div>
                            <span className={`text-${isVIP ? 'arc-teal' : 'arc-orange'} text-[8px] font-black uppercase tracking-[0.5em] mb-2 block italic`}>
                                {isVIP ? 'VIP Production Request' : 'Emergency Bug Report'}
                            </span>
                            <h2 className="text-4xl font-black text-white uppercase tracking-tighter italic">
                                {isVIP ? 'Request a Feature' : 'Report a Glitch'}
                            </h2>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="text-[10px] uppercase font-black tracking-widest text-white/40 mb-2 block italic">Subject</label>
                                <input 
                                    type="text"
                                    required
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    placeholder={isVIP ? "e.g. Multi-Season Universe Folders" : "e.g. Export button not responding"}
                                    className="w-full bg-black border border-white/10 rounded-sm p-4 text-white focus:outline-none focus:border-arc-teal transition-all text-sm uppercase tracking-tight placeholder:text-gray-800"
                                />
                            </div>

                            <div>
                                <label className="text-[10px] uppercase font-black tracking-widest text-white/40 mb-2 block italic">Detailed Brief</label>
                                <textarea 
                                    required
                                    value={body}
                                    onChange={(e) => setBody(e.target.value)}
                                    rows={5}
                                    placeholder={isVIP ? "What can we build to make your writing process faster?" : "Describe exactly what happened and what you expected to see..."}
                                    className="w-full bg-black border border-white/10 rounded-sm p-4 text-white focus:outline-none focus:border-arc-teal transition-all text-sm font-light leading-relaxed placeholder:text-gray-800"
                                />
                            </div>

                            <div className="pt-4">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className={`w-full py-5 rounded-sm font-black text-[10px] uppercase tracking-[0.5em] transition-all flex items-center justify-center gap-3 shadow-2xl ${isVIP ? 'bg-white text-black hover:bg-arc-teal hover:text-white' : 'bg-arc-orange text-white hover:bg-white hover:text-black'}`}
                                >
                                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                                        <>
                                            <Send className="w-4 h-4" /> Transmit to Studio
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>

                        <p className="mt-10 text-center text-[8px] font-black text-white/20 uppercase tracking-[0.4em]">
                            {isVIP ? 'Direct Line to Architecture Team Active' : 'Debug Environment Data Attached Automatically'}
                        </p>
                    </>
                )}
            </div>
        </div>
    );
};

export default FeedbackModal;
