import React, { useEffect, useState } from 'react';
import ProjectHeader from '../components/ProjectHeader';
import MobilePitchDeck from '../components/MobilePitchDeck';
import { useResponsive } from '../hooks/useResponsive';

const Dashboard = () => {
  const { isMobile } = useResponsive();
  const [mode, setMode] = useState('');

  useEffect(() => {
    const savedMode = localStorage.getItem('arc_mode');
    if (savedMode) {
      setMode(savedMode);
    }
  }, []);

  // If mobile, show pitch deck instead of dashboard
  if (isMobile) {
    return (
      <div className="min-h-screen bg-obsidian-black">
        <MobilePitchDeck
          projectTitle="My Epic Saga"
          tagline="An epic journey begins"
          synopsis="Year 2077. The megacity of Neo-Veridia thrives under the iron fist of the omniscient Aethel Corp, a company that controls every aspect of its citizens' lives through advanced neural implants. Kael, a former data architect now living off-grid, stumbles upon a suppressed historical archive revealing Aethel Corp's true origins: a brutal coup that erased the true founding principles of the city."
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-obsidian-black text-white p-8">
      <div className="animate-fade-in">
        <ProjectHeader
          universeId="default_universe"
          projectId="default_project"
          projectTitle="My Epic Saga"
          moodImageSrc="https://images.unsplash.com/photo-1511855231792-c439167389a0?q=80&w=2070&auto=format&fit=crop"
        />
      </div>

      <main className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
        <div className="bg-gray-900/50 p-8 rounded-2xl border border-gray-800 animate-fade-in-delayed hover:border-arc-teal transition-all duration-500 shadow-xl group">
          <h3 className="text-2xl font-bold mb-4 text-arc-teal group-hover:text-teal-400 transition-colors">Recent Projects</h3>
          <p className="text-gray-500">No projects found.</p>
        </div>

        <div className="bg-gray-900/50 p-8 rounded-2xl border border-gray-800 animate-fade-in-delayed hover:border-arc-orange transition-all duration-500 shadow-xl group" style={{ animationDelay: '0.2s' }}>
          <h3 className="text-2xl font-bold mb-4 text-arc-orange group-hover:text-orange-400 transition-colors">Quick Actions</h3>
          <ul className="space-y-3 text-gray-300">
            <li className="hover:text-arc-teal cursor-pointer transition-colors flex items-center gap-2">
              <span className="text-arc-teal">+</span> New Project
            </li>
            <li className="hover:text-arc-teal cursor-pointer transition-colors flex items-center gap-2">
              <span className="text-arc-teal">↓</span> Import Script
            </li>
          </ul>
        </div>

        <div className="bg-gray-900/50 p-8 rounded-2xl border border-gray-800 animate-fade-in-delayed hover:border-arc-teal transition-all duration-500 shadow-xl group" style={{ animationDelay: '0.4s' }}>
          <h3 className="text-2xl font-bold mb-4 text-arc-teal group-hover:text-teal-400 transition-colors">System Status</h3>
          <div className="space-y-2">
            <p className="text-sm text-green-500 flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              Logic Engine: Online
            </p>
            <p className="text-sm text-green-500 flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              Asset Studio: Online
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;

