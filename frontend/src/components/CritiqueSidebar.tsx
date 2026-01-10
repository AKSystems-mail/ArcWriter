import React, { useState, useEffect, useRef } from 'react';
import LogicScore from './LogicScore'; // Import LogicScore component

interface CritiqueSidebarProps {
    onAnalyzeScene: (persona: string) => void;
    messages: string[];
    isAnalyzing: boolean;
    score: number | null; // Add score prop
}

const CritiqueSidebar: React.FC<CritiqueSidebarProps> = ({ onAnalyzeScene, messages, isAnalyzing, score }) => {
    const [selectedPersona, setSelectedPersona] = useState<string>('Studio Exec');
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
        <div className="w-80 bg-gray-800 text-white p-4 flex flex-col h-full border-l border-gray-700">
            <h2 className="text-xl font-bold mb-4">Producer's Corner</h2>

            {/* Logic Score Display */}
            <div className="mb-4">
                <LogicScore score={score} />
            </div>

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

            <div className="flex-1 overflow-y-auto border border-gray-700 rounded-md p-3 bg-gray-900 flex flex-col">
                {messages.length === 0 ? (
                    <p className="text-gray-400">No feedback yet. Select a persona and analyze a scene.</p>
                ) : (
                    messages.map((msg, index) => (
                        <div key={index} className={`mb-2 p-2 rounded-lg text-sm ${msg.startsWith('[USER]') ? 'bg-blue-900 text-blue-100 self-end' : msg.startsWith('[AI]') ? 'bg-gray-700 text-gray-100 self-start' : 'bg-red-900 text-red-100 self-start'}`}>
                            {msg}
                        </div>
                    ))
                )}
                {isAnalyzing && (
                    <div className="mb-2 p-2 rounded-lg text-sm bg-gray-700 text-gray-100 self-start">
                        AI is thinking...
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>
        </div>
    );
};

export default CritiqueSidebar;
