import React, { useRef, useEffect } from 'react';
import { AlertCircle, CheckCircle2, Terminal, Activity, BrainCircuit, BarChart3, Scale, Target } from 'lucide-react';
import SceneSeismograph from './SceneSeismograph';

const StoryInsights = ({ 
  onAnalyzeScene, 
  onHookScan, // New prop
  messages, 
  isAnalyzing, 
  hookScanResult, // New prop
  score, 
  dynamics, 
  totalLines, 
  isSaving, 
  isSaved 
}) => {
  const [activeTab, setActiveTab] = React.useState('scene'); // 'scene' or 'hook'

  const analysisDetails = dynamics?.analysis_details || {};
  const hasAnalysis = !!dynamics;

  const PillarScore = ({ label, score }) => (
    <div className="flex flex-col gap-1">
        <div className="flex justify-between items-center text-[9px] uppercase tracking-tighter text-gray-500 font-bold">
            <span>{label}</span>
            <span>{score}%</span>
        </div>
        <div className="h-1 w-full bg-gray-800 rounded-full overflow-hidden">
            <div className="h-full bg-arc-teal transition-all duration-1000" style={{ width: `${score}%` }} />
        </div>
    </div>
  );

  return (
    <div className="w-96 bg-gray-900 border-l border-gray-800 flex flex-col h-full shadow-2xl z-40 font-sans">
      {/* Header */}
      <div className="h-16 border-b border-gray-800 flex items-center justify-between px-6 bg-gray-900/50 backdrop-blur-sm">
        <div className="flex items-center gap-3">
            <Activity className="w-5 h-5 text-arc-teal" />
            <h2 className="font-bold text-sm tracking-widest uppercase text-gray-200">Insights</h2>
        </div>
        <div className="flex bg-gray-800 p-1 rounded-lg">
            <button 
                onClick={() => setActiveTab('scene')}
                className={`px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'scene' ? 'bg-arc-teal text-black shadow-lg' : 'text-gray-500 hover:text-white'}`}
            >
                Scene
            </button>
            <button 
                onClick={() => setActiveTab('hook')}
                className={`px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'hook' ? 'bg-arc-teal text-black shadow-lg' : 'text-gray-500 hover:text-white'}`}
            >
                Hook
            </button>
        </div>
      </div>

      {/* Diagnostic Panel */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
          {activeTab === 'scene' ? (
            <div className="p-6 space-y-8">
                {/* ... (Existing Scene Analysis UI) */}
                <button
                    onClick={() => onAnalyzeScene("market_viability")}
                    disabled={isAnalyzing || totalLines < 5}
                    className="w-full py-3 bg-arc-teal/10 hover:bg-arc-teal/20 border border-arc-teal/50 text-arc-teal rounded-lg font-bold text-xs uppercase tracking-widest transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
                >
                    {isAnalyzing ? <div className="w-4 h-4 border-2 border-arc-teal border-t-transparent rounded-full animate-spin" /> : <BrainCircuit className="w-4 h-4" />}
                    Run Scene Diagnostics
                </button>

                {/* Logic Score */}
                <div className="flex items-center justify-between p-4 bg-gray-900/50 border border-gray-800 rounded-xl">
                    <div className="flex items-center gap-3">
                        <Scale className="w-5 h-5 text-gray-400" />
                        <span className="text-xs text-gray-400 uppercase tracking-widest font-semibold">Logic Score</span>
                    </div>
                    <div className={`text-3xl font-black font-mono ${score >= 80 ? 'text-green-400' : score >= 50 ? 'text-yellow-400' : score !== null ? 'text-red-400' : 'text-gray-600'}`}>{score !== null ? score : '--'}</div>
                </div>

                {/* Seismograph */}
                {dynamics && dynamics.tension_curve && (
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 mb-1"><Activity className="w-4 h-4 text-gray-500" /><span className="text-xs text-gray-500 font-bold uppercase tracking-widest">Scene Dynamics</span></div>
                        <div className="h-24 w-full bg-gray-950 rounded-lg border border-gray-800 overflow-hidden relative"><SceneSeismograph data={dynamics.tension_curve} /></div>
                    </div>
                )}

                {/* Report */}
                {messages.length > 0 && (
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 mb-1"><BarChart3 className="w-4 h-4 text-gray-500" /><span className="text-xs text-gray-500 font-bold uppercase tracking-widest">Analysis Report</span></div>
                        <div className="bg-gray-950/50 border border-gray-800 rounded-xl p-4 font-mono text-sm space-y-4">
                            {messages.slice(-1).map((msg, idx) => (
                                <div key={idx} className="animate-fade-in text-gray-300"><p className="whitespace-pre-wrap leading-relaxed">{msg.replace(/^\[.*?\]\s*/, '')}</p></div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
          ) : (
            <div className="p-6 space-y-8">
                <button
                    onClick={onHookScan}
                    disabled={isAnalyzing || totalLines < 50}
                    className="w-full py-3 bg-arc-orange/10 hover:bg-arc-orange/20 border border-arc-orange/50 text-arc-orange rounded-lg font-bold text-xs uppercase tracking-widest transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
                >
                    {isAnalyzing ? <div className="w-4 h-4 border-2 border-arc-orange border-t-transparent rounded-full animate-spin" /> : <Target className="w-4 h-4" />}
                    Gatekeeper Audit
                </button>

                {hookScanResult ? (
                    <div className="space-y-8 animate-fade-in">
                        {/* Verdict Card */}
                        <div className={`p-6 rounded-2xl border-2 flex flex-col items-center justify-center gap-2 ${hookScanResult.gatekeeper_verdict === 'READ' ? 'bg-green-500/10 border-green-500/50' : 'bg-red-500/10 border-red-500/50'}`}>
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Verdict</span>
                            <span className={`text-5xl font-black italic tracking-tighter ${hookScanResult.gatekeeper_verdict === 'READ' ? 'text-green-400' : 'text-red-400'}`}>
                                {hookScanResult.gatekeeper_verdict}
                            </span>
                        </div>

                        {/* Pillar Scores */}
                        <div className="grid grid-cols-2 gap-4">
                            <PillarScore label="Theme" score={hookScanResult.pillar_scores.theme} />
                            <PillarScore label="Motivation" score={hookScanResult.pillar_scores.motivation} />
                            <PillarScore label="Tone" score={hookScanResult.pillar_scores.tone} />
                            <PillarScore label="Catalyst" score={hookScanResult.pillar_scores.catalyst} />
                        </div>

                        {/* Audit Report */}
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 mb-1"><Target className="w-4 h-4 text-gray-500" /><span className="text-xs text-gray-500 font-bold uppercase tracking-widest">Pillar Audit</span></div>
                            <div className="bg-gray-950/50 border border-gray-800 rounded-xl p-4 font-mono text-[11px] text-gray-300 whitespace-pre-wrap leading-relaxed">
                                {hookScanResult.detailed_audit}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="py-20 text-center space-y-4">
                        <Target className="w-12 h-12 text-gray-800 mx-auto" />
                        <p className="text-gray-600 text-sm italic">"The first 10 pages are a contract. Have you fulfilled yours?"</p>
                        <p className="text-gray-700 text-[10px] uppercase font-bold tracking-widest">(Requires ~50 lines of text)</p>
                    </div>
                )}
            </div>
          )}
      </div>
    </div>
  );
};

export default StoryInsights;
