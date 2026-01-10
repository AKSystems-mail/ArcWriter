import React from 'react';
import BeatSheetForm from '../components/BeatSheetForm';

const Architect = () => {
    return (
        <div className="min-h-screen bg-gray-900 p-8">
             <header className="mb-8 border-b border-gray-700 pb-4">
                <h1 className="text-3xl font-bold text-white">Architect Mode</h1>
                <p className="text-gray-400 mt-2">Structure your narrative using the Save the Cat framework.</p>
            </header>
            
            <main>
                <BeatSheetForm />
            </main>
        </div>
    );
};

export default Architect;