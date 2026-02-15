import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

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
            className={`bg-gray-900 border-r border-gray-800 transition-all duration-300 flex flex-col ${
                isOpen ? 'w-80' : 'w-12'
            } relative h-full`}
        >
            {/* Toggle Button */}
            <button
                onClick={onToggle}
                className="absolute -right-3 top-6 bg-gray-800 border border-gray-700 rounded-full p-1 text-gray-400 hover:text-white hover:border-gray-500 z-20"
            >
                {isOpen ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
            </button>

            {isOpen ? (
                <>
                    <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-900 z-10">
                        <h2 className="font-bold text-gray-200 text-sm uppercase tracking-wider">Source Material</h2>
                    </div>
                    
                    <div 
                        className="flex-1 overflow-y-auto p-4 text-gray-400 text-sm whitespace-pre-wrap leading-relaxed font-mono custom-scrollbar selection:bg-arc-teal/30 selection:text-white"
                    >
                        {content || (
                            <div className="text-gray-600 italic text-center mt-10">
                                No source material found.<br/>
                                <span className="text-xs">Upload notes in the wizard to see them here.</span>
                            </div>
                        )}
                    </div>
                </>
            ) : (
                <div className="flex-1 flex flex-col items-center pt-6 gap-4">
                    <span 
                        className="transform -rotate-90 whitespace-nowrap text-gray-500 text-xs font-bold uppercase tracking-widest cursor-pointer hover:text-white transition-colors mt-20"
                        onClick={onToggle}
                    >
                        Source Material
                    </span>
                </div>
            )}
        </div>
    );
};

export default SourceMaterialDrawer;
