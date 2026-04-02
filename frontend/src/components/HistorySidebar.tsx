import React from 'react';
import { History, RotateCcw, Clock, ShieldCheck, ChevronRight, X } from 'lucide-react';

const HistorySidebar = ({ isOpen, onToggle, snapshots, onRestore, onSaveMilestone, isSaving }) => {
    return (
        <div className={`fixed right-0 top-0 h-full bg-[#050505] border-l border-white/5 transition-all duration-500 z-[150] flex flex-col ${isOpen ? 'w-80' : 'w-0 overflow-hidden'}`}>
            <div className="p-8 border-b border-white/5 flex justify-between items-center shrink-0">
                <div>
                    <span className="text-arc-teal text-[8px] font-black uppercase tracking-[0.4em] mb-1 block italic">Time Machine</span>
                    <h3 className="text-lg font-black text-white uppercase tracking-tighter">Snapshots</h3>
                </div>
                <button onClick={onToggle} className="p-2 hover:bg-white/5 rounded-full text-gray-500 transition-colors">
                    <X className="w-4 h-4" />
                </button>
            </div>

            <div className="p-6 shrink-0">
                <button 
                    onClick={onSaveMilestone}
                    disabled={isSaving}
                    className="w-full py-4 bg-white hover:bg-arc-teal text-black font-black text-[9px] uppercase tracking-[0.3em] rounded-sm transition-all flex items-center justify-center gap-3 shadow-xl disabled:opacity-50"
                >
                    <ShieldCheck className="w-4 h-4" />
                    Save Milestone
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                {snapshots.length === 0 ? (
                    <div className="text-center py-20 opacity-20">
                        <History className="w-12 h-12 mx-auto mb-4" />
                        <p className="text-[10px] font-black uppercase tracking-widest text-white">No history detected.</p>
                    </div>
                ) : (
                    snapshots.map((snap) => (
                        <div 
                            key={snap.id}
                            className="group bg-[#080808] border border-white/5 p-5 rounded-sm hover:border-arc-teal/30 transition-all relative overflow-hidden"
                        >
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center gap-2 text-arc-teal">
                                    <Clock className="w-3 h-3" />
                                    <span className="text-[8px] font-black uppercase tracking-widest">
                                        {(() => {
                                            if (!snap.created_at) return 'Just now';
                                            const d = snap.created_at.seconds 
                                                ? new Date(snap.created_at.seconds * 1000) 
                                                : new Date(snap.created_at);
                                            return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
                                        })()}
                                    </span>
                                </div>
                            </div>
                            
                            <h4 className="text-xs font-bold text-gray-300 mb-4 line-clamp-1 group-hover:text-white transition-colors uppercase tracking-tight italic">
                                {snap.name}
                            </h4>

                            <button 
                                onClick={() => onRestore(snap.id)}
                                className="w-full py-2 bg-white/5 border border-white/10 hover:bg-white hover:text-black text-[8px] font-black uppercase tracking-[0.2em] transition-all rounded-sm flex items-center justify-center gap-2"
                            >
                                <RotateCcw className="w-3 h-3" />
                                Restore
                            </button>
                        </div>
                    ))
                )}
            </div>

            <div className="p-6 bg-black/50 border-t border-white/5">
                <p className="text-[7px] font-black uppercase tracking-[0.3em] text-gray-600 text-center leading-relaxed">
                    Writer's Room allows up to 50 historical snapshots per project.
                </p>
            </div>
        </div>
    );
};

export default HistorySidebar;
