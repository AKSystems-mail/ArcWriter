import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
    Shield, Lock, Play, FileText, User, 
    ChevronRight, Zap, Info, Loader2, AlertCircle,
    X, UserCircle, Download
} from 'lucide-react';
import { apiClient } from '../api/client';

const PitchDeckView = () => {
    const { shareHash } = useParams();
    const [loading, setLoading] = useState(true);
    const [pitchData, setPitchData] = useState(null);
    const [error, setError] = useState(null);
    const [password, setPassword] = useState('');
    const [isUnlocking, setIsUnlocking] = useState(false);
    const [scriptBlocks, setScriptBlocks] = useState(null);
    const [isReaderOpen, setIsReaderOpen] = useState(false);

    // 1. DEVICE FINGERPRINTING
    const getDeviceId = () => {
        let id = localStorage.getItem('arc_pitch_device_id');
        if (!id) {
            id = 'dev_' + Math.random().toString(36).substr(2, 12);
            localStorage.setItem('arc_pitch_device_id', id);
        }
        return id;
    };

    const trackEvent = async (type, metadata = {}) => {
        try {
            await fetch(`/api/share/track/${shareHash}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type,
                    device_id: getDeviceId(),
                    metadata
                })
            });
        } catch (err) {
            console.warn("Tracking failed:", err);
        }
    };

    useEffect(() => {
        const fetchPitch = async () => {
            try {
                // Using fetch directly as this is a public route (no auth token required)
                const response = await fetch(`/api/share/view/${shareHash}`);
                if (!response.ok) {
                    if (response.status === 410) throw new Error("This pitch has expired.");
                    if (response.status === 404) throw new Error("Pitch not found.");
                    throw new Error("Failed to load pitch.");
                }
                const data = await response.json();
                setPitchData(data);
                
                // TRACK: Initial View
                trackEvent('view');
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchPitch();
    }, [shareHash]);

    // 2. SCROLL DEPTH TRACKING
    useEffect(() => {
        let maxDepth = 0;
        const handleScroll = () => {
            const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
            const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
            const scrolled = Math.round((winScroll / height) * 100);
            
            if (scrolled > maxDepth) {
                maxDepth = scrolled;
                // Update every 25% to avoid spamming the API
                if (maxDepth % 25 === 0 && maxDepth > 0) {
                    trackEvent('scroll_depth', { depth: maxDepth });
                }
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [shareHash]);

    // ANTI-COPY ENGINE (Fortress Protocol)
    useEffect(() => {
        const handleContextMenu = (e) => e.preventDefault();
        const handleKeyDown = (e) => {
            // Block Ctrl+C, Ctrl+V, Ctrl+S, Ctrl+P, Ctrl+U, Cmd equivalents
            if (
                (e.ctrlKey || e.metaKey) && 
                ['c', 'v', 's', 'p', 'u', 'a'].includes(e.key.toLowerCase())
            ) {
                e.preventDefault();
                return false;
            }
        };

        document.addEventListener('contextmenu', handleContextMenu);
        document.addEventListener('keydown', handleKeyDown);
        
        return () => {
            document.removeEventListener('contextmenu', handleContextMenu);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    const handleUnlock = async (e) => {
        e.preventDefault();
        setIsUnlocking(true);
        try {
            const response = await fetch(`/api/share/unlock/${shareHash}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password })
            });

            if (!response.ok) throw new Error("Incorrect password.");
            const data = await response.json();
            setScriptBlocks(data.blocks);
            setIsReaderOpen(true);
            
            // TRACK: Script Open
            trackEvent('read_script');
        } catch (err) {
            alert(err.message);
        } finally {
            setIsUnlocking(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center">
            <Loader2 className="w-10 h-10 text-arc-teal animate-spin mb-4" />
            <span className="text-[10px] font-black uppercase tracking-[0.5em] text-arc-teal animate-pulse">Syncing Pitch Assets...</span>
        </div>
    );

    if (error) return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-center">
            <div className="bg-red-500/10 p-4 rounded-full mb-6 border border-red-500/20 text-red-500">
                <AlertCircle className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-black uppercase tracking-tighter text-white mb-2">{error}</h2>
            <p className="text-gray-500 text-xs uppercase tracking-widest">Contact the writer for renewed access.</p>
        </div>
    );

    return (
        <div className="min-h-screen bg-black text-white selection:bg-none select-none overflow-x-hidden">
            {/* 1. HERO SECTION */}
            <div className="relative h-[70vh] w-full overflow-hidden border-b border-white/5">
                {pitchData.teaser_url ? (
                    <video 
                        src={pitchData.teaser_url}
                        autoPlay loop muted playsInline
                        className="w-full h-full object-cover opacity-60 scale-105 blur-[2px]"
                        onPlay={() => trackEvent('play_teaser')}
                    />
                ) : pitchData.poster_url ? (
                    <img 
                        src={pitchData.poster_url}
                        className="w-full h-full object-cover opacity-40 grayscale"
                    />
                ) : (
                    <div className="w-full h-full bg-gradient-to-b from-gray-900 to-black opacity-50" />
                )}
                
                {/* Visual Content Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 mt-20">
                    <span className="text-arc-orange text-[10px] font-black uppercase tracking-[0.6em] mb-6 animate-fade-in italic">Exclusive Studio Pitch</span>
                    <h1 className="text-6xl md:text-8xl font-black uppercase tracking-tighter leading-none mb-6 animate-slide-up">
                        {pitchData.title}
                    </h1>
                    <p className="max-w-2xl text-lg md:text-xl font-bold italic text-white/80 border-l-2 border-arc-teal pl-6 py-2 leading-relaxed animate-fade-in">
                        {pitchData.logline}
                    </p>
                </div>
            </div>

            {/* 2. THE CONTENT BODY */}
            <div className="max-w-5xl mx-auto px-6 py-24 space-y-32">
                
                {/* Poster / Key Art Section */}
                {pitchData.poster_url && (
                    <section className="animate-fade-in">
                        <div className="flex items-center gap-4 mb-12">
                            <div className="h-px flex-1 bg-white/10" />
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-600">The Visual Identity</span>
                            <div className="h-px flex-1 bg-white/10" />
                        </div>
                        <div className="flex flex-col items-center">
                            <h2 className="text-4xl font-black uppercase tracking-tighter mb-8 italic text-center">Official Key Art</h2>
                            <div className="relative group max-w-2xl w-full aspect-[2/3] bg-black border border-white/5 overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                                <img 
                                    src={pitchData.poster_url} 
                                    alt="Official Poster" 
                                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                                />
                                <div className="absolute inset-0 shadow-[inset_0_0_100px_rgba(0,0,0,0.8)]" />
                                <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md border border-white/10 px-4 py-2 rounded-full flex items-center gap-2">
                                    <Shield className="w-3 h-3 text-arc-teal" />
                                    <span className="text-[8px] font-black uppercase tracking-widest text-white/70">Studio Certified Asset</span>
                                </div>
                            </div>
                        </div>
                    </section>
                )}

                {/* Synopsis Section */}
                <section className="animate-fade-in">
                    <div className="flex items-center gap-4 mb-12">
                        <div className="h-px flex-1 bg-white/10" />
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-600">The Narrative Core</span>
                        <div className="h-px flex-1 bg-white/10" />
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
                        <div className="lg:col-span-4 sticky top-32">
                            <div className="bg-[#080808] border border-white/5 p-8 rounded-sm">
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-arc-teal mb-6 border-b border-white/5 pb-4">Production Specs</h3>
                                <div className="space-y-6">
                                    <div>
                                        <span className="text-[8px] font-black text-gray-600 uppercase block mb-1">Genre</span>
                                        <span className="text-xs font-bold text-white uppercase">{pitchData.genre}</span>
                                    </div>
                                    <div>
                                        <span className="text-[8px] font-black text-gray-600 uppercase block mb-1">Visual Soul</span>
                                        <span className="text-xs font-bold text-white uppercase">{pitchData.vibe}</span>
                                    </div>
                                    <div>
                                        <span className="text-[8px] font-black text-gray-600 uppercase block mb-1">Copyright</span>
                                        <span className="text-[10px] font-medium text-gray-400">
                                            © {pitchData.registration?.copyright_year || '2026'} {pitchData.registration?.author_name || 'Project Owner'}
                                        </span>
                                    </div>
                                    {pitchData.registration?.wga_number && (
                                        <div>
                                            <span className="text-[8px] font-black text-gray-600 uppercase block mb-1">Registry</span>
                                            <span className="text-[10px] font-medium text-gray-400">WGAw Reg: {pitchData.registration.wga_number}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="lg:col-span-8">
                            <h2 className="text-4xl font-black uppercase tracking-tighter mb-8 italic">The Synopsis</h2>
                            <div className="prose prose-invert prose-lg max-w-none text-gray-400 leading-relaxed font-light italic">
                                {pitchData.synopsis?.split('\n\n').map((para, i) => (
                                    <p key={i} className="mb-6">{para.replace('## Synopsis', '').replace('##', '').trim()}</p>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Personnel Section */}
                <section>
                    <div className="flex items-center gap-4 mb-12">
                        <div className="h-px flex-1 bg-white/10" />
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-600">Personnel Dossiers</span>
                        <div className="h-px flex-1 bg-white/10" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {pitchData.characters?.map((char, idx) => (
                            <div key={idx} className="bg-[#080808] border border-white/5 rounded-sm p-8 flex flex-col gap-6 group hover:border-arc-teal/20 transition-all duration-500">
                                <div className="flex gap-6 items-center">
                                    <div className="w-16 h-16 rounded-full overflow-hidden border border-white/10 grayscale group-hover:grayscale-0 transition-all duration-700 shadow-xl">
                                        {char.anchor_url ? (
                                            <img src={char.anchor_url} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full bg-gray-900 flex items-center justify-center"><User className="w-6 h-6 text-gray-700" /></div>
                                        )}
                                    </div>
                                    <div>
                                        <h4 className="font-black text-white text-lg uppercase tracking-tight">{char.name}</h4>
                                        <p className="text-[8px] uppercase font-black tracking-[0.2em] text-arc-teal mt-1">{char.role}</p>
                                    </div>
                                </div>
                                <p className="text-xs text-gray-500 font-light leading-relaxed italic line-clamp-3">"{char.description}"</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* THE CTA / LOCK SECTION */}
                <section className="pb-40">
                    <div className="bg-arc-orange/5 border border-arc-orange/20 p-16 rounded-sm text-center relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-full h-[2px] bg-arc-orange opacity-20 group-hover:opacity-100 transition-opacity" />
                        
                        <Zap className="w-12 h-12 text-arc-orange mx-auto mb-8 animate-pulse" />
                        <h2 className="text-4xl font-black uppercase tracking-tighter mb-4 italic">The Master Manuscript</h2>
                        <p className="text-gray-500 text-sm uppercase tracking-[0.2em] mb-12">Authorized Access Only</p>

                        {!pitchData.requires_password || scriptBlocks ? (
                            <button 
                                onClick={async () => {
                                    if (scriptBlocks) setIsReaderOpen(true);
                                    else {
                                        setIsUnlocking(true);
                                        const res = await fetch(`/api/share/unlock/${shareHash}`, { method: 'POST' });
                                        const d = await res.json();
                                        setScriptBlocks(d.blocks);
                                        setIsReaderOpen(true);
                                        setIsUnlocking(false);
                                        // TRACK: Direct script open
                                        trackEvent('read_script');
                                    }
                                }}
                                className="bg-white text-black font-black px-16 py-6 rounded-sm text-xs uppercase tracking-[0.5em] hover:bg-arc-orange hover:text-white transition-all shadow-2xl hover:scale-105 active:scale-95"
                            >
                                {isUnlocking ? "Decrypting..." : "Read Script"}
                            </button>
                        ) : (
                            <form onSubmit={handleUnlock} className="max-w-md mx-auto space-y-6">
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                                    <input 
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Enter Access Key"
                                        className="w-full bg-black border border-white/10 rounded-sm py-4 pl-12 pr-4 text-center text-sm font-mono tracking-widest focus:border-arc-orange transition-colors outline-none"
                                    />
                                </div>
                                <button 
                                    type="submit"
                                    disabled={isUnlocking}
                                    className="w-full bg-arc-orange text-white font-black py-4 rounded-sm text-[10px] uppercase tracking-[0.4em] hover:bg-white hover:text-black transition-all"
                                >
                                    {isUnlocking ? "Validating..." : "Unlock Manuscript"}
                                </button>
                            </form>
                        )}
                    </div>
                </section>
            </div>

            {/* 3. SCRIPT READER MODAL */}
            {isReaderOpen && (
                <div className="fixed inset-0 bg-white z-[9999] text-black overflow-y-auto animate-fade-in font-['Courier_Prime',_Courier,monospace]">
                    {/* Reader Header */}
                    <div className="sticky top-0 bg-gray-50 border-b border-gray-200 px-8 py-4 flex justify-between items-center select-none">
                        <div className="flex items-center gap-4">
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Vault Access</span>
                            <div className="h-4 w-px bg-gray-300" />
                            <span className="text-xs font-bold uppercase">{pitchData.title}</span>
                        </div>
                        <div className="flex items-center gap-6">
                            {pitchData.allow_download && (
                                <button className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-arc-teal hover:bg-arc-teal/10 px-4 py-2 rounded-full transition-all">
                                    <Download className="w-3.5 h-3.5" /> Download PDF
                                </button>
                            )}
                            <button 
                                onClick={() => setIsReaderOpen(false)}
                                className="p-2 hover:bg-red-500/10 rounded-full text-gray-400 hover:text-red-500 transition-all"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                    </div>

                    {/* Script Page Area */}
                    <div className="max-w-4xl mx-auto py-20 px-6 md:px-12 min-h-screen bg-gray-100/50">
                        
                        {/* Dynamic Watermark Overlay (Global Fixed) */}
                        {pitchData.recipient && (
                            <div className="fixed inset-0 pointer-events-none z-[10000] flex items-center justify-center overflow-hidden opacity-[0.03] select-none">
                                <div className="text-[12vw] font-black uppercase tracking-tighter -rotate-45 whitespace-nowrap">
                                    EXCLUSIVELY FOR {pitchData.recipient}
                                </div>
                            </div>
                        )}

                        <div className="flex flex-col items-center gap-12">
                            {(() => {
                                if (!scriptBlocks || scriptBlocks.length === 0) {
                                    return (
                                        <div className="w-full max-w-3xl bg-white shadow-2xl p-24 text-center text-gray-300 italic">
                                            Script manuscript is still in production.
                                        </div>
                                    );
                                }

                                const TARGET_UNITS_PER_PAGE = 40;
                                const pages = [];
                                let currentPage = [];
                                let currentUnits = 0;

                                scriptBlocks.forEach((block) => {
                                    const text = block.text || "";
                                    let charsPerLine = 60;
                                    let unitWeight = 1;

                                    const type = block.type?.toLowerCase();
                                    if (type === 'scene heading' || type === 'slugline') unitWeight = 2;
                                    if (type === 'character') unitWeight = 1;
                                    if (type === 'parenthetical') charsPerLine = 25;
                                    if (type === 'dialogue') {
                                        charsPerLine = 35;
                                        unitWeight = 0;
                                    }
                                    if (type === 'act break') unitWeight = 3;

                                    const estimatedLines = Math.max(1, Math.ceil(text.length / charsPerLine));
                                    const totalBlockUnits = estimatedLines + unitWeight;

                                    if (currentUnits + totalBlockUnits > TARGET_UNITS_PER_PAGE && currentPage.length > 0) {
                                        pages.push(currentPage);
                                        currentPage = [];
                                        currentUnits = 0;
                                    }
                                    
                                    currentPage.push(block);
                                    currentUnits += totalBlockUnits;
                                });
                                if (currentPage.length > 0) pages.push(currentPage);

                                return pages.map((pageBlocks, pageIndex) => (
                                    <div key={pageIndex} className="w-full max-w-3xl bg-white shadow-2xl p-12 md:p-20 relative min-h-[1000px]">
                                        {/* Page Number */}
                                        <div className="absolute top-8 right-12 text-gray-300 text-sm font-mono">{pageIndex + 1}.</div>
                                        
                                        <div className="space-y-4 text-[13pt] leading-[1.1]">
                                            {pageBlocks.map((block, idx) => {
                                                const type = block.type?.toLowerCase() || 'action';
                                                let style = "mb-4 ";
                                                
                                                if (type === 'slugline' || type === 'scene heading') style += "font-bold uppercase mt-8";
                                                else if (type === 'character') style += "w-1/2 mx-auto text-center mt-6 uppercase";
                                                else if (type === 'parenthetical') style += "w-1/3 mx-auto text-center text-[11pt]";
                                                else if (type === 'dialogue') style += "w-3/4 mx-auto text-center mb-6";
                                                
                                                return (
                                                    <div key={idx} className={style}>
                                                        {block.text}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ));
                            })()}
                        </div>
                    </div>
                </div>
            )}

            {/* FOOTER */}
            <footer className="bg-black py-20 border-t border-white/5 text-center">
                <img src="/ArcWriter_logo.png" className="h-6 mx-auto mb-4 opacity-20 grayscale" alt="ArcWriter" />
                <p className="text-[8px] font-black uppercase tracking-[0.5em] text-gray-700">Powered by ArcWriter AI Studio</p>
            </footer>
        </div>
    );
};

export default PitchDeckView;
