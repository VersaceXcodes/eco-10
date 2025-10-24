import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAppStore } from '@/store/main';

// Import all required views
import GV_TopNav from '@/components/views/GV_TopNav';
import GV_Footer from '@/components/views/GV_Footer';
import GV_LoginModal from '@/components/views/GV_LoginModal';
import GV_SettingsPanel from '@/components/views/GV_SettingsPanel';
import GV_NotificationBanner from '@/components/views/GV_NotificationBanner';
import GV_SetupWizard from '@/components/views/GV_SetupWizard';
import GV_ShareModal from '@/components/views/GV_ShareModal';
import GV_BarcodeScanner from '@/components/views/GV_BarcodeScanner';
import UV_Landing from '@/components/views/UV_Landing';
import UV_Dashboard from '@/components/views/UV_Dashboard';
import UV_ActivityTracking_Transportation from '@/components/views/UV_ActivityTracking_Transportation';
import UV_ActivityTracking_Energy from '@/components/views/UV_ActivityTracking_Energy';
import UV_ActivityTracking_Waste from '@/components/views/UV_ActivityTracking_Waste';
import UV_ActivityTracking_Diet from '@/components/views/UV_ActivityTracking_Diet';
import UV_ActivityTracking_Shopping from '@/components/views/UV_ActivityTracking_Shopping';
import UV_GoalSetting from '@/components/views/UV_GoalSetting';
import UV_Challenges from '@/components/views/UV_Challenges';
import UV_EducationalContent_Tips from '@/components/views/UV_EducationalContent_Tips';
import UV_EducationalContent_Impact from '@/components/views/UV_EducationalContent_Impact';
import UV_EducationalContent_News from '@/components/views/UV_EducationalContent_News';
import UV_Community_Forums from '@/components/views/UV_Community_Forums';
import UV_Community_Leaderboards from '@/components/views/UV_Community_Leaderboards';
import UV_Profile from '@/components/views/UV_Profile';
import UV_BusinessDashboard from '@/components/views/UV_BusinessDashboard';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
});

const LoadingSpinner: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
  </div>
);

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isAuthenticated = useAppStore(state => state.auth_state.authentication_status.is_authenticated);
  const isLoading = useAppStore(state => state.auth_state.authentication_status.is_loading);
  
  if (isLoading) return <LoadingSpinner />;
  if (!isAuthenticated) return <Navigate to="/" replace />;
  
  return <>{children}</>;
};

const App: React.FC = () => {
  const isLoading = useAppStore(state => state.auth_state.authentication_status.is_loading);
  const error_message = useAppStore(state => state.auth_state.error_message);
  const initializeAuth = useAppStore(state => state.initialize_auth);
  const isSetupComplete = useAppStore(state => state.user_impact.daily_score > 0); // Simple check for setup completion

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  if (isLoading) return <LoadingSpinner />;

  return (
    <Router>
      <QueryClientProvider client={queryClient}>
        <div className="min-h-screen flex flex-col bg-gray-50">
          <GV_TopNav />
          
          <main className="flex-1 overflow-y-auto">
            <Routes>
              {/* Public Routes */}
              <Route 
                path="/" 
                element={<UV_Landing />} 
              />
              
              {/* Protected Routes */}
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute>
                    <UV_Dashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/track/transport" 
                element={
                  <ProtectedRoute>
                    <UV_ActivityTracking_Transportation />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/track/energy" 
                element={
                  <ProtectedRoute>
                    <UV_ActivityTracking_Energy />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/track/waste" 
                element={
                  <ProtectedRoute>
                    <UV_ActivityTracking_Waste />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/track/diet" 
                element={
                  <ProtectedRoute>
                    <UV_ActivityTracking_Diet />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/track/shopping" 
                element={
                  <ProtectedRoute>
                    <UV_ActivityTracking_Shopping />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/goals" 
                element={
                  <ProtectedRoute>
                    <UV_GoalSetting />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/challenges" 
                element={
                  <ProtectedRoute>
                    <UV_Challenges />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/learn/tips" 
                element={
                  <ProtectedRoute>
                    <UV_EducationalContent_Tips />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/learn/impact" 
                element={
                  <ProtectedRoute>
                    <UV_EducationalContent_Impact />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/learn/news" 
                element={
                  <ProtectedRoute>
                    <UV_EducationalContent_News />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/community/forums" 
                element={
                  <ProtectedRoute>
                    <UV_Community_Forums />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/community/leaderboards" 
                element={
                  <ProtectedRoute>
                    <UV_Community_Leaderboards />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/profile" 
                element={
                  <ProtectedRoute>
                    <UV_Profile />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/business" 
                element={
                  <ProtectedRoute>
                    <UV_BusinessDashboard />
                  </ProtectedRoute>
                } 
              />
              
              {/* Fallback for authenticated users */}
              <Route 
                path="*" 
                element={<Navigate to="/dashboard" replace />} 
              />
            </Routes>
          </main>
          
          <GV_Footer />
          
          {/* Global Modals */}
          {error_message && <GV_LoginModal />}
          <GV_SettingsPanel />
          <GV_NotificationBanner />
          {!isSetupComplete && <GV_SetupWizard />}
          <GV_ShareModal />
          <GV_BarcodeScanner />
        </div>
      </QueryClientProvider>
    </Router>
  );
};

export default App;