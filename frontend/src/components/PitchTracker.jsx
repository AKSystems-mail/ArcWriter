import React, { useState, useEffect } from 'react';
import { 
    Activity, Eye, Play, FileText, MapPin, 
    Trash2, Clock, CheckCircle2, AlertCircle, 
    Lock, ShieldAlert, BarChart3, ChevronRight,
    TrendingUp, MousePointer2, Smartphone, Loader2
} from 'lucide-react';
import { apiClient } from '../api/client';

const PitchTracker = ({ universeId, projectId, isSubscriber }) => {
    const [shares, setShares] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeAnalytics, setActiveAnalytics] = useState(null);
    const [isRevoking, setIsRevoking] = useState(null);

    const fetchShares = async () => {
        try {
            const url = (universeId === 'all' && projectId === 'all') 
                ? '/api/share/list-all' 
                : `/api/share/list/${universeId}/${projectId}`;
            const response = await apiClient(url);
            if (response.ok) {
                const data = await response.json();
                setShares(data);
            }
        } catch (err) {
            console.error("Failed to fetch shares:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isSubscriber) {
            fetchShares();
        } else {
            setLoading(false);
        }
    }, [universeId, projectId, isSubscriber]);

    const handleRevoke = async (hash) => {
        if (!window.confirm("ARE YOU SURE? This will immediately lock the producer out of this link. This action is permanent.")) return;
        
        setIsRevoking(hash);
        try {
            const response = await apiClient(`/api/share/revoke/${hash}`, { method: 'POST' });
            if (response.ok) {
                setShares(shares.map(s => s.hash === hash ? { ...s, is_revoked: true } : s));
            }
        } catch (err) {
            alert("Failed to revoke link.");
        } finally {
            setIsRevoking(null);
        }
    };

    const fetchAnalytics = async (hash) => {
        try {
            const response = await apiClient(`/api/share/analytics/${hash}`);
            if (response.ok) {
                const data = await response.json();
                setActiveAnalytics({ hash, ...data });
            }
        } catch (err) {
            console.error("Failed to fetch analytics:", err);
        }
    };

    if (!isSubscriber) {
        return (
            <div className="bg-[#080808] border border-white/5 rounded-sm p-16 text-center relative overflow-hidden shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-b from-arc-teal/5 to-transparent pointer-events-none" />
                <ShieldAlert className="w-16 h-16 text-arc-teal mx-auto mb-8 animate-pulse" />
                <h2 className="text-3xl font-black text-white uppercase tracking-tighter italic mb-4">The Writer's Room Access Required</h2>
                <p className="max-w-xl mx-auto text-white/60 text-sm uppercase tracking-widest leading-relaxed mb-10">
                    Unlock professional-grade engagement tracking. See exactly who is reading your script, where they are, and how they engage with your cinematic assets.
                </p>
                <button className="bg-white text-black font-black px-12 py-5 rounded-sm text-[10px] uppercase tracking-[0.4em] hover:bg-arc-teal hover:text-white transition-all shadow-glow">
                    Upgrade to Writer's Room
                </button>
            </div>
        );
    }

    if (loading) return (
        <div className="py-40 flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 text-arc-teal animate-spin mb-4" />
            <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Accessing Vault Logs...</span>
        </div>
    );

    return (
        <div className="space-y-12 animate-fade-in">
            {/* 1. OVERVIEW SUMMARY */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                    { label: 'Active Links', value: shares.filter(s => !s.is_revoked).length, icon: Activity, color: 'text-arc-teal' },
                    { label: 'Total Engagement', value: shares.reduce((acc, s) => acc + (s.view_count || 0), 0), icon: Eye, color: 'text-white' },
                    { label: 'Industry Interest', value: shares.reduce((acc, s) => acc + (s.unique_devices?.length || 0), 0), icon: TrendingUp, color: 'text-arc-orange' },
                    { label: 'Script Completes', value: 'High', icon: FileText, color: 'text-arc-teal' }
                ].map((stat, i) => (
                    <div key={i} className="bg-[#080808] border border-white/5 p-8 rounded-sm shadow-xl">
                        <div className="flex justify-between items-start mb-4">
                            <stat.icon className={`w-5 h-5 ${stat.color}`} />
                            <span className="text-[8px] font-black uppercase tracking-[0.3em] text-white/40">{stat.label}</span>
                        </div>
                        <p className="text-3xl font-black text-white tracking-tighter">{stat.value}</p>
                    </div>
                ))}
            </div>

            {/* 2. LINK MANAGEMENT TABLE */}
            <div className="bg-[#080808] border border-white/5 rounded-sm overflow-hidden shadow-2xl">
                <div className="px-10 py-6 border-b border-white/5 flex justify-between items-center bg-black/50">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/70 italic flex items-center gap-3">
                        <BarChart3 className="w-4 h-4 text-arc-teal" /> Pitch Link Inventory
                    </h3>
                    <span className="text-[8px] font-black text-white/20 uppercase tracking-widest italic">Encrypted Ledger</span>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-white/5">
                            <tr>
                                <th className="px-10 py-4 text-[8px] font-black uppercase tracking-widest text-white/40">Recipient</th>
                                {universeId === 'all' && <th className="px-6 py-4 text-[8px] font-black uppercase tracking-widest text-white/40">Project</th>}
                                <th className="px-6 py-4 text-[8px] font-black uppercase tracking-widest text-white/40">Status</th>
                                <th className="px-6 py-4 text-[8px] font-black uppercase tracking-widest text-white/40">Engagement</th>
                                <th className="px-6 py-4 text-[8px] font-black uppercase tracking-widest text-white/40">Unique Devices</th>
                                <th className="px-6 py-4 text-[8px] font-black uppercase tracking-widest text-white/40 text-right">Protection</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {shares.map((share) => (
                                <React.Fragment key={share.hash}>
                                    <tr 
                                        className={`group hover:bg-white/5 transition-colors cursor-pointer ${activeAnalytics?.hash === share.hash ? 'bg-arc-teal/5' : ''}`}
                                        onClick={() => fetchAnalytics(share.hash)}
                                    >
                                        <td className="px-10 py-6">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-1.5 h-1.5 rounded-full ${share.is_revoked ? 'bg-red-500' : 'bg-arc-teal animate-pulse'}`} />
                                                <div>
                                                    <p className="text-sm font-black text-white uppercase tracking-tight italic">
                                                        {share.recipient || 'Anonymous Link'}
                                                    </p>
                                                    <p className="text-[8px] text-white/20 uppercase tracking-widest mt-1">
                                                        Sent: {(() => {
                                                            if (!share.created_at) return 'Just now';
                                                            const d = share.created_at._seconds 
                                                                ? new Date(share.created_at._seconds * 1000) 
                                                                : new Date(share.created_at);
                                                            return d.toLocaleDateString();
                                                        })()}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        {universeId === 'all' && (
                                            <td className="px-6 py-6">
                                                <span className="text-[10px] font-black text-white/60 uppercase tracking-tighter italic">
                                                    {share.project_title || 'Unknown Project'}
                                                </span>
                                            </td>
                                        )}
                                        <td className="px-6 py-6">
                                            {share.is_revoked ? (
                                                <span className="bg-red-500/10 text-red-500 border border-red-500/20 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest">Revoked</span>
                                            ) : (
                                                <span className="bg-arc-teal/10 text-arc-teal border border-arc-teal/20 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest">Active</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-6">
                                            <div className="flex items-center gap-2">
                                                <Eye className="w-3 h-3 text-white/40" />
                                                <span className="text-xs font-bold text-white">{share.view_count || 0} Opens</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-6">
                                            <div className="flex items-center gap-2 text-white/60">
                                                <Smartphone className="w-3 h-3" />
                                                <span className="text-xs font-bold">{share.unique_devices?.length || 0}</span>
                                            </div>
                                        </td>
                                        <td className="px-10 py-6 text-right">
                                            {!share.is_revoked && (
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); handleRevoke(share.hash); }}
                                                    className="p-2 hover:bg-red-500/10 rounded-sm text-white/20 hover:text-red-500 transition-all border border-transparent hover:border-red-500/20"
                                                    title="Kill Switch"
                                                >
                                                    <ShieldAlert className="w-4 h-4" />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                    
                                    {/* Detailed Analytics Expansion */}
                                    {activeAnalytics?.hash === share.hash && (
                                        <tr>
                                            <td colSpan={5} className="bg-black/80 px-10 py-10 border-t border-arc-teal/20">
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-12 animate-slide-up">
                                                    <div className="space-y-6">
                                                        <h4 className="text-[9px] font-black text-arc-teal uppercase tracking-widest border-b border-arc-teal/10 pb-2 flex items-center gap-2">
                                                            <MousePointer2 className="w-3 h-3" /> Interactive Depth
                                                        </h4>
                                                        <div className="flex justify-between items-center bg-white/5 p-4 rounded-sm">
                                                            <span className="text-[8px] font-black uppercase text-white/40">Teaser Plays</span>
                                                            <span className="text-lg font-black text-white italic">{activeAnalytics.teaser_plays}</span>
                                                        </div>
                                                        <div className="flex justify-between items-center bg-white/5 p-4 rounded-sm">
                                                            <span className="text-[8px] font-black uppercase text-white/40">Script Reads</span>
                                                            <span className="text-lg font-black text-white italic">{activeAnalytics.script_opens}</span>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-6">
                                                        <h4 className="text-[9px] font-black text-arc-teal uppercase tracking-widest border-b border-arc-teal/10 pb-2 flex items-center gap-2">
                                                            <Clock className="w-3 h-3" /> Retention Engine
                                                        </h4>
                                                        <div className="flex justify-between items-center bg-white/5 p-4 rounded-sm">
                                                            <span className="text-[8px] font-black uppercase text-white/40">Max Scroll Depth</span>
                                                            <span className="text-lg font-black text-white italic">{activeAnalytics.max_scroll}%</span>
                                                        </div>
                                                        <div className="flex justify-between items-center bg-white/5 p-4 rounded-sm">
                                                            <span className="text-[8px] font-black uppercase text-white/40">Engagement Score</span>
                                                            <span className="text-lg font-black text-arc-teal italic">
                                                                {Math.min(100, (activeAnalytics.teaser_plays * 20) + (activeAnalytics.max_scroll / 2) + (activeAnalytics.script_opens * 30))}%
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-6">
                                                        <h4 className="text-[9px] font-black text-arc-teal uppercase tracking-widest border-b border-arc-teal/10 pb-2 flex items-center gap-2">
                                                            <MapPin className="w-3 h-3" /> Origin Resolve
                                                        </h4>
                                                        <div className="flex flex-wrap gap-2">
                                                            {activeAnalytics.locations.map((loc, i) => (
                                                                <span key={i} className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[8px] font-black text-white/60">
                                                                    IP: {loc}
                                                                </span>
                                                            ))}
                                                            {activeAnalytics.locations.length === 0 && (
                                                                <span className="text-[8px] font-black text-white/20 italic">Awaiting geo-spatial data...</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))}
                            {shares.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="py-20 text-center">
                                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20 italic">No distribution logs found for this asset.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default PitchTracker;
