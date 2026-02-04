import React, { useRef, useEffect } from 'react';
import { AlertCircle, CheckCircle2, Terminal, Activity, BrainCircuit, BarChart3, Scale, Target } from 'lucide-react';
import SceneSeismograph from './SceneSeismograph';

const StoryInsights = ({ 
  onAnalyzeScene, 
  messages, 
  isAnalyzing, 
  score, 
  dynamics, 
  totalLines, 
  isSaving, 
  isSaved 
}) => {
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Phase 3: Translation Layer (Math -> English)
  // Logic to interpret backend data if available in dynamics
  // Note: We expect 'dynamics' to potentially contain 'analysis_details' from our recent backend update,
  // or 'dynamics' itself might be the merged object from the backend response in ScriptEditor.
  
  // Let's assume the 'dynamics' prop passed here is the full data object from the API response
  // when available, or null.
  
  const analysisDetails = dynamics?.analysis_details || {};
  
  // Mapping
  // Payoff Matrix -> Stakes Analysis (visualized conceptually or just listed)
  // Nash Equilibrium -> Believability Check
  // Dominant Strategy -> Primary Motivation
  
  const hasAnalysis = !!dynamics;

  return (
    <div className="w-96 bg-gray-900 border-l border-gray-800 flex flex-col h-full shadow-2xl z-40 font-sans">
      {/* Header */}
      <div className="h-16 border-b border-gray-800 flex items-center justify-between px-6 bg-gray-900/50 backdrop-blur-sm">
        <div className="flex items-center gap-3">
            <Activity className="w-5 h-5 text-arc-teal" />
            <h2 className="font-bold text-sm tracking-widest uppercase text-gray-200">Story Insights</h2>
        </div>
        <div className="flex items-center gap-2">
            {isSaving ? (
                <span className="text-xs text-yellow-500 font-mono animate-pulse">SAVING...</span>
            ) : isSaved ? (
                <span className="text-xs text-gray-500 font-mono flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> SAVED
                </span>
            ) : (
                <span className="text-xs text-red-500 font-mono">UNSAVED</span>
            )}
        </div>
      </div>

      {/* Diagnostic Panel */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="p-6 space-y-8">
            
            {/* Analyze Button */}
            <button
                onClick={() => onAnalyzeScene("current_persona")}
                disabled={isAnalyzing || totalLines < 5}
                className="w-full py-3 bg-arc-teal/10 hover:bg-arc-teal/20 border border-arc-teal/50 text-arc-teal rounded-lg font-bold text-xs uppercase tracking-widest transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
            >
                {isAnalyzing ? (
                    <>
                        <div className="w-4 h-4 border-2 border-arc-teal border-t-transparent rounded-full animate-spin" />
                        Running Simulation...
                    </>
                ) : (
                    <>
                        <BrainCircuit className="w-4 h-4 group-hover:scale-110 transition-transform" />
                        Run Diagnostics
                    </>
                )}
            </button>

            {/* Rationality / Logic Score */}
            <div className="flex items-center justify-between p-4 bg-gray-900/50 border border-gray-800 rounded-xl">
                <div className="flex items-center gap-3">
                    <Scale className="w-5 h-5 text-gray-400" />
                    <span className="text-xs text-gray-400 uppercase tracking-widest font-semibold">Logic Score</span>
                </div>
                <div className={`text-3xl font-black font-mono ${
                    score >= 80 ? 'text-green-400' : 
                    score >= 50 ? 'text-yellow-400' : 
                    score !== null ? 'text-red-400' : 'text-gray-600'
                }`}>
                    {score !== null ? score : '--'}
                </div>
            </div>

            {/* Scene Dynamics (Seismograph) */}
            {dynamics && dynamics.tension_curve && (
                <div className="space-y-2">
                    <div className="flex items-center gap-2 mb-1">
                        <Activity className="w-4 h-4 text-gray-500" />
                        <span className="text-xs text-gray-500 font-bold uppercase tracking-widest">Scene Dynamics</span>
                    </div>
                    <div className="h-24 w-full bg-gray-950 rounded-lg border border-gray-800 overflow-hidden relative">
                        <SceneSeismograph data={dynamics.tension_curve} />
                    </div>
                </div>
            )}

            {/* Stakes Analysis (Payoff Matrix Translation) */}
            {analysisDetails.payoff_matrix && (
                <div className="space-y-2 animate-fade-in">
                     <div className="flex items-center gap-2 mb-1">
                        <Target className="w-4 h-4 text-gray-500" />
                        <span className="text-xs text-gray-500 font-bold uppercase tracking-widest">Stakes Analysis</span>
                    </div>
                    <div className="bg-gray-950 border border-gray-800 rounded-lg p-3 text-xs text-gray-400 font-mono">
                         {/* Conceptual display of strategies */}
                         {Object.keys(analysisDetails.payoff_matrix).map(strategy => (
                             <div key={strategy} className="mb-1">
                                 <span className="text-arc-teal">• {strategy}</span>
                             </div>
                         ))}
                    </div>
                </div>
            )}

             {/* Believability Check (Nash Equilibrium) */}
             {analysisDetails.nash_equilibria && (
                <div className="space-y-2 animate-fade-in">
                     <div className="flex items-center gap-2 mb-1">
                        <CheckCircle2 className="w-4 h-4 text-gray-500" />
                        <span className="text-xs text-gray-500 font-bold uppercase tracking-widest">Believability Check</span>
                    </div>
                    <div className="bg-gray-950 border border-gray-800 rounded-lg p-3 text-xs text-gray-400 font-mono">
                         {analysisDetails.nash_equilibria.length > 0 ? (
                             <span className="text-green-400">Stable Motivation Detected</span>
                         ) : (
                             <span className="text-yellow-400">Motivation Gap: Behavior may feel forced.</span>
                         )}
                    </div>
                </div>
            )}


            {/* Analysis Report (Critique Text) */}
            {messages.length > 0 && (
                <div className="space-y-2">
                     <div className="flex items-center gap-2 mb-1">
                        <BarChart3 className="w-4 h-4 text-gray-500" />
                        <span className="text-xs text-gray-500 font-bold uppercase tracking-widest">Analysis Report</span>
                    </div>
                    <div className="bg-gray-950/50 border border-gray-800 rounded-xl p-4 font-mono text-sm space-y-4">
                        {messages.slice(-1).map((msg, idx) => ( // Only show latest report for cleaner UI? Or keep log? User said "Diagnostic Panel... not Chatbot stream"
                            <div key={idx} className="animate-fade-in text-gray-300">
                                <p className="whitespace-pre-wrap leading-relaxed">
                                    {msg.replace(/^\[.*?\]\s*/, '')}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

          </div>
      </div>
    </div>
  );
};

export default StoryInsights;
