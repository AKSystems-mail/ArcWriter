import React, { useState, useEffect } from 'react';
import { signInWithPopup, GoogleAuthProvider, onAuthStateChanged } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase';

const LoginScreen: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();
    const provider = new GoogleAuthProvider();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                navigate('/app');
            }
        });
        return () => unsubscribe();
    }, [auth, navigate]);

    const handleGoogleSignIn = async () => {
        setLoading(true);
        setError(null);
        try {
            await signInWithPopup(auth, provider);
            navigate('/app');
        } catch (err: any) {
            console.error("Error during Google Sign-In:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-black font-sans relative overflow-hidden selection:bg-arc-teal/30">
            {/* Cinematic Background Overlay */}
            <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-arc-teal/5 via-transparent to-transparent opacity-50"></div>
            <div className="absolute inset-0 z-0 bg-cover bg-center opacity-10 grayscale" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1517604907996-f947bb3ef008?auto=format&fit=crop&w=2070&q=80')" }}></div>

            <div className="relative z-10 p-12 md:p-20 bg-[#080808] backdrop-blur-xl border border-white/5 rounded-sm shadow-2xl text-center max-w-xl w-full animate-fade-in">
                <div className="flex justify-center mb-12">
                    <img src="/ArcWriter_logo.png" alt="ArcWriter" className="h-12 w-auto" />
                </div>
                
                <span className="text-arc-teal text-[10px] font-black uppercase tracking-[0.5em] mb-4 block italic">Phase 00: Authentication</span>
                <h1 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter mb-6 leading-none">
                    Initialize <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-600">The Studio</span>
                </h1>

                <p className="text-lg text-gray-500 mb-12 font-light italic leading-relaxed border-l border-white/10 pl-6 mx-auto max-w-sm">
                    Structural engineering for the next generation of professional screenwriters.
                </p>

                {error && (
                    <div className="bg-red-500/5 border border-red-500/20 text-red-400 text-[10px] font-black uppercase tracking-widest px-4 py-3 rounded-sm relative mb-8 animate-fade-in" role="alert">
                        <span>{error}</span>
                    </div>
                )}

                <button
                    onClick={handleGoogleSignIn}
                    disabled={loading}
                    className="w-full flex items-center justify-center px-10 py-6 bg-white text-black font-black text-[10px] uppercase tracking-[0.4em] rounded-sm shadow-2xl transition-all duration-500 transform hover:bg-arc-teal hover:text-white active:scale-95 disabled:opacity-50"
                >
                    {loading ? (
                        <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full"></div>
                    ) : (
                        <>
                            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="h-4 w-4 mr-4 grayscale" />
                            Initialize Access
                        </>
                    )}
                </button>

                <div className="mt-12 pt-8 border-t border-white/5">
                    <p className="text-gray-700 text-[9px] font-black uppercase tracking-[0.3em]">
                        Precision Instruments Active
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LoginScreen;

