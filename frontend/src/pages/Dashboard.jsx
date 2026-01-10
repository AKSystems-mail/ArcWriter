import React, { useEffect, useState } from 'react';

import ProjectHeader from '../components/ProjectHeader';

const Dashboard = () => {
  const [mode, setMode] = useState('');

  useEffect(() => {
    const savedMode = localStorage.getItem('arc_mode');
    if (savedMode) {
      setMode(savedMode);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <ProjectHeader projectTitle="My Epic Saga" moodImageSrc="https://images.unsplash.com/photo-1511855231792-c439167389a0?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" />

      <main className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
          <h3 className="text-xl font-semibold mb-4">Recent Projects</h3>
          <p className="text-gray-500">No projects found.</p>
        </div>
        
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
          <h3 className="text-xl font-semibold mb-4">Quick Actions</h3>
          <ul className="space-y-2 text-gray-300">
            <li>+ New Project</li>
            <li>Import Script</li>
          </ul>
        </div>

        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
           <h3 className="text-xl font-semibold mb-4">System Status</h3>
           <p className="text-sm text-green-400">● Logic Engine: Online</p>
           <p className="text-sm text-green-400">● Asset Studio: Online</p>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
