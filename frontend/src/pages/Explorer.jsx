import React, { useState } from 'react';

const Explorer = () => {
    const [vibe, setVibe] = useState('');

    return (
        <div className="p-8">
            <h2 className="text-3xl font-bold mb-6 text-purple-400">Explorer Mode (Pantser)</h2>
            <p className="mb-4 text-gray-300">Focus on the vibe. Brainstorm and iterate freely.</p>

            <div className="flex flex-col gap-6">
                <textarea
                    className="w-full h-48 p-4 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                    placeholder="Describe the 'vibe' or a loose character idea..."
                    value={vibe}
                    onChange={(e) => setVibe(e.target.value)}
                />

                <button className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg transition-colors">
                    Generate Project Bible
                </button>
            </div>
        </div>
    );
};

export default Explorer;
