import React, { useState, useEffect } from 'react';
import { HelpCircle, Loader2, X } from 'lucide-react';
import { apiClient } from '../api/client';
import HelpScript from './HelpScript';

interface ContextualHelpProps {
    sectionId: string;
    className?: string;
}

const ContextualHelp: React.FC<ContextualHelpProps> = ({ sectionId, className = "" }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [helpData, setHelpData] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchHelpContent = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await apiClient(`/api/manual/section/${sectionId}`);
            if (!response.ok) throw new Error("Failed to load help content");
            const data = await response.json();
            setHelpData(data);
        } catch (err: any) {
            console.error("Help Fetch Error:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen && !helpData) {
            fetchHelpContent();
        }
    }, [isOpen]);

    return (
        <>
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    setIsOpen(true);
                }}
                className={`text-gray-600 hover:text-arc-teal transition-colors focus:outline-none ${className}`}
                title="Help"
            >
                <HelpCircle className="w-4 h-4" />
            </button>

            {isOpen && (
                <div 
                    className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-fade-in"
                    onClick={() => setIsOpen(false)}
                >
                    <div 
                        className="max-w-2xl w-full relative"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {loading ? (
                            <div className="bg-[#050505] border border-white/5 p-20 flex flex-col items-center justify-center rounded-sm">
                                <Loader2 className="w-8 h-8 text-arc-teal animate-spin mb-4" />
                                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">Accessing Studio Manual...</span>
                            </div>
                        ) : error ? (
                            <div className="bg-[#050505] border border-red-500/20 p-12 text-center rounded-sm">
                                <p className="text-red-400 text-xs font-black uppercase tracking-widest mb-4">Manual Section Missing</p>
                                <button 
                                    onClick={() => setIsOpen(false)}
                                    className="text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white"
                                >
                                    [Close]
                                </button>
                            </div>
                        ) : helpData && (
                            <HelpScript
                                slugline={helpData.slugline}
                                action={helpData.action}
                                character={helpData.character}
                                parenthetical={helpData.parenthetical}
                                dialogue={helpData.dialogue}
                                onClose={() => setIsOpen(false)}
                            />
                        )}
                    </div>
                </div>
            )}
        </>
    );
};

export default ContextualHelp;
