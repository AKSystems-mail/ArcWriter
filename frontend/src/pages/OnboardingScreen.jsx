import React from 'react';
import { useNavigate } from 'react-router-dom';

const OnboardingScreen = () => {
  const navigate = useNavigate();

  const handleModeSelect = (mode) => {
    // Save preference (mocking local state/persistence)
    localStorage.setItem('arc_mode', mode);
    console.log(`Mode selected: ${mode}`);
    
    // Redirect to Dashboard
    navigate('/dashboard');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 p-8">
      <h1 className="text-4xl font-bold text-white mb-12">Choose Your Path</h1>
      
      <div className="flex flex-col md:flex-row gap-8 w-full max-w-4xl">
        {/* The Explorer Card */}
        <button
          onClick={() => handleModeSelect('explorer')}
          className="flex-1 bg-gradient-to-br from-purple-600 to-blue-600 p-8 rounded-2xl shadow-xl hover:scale-105 transition-transform duration-300 text-left group"
        >
          <div className="h-full flex flex-col justify-between">
            <div>
              <h2 className="text-3xl font-bold text-white mb-4">The Explorer</h2>
              <p className="text-gray-100 text-lg opacity-90">
                Focus on creativity and vibes. Brainstorm ideas, explore themes, and let your imagination roam free.
              </p>
            </div>
            <div className="mt-8">
              <span className="inline-block px-4 py-2 bg-white/20 rounded-full text-white text-sm font-medium group-hover:bg-white/30 transition-colors">
                Select Explorer Mode &rarr;
              </span>
            </div>
          </div>
        </button>

        {/* The Architect Card */}
        <button
          onClick={() => handleModeSelect('architect')}
          className="flex-1 bg-gradient-to-br from-emerald-600 to-teal-600 p-8 rounded-2xl shadow-xl hover:scale-105 transition-transform duration-300 text-left group"
        >
          <div className="h-full flex flex-col justify-between">
            <div>
              <h2 className="text-3xl font-bold text-white mb-4">The Architect</h2>
              <p className="text-gray-100 text-lg opacity-90">
                Focus on structure and logic. Build solid foundations, outline beats, and analyze plot mechanics.
              </p>
            </div>
            <div className="mt-8">
              <span className="inline-block px-4 py-2 bg-white/20 rounded-full text-white text-sm font-medium group-hover:bg-white/30 transition-colors">
                Select Architect Mode &rarr;
              </span>
            </div>
          </div>
        </button>
      </div>
    </div>
  );
};

export default OnboardingScreen;
