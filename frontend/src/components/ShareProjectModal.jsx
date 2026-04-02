import React, { useState } from 'react';
import { Share2, Lock, Clock, User, Download, Copy, Check, X, Loader2, Link as LinkIcon, Shield } from 'lucide-react';
import { apiClient } from '../api/client';

const ShareProjectModal = ({ isOpen, onClose, universeId, projectId, projectTitle }) => {
    const [config, setConfig] = useState({
        recipient: '',
        password: '',
        expiration_days: 7,
        allow_download: false
    });

    const [isGenerating, setIsGenerating] = useState(false);
    const [shareResult, setShareResult] = useState(null);
    const [copied, setCopied] = useState(false);

    if (!isOpen) return null;

    const handleCreateLink = async () => {
        setIsGenerating(true);
        try {
            const response = await apiClient('/api/share/create', {
                method: 'POST',
                body: JSON.stringify({
                    universe_id: universeId,
                    project_id: projectId,
                    ...config
                })
            });

            if (!response.ok) throw new Error("Failed to create link");
            const data = await response.json();
            setShareResult(data);
        } catch (error) {
            console.error("Share Error:", error);
            alert("Studio Error: Could not generate share link.");
        } finally {
            setIsGenerating(false);
        }
    };

    const copyToClipboard = () => {
        const fullUrl = `${window.location.origin}${shareResult.share_url}`;
        navigator.clipboard.writeText(fullUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[9999] flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-[#050505] border border-white/5 rounded-sm shadow-[0_0_100px_rgba(0,0,0,0.5)] max-w-xl w-full p-10 relative overflow-hidden">
                <button onClick={onClose} className="absolute top-6 right-6 text-gray-600 hover:text-white transition-colors">
                    <X className="w-5 h-5" />
                </button>

                <div className="mb-10 flex items-center gap-4">
                    <div className="bg-arc-teal/10 p-3 rounded-sm border border-arc-teal/20">
                        <Share2 className="w-6 h-6 text-arc-teal" />
                    </div>
                    <div>
                        <span className="text-arc-teal text-[8px] font-black uppercase tracking-[0.5em] block mb-1 italic">The Viral Loop</span>
                        <h2 className="text-2xl font-black text-white uppercase tracking-tighter italic whitespace-nowrap overflow-hidden text-ellipsis max-w-[300px]">Share {projectTitle}</h2>
                    </div>
                </div>

                {!shareResult ? (
                    <div className="space-y-8">
                        {/* Recipient */}
                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2 ml-1">
                                <User className="w-3 h-3" /> Targeted Recipient
                            </label>
                            <input 
                                type="text"
                                value={config.recipient}
                                onChange={(e) => setConfig({...config, recipient: e.target.value})}
                                placeholder="e.g. A24 Acquisitions"
                                className="w-full bg-white/5 border border-white/10 rounded-sm px-4 py-3 text-sm text-white focus:outline-none focus:border-arc-teal transition-colors font-mono"
                            />
                            <p className="text-[8px] text-gray-600 uppercase tracking-widest pl-1 italic">Used for dynamic watermarking across the deck.</p>
                        </div>

                        {/* Security & Expiry */}
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2 ml-1">
                                    <Lock className="w-3 h-3" /> Access Key
                                </label>
                                <input 
                                    type="password"
                                    value={config.password}
                                    onChange={(e) => setConfig({...config, password: e.target.value})}
                                    placeholder="Optional"
                                    autoComplete="new-password"
                                    className="w-full bg-white/5 border border-white/10 rounded-sm px-4 py-3 text-sm text-white focus:outline-none focus:border-arc-teal transition-colors font-mono"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2 ml-1">
                                    <Clock className="w-3 h-3" /> Expiration
                                </label>
                                <select 
                                    value={config.expiration_days}
                                    onChange={(e) => setConfig({...config, expiration_days: parseInt(e.target.value)})}
                                    className="w-full bg-white/5 border border-white/10 rounded-sm px-4 py-[11px] text-sm text-white focus:outline-none focus:border-arc-teal transition-colors font-mono"
                                >
                                    <option value={1} className="bg-black">24 Hours</option>
                                    <option value={7} className="bg-black">7 Days</option>
                                    <option value={30} className="bg-black">30 Days</option>
                                    <option value={0} className="bg-black">Never</option>
                                </select>
                            </div>
                        </div>

                        {/* Permissions */}
                        <div className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-sm group hover:border-arc-teal/30 transition-all">
                            <div className="flex items-center gap-3">
                                <Download className="w-4 h-4 text-gray-500 group-hover:text-arc-teal" />
                                <span className="text-[10px] font-black text-gray-400 group-hover:text-white uppercase tracking-widest transition-colors">Allow Native Download</span>
                            </div>
                            <button 
                                onClick={() => setConfig({...config, allow_download: !config.allow_download})}
                                className={`w-10 h-5 rounded-full transition-all relative ${config.allow_download ? 'bg-arc-teal' : 'bg-gray-800'}`}
                            >
                                <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${config.allow_download ? 'left-6' : 'left-1'}`} />
                            </button>
                        </div>

                        <button
                            onClick={handleCreateLink}
                            disabled={isGenerating}
                            className="w-full bg-white text-black font-black py-5 rounded-sm hover:bg-arc-teal hover:text-white transition-all flex items-center justify-center gap-3 text-[10px] uppercase tracking-[0.4em] disabled:opacity-20 mt-10"
                        >
                            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <LinkIcon className="w-4 h-4" />}
                            Generate Secure Pitch Link
                        </button>
                    </div>
                ) : (
                    <div className="space-y-8 animate-slide-up">
                        <div className="bg-arc-teal/10 border border-arc-teal/20 p-8 rounded-sm text-center">
                            <Shield className="w-10 h-10 text-arc-teal mx-auto mb-4" />
                            <h3 className="text-lg font-black text-white uppercase tracking-widest mb-2 italic">Vault Link Active</h3>
                            <p className="text-[10px] text-gray-500 uppercase tracking-[0.2em] leading-relaxed">
                                {config.recipient ? `Exclusively prepared for ${config.recipient.toUpperCase()}` : 'Anonymous Access Enabled'}
                                <br />
                                {config.expiration_days > 0 ? `Expires in ${config.expiration_days} days` : 'Permanent access granted'}
                            </p>
                        </div>

                        <div className="space-y-3">
                            <label className="text-[9px] font-black text-gray-600 uppercase tracking-widest ml-1 block">Your Public URL</label>
                            <div className="flex gap-2">
                                <div className="flex-1 bg-black border border-white/10 px-4 py-4 rounded-sm text-xs font-mono text-arc-teal truncate">
                                    {window.location.origin}{shareResult.share_url}
                                </div>
                                <button 
                                    onClick={copyToClipboard}
                                    className={`px-6 rounded-sm font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 ${copied ? 'bg-green-500 text-white' : 'bg-white text-black hover:bg-arc-teal hover:text-white'}`}
                                >
                                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                    {copied ? 'Copied' : 'Copy'}
                                </button>
                            </div>
                        </div>

                        <button 
                            onClick={() => { setShareResult(null); onClose(); }}
                            className="w-full bg-white/5 border border-white/10 text-gray-500 font-black py-4 rounded-sm hover:bg-white/10 hover:text-white transition-all text-[9px] uppercase tracking-[0.3em]"
                        >
                            Close Studio Share
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ShareProjectModal;
