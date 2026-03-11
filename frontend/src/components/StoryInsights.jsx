import React, { useRef, useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Terminal, Activity, BrainCircuit, BarChart3, Scale, Target, ChevronRight, ChevronLeft, Zap, RefreshCw, Layers, FileText } from 'lucide-react';
import SceneSeismograph from './SceneSeismograph';
import ContextualHelp from './ContextualHelp';

const StoryInsights = ({ 
  onAnalyzeScene, 
  onHookScan, 
  onMacroAudit,
  messages, 
  isAnalyzing, 
  hookScanResult, 
  macroAuditResult,
  score, 
  dynamics, 
  totalLines, 
  isSaving, 
  isSaved,
  isOpen,
  onToggle
}) => {
  const [activeTab, setActiveTab] = useState('scene'); // 'scene' | 'macro' | 'hook'

  const PillarScore = ({ label, score }) => (
    <div className="flex flex-col gap-2">
        <div className="flex justify-between items-center text-[8px] uppercase tracking-widest text-gray-600 font-black">
            <span>{label}</span>
            <span className="text-white">{score}%</span>
        </div>
        <div className="h-[1px] w-full bg-white/5 overflow-hidden">
            <div className="h-full bg-arc-teal transition-all duration-1000 shadow-glow" style={{ width: `${score}%` }} />
        </div>
    </div>
  );

  return (
    <div className={`bg-[#050505] border-l border-white/5 transition-all duration-500 flex flex-col h-full shadow-2xl z-40 font-sans relative ${isOpen ? 'w-[400px]' : 'w-14'}`}>
      
      {/* Minimalist Toggle */}
      <button
          onClick={onToggle}
          className="absolute -left-3 top-24 bg-black border border-white/10 rounded-full p-1.5 text-gray-600 hover:text-white hover:border-white/30 z-50 transition-all shadow-2xl"
      >
          {isOpen ? <ChevronRight size={12} strokeWidth={3} /> : <ChevronLeft size={12} strokeWidth={3} />}
      </button>

      {isOpen ? (
        <>
          {/* Sidebar Header */}
          <div className="h-16 border-b border-white/5 flex items-center justify-between px-8 bg-black/50 backdrop-blur-sm">
            <div className="flex items-center gap-4">
                <Activity className="w-4 h-4 text-arc-teal opacity-50" />
                <h2 className="font-black text-[10px] tracking-[0.2em] uppercase text-gray-400">Insights</h2>
                <ContextualHelp 
                    sectionId={
                        activeTab === 'scene' ? 'INSIGHTS_SCENE' : 
                        activeTab === 'macro' ? 'INSIGHTS_MACRO' : 
                        'INSIGHTS_HOOK'
                    } 
                />
            </div>
            <div className="flex bg-white/5 p-1 rounded-sm border border-white/5">
                {['scene', 'macro', 'hook'].map((tab) => (
                    <button 
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-3 py-1.5 rounded-sm text-[8px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-white text-black shadow-xl' : 'text-gray-600 hover:text-white'}`}
                    >
                        {tab}
                    </button>
                ))}
            </div>
          </div>

          {/* Diagnostic Panel Content */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
              {activeTab === 'scene' && (
                <div className="p-10 space-y-12">
                    <button
                        onClick={() => onAnalyzeScene("structural_integrity")}
                        disabled={isAnalyzing || totalLines < 5}
                        className="group w-full py-5 bg-white hover:bg-arc-teal text-black hover:text-white border border-transparent rounded-sm font-black text-[10px] uppercase tracking-[0.4em] transition-all duration-500 disabled:opacity-20 shadow-2xl flex items-center justify-center gap-4"
                    >
                        {isAnalyzing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <BrainCircuit className="w-4 h-4 group-hover:scale-110 transition-transform" />}
                        Initialize Diagnostic
                    </button>

                    {/* Logic Score Instrument */}
                    <div className="flex flex-col gap-6 p-8 bg-[#080808] border border-white/5 rounded-sm shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-0 bg-arc-teal transition-all duration-1000" style={{ h: score !== null ? '100%' : '0%' }} />
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Scale className="w-4 h-4 text-gray-600" />
                                <span className="text-[9px] text-gray-600 uppercase tracking-[0.3em] font-black">Rationality Score</span>
                            </div>
                            <div className={`text-4xl font-black tracking-tighter ${score >= 80 ? 'text-arc-teal' : score >= 50 ? 'text-arc-orange' : score !== null ? 'text-red-500' : 'text-gray-800'}`}>
                                {score !== null ? score : '--'}
                            </div>
                        </div>
                        <div className="h-[2px] w-full bg-white/5 rounded-full overflow-hidden">
                            <div className={`h-full transition-all duration-1000 ${score >= 80 ? 'bg-arc-teal' : 'bg-arc-orange'}`} style={{ width: `${score || 0}%` }} />
                        </div>
                    </div>

                    {/* Emotional Rhythm (Seismograph) */}
                    {dynamics && dynamics.tension_curve && isOpen && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Activity className="w-4 h-4 text-gray-600" />
                                    <span className="text-[9px] text-gray-600 font-black uppercase tracking-[0.3em]">Emotional Rhythm</span>
                                </div>
                                <span className="text-[8px] font-black text-arc-teal uppercase tracking-widest italic">Dynamic Curve</span>
                            </div>
                            <SceneSeismograph 
                                tensionCurve={dynamics.tension_curve} 
                                milestones={dynamics.milestones}
                                labelType="Line"
                            />
                        </div>
                    )}

                    {/* Analysis Log */}
                    {messages.length > 0 && (
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                                <BarChart3 className="w-4 h-4 text-gray-600" />
                                <span className="text-[9px] text-gray-600 font-black uppercase tracking-[0.3em]">Audit Log</span>
                            </div>
                            <div className="space-y-8">
                                {messages.slice(-1).map((msg, idx) => (
                                    <div key={idx} className="animate-fade-in">
                                        <p className="text-gray-400 text-sm font-light leading-relaxed italic whitespace-pre-wrap pl-4 border-l border-white/5">
                                            {msg.replace(/^\[.*?\]\s*/, '')}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
              )}

              {activeTab === 'macro' && (
                <div className="p-10 space-y-12">
                    <button
                        onClick={onMacroAudit}
                        disabled={isAnalyzing || totalLines < 100}
                        className="group w-full py-5 bg-white hover:bg-arc-orange text-black hover:text-white border border-transparent rounded-sm font-black text-[10px] uppercase tracking-[0.4em] transition-all duration-500 disabled:opacity-20 shadow-2xl flex items-center justify-center gap-4"
                    >
                        {isAnalyzing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Target className="w-4 h-4 group-hover:scale-110 transition-transform" />}
                        Structural Audit
                    </button>

                    {macroAuditResult ? (
                        <div className="space-y-12 animate-fade-in">
                            <div className="flex flex-col gap-6 p-8 bg-[#080808] border border-white/5 rounded-sm shadow-xl relative overflow-hidden">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Layers className="w-4 h-4 text-gray-600" />
                                        <span className="text-[9px] text-gray-600 uppercase tracking-[0.3em] font-black">Macro Integrity</span>
                                    </div>
                                    <div className="text-4xl font-black tracking-tighter text-arc-orange">
                                        {macroAuditResult.structural_integrity_score}%
                                    </div>
                                </div>
                                <div className="h-[2px] w-full bg-white/5 rounded-full overflow-hidden">
                                    <div className="h-full bg-arc-orange transition-all duration-1000" style={{ width: `${macroAuditResult.structural_integrity_score}%` }} />
                                </div>
                            </div>

                            {macroAuditResult.plothole_warnings?.length > 0 && (
                                <div className="space-y-4">
                                    <div className="text-[9px] font-black text-red-500 uppercase tracking-[0.3em] mb-4">Critical Logic Gaps</div>
                                    {macroAuditResult.plothole_warnings.map((warn, i) => (
                                        <div key={i} className="p-4 bg-red-500/5 border border-red-500/20 rounded-sm text-xs text-red-200 italic font-light leading-relaxed">
                                            {warn}
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="space-y-6">
                                <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                                    <FileText className="w-4 h-4 text-gray-600" />
                                    <span className="text-[9px] text-gray-600 font-black uppercase tracking-[0.3em]">Full Audit Log</span>
                                </div>
                                <div className="font-light text-sm text-gray-400 whitespace-pre-wrap leading-relaxed italic pl-4 border-l border-white/5">
                                    {macroAuditResult.full_audit_report}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="py-32 text-center space-y-8 opacity-20">
                            <Layers className="w-16 h-16 text-white mx-auto mb-4" />
                            <div className="space-y-2">
                                <p className="text-white text-xs font-black uppercase tracking-[0.3em]">Structural Engine Idle</p>
                                <p className="text-gray-500 text-[9px] font-bold uppercase tracking-widest">(Minimum 100 Line Requirement)</p>
                            </div>
                        </div>
                    )}
                </div>
              )}

              {activeTab === 'hook' && (
                <div className="p-10 space-y-12">
                    <button
                        onClick={onHookScan}
                        disabled={isAnalyzing || totalLines < 50}
                        className="group w-full py-5 bg-black border border-white/10 hover:border-arc-orange/50 text-gray-500 hover:text-white rounded-sm font-black text-[10px] uppercase tracking-[0.4em] transition-all duration-500 disabled:opacity-20 flex items-center justify-center gap-4"
                    >
                        {isAnalyzing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Target className="w-4 h-4 group-hover:scale-110 transition-transform" />}
                        Audit First 10 Pages
                    </button>

                    {hookScanResult ? (
                        <div className="space-y-12 animate-fade-in">
                            {/* Hook Velocity Instrument */}
                            {hookScanResult.velocity_curve && isOpen && (
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <Zap className="w-4 h-4 text-gray-600" />
                                            <span className="text-[9px] text-gray-600 font-black uppercase tracking-[0.3em]">Hook Velocity</span>
                                        </div>
                                        <span className="text-[8px] font-black text-arc-orange uppercase tracking-widest italic">Interest Curve</span>
                                    </div>
                                    <SceneSeismograph 
                                        tensionCurve={hookScanResult.velocity_curve} 
                                        milestones={hookScanResult.hook_milestones}
                                        labelType="Page"
                                    />
                                </div>
                            )}

                            <div className={`p-10 rounded-sm border flex flex-col items-center justify-center gap-4 shadow-2xl relative overflow-hidden ${hookScanResult.gatekeeper_verdict === 'READ' ? 'bg-arc-teal/5 border-arc-teal/20' : 'bg-red-500/5 border-red-500/20'}`}>
                                <div className="absolute top-0 left-0 w-full h-[1px] bg-white/5" />
                                <span className="text-[10px] font-black uppercase tracking-[0.5em] text-gray-600">Executive Verdict</span>
                                <span className={`text-6xl font-black italic tracking-tighter ${hookScanResult.gatekeeper_verdict === 'READ' ? 'text-arc-teal shadow-glow' : 'text-red-500'}`}>
                                    {hookScanResult.gatekeeper_verdict}
                                </span>
                            </div>

                            <div className="grid grid-cols-1 gap-8 bg-[#080808] p-8 border border-white/5 rounded-sm">
                                <PillarScore label="Theme Convergence" score={hookScanResult.pillar_scores.theme} />
                                <PillarScore label="Motivation Drift" score={hookScanResult.pillar_scores.motivation} />
                                <PillarScore label="Tonal Integrity" score={hookScanResult.pillar_scores.tone} />
                                <PillarScore label="Narrative Catalyst" score={hookScanResult.pillar_scores.catalyst} />
                            </div>

                            <div className="space-y-6">
                                <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                                    <Target className="w-4 h-4 text-gray-600" />
                                    <span className="text-[9px] text-gray-600 font-black uppercase tracking-[0.3em]">Pillar Specification</span>
                                </div>
                                <div className="font-light text-sm text-gray-400 whitespace-pre-wrap leading-relaxed italic pl-4 border-l border-white/5">
                                    {hookScanResult.detailed_audit}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="py-32 text-center space-y-8 opacity-20">
                            <Target className="w-16 h-16 text-white mx-auto mb-4" />
                            <div className="space-y-2">
                                <p className="text-white text-xs font-black uppercase tracking-[0.3em]">Gatekeeper Protocol Idle</p>
                                <p className="text-gray-500 text-[9px] font-bold uppercase tracking-widest">(Minimum 50 Line Requirement)</p>
                            </div>
                        </div>
                    )}
                </div>
              )}
          </div>
        </>
      ) : (
        <div className="flex-1 flex flex-col items-center pt-32 gap-8 bg-black/20">
            <span 
                className="transform rotate-90 whitespace-nowrap text-gray-700 text-[10px] font-black uppercase tracking-[0.5em] cursor-pointer hover:text-arc-teal transition-colors"
                onClick={onToggle}
            >
                Insights
            </span>
            <div className="w-px h-24 bg-gradient-to-b from-gray-900 to-transparent" />
        </div>
      )}
    </div>
  );
};

export default StoryInsights;