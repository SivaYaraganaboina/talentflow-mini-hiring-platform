import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { motion } from 'framer-motion';
import Jobs from './pages/Jobs';
import JobDetailProfessional from './pages/JobDetailProfessional';
import Candidates from './pages/Candidates';
import CandidateProfileProfessional from './pages/CandidateProfileProfessional';
import Assessments from './pages/Assessments';
import HRDashboard from './pages/HRDashboard';
import CandidateDashboard from './pages/CandidateDashboard';
import Header from './components/common/Header';
import ErrorBoundary from './components/common/ErrorBoundary';
import LoginPage from './pages/LoginPage';
import JobsBoardForCandidatesProfessional from './pages/JobsBoardForCandidatesProfessional';
import MyApplicationsProfessional from './pages/MyApplicationsProfessional';
import TakeAssessment from './pages/TakeAssessment';
import JobDetailForCandidate from './pages/JobDetailForCandidate';
import OfflineIndicator from './components/OfflineIndicator';
import CandidateKanbanSimple from './components/CandidateKanbanSimple';
import FeatureChecker from './components/FeatureChecker';
import ToastProvider from './components/ui/ToastProvider';
import { useAuth, useTheme } from './store';
import { initializeDatabase } from './services/database';
import { initializeUserDatabase } from './services/userDatabase';
import './styles/globals.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
    },
  },
});

const App: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme } = useTheme();

  useEffect(() => {
    initializeDatabase();
    initializeUserDatabase();
    // Apply theme on mount
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  if (!user.role) {
    return (
      <QueryClientProvider client={queryClient}>
        <ToastProvider />
        <LoginPage />
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <ToastProvider />
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
            <Header onLogout={logout} />
            <OfflineIndicator />
            <motion.main
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="pb-8"
            >
              <Routes>
                {user.role === 'HR' ? (
                  <>
                    <Route path="/" element={<HRDashboard />} />
                    <Route path="/jobs/:jobId" element={<JobDetailProfessional />} />
                    <Route path="/jobs" element={<Jobs />} />
                    <Route path="/candidates/board" element={<CandidateKanbanSimple />} />
                    <Route path="/candidates/:id" element={<CandidateProfileProfessional />} />
                    <Route path="/candidates" element={<Candidates />} />
                    <Route path="/assessments" element={<Assessments />} />
                    <Route path="/assessments/create" element={<Assessments />} />
                    <Route path="/feature-check" element={<FeatureChecker />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </>
                ) : (
                  <>
                    <Route path="/" element={<CandidateDashboard />} />
                    <Route path="/jobs/:jobId" element={<JobDetailForCandidate />} />
                    <Route path="/jobs" element={<JobsBoardForCandidatesProfessional />} />
                    <Route path="/my-applications" element={<MyApplicationsProfessional />} />
                    <Route path="/take-assessment/:jobId" element={<TakeAssessment />} />
                    <Route path="/feature-check" element={<FeatureChecker />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </>
                )}
              </Routes>
            </motion.main>
          </div>
        </Router>
      </ErrorBoundary>
    </QueryClientProvider>
  );
};



export default App;
