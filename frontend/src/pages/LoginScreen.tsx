import React, { useState, useEffect } from 'react';
import { signInWithPopup, GoogleAuthProvider, onAuthStateChanged } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase'; // Import auth from firebase.js

const LoginScreen: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();
    const provider = new GoogleAuthProvider();

    useEffect(() => {
        // Listen for authentication state changes
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                // User is signed in, redirect to dashboard or home
                console.log("User already signed in:", user.uid);
                navigate('/app'); // Redirect to Traffic Controller
            }
        });
        return () => unsubscribe(); // Cleanup subscription
    }, [auth, navigate]);

    const handleGoogleSignIn = async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await signInWithPopup(auth, provider);
            // The IdP data is available in result.additionalUserInfo.profile.
            // The Firebase credential type is GoogleAuthProvider.credential
            const credential = GoogleAuthProvider.credentialFromResult(result);
            const token = await result.user.getIdToken(); // Get Firebase ID token

            console.log("Google Sign-In successful. User UID:", result.user.uid);
            console.log("Firebase ID Token:", token);

            // Here, you might send the ID token to your backend for verification
            // and to create/update user data in your Firestore or other database.
            // Example:
            // await fetch('http://localhost:5000/api/auth/verify-token', {
            //     method: 'POST',
            //     headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            //     body: JSON.stringify({ userId: result.user.uid })
            // });

            navigate('/app'); // Navigate to Traffic Controller after successful login
        } catch (err: any) {
            console.error("Error during Google Sign-In:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-obsidian-black font-sans relative overflow-hidden">
            {/* Cinematic Background Overlay */}
            <div className="absolute inset-0 z-0 bg-gradient-to-br from-arc-teal/10 via-obsidian-black to-arc-orange/10 opacity-70"></div>
            <div className="absolute inset-0 z-0 bg-cover bg-center opacity-20 transition-opacity duration-1000" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1517604907996-f947bb3ef008?auto=format&fit=crop&w=2070&q=80')" }}></div>

            <div className="relative z-10 p-10 md:p-16 bg-gray-900/40 backdrop-blur-xl border border-gray-800 rounded-3xl shadow-2xl text-center max-w-lg w-full animate-fade-in">
                <div className="flex justify-center mb-6">
                    <img src="/Arc%20Main.png" alt="ArcWriter Logo" className="h-32 w-auto object-contain" />
                </div>
                <div className="h-1 w-20 bg-arc-orange mx-auto mb-8 rounded-full"></div>

                <p className="text-xl text-gray-300 mb-10 font-light">
                    The Cinema-First AI Writing Studio.
                </p>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/50 text-red-200 px-4 py-3 rounded-xl relative mb-6 animate-fade-in" role="alert">
                        <span className="block sm:inline">{error}</span>
                    </div>
                )}

                <button
                    onClick={handleGoogleSignIn}
                    disabled={loading}
                    className="w-full flex items-center justify-center px-8 py-4 border border-transparent rounded-xl shadow-xl text-lg font-bold text-white bg-arc-orange hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-arc-orange transition-all duration-300 transform hover:scale-[1.02] active:scale-95 shadow-arc-orange/20"
                >
                    {loading ? (
                        <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    ) : (
                        <>
                            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google logo" className="h-6 w-6 mr-3" />
                            Continue with Google
                        </>
                    )}
                </button>

                <p className="mt-8 text-gray-500 text-sm">
                    Step into the Architect's chair.
                </p>
            </div>
        </div>
    );
};

export default LoginScreen;
