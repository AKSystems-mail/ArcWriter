import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from './firebase';
import { collectionGroup, query, where, getDocs, limit } from 'firebase/firestore';

// Pages
import OnboardingScreen from './pages/OnboardingScreen'; // Keep if used elsewhere, otherwise remove
import Dashboard from './pages/Dashboard';
import Architect from './pages/Architect';
import UniverseDashboard from './pages/UniverseDashboard';
import PitchDeckGallery from './components/PitchDeckGallery';
import LoginScreen from './pages/LoginScreen';
import LandingPage from './pages/LandingPage';
import Analyze from './pages/Analyze';
import Billing from './pages/Billing';
import OnboardingWizard from './pages/OnboardingWizard';
import ScriptEditorPage from './pages/ScriptEditorPage';
import PitchDeckView from './pages/PitchDeckView';
import PitchTrackerPage from './pages/PitchTrackerPage';
import ManuscriptUpload from './pages/ManuscriptUpload';
import BugFeatureDashboard from './pages/BugFeatureDashboard';
import PublicCoverage from './pages/PublicCoverage';
import NotFoundPage from './pages/NotFoundPage';
import './index.css';

// This checks if the user has completed onboarding or has projects
const checkUserOnboardingStatus = async (user) => {
    try {
        const q = query(
            collectionGroup(db, 'projects'),
            where('owner_id', '==', user.uid),
            limit(1)
        );
        const querySnapshot = await getDocs(q);
        return { hasProjects: !querySnapshot.empty };
    } catch (error) {
        console.error("Error checking onboarding status:", error);
        return { hasProjects: false };
    }
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
    // Keep the loading state to provide feedback while the check is happening.
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Use onAuthStateChanged for a reliable user object.
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                // User is confirmed. Now, check for projects.
                const status = await checkUserOnboardingStatus(user);
                if (status.hasProjects) {
                    navigate('/dashboard');
                } else {
                    navigate('/wizard');
                }
            } else {
                // This case should theoretically be handled by ProtectedRoute,
                // but as a safeguard, navigate to login if no user is found.
                navigate('/login');
            }
            // No need to setLoading(false) as navigation will unmount the component.
        });

        // Cleanup the listener when the component unmounts.
        return () => unsubscribe();
    }, [navigate]);

    // Display a loading indicator while the auth check and project query are in progress.
    return (
        <div className="min-h-screen bg-obsidian-black flex items-center justify-center">
            <div className="text-arc-teal font-black tracking-widest animate-pulse">LOADING STUDIO...</div>
        </div>
    );
};

function App() {
    return (
        <Router>
            <div className="App bg-obsidian-black min-h-screen text-white font-sans">
                <Routes>
                    {/* Public Routes */}
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/login" element={<LoginScreen />} />
                    <Route path="/analyze" element={<Analyze />} />
                    <Route path="/pitch/:shareHash" element={<PitchDeckView />} />

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
                        path="/tracker"
                        element={
                            <ProtectedRoute>
                                <PitchTrackerPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/upload-manuscript"
                        element={
                            <ProtectedRoute>
                                <ManuscriptUpload />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/bug-feature"
                        element={
                            <ProtectedRoute>
                                <BugFeatureDashboard />
                            </ProtectedRoute>
                        }
                    />
                    <Route path="/coverage" element={<PublicCoverage />} />
                    <Route
                        path="/project/:projectId/beat-sheet"
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
                    <Route
                        path="/billing"
                        element={
                            <ProtectedRoute>
                                <Billing />
                            </ProtectedRoute>
                        }
                    />
                    <Route path="*" element={<NotFoundPage />} />
                </Routes>
            </div>
        </Router>
    );
}

export default App;
