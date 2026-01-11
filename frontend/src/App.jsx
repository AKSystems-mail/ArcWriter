import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth'; // Import Firebase auth
import { auth } from './firebase'; // Import auth from firebase.js

import OnboardingScreen from './pages/OnboardingScreen';
import Dashboard from './pages/Dashboard';
import Architect from './pages/Architect';
import UniverseDashboard from './pages/UniverseDashboard';
import PitchDeckGallery from './components/PitchDeckGallery';
import LoginScreen from './pages/LoginScreen';
import LandingPage from './pages/LandingPage';
import OnboardingWizard from './pages/OnboardingWizard';
import './index.css';

// A simple protected route wrapper
const ProtectedRoute = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                setIsAuthenticated(true);
            } else {
                setIsAuthenticated(false);
                navigate('/'); // Redirect to landing if not authenticated
            }
        });
        return () => unsubscribe();
    }, [auth, navigate]);

    if (isAuthenticated === null) {
        return <div className="min-h-screen bg-obsidian-black flex items-center justify-center"><div className="animate-spin h-10 w-10 border-4 border-arc-teal border-t-transparent rounded-full"></div></div>;
    }

    return isAuthenticated ? <>{children}</> : null;
};


function App() {
    return (
        <Router>
            <div className="App">
                <Routes>
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/login" element={<LoginScreen />} />

                    {/* Protected routes */}
                    <Route
                        path="/universes"
                        element={
                            <ProtectedRoute>
                                <UniverseDashboard />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/onboarding"
                        element={
                            <ProtectedRoute>
                                <OnboardingWizard />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/wizard"
                        element={
                            <ProtectedRoute>
                                <OnboardingWizard />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/dashboard"
                        element={
                            <ProtectedRoute>
                                <Dashboard />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/architect"
                        element={
                            <ProtectedRoute>
                                <Architect />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/pitchdeck"
                        element={
                            <ProtectedRoute>
                                <PitchDeckGallery />
                            </ProtectedRoute>
                        }
                    />
                </Routes>
            </div>
        </Router>
    );
}

export default App;