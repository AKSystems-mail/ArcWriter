import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { MessageSquare, AlertCircle, Sparkles, CheckCircle2, Clock, Trash2, ArrowLeft, Loader2, User, Mail, ExternalLink } from 'lucide-react';

const ADMIN_UIDS = ['rezAaItMpOaLDRvnMkfX60Rrqoh1', 'k4B9sTKY2FdrdlG3BdP4RhPt4g32'];

const BugFeatureDashboard = () => {
    const navigate = useNavigate();
    const [feedback, setFeedback] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // 'all' | 'bug' | 'feature'

    useEffect(() => {
        // Security: Boot non-admins
        if (!auth.currentUser || !ADMIN_UIDS.includes(auth.currentUser.uid)) {
            navigate('/dashboard');
            return;
        }

        const q = query(collection(db, 'feedback'), orderBy('created_at', 'desc'));
        const unsub = onSnapshot(q, (snapshot) => {
            const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setFeedback(list);
            setLoading(false);
        });
        return () => unsub();
    }, [navigate]);

    const handleStatusUpdate = async (id, status) => {
        try {
            await updateDoc(doc(db, 'feedback', id), { status });
        } catch (err) {
            console.error("Update failed:", err);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Permanently delete this feedback entry?")) {
            await deleteDoc(doc(db, 'feedback', id));
        }
    };

    const filtered = feedback.filter(f => filter === 'all' || f.type === filter);

    if (loading) return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center">
            <Loader2 className="w-10 h-10 text-arc-teal animate-spin" />
        </div>
    );

    return (
        <div className="min-h-screen bg-black text-white selection:bg-arc-teal/30">
            {/* Header */}
            <nav className="fixed top-0 w-full z-50 px-8 py-6 flex justify-between items-center bg-[#050505] border-b border-white/5">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/dashboard')} className="p-2 hover:bg-white/5 rounded-full transition-colors text-gray-500 hover:text-white">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="h-4 w-px bg-gray-800"></div>
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-arc-teal italic">Founder's Control Room</span>
                </div>
                <div className="flex gap-4">
                    {['all', 'bug', 'feature'].map(t => (
                        <button 
                            key={t}
                            onClick={() => setFilter(t)}
                            className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${filter === t ? 'bg-white text-black' : 'bg-white/5 text-gray-500 hover:text-white'}`}
                        >
                            {t === 'all' ? 'All' : `${t}s`}
                        </button>
                    ))}
                </div>
            </nav>

            <main className="pt-32 px-8 md:px-12 max-w-6xl mx-auto pb-40">
                <div className="mb-12">
                    <h1 className="text-5xl font-black uppercase tracking-tighter italic">Feedback <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-600">Intelligence.</span></h1>
                    <p className="text-white/40 mt-4 text-xs uppercase tracking-widest font-medium italic">Monitoring {feedback.length} community signals.</p>
                </div>

                <div className="space-y-4">
                    {filtered.map((item) => (
                        <div key={item.id} className={`bg-[#080808] border ${item.status === 'new' ? 'border-arc-teal/20 shadow-[0_0_30px_rgba(0,206,201,0.05)]' : 'border-white/5 opacity-60'} p-8 rounded-sm transition-all hover:border-white/10`}>
                            <div className="flex justify-between items-start mb-6">
                                <div className="flex items-center gap-4">
                                    <div className={`p-3 rounded-sm ${item.type === 'feature' ? 'bg-arc-teal/10 text-arc-teal' : 'bg-arc-orange/10 text-arc-orange'}`}>
                                        {item.type === 'feature' ? <Sparkles className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-3 mb-1">
                                            <h3 className="text-xl font-black uppercase tracking-tight italic">{item.subject}</h3>
                                            {item.is_paid_user && <span className="bg-white text-black text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter shadow-glow">VIP</span>}
                                        </div>
                                        <div className="flex items-center gap-4 text-[9px] font-black uppercase tracking-widest text-white/30 italic">
                                            <span className="flex items-center gap-1.5"><User className="w-3 h-3" /> {item.user_id.slice(0,8)}</span>
                                            <span className="flex items-center gap-1.5"><Mail className="w-3 h-3" /> {item.user_email}</span>
                                            <span className="flex items-center gap-1.5"><Clock className="w-3 h-3" /> {item.created_at?.seconds ? new Date(item.created_at.seconds * 1000).toLocaleString() : 'Just now'}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => handleStatusUpdate(item.id, item.status === 'new' ? 'resolved' : 'new')}
                                        className={`p-2 rounded-sm border transition-all ${item.status === 'new' ? 'border-arc-teal/30 text-arc-teal hover:bg-arc-teal hover:text-white' : 'border-white/10 text-gray-600 hover:text-white'}`}
                                        title="Toggle Resolved"
                                    >
                                        <CheckCircle2 className="w-4 h-4" />
                                    </button>
                                    <button 
                                        onClick={() => handleDelete(item.id)}
                                        className="p-2 rounded-sm border border-white/10 text-gray-600 hover:text-red-500 hover:border-red-500/30 transition-all"
                                        title="Delete Log"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <p className="text-sm text-white/80 leading-relaxed font-light italic bg-black/40 p-6 rounded-sm border border-white/5 mb-6">
                                "{item.body}"
                            </p>

                            <div className="flex flex-wrap gap-4 pt-4 border-t border-white/5">
                                <span className="text-[8px] font-black text-white/20 uppercase tracking-[0.2em] italic">Environment:</span>
                                <span className="text-[8px] font-black text-white/40 uppercase tracking-widest">{item.metadata?.url?.replace('https://arcwriter.us', '') || 'Dashboard'}</span>
                                <span className="text-[8px] font-black text-white/40 uppercase tracking-widest truncate max-w-[200px]">{item.metadata?.user_agent}</span>
                            </div>
                        </div>
                    ))}

                    {filtered.length === 0 && (
                        <div className="py-20 text-center border border-dashed border-white/5 rounded-sm opacity-20">
                            <MessageSquare className="w-12 h-12 mx-auto mb-4" />
                            <p className="text-[10px] font-black uppercase tracking-[0.4em]">No community signals detected.</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default BugFeatureDashboard;
