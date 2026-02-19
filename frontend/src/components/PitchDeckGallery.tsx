import React, { useState, useEffect, useRef } from 'react';
import { auth } from '../firebase'; // Import auth from firebase.js
import PricingModal from './PricingModal'; // Import PricingModal

interface PitchDeckGalleryProps {
    logline?: string;
    synopsis?: string;
    moodImageUrl?: string;
    characterAnchorUrl?: string; // This should come from the character profile
}

const POSTER_COST = 10;
const TEASER_COST = 20;

const PitchDeckGallery: React.FC<PitchDeckGalleryProps> = ({
    logline = 'In a dystopian future, a lone rebel discovers a hidden truth that could shatter the oppressive regime, but at what cost?',
    synopsis = 'Year 2077. The megacity of Neo-Veridia thrives under the iron fist of the omniscient Aethel Corp, a company that controls every aspect of its citizens\' lives through advanced neural implants. Kael, a former data architect now living off-grid, stumbles upon a suppressed historical archive revealing Aethel Corp\'s true origins: a brutal coup that erased the true founding principles of the city. Haunted by the truth, Kael must choose between a quiet, safe existence and igniting a revolution against an enemy that sees and hears all. His journey forces him to confront his own past, rally a disillusioned populace, and ultimately decide if freedom is worth the ultimate sacrifice.',
    moodImageUrl = 'https://via.placeholder.com/1920x300?text=Cinematic+Mood+Header',
    characterAnchorUrl = 'https://via.placeholder.com/150?text=Anchor+Image', // Placeholder
}) => {
    const [teaserJobId, setTeaserJobId] = useState<string | null>(null);
    const [teaserStatus, setTeaserStatus] = useState<'idle' | 'generating' | 'completed' | 'error'>('idle');
    const [teaserVideoUrl, setTeaserVideoUrl] = useState<string | null>(null);
    const [progress, setProgress] = useState<number>(0);
    const pollingIntervalRef = useRef<number | null>(null);

    const [generatedPosterUrl, setGeneratedPosterUrl] = useState<string | null>(null);
    const [isGeneratingPoster, setIsGeneratingPoster] = useState<boolean>(false);

    const [userCredits, setUserCredits] = useState<number | null>(null);
    const [isSubscribed, setIsSubscribed] = useState<boolean>(false);
    const [isPricingModalOpen, setIsPricingModalOpen] = useState<boolean>(false);
    const PROJECT_TITLE = "ArcWriter - The Genesis"; // Hardcoded for now
    const PROJECT_TAGLINE = "A new beginning for humanity."; // Hardcoded for now
    const PROJECT_GENRE = "Sci-Fi"; // Hardcoded for now
    const UNIVERSE_NAME = "default"; // Hardcoded for now
    const PROJECT_ID = "operation_blackout"; // Hardcoded for now

    const fetchUserData = async () => {
        const currentUser = auth.currentUser;
        if (!currentUser) {
            setUserCredits(0);
            setIsSubscribed(false);
            return;
        }
        try {
            const idToken = await currentUser.getIdToken();
            const response = await fetch('/api/user/me', {
                headers: {
                    'Authorization': `Bearer ${idToken}`,
                },
            });
            if (!response.ok) {
                throw new Error('Failed to fetch user data');
            }
            const data = await response.json();
            setUserCredits(data.studio_credits);
            setIsSubscribed(data.subscription_status === 'active');
        } catch (error) {
            console.error("Error fetching user data:", error);
            setUserCredits(0);
            setIsSubscribed(false);
        }
    };

    useEffect(() => {
        const unsubscribe = auth.onIdTokenChanged(user => {
            if (user) {
                fetchUserData();
            } else {
                setUserCredits(0);
                setIsSubscribed(false);
            }
        });
        fetchUserData(); // Initial fetch
        return () => unsubscribe();
    }, [auth]);

    const canGeneratePoster = isSubscribed || (userCredits !== null && userCredits >= POSTER_COST);
    const posterTooltip = isSubscribed ? "Free with subscription" : `Costs ${POSTER_COST} Credits. Balance: ${userCredits !== null ? userCredits : '...'}`;
    const canGenerateTeaser = isSubscribed || (userCredits !== null && userCredits >= TEASER_COST);
    const teaserTooltip = isSubscribed ? "Free with subscription" : `Costs ${TEASER_COST} Credits. Balance: ${userCredits !== null ? userCredits : '...'}`;

    const handleGenerateTeaser = async () => {
        if (!canGenerateTeaser) {
            setIsPricingModalOpen(true);
            return;
        }
        setTeaserStatus('generating');
        setTeaserVideoUrl(null);
        setTeaserJobId(null);
        setProgress(0);

        try {
            const idToken = await auth.currentUser?.getIdToken();
            if (!idToken) throw new Error("Authentication token not found.");

            const response = await fetch('/api/assets/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${idToken}`,
                },
                body: JSON.stringify({
                    type: 'teaser',
                    beat: "A dramatic chase scene through a futuristic city, ending with a surprising reveal.",
                    reference_image_url: characterAnchorUrl,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            setTeaserJobId(data.job_id);
            setProgress(10);
            fetchUserData(); // Refresh credits after deduction

        } catch (error: any) {
            console.error("Error generating teaser:", error.message);
            setTeaserStatus('error');
        }
    };

    const handleGeneratePoster = async () => {
        if (!canGeneratePoster) {
            setIsPricingModalOpen(true);
            return;
        }
        setIsGeneratingPoster(true);
        setGeneratedPosterUrl(null);

        try {
            const idToken = await auth.currentUser?.getIdToken();
            if (!idToken) throw new Error("Authentication token not found.");

            const response = await fetch('/api/assets/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${idToken}`,
                },
                body: JSON.stringify({
                    type: 'poster',
                    title: PROJECT_TITLE,
                    tagline: PROJECT_TAGLINE,
                    genre: PROJECT_GENRE,
                    reference_image_url: characterAnchorUrl,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            setGeneratedPosterUrl(data.url);
            fetchUserData(); // Refresh credits after deduction

        } catch (error: any) {
            console.error("Error generating poster:", error.message);
            // Handle error state in UI if needed
        } finally {
            setIsGeneratingPoster(false);
        }
    };

    const handleDownloadPitchDeck = () => {
        const downloadUrl = `/api/pitchdeck/download/${UNIVERSE_NAME}/${PROJECT_ID}`;
        window.open(downloadUrl, '_blank');
    };

    useEffect(() => {
        if (teaserJobId && teaserStatus === 'generating') {
            pollingIntervalRef.current = window.setInterval(async () => {
                try {
                    const idToken = await auth.currentUser?.getIdToken();
                    if (!idToken) throw new Error("Authentication token not found.");

                    const response = await fetch(`/api/assets/check_video_status/${teaserJobId}`, {
                        headers: {
                            'Authorization': `Bearer ${idToken}`,
                        },
                    });
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    const data = await response.json();

                    if (data.status === 'completed') {
                        setTeaserStatus('completed');
                        setTeaserVideoUrl(data.video_url);
                        setProgress(100);
                        if (pollingIntervalRef.current) {
                            clearInterval(pollingIntervalRef.current);
                        }
                    } else if (data.status === 'pending') {
                        setProgress(prev => Math.min(prev + 10, 90));
                    }
                } catch (error) {
                    console.error("Error polling teaser status:", error);
                    setTeaserStatus('error');
                    if (pollingIntervalRef.current) {
                        clearInterval(pollingIntervalRef.current);
                    }
                }
            }, 2000);
        } else if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
        }

        return () => {
            if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
            }
        };
    }, [teaserJobId, teaserStatus, auth]);


    return (
        <div className="min-h-screen bg-gray-900 text-white font-sans">
            {/* Mood Header */}
            <div
                className="relative h-64 bg-cover bg-center flex items-center justify-center"
                style={{ backgroundImage: `url(${moodImageUrl})` }}
            >
                <div className="absolute inset-0 bg-black opacity-50"></div>
                <h1 className="relative z-10 text-5xl font-extrabold text-white text-center drop-shadow-lg">
                    Project Pitch Deck
                </h1>
                <button
                    onClick={handleDownloadPitchDeck}
                    className="absolute top-4 right-4 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-md transition-colors duration-300"
                >
                    Download Pitch Deck PDF
                </button>
            </div>

            <div className="container mx-auto px-8 py-12 flex flex-col lg:flex-row gap-12">
                {/* Left Section: Movie Poster */}
                <div className="flex-shrink-0 lg:w-1/3 flex justify-center lg:justify-end">
                    <div className="relative w-full max-w-sm rounded-none overflow-hidden shadow-2xl transform hover:scale-105 transition-transform duration-300">
                        <img
                            src={generatedPosterUrl || 'https://via.placeholder.com/600x900?text=Movie+Poster'}
                            alt="Movie Poster"
                            className="w-full h-auto object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent opacity-70"></div>
                        <div className="absolute bottom-4 left-4 right-4">
                            <button
                                onClick={handleGeneratePoster}
                                disabled={isGeneratingPoster || !canGeneratePoster}
                                title={posterTooltip}
                                className={`w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg text-lg transition-colors duration-300
                                            ${(isGeneratingPoster || !canGeneratePoster) ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                {isGeneratingPoster ? 'Generating Poster...' : 'Generate New Poster'}
                            </button>
                        </div>
                    </div>
                    {userCredits !== null && !isSubscribed && userCredits < POSTER_COST && (
                        <button
                            onClick={() => setIsPricingModalOpen(true)}
                            className="mt-4 w-full bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-bold py-2 px-4 rounded-md transition-colors duration-300"
                        >
                            Get More Credits
                        </button>
                    )}
                </div>

                {/* Right Section: Logline and Synopsis */}
                <div className="lg:w-2/3 flex flex-col justify-center">
                    <h2 className="text-4xl font-bold mb-4 text-red-500">
                        {PROJECT_TITLE}
                    </h2>
                    <p className="text-xl italic mb-6 text-gray-300">
                        "{PROJECT_TAGLINE}"
                    </p>
                    <p className="text-lg leading-relaxed text-gray-200">
                        {synopsis}
                    </p>

                    {/* Additional marketing materials could go here */}
                    <div className="mt-10 pt-8 border-t border-gray-700">
                        <h3 className="text-3xl font-bold mb-6 text-red-500">More Assets</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                            {/* Placeholder for character sheets, other posters */}
                            <div className="bg-gray-800 rounded-lg p-4 shadow-xl">
                                <img src={characterAnchorUrl} alt="Character Anchor" className="w-full h-auto rounded-md mb-2" />
                                <p className="text-sm text-gray-400">Main Character Anchor</p>
                            </div>
                            <div className="bg-gray-800 rounded-lg p-4 shadow-xl">
                                <img src="https://via.placeholder.com/150?text=Poster+Variant" alt="Poster Variant" className="w-full h-auto rounded-md mb-2" />
                                <p className="text-sm text-gray-400">Poster Variant</p>
                            </div>

                            {/* Teasers Section */}
                            <div className="bg-gray-800 rounded-lg p-4 shadow-xl flex flex-col justify-between">
                                <h4 className="text-lg font-semibold mb-2 text-white">Motion Teaser</h4>
                                {teaserStatus === 'idle' && (
                                    <button
                                        onClick={handleGenerateTeaser}
                                        disabled={!canGenerateTeaser}
                                        title={teaserTooltip}
                                        className={`mt-auto bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition-colors duration-300
                                                    ${!canGenerateTeaser ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        Generate Motion Teaser
                                    </button>
                                )}
                                {teaserStatus === 'generating' && (
                                    <div className="mt-auto text-center">
                                        <p className="text-yellow-400 mb-2">Rendering...</p>
                                        <div className="w-full bg-gray-700 rounded-full h-2.5">
                                            <div className="bg-blue-500 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
                                        </div>
                                    </div>
                                )}
                                {teaserStatus === 'completed' && teaserVideoUrl && (
                                    <div className="mt-auto">
                                        <video controls src={teaserVideoUrl} className="w-full h-auto rounded-md" />
                                        <p className="text-sm text-gray-400 mt-2">Teaser Complete!</p>
                                    </div>
                                )}
                                {teaserStatus === 'error' && (
                                    <p className="mt-auto text-red-500">Error generating teaser.</p>
                                )}
                                {userCredits !== null && !isSubscribed && userCredits < TEASER_COST && (
                                    <button
                                        onClick={() => setIsPricingModalOpen(true)}
                                        className="mt-4 w-full bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-bold py-2 px-4 rounded-md transition-colors duration-300"
                                    >
                                        Get More Credits
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <PricingModal
                isOpen={isPricingModalOpen}
                onClose={() => setIsPricingModalOpen(false)}
            />
        </div>
    );
};

export default PitchDeckGallery;