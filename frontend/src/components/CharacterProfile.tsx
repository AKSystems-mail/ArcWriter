import React, { useState, useEffect } from 'react';
import { auth } from '../firebase'; // Import auth from firebase.js
import PricingModal from './PricingModal'; // Import PricingModal

interface CharacterProfileProps {
    // Add any props if needed, e.g., initial data for the character
}

const CHARACTER_CONCEPTS_COST = 5;

const CharacterProfile: React.FC<CharacterProfileProps> = () => {
    const [name, setName] = useState<string>('');
    const [role, setRole] = useState<string>('');
    const [archetype, setArchetype] = useState<string>('');
    const [physicalDescription, setPhysicalDescription] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [generatedConceptUrls, setGeneratedConceptUrls] = useState<string[]>([]);
    const [anchorImageUrl, setAnchorImageUrl] = useState<string | null>(null);

    const [userCredits, setUserCredits] = useState<number | null>(null);
    const [isSubscribed, setIsSubscribed] = useState<boolean>(false);
    const [isPricingModalOpen, setIsPricingModalOpen] = useState<boolean>(false);
    const fetchUserData = async () => {
        const currentUser = auth.currentUser;
        if (!currentUser) {
            setUserCredits(0);
            setIsSubscribed(false);
            return;
        }
        try {
            const idToken = await currentUser.getIdToken();
            const response = await fetch('http://localhost:5000/api/user/me', {
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

    const canGenerateVisualConcepts = isSubscribed || (userCredits !== null && userCredits >= CHARACTER_CONCEPTS_COST);
    const visualConceptsTooltip = isSubscribed ? "Free with subscription" : `Costs ${CHARACTER_CONCEPTS_COST} Credits. Balance: ${userCredits !== null ? userCredits : '...'}`;

    const handleGenerateVisuals = async () => {
        if (!canGenerateVisualConcepts) {
            setIsPricingModalOpen(true);
            return;
        }

        setIsLoading(true);
        setGeneratedConceptUrls([]);
        setAnchorImageUrl(null);

        try {
            const idToken = await auth.currentUser?.getIdToken();
            if (!idToken) throw new Error("Authentication token not found.");

            const response = await fetch('http://localhost:5000/api/assets/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${idToken}`,
                },
                body: JSON.stringify({
                    type: 'character_concepts',
                    description: physicalDescription,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            setGeneratedConceptUrls(data.urls || []);
            fetchUserData(); // Refresh credits after deduction

        } catch (error: any) {
            console.error("Error generating character concepts:", error.message);
            // Handle error state in UI if needed
        } finally {
            setIsLoading(false);
        }
    };

    const handleSelectAnchorImage = (url: string) => {
        setAnchorImageUrl(url);
        console.log("Selected Anchor Image URL:", url);
        // In a real application, you would save this to the database
        // For now, it's just stored in component state and logged.
    };

    return (
        <div className="p-8 bg-gray-900/40 backdrop-blur-md rounded-3xl border border-gray-800 shadow-2xl mb-12 animate-fade-in-delayed">
            <h2 className="text-3xl font-black mb-8 text-white tracking-tight flex items-center gap-3">
                <span className="text-arc-orange">✦</span> Character Profile
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                    <div>
                        <label htmlFor="name" className="block text-sm font-bold text-gray-400 uppercase tracking-widest mb-2">Name</label>
                        <input
                            type="text"
                            id="name"
                            className="block w-full rounded-xl bg-gray-800/50 border-gray-700 text-white shadow-inner focus:border-arc-teal focus:ring-arc-teal transition-all p-3"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g., Detective Miller"
                        />
                    </div>

                    <div>
                        <label htmlFor="role" className="block text-sm font-bold text-gray-400 uppercase tracking-widest mb-2">Role</label>
                        <select
                            id="role"
                            className="block w-full rounded-xl bg-gray-800/50 border-gray-700 text-white shadow-inner focus:border-arc-teal focus:ring-arc-teal transition-all p-3"
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                        >
                            <option value="">Select Role</option>
                            <option value="protagonist">Protagonist</option>
                            <option value="antagonist">Antagonist</option>
                            <option value="supporting">Supporting Character</option>
                            <option value="mentor">Mentor</option>
                            <option value="sidekick">Sidekick</option>
                        </select>
                    </div>

                    <div>
                        <label htmlFor="archetype" className="block text-sm font-bold text-gray-400 uppercase tracking-widest mb-2">Archetype</label>
                        <input
                            type="text"
                            id="archetype"
                            className="block w-full rounded-xl bg-gray-800/50 border-gray-700 text-white shadow-inner focus:border-arc-teal focus:ring-arc-teal transition-all p-3"
                            value={archetype}
                            onChange={(e) => setArchetype(e.target.value)}
                            placeholder="e.g., Gritty Detective"
                        />
                    </div>
                </div>

                <div className="space-y-6">
                    <label htmlFor="physicalDescription" className="block text-sm font-bold text-gray-400 uppercase tracking-widest mb-2">
                        Physical Description
                    </label>
                    <textarea
                        id="physicalDescription"
                        rows={6}
                        className="block w-full rounded-xl bg-gray-800/50 border-gray-700 text-white font-courier shadow-inner focus:border-arc-teal focus:ring-arc-teal transition-all p-4"
                        value={physicalDescription}
                        onChange={(e) => setPhysicalDescription(e.target.value)}
                        placeholder="Describe the cinematic look..."
                    ></textarea>

                    <button
                        onClick={handleGenerateVisuals}
                        disabled={isLoading || !physicalDescription.trim() || !canGenerateVisualConcepts}
                        title={visualConceptsTooltip}
                        className={`w-full inline-flex items-center justify-center px-6 py-4 border border-transparent text-lg font-bold rounded-xl shadow-xl transition-all duration-300 transform active:scale-95
                                    ${(isLoading || !physicalDescription.trim() || !canGenerateVisualConcepts) ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-arc-orange hover:bg-opacity-90 text-white shadow-arc-orange/20'} `}
                    >
                        {isLoading ? (
                            <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        ) : (
                            <>
                                <span className="mr-2">⚡</span> Generate Visual Concepts
                            </>
                        )}
                    </button>

                    {userCredits !== null && !isSubscribed && userCredits < CHARACTER_CONCEPTS_COST && (
                        <button
                            onClick={() => setIsPricingModalOpen(true)}
                            className="w-full bg-arc-teal/10 border border-arc-teal/30 hover:bg-arc-teal/20 text-arc-teal font-bold py-3 px-4 rounded-xl transition-all duration-300"
                        >
                            Get More Credits
                        </button>
                    )}
                </div>
            </div>

            {generatedConceptUrls.length > 0 && (
                <div className="mt-12 border-t border-gray-800 pt-10 animate-fade-in">
                    <h3 className="text-2xl font-bold mb-6 text-white tracking-tight flex items-center gap-3">
                        <span className="text-arc-teal">✦</span> Studio Renders <span className="text-sm font-normal text-gray-500">(Select Anchor)</span>
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {generatedConceptUrls.map((url, index) => (
                            <div
                                key={index}
                                className={`relative group rounded-2xl overflow-hidden cursor-pointer transition-all duration-500
                                            ${anchorImageUrl === url ? 'ring-4 ring-arc-teal ring-offset-4 ring-offset-obsidian-black scale-95' : 'hover:scale-[1.02]'}`}
                                onClick={() => handleSelectAnchorImage(url)}
                            >
                                <img src={url} alt={`Concept ${index + 1}`} className="w-full h-64 object-cover transition-transform duration-700 group-hover:scale-110" />
                                <div className={`absolute inset-0 bg-arc-teal/20 transition-opacity duration-300 ${anchorImageUrl === url ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}></div>
                                {anchorImageUrl === url && (
                                    <div className="absolute top-4 right-4 bg-arc-teal text-white text-xs font-black px-3 py-1.5 rounded-full shadow-lg">
                                        ANCHOR
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
            <PricingModal
                isOpen={isPricingModalOpen}
                onClose={() => setIsPricingModalOpen(false)}
            />
        </div>
    );
};

export default CharacterProfile;