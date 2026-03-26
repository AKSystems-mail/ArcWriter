import React, { useState, useEffect } from 'react';
import { Shield, Lock, FileText, User, Mail, Hash, Download, X, Loader2 } from 'lucide-react';
import { db } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';

const ScriptIdentityModal = ({ isOpen, onClose, projectData, universeId, projectId, onConfirm }) => {
    const [formData, setFormData] = useState({
        author_name: '',
        contact_info: '',
        wga_number: '',
        copyright_year: new Date().getFullYear().toString(),
        recipient: ''
    });
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (projectData?.registration) {
            setFormData(prev => ({
                ...prev,
                ...projectData.registration,
                recipient: '' // Reset recipient each time modal opens
            }));
        } else if (projectData) {
            // Default if no registration exists yet
            setFormData(prev => ({
                ...prev,
                author_name: projectData.author || '',
                contact_info: '',
            }));
        }
    }, [projectData, isOpen]);

    if (!isOpen) return null;

    const handleSaveAndDownload = async () => {
        setIsSaving(true);
        try {
            const projectRef = doc(db, 'universes', universeId, 'projects', projectId);
            
            // Exclude recipient from Firestore persistence (it's per-download)
            const { recipient, ...persistData } = formData;
            
            await updateDoc(projectRef, {
                registration: persistData
            });

            // Trigger the actual download via the parent component
            onConfirm(formData);
            onClose();
        } catch (error) {
            console.error("Error saving registration:", error);
            alert("Failed to save project identity.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[9999] flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-[#050505] border border-white/5 rounded-sm shadow-[0_0_100px_rgba(0,0,0,0.5)] max-w-2xl w-full p-10 relative overflow-hidden">
                {/* Visual Soul Accents */}
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-arc-orange to-transparent opacity-50"></div>
                
                <button 
                    onClick={onClose}
                    className="absolute top-6 right-6 text-gray-600 hover:text-white transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="mb-10 flex items-center gap-4">
                    <div className="bg-arc-orange/10 p-3 rounded-sm border border-arc-orange/20">
                        <Shield className="w-6 h-6 text-arc-orange" />
                    </div>
                    <div>
                        <span className="text-arc-orange text-[8px] font-black uppercase tracking-[0.5em] block mb-1 italic">The Fortress Protocol</span>
                        <h2 className="text-2xl font-black text-white uppercase tracking-tighter italic">Script Identity & Protection</h2>
                    </div>
                </div>

                <div className="space-y-8">
                    {/* Author & WGA */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2 ml-1">
                                <User className="w-3 h-3" /> Author Name
                            </label>
                            <input 
                                type="text"
                                value={formData.author_name}
                                onChange={(e) => setFormData({...formData, author_name: e.target.value})}
                                placeholder="Legal Name for Title Page"
                                className="w-full bg-white/5 border border-white/10 rounded-sm px-4 py-3 text-sm text-white focus:outline-none focus:border-arc-teal transition-colors font-mono"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2 ml-1">
                                <Hash className="w-3 h-3" /> WGAw Reg #
                            </label>
                            <input 
                                type="text"
                                value={formData.wga_number}
                                onChange={(e) => setFormData({...formData, wga_number: e.target.value})}
                                placeholder="Optional (e.g. 2341567)"
                                className="w-full bg-white/5 border border-white/10 rounded-sm px-4 py-3 text-sm text-white focus:outline-none focus:border-arc-teal transition-colors font-mono"
                            />
                        </div>
                    </div>

                    {/* Contact Info */}
                    <div className="space-y-2">
                        <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2 ml-1">
                            <Mail className="w-3 h-3" /> Contact Information
                        </label>
                        <textarea 
                            value={formData.contact_info}
                            onChange={(e) => setFormData({...formData, contact_info: e.target.value})}
                            placeholder="Email, Phone, or Representation details..."
                            rows={3}
                            className="w-full bg-white/5 border border-white/10 rounded-sm px-4 py-3 text-sm text-white focus:outline-none focus:border-arc-teal transition-colors font-mono resize-none"
                        />
                    </div>

                    {/* Watermark Section */}
                    <div className="p-6 bg-white/5 border border-white/5 rounded-sm space-y-4">
                        <div className="flex items-center gap-3 mb-2">
                            <Lock className="w-4 h-4 text-arc-teal" />
                            <span className="text-[10px] font-black text-white uppercase tracking-widest">Dynamic Watermark</span>
                        </div>
                        <p className="text-[10px] text-gray-500 leading-relaxed uppercase tracking-tighter">
                            Enter a recipient name to embed a non-removable, semi-transparent identifier across all script pages.
                        </p>
                        <input 
                            type="text"
                            value={formData.recipient}
                            onChange={(e) => setFormData({...formData, recipient: e.target.value})}
                            placeholder="Recipient Name (e.g. Paramount Executive)"
                            className="w-full bg-black border border-white/10 rounded-sm px-4 py-3 text-sm text-arc-teal focus:outline-none focus:border-arc-teal transition-colors font-mono uppercase"
                        />
                    </div>
                </div>

                <div className="mt-10 flex flex-col gap-4">
                    <button
                        onClick={handleSaveAndDownload}
                        disabled={isSaving || !formData.author_name}
                        className="w-full bg-white text-black font-black py-5 rounded-sm hover:bg-arc-teal hover:text-white transition-all flex items-center justify-center gap-3 text-[10px] uppercase tracking-[0.4em] disabled:opacity-20"
                    >
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                        Finalize & Export PDF
                    </button>
                    <p className="text-center text-[8px] font-black text-gray-700 uppercase tracking-[0.3em]">
                        Your details will be saved to this project for future exports.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ScriptIdentityModal;
