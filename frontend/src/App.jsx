import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import OnboardingScreen from './pages/OnboardingScreen';
import Dashboard from './pages/Dashboard';
import Architect from './pages/Architect';
import UniverseDashboard from './pages/UniverseDashboard'; // Import the new component
import './index.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<UniverseDashboard />} /> {/* Set UniverseDashboard as default */}
          <Route path="/onboarding" element={<OnboardingScreen />} /> {/* Onboarding if needed */}
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/architect" element={<Architect />} />
          <Route path="/universes" element={<UniverseDashboard />} /> {/* Also accessible via /universes */}
        </Routes>
      </div>
    </Router>
  );
}

export default App;