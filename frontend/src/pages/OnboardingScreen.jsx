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
    <div className="flex flex-col items-center justify-center min-h-screen bg-obsidian-black p-8 relative overflow-hidden">
      <div className="absolute inset-0 z-0 bg-gradient-to-t from-arc-teal/5 via-transparent to-arc-orange/5 opacity-50"></div>

      <div className="relative z-10 text-center mb-16 animate-fade-in">
        <img src="/Arc%20Main.png" alt="ArcWriter" className="h-24 mx-auto mb-8" />
        <h1 className="text-5xl font-black text-white tracking-tight">Choose Your Path</h1>
      </div>

      <div className="relative z-10 flex flex-col md:flex-row gap-8 w-full max-w-5xl">
        {/* The Explorer Card */}
        <button
          onClick={() => handleModeSelect('explorer')}
          className="flex-1 bg-gray-900/50 border border-gray-800 p-10 rounded-3xl shadow-2xl hover:border-arc-orange transition-all duration-500 text-left group animate-fade-in-delayed hover:shadow-arc-orange/10"
        >
          <div className="h-full flex flex-col justify-between">
            <div>
              <div className="h-12 w-12 bg-arc-orange/20 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <span className="text-arc-orange text-2xl">✧</span>
              </div>
              <h2 className="text-3xl font-bold text-white mb-4 group-hover:text-arc-orange transition-colors">The Explorer</h2>
              <p className="text-gray-400 text-lg leading-relaxed">
                Focus on creativity and vibes. Brainstorm ideas, explore themes, and let your imagination roam free.
              </p>
            </div>
            <div className="mt-12">
              <span className="inline-block px-6 py-3 bg-arc-orange text-white rounded-xl text-sm font-bold shadow-lg shadow-arc-orange/20 group-hover:translate-x-2 transition-all">
                Select Explorer Mode &rarr;
              </span>
            </div>
          </div>
        </button>

        {/* The Architect Card */}
        <button
          onClick={() => handleModeSelect('architect')}
          className="flex-1 bg-gray-900/50 border border-gray-800 p-10 rounded-3xl shadow-2xl hover:border-arc-teal transition-all duration-500 text-left group animate-fade-in-delayed hover:shadow-arc-teal/10"
          style={{ animationDelay: '0.2s' }}
        >
          <div className="h-full flex flex-col justify-between">
            <div>
              <div className="h-12 w-12 bg-arc-teal/20 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <span className="text-arc-teal text-2xl">⬡</span>
              </div>
              <h2 className="text-3xl font-bold text-white mb-4 group-hover:text-arc-teal transition-colors">The Architect</h2>
              <p className="text-gray-400 text-lg leading-relaxed">
                Focus on structure and logic. Build solid foundations, outline beats, and analyze plot mechanics.
              </p>
            </div>
            <div className="mt-12">
              <span className="inline-block px-6 py-3 bg-arc-teal text-white rounded-xl text-sm font-bold shadow-lg shadow-arc-teal/20 group-hover:translate-x-2 transition-all">
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
