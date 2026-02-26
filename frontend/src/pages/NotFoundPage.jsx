import React from 'react';
import { useNavigate } from 'react-router-dom';
import HelpScript from '../components/HelpScript';

const NotFoundPage = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-8">
            <div className="w-full max-w-2xl">
                <HelpScript
                    slugline="EXT. THE VOID - NIGHT"
                    action="Total darkness. The plot has been lost. The scene you are looking for has been cut in post-production."
                    character="THE WRITER"
                    dialogue="So... what now?"
                />
                
                <div className="mt-12 space-y-8 animate-fade-in delay-700">
                    <div className="text-center font-mono text-sm uppercase text-gray-600">
                        CUT TO:
                    </div>
                    
                    <div className="flex flex-col items-center gap-6">
                        <div className="font-mono text-sm font-bold uppercase text-white bg-white/5 px-8 py-4 border border-white/10">
                            INT. DASHBOARD - DAY
                        </div>
                        
                        <button 
                            onClick={() => navigate('/app')}
                            className="bg-white text-black px-12 py-4 rounded-sm font-black text-[10px] uppercase tracking-[0.4em] hover:bg-arc-teal hover:text-white transition-all shadow-2xl"
                        >
                            Return to Beginning
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NotFoundPage;
