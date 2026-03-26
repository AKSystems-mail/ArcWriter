import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import PricingModal from './PricingModal';
import { User, Zap, Sparkles, RefreshCw, Check, UserCircle } from 'lucide-react';

interface CharacterProfileProps {
    universeId: string;
    projectId: string;
    initialCharacters?: Array<{
        name: string;
        role: string;
        description: string;
        anchor_url?: string;
    }>;
}

const CHARACTER_CONCEPTS_COST = 5;

const CharacterProfile: React.FC<CharacterProfileProps> = ({ universeId, projectId, initialCharacters }) => {
    const [characters, setCharacters] = useState<any[]>(initialCharacters || []);
    const [activeIndex, setActiveTab] = useState<number>(0);
    
    // Active character fields
    const [name, setName] = useState<string>('');
    const [role, setRole] = useState<string>('');
    const [archetype, setArchetype] = useState<string>('');
    const [physicalDescription, setPhysicalDescription] = useState<string>('');
    const [anchorImageUrl, setAnchorImageUrl] = useState<string | null>(null);

    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [generatedConceptUrls, setGeneratedConceptUrls] = useState<string[]>([]);
    const [userProfile, setUserProfile] = useState<any>(null);
    const [isPricingModalOpen, setIsPricingModalOpen] = useState<boolean>(false);

    useEffect(() => {
        if (!auth.currentUser) return;
        const unsub = onSnapshot(doc(db, 'users', auth.currentUser.uid), (doc) => {
            setUserProfile(doc.data());
        });
        return () => unsub();
    }, []);

    // Sync state when switching characters or initial data loads
    useEffect(() => {
        if (characters.length > 0 && characters[activeIndex]) {
            const char = characters[activeIndex];
            setName(char.name || '');
            setRole(char.role || '');
            setArchetype(char.archetype || '');
            setPhysicalDescription(char.description || '');
            setAnchorImageUrl(char.anchor_url || null);
            setGeneratedConceptUrls([]); // Reset renders on switch
        }
    }, [activeIndex, characters]);

    const handleAddCharacter = () => {
        const newChar = { name: 'NEW ENTITY', role: '', description: '', archetype: '' };
        setCharacters([...characters, newChar]);
        setActiveTab(characters.length);
    };

    const handleSyncToBible = async () => {
        try {
            const idToken = await auth.currentUser?.getIdToken();
            if (!idToken) return;

            const updatedCharacters = [...characters];
            updatedCharacters[activeIndex] = {
                ...updatedCharacters[activeIndex],
                name,
                role,
                archetype,
                description: physicalDescription,
                anchor_url: anchorImageUrl
            };

            const response = await fetch('/api/bible/update', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${idToken}`,
                },
                body: JSON.stringify({
                    universe_name: universeId,
                    project_id: projectId,
                    section_header: '## Principal Cast',
                    characters: updatedCharacters
                }),
            });
            
            if (response.ok) {
                setCharacters(updatedCharacters);
                console.log("Art Dept: Personnel Dossiers synced to Bible");
            }
        } catch (error) {
            console.error("Error syncing characters:", error);
        }
    };

    const userCredits = userProfile?.studio_credits || 0;
    const isSubscribed = userProfile?.subscription_status === 'active';
    const canGenerateVisualConcepts = isSubscribed || userCredits >= CHARACTER_CONCEPTS_COST;

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

            const response = await fetch('/api/assets/generate', {
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
            if (data.variants) {
                const formatted = data.variants.map((b64: string) => `data:image/jpeg;base64,${b64}`);
                setGeneratedConceptUrls(formatted);
            } else {
                setGeneratedConceptUrls(data.urls || []);
            }
            fetchUserData();

        } catch (error: any) {
            console.error("Error generating character concepts:", error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSelectAnchorImage = async (url: string) => {
        setAnchorImageUrl(url);
        
        try {
            const idToken = await auth.currentUser?.getIdToken();
            if (!idToken) return;

            // Step 8: Lock the Anchor in the Project Bible
            const response = await fetch('/api/project/character/update_anchor', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${idToken}`,
                },
                body: JSON.stringify({
                    universe_id: universeId,
                    project_id: projectId,
                    character_name: name,
                    anchor_url: url
                }),
            });
            
            if (response.ok) {
                console.log(`Art Dept: Anchor locked for ${name}`);
            }
        } catch (error) {
            console.error("Error locking anchor:", error);
        }
    };

    return (
        <div className="bg-[#080808] border border-white/5 rounded-sm p-10 md:p-16 relative overflow-hidden shadow-2xl mb-20">
            <div className="absolute top-0 right-0 p-12 opacity-[0.03]">
                <UserCircle className="w-64 h-64 text-white" />
            </div>

            <div className="relative z-10">
                <div className="mb-16 border-b border-white/5 pb-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
                    <div>
                        <span className="text-arc-orange text-[10px] font-black uppercase tracking-[0.5em] mb-4 block italic">Section 03: Personnel</span>
                        <h2 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter">
                            Entity <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-600">Dossier</span>
                        </h2>
                        <p className="text-white/60 mt-4 text-lg font-light italic">Configure character DNA and generate cinematic concept art.</p>
                    </div>

                    <div className="flex flex-col gap-4 w-full md:w-auto">
                        <label className="text-[10px] uppercase font-black tracking-widest text-white/40 block ml-1">Personnel Selection</label>
                        <div className="flex flex-wrap gap-2">
                            {characters.map((char, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setActiveTab(idx)}
                                    className={`px-4 py-2 rounded-sm text-[10px] font-black uppercase tracking-widest transition-all border ${activeIndex === idx ? 'bg-white text-black border-white' : 'bg-transparent text-white/40 border-white/5 hover:border-white/20 hover:text-white'}`}
                                >
                                    {char.name || 'UNNAMED'}
                                </button>
                            ))}
                            <button
                                onClick={handleAddCharacter}
                                className="px-4 py-2 rounded-sm text-[10px] font-black uppercase tracking-widest transition-all border border-dashed border-arc-teal/30 text-arc-teal hover:bg-arc-teal hover:text-black hover:border-arc-teal"
                            >
                                + Add Entity
                            </button>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
                    <div className="space-y-10">
                        <div>
                            <label className="text-[10px] uppercase font-black tracking-widest text-white/40 mb-4 block">Identity Configuration</label>
                            <div className="grid grid-cols-1 gap-6">
                                <div className="space-y-2">
                                    <span className="text-xs font-black uppercase text-white/40 tracking-widest ml-1">Asset Name</span>
                                    <input
                                        type="text"
                                        className="w-full bg-black border border-white/10 rounded-sm p-5 text-white focus:border-arc-teal outline-none transition-all uppercase font-bold tracking-tight"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="ENTITY NAME"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <span className="text-xs font-black uppercase text-white/40 tracking-widest ml-1">Story Role</span>
                                        <select
                                            className="w-full bg-black border border-white/10 rounded-sm p-5 text-white text-xs font-black uppercase tracking-widest focus:border-arc-teal outline-none appearance-none cursor-pointer"
                                            value={role}
                                            onChange={(e) => setRole(e.target.value)}
                                        >
                                            <option value="">SELECT ROLE</option>
                                            <option value="protagonist">PROTAGONIST</option>
                                            <option value="antagonist">ANTAGONIST</option>
                                            <option value="supporting">SUPPORTING</option>
                                            <option value="mentor">MENTOR</option>
                                            <option value="sidekick">SIDEKICK</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <span className="text-xs font-black uppercase text-white/40 tracking-widest ml-1">Archetype</span>
                                        <input
                                            type="text"
                                            className="w-full bg-black border border-white/10 rounded-sm p-5 text-white focus:border-arc-teal outline-none transition-all uppercase font-bold tracking-tight"
                                            value={archetype}
                                            onChange={(e) => setArchetype(e.target.value)}
                                            placeholder="ARCHETYPE"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-10">
                        <div className="space-y-2">
                            <label className="text-xs uppercase font-black tracking-widest text-white/40 mb-4 block">Aesthetic Specification</label>
                            <textarea
                                rows={6}
                                className="w-full bg-black border border-white/10 rounded-sm p-8 text-white font-courier text-lg focus:outline-none focus:border-arc-teal transition-all resize-none leading-relaxed placeholder:text-gray-900 font-normal italic"
                                value={physicalDescription}
                                onChange={(e) => setPhysicalDescription(e.target.value)}
                                placeholder="DRAFTING CINEMATIC LOOK SPECIFICATIONS..."
                            />
                        </div>

                        <div className="flex flex-col gap-4">
                            <div className="flex gap-4">
                                <button
                                    onClick={handleSyncToBible}
                                    className="flex-1 bg-white/5 border border-white/10 text-white font-black py-6 rounded-sm text-[10px] uppercase tracking-[0.4em] hover:bg-white hover:text-black transition-all"
                                >
                                    Commit to Bible
                                </button>
                                <button
                                    onClick={handleGenerateVisuals}
                                    disabled={isLoading || !physicalDescription.trim() || !canGenerateVisualConcepts}
                                    className={`flex-[2] py-6 rounded-sm font-black text-[10px] uppercase tracking-[0.4em] transition-all flex items-center justify-center gap-4 shadow-2xl
                                                ${(isLoading || !physicalDescription.trim() || !canGenerateVisualConcepts) 
                                                    ? 'bg-black text-white/20 border border-white/5 cursor-not-allowed' 
                                                    : 'bg-white text-black hover:bg-arc-orange hover:text-white shadow-white/5'} `}
                                >
                                    {isLoading ? (
                                        <RefreshCw className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <>
                                            <Zap className="w-4 h-4" /> Initialize Render
                                        </>
                                    )}
                                </button>
                            </div>
                            
                            <div className="flex justify-between items-center px-2">
                                <span className="text-[10px] font-black text-white/40 uppercase tracking-widest italic">
                                    {isSubscribed ? "Studio Tier: Unlimited Renders" : `Operation Cost: ${CHARACTER_CONCEPTS_COST} Credits`}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {generatedConceptUrls.length > 0 && (
                    <div className="mt-20 border-t border-white/5 pt-16 animate-fade-in">
                        <div className="flex justify-between items-center mb-10">
                            <h3 className="text-2xl font-black text-white uppercase tracking-tighter flex items-center gap-4">
                                <Sparkles className="w-6 h-6 text-arc-teal" /> 
                                Studio <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-600">Renders</span>
                            </h3>
                            <span className="text-xs font-black text-white/40 uppercase tracking-widest">Select Visual Anchor</span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                            {generatedConceptUrls.map((url, index) => (
                                <div
                                    key={index}
                                    className={`relative group bg-black border transition-all duration-700 cursor-pointer shadow-2xl overflow-hidden
                                                ${anchorImageUrl === url ? 'border-arc-teal border-2' : 'border-white/5 hover:border-white/20'}`}
                                    onClick={() => handleSelectAnchorImage(url)}
                                >
                                    <img src={url} alt={`Render ${index + 1}`} className="w-full h-72 object-cover grayscale group-hover:grayscale-0 transition-all duration-1000 group-hover:scale-105" />
                                    <div className={`absolute inset-0 bg-arc-teal/10 transition-opacity duration-500 ${anchorImageUrl === url ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}></div>
                                    {anchorImageUrl === url && (
                                        <div className="absolute bottom-4 right-4 bg-arc-teal text-white p-2 rounded-full shadow-glow animate-fade-in">
                                            <Check className="w-4 h-4" />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
            <PricingModal
                isOpen={isPricingModalOpen}
                onClose={() => setIsPricingModalOpen(false)}
            />
        </div>
    );
};

export default CharacterProfile;