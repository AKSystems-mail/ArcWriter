import React from 'react';
import { ChevronLeft, ChevronRight, FileText } from 'lucide-react';

interface SourceMaterialDrawerProps {
    isOpen: boolean;
    onToggle: () => void;
    content: string;
    onInsert: (text: string) => void;
}

const SourceMaterialDrawer: React.FC<SourceMaterialDrawerProps> = ({
    isOpen,
    onToggle,
    content,
    onInsert,
}) => {
    return (
        <div
            className={`bg-[#050505] border-r border-white/5 transition-all duration-500 flex flex-col ${
                isOpen ? 'w-[400px]' : 'w-14'
            } relative h-full z-50`}
        >
            {/* Minimalist Toggle */}
            <button
                onClick={onToggle}
                className="absolute -right-3 top-24 bg-black border border-white/10 rounded-full p-1.5 text-white/60 hover:text-arc-orange hover:border-arc-orange/30 z-[60] transition-all shadow-2xl"
            >
                {isOpen ? <ChevronLeft size={12} strokeWidth={3} /> : <ChevronRight size={12} strokeWidth={3} />}
            </button>

            {isOpen ? (
                <>
                    <div className="h-16 px-8 border-b border-white/5 flex items-center justify-between bg-black/50 backdrop-blur-sm">
                        <div className="flex items-center gap-4">
                            <FileText className="w-4 h-4 text-arc-orange opacity-50" />
                            <h2 className="font-black text-[10px] tracking-[0.4em] uppercase text-white/70">Reference</h2>
                        </div>
                        <span className="text-[8px] font-black text-white/40 uppercase tracking-widest italic">Source Asset</span>
                    </div>
                    
                    <div 
                        className="flex-1 overflow-y-auto p-10 text-white/70 text-sm whitespace-pre-wrap leading-loose font-medium italic custom-scrollbar selection:bg-arc-orange/20 selection:text-white"
                    >
                        {content ? (
                            <div className="animate-fade-in border-l border-white/5 pl-6">
                                {content}
                            </div>
                        ) : (
                            <div className="text-white/20 uppercase font-black text-[10px] tracking-[0.3em] text-center mt-20">
                                No source material identified.<br/>
                                <span className="text-[8px] opacity-50 mt-2 block">Initialize notes in the studio wizard.</span>
                            </div>
                        )}
                    </div>
                </>
            ) : (
                <div className="flex-1 flex flex-col items-center pt-32 gap-8 bg-black/20">
                    <span 
                        className="transform -rotate-90 whitespace-nowrap text-white/70 text-[10px] font-black uppercase tracking-[0.5em] cursor-pointer hover:text-arc-orange transition-colors"
                        onClick={onToggle}
                    >
                        Reference
                    </span>
                    <div className="w-px h-24 bg-gradient-to-b from-gray-900 to-transparent" />
                </div>
            )}
        </div>
    );
};

export default SourceMaterialDrawer;

