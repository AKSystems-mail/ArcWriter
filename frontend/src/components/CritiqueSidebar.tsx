import React, { useState, useEffect, useRef } from 'react';
import LogicScore from './LogicScore';
import SceneSeismograph from './SceneSeismograph';

interface CritiqueSidebarProps {
    onAnalyzeScene: (persona: string) => void;
    messages: string[];
    isAnalyzing: boolean;
    score: number | null;
    dynamics?: {
        power_shift_score?: number;
        tension_peaks?: (number | string)[];
        tension_curve?: number[];
        push_pull_map?: Record<string, string>;
        verdict: string;
        analysis_summary?: string;
    } | null;
    totalLines?: number;
    isSaving?: boolean;
    isSaved?: boolean;
}

const CritiqueSidebar: React.FC<CritiqueSidebarProps> = ({ 
    onAnalyzeScene, 
    messages, 
    isAnalyzing, 
    score, 
    dynamics, 
    totalLines,
    isSaving,
    isSaved 
}) => {
    const [selectedPersona, setSelectedPersona] = useState<string>('Studio Exec');
    const [showChecklist, setShowChecklist] = useState<boolean>(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const handlePersonaChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedPersona(event.target.value);
    };

    const handleAnalyzeScene = () => {
        onAnalyzeScene(selectedPersona);
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    return (
        <div className="w-80 bg-gray-800 text-white p-4 flex flex-col h-full border-l border-gray-700 overflow-y-auto custom-scrollbar relative">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Producer's Corner</h2>
                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => setShowChecklist(!showChecklist)}
                        className="p-1 hover:text-arc-teal transition-colors"
                        title="Next Steps"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.172a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                    </button>
                    <div className="text-[10px] font-bold px-2 py-1 rounded bg-gray-900 border border-gray-700 whitespace-nowrap">
                        {isSaving ? (
                            <span className="text-yellow-400 animate-pulse">SAVING...</span>
                        ) : isSaved ? (
                            <span className="text-green-400">SAVED</span>
                        ) : (
                            <span className="text-red-400">UNSAVED</span>
                        )}
                    </div>
                </div>
            </div>

            {/* Checklist Popover */}
            {showChecklist && (
                <div className="absolute top-12 right-4 w-64 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl p-4 z-[100] animate-fade-in">
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-arc-teal mb-4">Production Roadmap</h3>
                    <ul className="space-y-3">
                        {[
                            { id: 1, label: 'Complete Beat Sheet', done: true },
                            { id: 2, label: 'Write Draft', done: false },
                            { id: 3, label: 'Generate Assets', done: false }
                        ].map(item => (
                            <li key={item.id} className="flex items-center gap-3 text-sm">
                                <div className={`w-4 h-4 rounded border flex items-center justify-center ${item.done ? 'bg-arc-teal border-arc-teal text-black' : 'border-gray-600'}`}>
                                    {item.done && <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>}
                                </div>
                                <span className={item.done ? 'text-gray-400 line-through' : 'text-white'}>{item.label}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Logic Score Display */}
            <div className="mb-4">
                <LogicScore score={score} />
            </div>

            {/* Scene Dynamics Graph */}
            {dynamics && (
                <div className="mb-6 animate-fade-in">
                    <SceneSeismograph 
                        tensionPeaks={dynamics.tension_peaks} 
                        tensionCurve={dynamics.tension_curve}
                        totalLines={totalLines} 
                    />
                    <div className="flex justify-between mt-2 text-xs text-gray-400 px-1">
                        <span>Power Shift: <span className="text-white font-bold">{dynamics.power_shift_score ?? 'N/A'}%</span></span>
                        <span className="uppercase tracking-wider">{dynamics.verdict}</span>
                    </div>
                    {dynamics.analysis_summary && (
                        <p className="mt-3 text-xs text-gray-500 leading-relaxed italic border-l-2 border-gray-700 pl-2">
                            {dynamics.analysis_summary}
                        </p>
                    )}
                </div>
            )}

            <div className="mb-4">
                <label htmlFor="persona-select" className="block text-sm font-medium text-gray-300 mb-2">
                    Select Persona:
                </label>
                <select
                    id="persona-select"
                    className="block w-full p-2 border border-gray-600 rounded-md bg-gray-700 text-white focus:ring-blue-500 focus:border-blue-500"
                    value={selectedPersona}
                    onChange={handlePersonaChange}
                    disabled={isAnalyzing}
                >
                    <option value="Studio Exec">Studio Exec</option>
                    <option value="Auteur">Auteur</option>
                    <option value="Script Doctor">Script Doctor</option>
                </select>
            </div>

            <button
                onClick={handleAnalyzeScene}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75 mb-4 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isAnalyzing}
            >
                {isAnalyzing ? 'Analyzing...' : 'Analyze Scene'}
            </button>

            <div className="flex-1 overflow-y-auto border border-gray-700 rounded-md p-3 bg-gray-900 flex flex-col custom-scrollbar">
                {messages.length === 0 ? (
                    <p className="text-gray-400">No feedback yet. Select a persona and analyze a scene.</p>
                ) : (
                    messages.map((msg, index) => (
                        <div key={index} className={`mb-4 p-3 rounded-lg text-sm leading-relaxed ${msg.startsWith('[USER]') ? 'bg-blue-900 text-blue-100 self-end ml-4' : msg.startsWith('[AI]') ? 'bg-gray-800 text-gray-100 self-start mr-4 border border-gray-700' : 'bg-red-900 text-red-100 self-start mr-4'}`}>
                            <div className="font-bold mb-1 opacity-50 text-[10px] uppercase tracking-widest">{msg.startsWith('[USER]') ? 'User' : msg.startsWith('[AI]') ? 'Producer' : 'System'}</div>
                            {msg.replace(/^\[.*?\]\s*/, '').split('\n\n').map((para, i) => (
                                <p key={i} className="mb-2 last:mb-0">{para}</p>
                            ))}
                        </div>
                    ))
                )}
                {isAnalyzing && (
                    <div className="mb-2 p-3 rounded-lg text-sm bg-gray-800 text-gray-100 self-start mr-4 border border-gray-700 animate-pulse">
                        Producer is thinking...
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>
        </div>
    );
};

export default CritiqueSidebar;
