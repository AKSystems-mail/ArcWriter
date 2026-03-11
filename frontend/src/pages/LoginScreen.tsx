import React, { useState, useEffect } from 'react';
import { 
    signInWithPopup, 
    GoogleAuthProvider, 
    onAuthStateChanged, 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword,
    sendPasswordResetEmail,
    sendEmailVerification,
    setPersistence,
    browserLocalPersistence
} from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import { Mail, Lock, UserPlus, ArrowLeft, Loader2, Info } from 'lucide-react';

const LoginScreen: React.FC = () => {
    // Auth Version: 2.5.4-REDR
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [mode, setMode] = useState<'social' | 'email' | 'signup' | 'reset'>('social');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [infoMessage, setInfoMessage] = useState<string | null>(null);
    
    const navigate = useNavigate();
    const provider = new GoogleAuthProvider();

    useEffect(() => {
        // Simple listener: if user is detected, move to app.
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user && !loading) {
                navigate('/app');
            }
        });
        return () => unsubscribe();
    }, [auth, navigate, loading]);

    const handleGoogleSignIn = async () => {
        setLoading(true);
        setError(null);
        try {
            await setPersistence(auth, browserLocalPersistence);
            await signInWithPopup(auth, provider);
            // Navigation is handled by the useEffect listener
        } catch (err: any) {
            console.error("Error during Google Sign-In:", err);
            if (err.code === 'auth/popup-closed-by-user') {
                setError("Sign-in window was closed. Please try again.");
            } else if (err.code === 'auth/cancelled-popup-request') {
                setError("Only one sign-in window can be open at a time.");
            } else {
                setError(err.message);
            }
            setLoading(false);
        }
    };

    const handleEmailAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            if (mode === 'email') {
                await signInWithEmailAndPassword(auth, email, password);
            } else if (mode === 'signup') {
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                await sendEmailVerification(userCredential.user);
                setInfoMessage("Studio Briefing dispatched. Please verify your email.");
                setMode('email');
                setLoading(false);
                return; 
            } else if (mode === 'reset') {
                await sendPasswordResetEmail(auth, email);
                setInfoMessage("Reset link dispatched to your inbox.");
                setMode('email');
            }
            if (mode !== 'reset') navigate('/app');
        } catch (err: any) {
            setError(err.message.replace('Firebase:', '').trim());
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-black font-sans relative overflow-hidden selection:bg-arc-teal/30 text-white">
            {/* Cinematic Background Overlay */}
            <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-arc-teal/5 via-transparent to-transparent opacity-50"></div>
            <div className="absolute inset-0 z-0 bg-cover bg-center opacity-10 grayscale" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1517604907996-f947bb3ef008?auto=format&fit=crop&w=2070&q=80')" }}></div>

            <div className="relative z-10 p-10 md:p-16 bg-[#080808] backdrop-blur-xl border border-white/5 rounded-sm shadow-2xl text-center max-w-md w-full animate-fade-in mx-4">
                <button 
                    onClick={() => navigate('/')}
                    className="absolute top-6 left-6 text-[8px] font-black uppercase tracking-widest text-gray-700 hover:text-white transition-all flex items-center gap-2 group"
                >
                    <ArrowLeft className="w-3 h-3 group-hover:-translate-x-1 transition-transform" />
                    Back to Landing
                </button>

                <div className="flex justify-center mb-10 mt-4">
                    <img 
                        src="/ArcWriter_logo.png" 
                        alt="ArcWriter" 
                        className="h-12 w-auto cursor-pointer hover:scale-105 transition-transform" 
                        onClick={() => navigate('/')}
                    />
                </div>
                
                <span className="text-arc-teal text-[9px] font-black uppercase tracking-[0.5em] mb-4 block italic">Phase 00: Authentication</span>
                
                <h1 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tighter mb-8 leading-tight">
                    {mode === 'social' ? 'Initialize Studio' : 
                     mode === 'email' ? 'Secure Login' : 
                     mode === 'signup' ? 'New Member' : 'Restore Access'}
                </h1>

                {error && (
                    <div className="bg-red-500/5 border border-red-500/20 text-red-400 text-[9px] font-black uppercase tracking-widest px-4 py-3 rounded-sm mb-6 animate-shake" role="alert">
                        <span>{error}</span>
                    </div>
                )}

                {infoMessage && (
                    <div className="bg-arc-teal/5 border border-arc-teal/20 text-arc-teal text-[9px] font-black uppercase tracking-widest px-4 py-3 rounded-sm mb-6 flex items-center gap-2 justify-center">
                        <Info className="w-3 h-3" />
                        <span>{infoMessage}</span>
                    </div>
                )}

                {mode === 'social' ? (
                    <div className="space-y-4">
                        <button
                            onClick={handleGoogleSignIn}
                            disabled={loading}
                            className="w-full flex items-center justify-center px-8 py-5 bg-white text-black font-black text-[9px] uppercase tracking-[0.4em] rounded-sm shadow-xl transition-all duration-500 transform hover:bg-arc-teal hover:text-white active:scale-95 disabled:opacity-50"
                        >
                            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="h-4 w-4 mr-4 grayscale" />
                            Google Auth
                        </button>
                        
                        <div className="flex items-center gap-4 py-4 opacity-20">
                            <div className="h-px flex-1 bg-white/50"></div>
                            <span className="text-[8px] font-black uppercase tracking-widest">or</span>
                            <div className="h-px flex-1 bg-white/50"></div>
                        </div>

                        <button
                            onClick={() => setMode('email')}
                            className="w-full py-5 bg-transparent border border-white/10 text-white font-black text-[9px] uppercase tracking-[0.4em] rounded-sm transition-all hover:bg-white/5 hover:border-white/20"
                        >
                            Email Access
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleEmailAuth} className="space-y-6 text-left animate-fade-in">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 ml-1">Email</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-700" />
                                <input 
                                    type="email" 
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Enter your email"
                                    className="w-full bg-black border border-white/10 rounded-sm py-4 pl-12 pr-4 text-sm font-light focus:outline-none focus:border-arc-teal/50 transition-all placeholder:text-gray-800"
                                />
                            </div>
                        </div>

                        {mode !== 'reset' && (
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 ml-1">Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-700" />
                                    <input 
                                        type="password" 
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="w-full bg-black border border-white/10 rounded-sm py-4 pl-12 pr-4 text-sm font-light focus:outline-none focus:border-arc-teal/50 transition-all placeholder:text-gray-800"
                                    />
                                </div>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-5 bg-arc-teal text-black font-black text-[9px] uppercase tracking-[0.4em] rounded-sm transition-all hover:bg-white shadow-xl flex items-center justify-center gap-3 disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 
                             mode === 'email' ? 'Sign In' : 
                             mode === 'signup' ? 'Create Account' : 'Send Reset Link'}
                        </button>

                        <div className="flex justify-between items-center px-1 pt-4">
                            <button 
                                type="button" 
                                onClick={() => setMode('social')}
                                className="text-[8px] font-black uppercase tracking-widest text-gray-600 hover:text-white flex items-center gap-2 transition-colors"
                            >
                                <ArrowLeft className="w-3 h-3" /> Back
                            </button>
                            
                            {mode === 'email' && (
                                <button 
                                    type="button" 
                                    onClick={() => setMode('reset')}
                                    className="text-[8px] font-black uppercase tracking-widest text-gray-600 hover:text-arc-orange transition-colors"
                                >
                                    Forgot Key?
                                </button>
                            )}
                        </div>

                        {mode === 'email' && (
                            <button 
                                type="button" 
                                onClick={() => setMode('signup')}
                                className="w-full py-4 mt-4 bg-white/5 border border-white/5 text-[8px] font-black uppercase tracking-[0.3em] text-gray-400 hover:text-white hover:bg-white/10 rounded-sm transition-all flex items-center justify-center gap-3"
                            >
                                <UserPlus className="w-3 h-3" />
                                New around here? Join the Room
                            </button>
                        )}
                        
                        {mode === 'signup' && (
                            <button 
                                type="button" 
                                onClick={() => setMode('email')}
                                className="w-full py-4 mt-4 bg-white/5 border border-white/5 text-[8px] font-black uppercase tracking-[0.3em] text-gray-400 hover:text-white hover:bg-white/10 rounded-sm transition-all"
                            >
                                Already a member? Sign in
                            </button>
                        )}
                    </form>
                )}

                <div className="mt-12 pt-8 border-t border-white/5">
                    <p className="text-gray-800 text-[8px] font-black uppercase tracking-[0.4em]">
                        Precision Instruments Active | v2.5.4
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LoginScreen;
