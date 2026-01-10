import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import OnboardingScreen from './pages/OnboardingScreen';
import Dashboard from './pages/Dashboard';
import Architect from './pages/Architect';
import './index.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<OnboardingScreen />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/architect" element={<Architect />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;