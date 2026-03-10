import React from 'react';

interface HelpScriptProps {
    slugline: string;
    action: string;
    character?: string;
    parenthetical?: string;
    dialogue?: string;
    onClose?: () => void;
}

const HelpScript: React.FC<HelpScriptProps> = ({
    slugline,
    action,
    character = "ARCWRITER",
    parenthetical,
    dialogue,
    onClose
}) => {
    return (
        <div className="bg-white text-black p-12 shadow-2xl font-mono text-sm max-w-2xl w-full border border-gray-200 animate-fade-in relative max-h-[85vh] flex flex-col">
            {onClose && (
                <button 
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-black uppercase text-[10px] font-black tracking-widest z-10 bg-white/80 backdrop-blur-sm px-2 py-1 rounded-sm"
                >
                    [Close Scene]
                </button>
            )}
            
            <div className="overflow-y-auto custom-scrollbar pr-4">
                <div className="space-y-8">
                    {/* Slugline */}
                    <div className="font-bold uppercase mb-8">{slugline}</div>

                    {/* Action */}
                    <div className="leading-relaxed mb-8">
                        {action}
                    </div>

                    {/* Dialogue Block */}
                    {dialogue && (
                        <div className="px-20 text-center">
                            <div className="uppercase font-bold mb-1 ml-auto mr-auto inline-block">{character}</div>
                            {parenthetical && (
                                <div className="italic text-xs mb-1">({parenthetical})</div>
                            )}
                            <div className="leading-relaxed">
                                {dialogue}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default HelpScript;
