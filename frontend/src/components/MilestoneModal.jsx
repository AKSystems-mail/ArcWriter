import React, { useState } from 'react';
import { X, ShieldCheck, ChevronRight } from 'lucide-react';

const MilestoneModal = ({ isOpen, onClose, onConfirm }) => {
    const [name, setName] = useState('');

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (name.trim()) {
            onConfirm(name.trim());
            setName('');
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-[300] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-[#050505] border border-white/5 rounded-sm shadow-[0_0_100px_rgba(0,206,201,0.1)] max-w-md w-full p-10 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-arc-teal to-transparent opacity-50"></div>
                
                <button 
                    onClick={onClose}
                    className="absolute top-6 right-6 text-gray-600 hover:text-white transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="text-center mb-10">
                    <div className="bg-arc-teal/10 w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-6 border border-arc-teal/20">
                        <ShieldCheck className="w-7 h-7 text-arc-teal" />
                    </div>
                    <span className="text-arc-teal text-[8px] font-black uppercase tracking-[0.5em] mb-2 block italic">Time Machine Protocol</span>
                    <h2 className="text-2xl font-black text-white uppercase tracking-tighter italic">Commit Milestone</h2>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 block italic">Milestone Name</label>
                        <input 
                            autoFocus
                            type="text"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. The First Pivot"
                            className="w-full bg-black border border-white/10 rounded-sm px-4 py-4 text-sm text-white focus:outline-none focus:border-arc-teal transition-all uppercase tracking-tight font-mono placeholder:text-gray-800"
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-white text-black font-black py-5 rounded-sm hover:bg-arc-teal hover:text-white transition-all flex items-center justify-center gap-3 text-[10px] uppercase tracking-[0.4em] shadow-2xl group"
                    >
                        Synchronizing History <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                </form>

                <p className="mt-10 text-center text-[7px] font-black text-white/20 uppercase tracking-[0.4em]">
                    Committing blocks to persistent version storage
                </p>
            </div>
        </div>
    );
};

export default MilestoneModal;
