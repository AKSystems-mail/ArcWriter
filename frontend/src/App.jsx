import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';

// Pages
import OnboardingScreen from './pages/OnboardingScreen'; // Keep if used elsewhere, otherwise remove
import Dashboard from './pages/Dashboard';
import Architect from './pages/Architect';
import UniverseDashboard from './pages/UniverseDashboard';
import PitchDeckGallery from './components/PitchDeckGallery';
import LoginScreen from './pages/LoginScreen';
import LandingPage from './pages/LandingPage';
import OnboardingWizard from './pages/OnboardingWizard';
import ScriptEditorPage from './pages/ScriptEditorPage';
import './index.css';

// Mock API service - REPLACE THIS with your real backend call
// This checks if the user has completed onboarding or has projects
const checkUserOnboardingStatus = async (user) => {
    // TODO: Connect this to your backend endpoint, e.g., /api/users/me
    // return { hasProjects: data.project_count > 0 }

    // For MVP testing: We assume new users have 0 projects.
    // You might check a flag in Firestore here.
    return { hasProjects: false };
};

const ProtectedRoute = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(null);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                setIsAuthenticated(true);
            } else {
                setIsAuthenticated(false);
                // Save where they were trying to go so we can send them back after login
                navigate('/login', { state: { from: location } });
            }
        });
        return () => unsubscribe();
    }, [auth, navigate, location]);

    if (isAuthenticated === null) {
        return (
            <div className="min-h-screen bg-obsidian-black flex items-center justify-center">
                <div className="animate-spin h-10 w-10 border-4 border-arc-teal border-t-transparent rounded-full"></div>
            </div>
        );
    }

    return isAuthenticated ? <>{children}</> : null;
};

// THE NEW TRAFFIC CONTROLLER
// This decides where a logged-in user should land
const TrafficController = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const decideRoute = async () => {
            const user = auth.currentUser;
            if (user) {
                // Check if they have projects (The "Magic Moment" Logic)
                const status = await checkUserOnboardingStatus(user);

                if (!status.hasProjects) {
                    // New User -> Force them to the Wizard
                    navigate('/wizard');
                } else {
                    // Returning User -> Go to Universe Dashboard
                    navigate('/universes');
                }
            }
            setLoading(false);
        };
        decideRoute();
    }, [navigate]);

    if (loading) {
        return (
            <div className="min-h-screen bg-obsidian-black flex items-center justify-center">
                <div className="text-arc-teal font-black tracking-widest animate-pulse">LOADING STUDIO...</div>
            </div>
        );
    }

    return null;
};

function App() {
    return (
        <Router>
            <div className="App bg-obsidian-black min-h-screen text-white font-sans">
                <Routes>
                    {/* Public Routes */}
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/login" element={<LoginScreen />} />

                    {/* The Traffic Controller (Default Logged-in Route) */}
                    <Route
                        path="/app"
                        element={
                            <ProtectedRoute>
                                <TrafficController />
                            </ProtectedRoute>
                        }
                    />

                    {/* Protected Routes */}
                    <Route
                        path="/universes"
                        element={
                            <ProtectedRoute>
                                <UniverseDashboard />
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
                        path="/project/:projectId/editor"
                        element={
                            <ProtectedRoute>
                                <ScriptEditorPage />
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