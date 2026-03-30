import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import Login from './components/Login';
import SignupPage from './pages/SignupPage';
import PublicSignup from './pages/PublicSignup';
import ProjectLayout from './components/ProjectLayout';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NavigationProvider } from './context/NavigationProvider';
import { useNavigation } from './context/useNavigation';
import { CockpitView } from './components/views/CockpitView';
import { DepartmentSettings } from './components/views/DepartmentSettings';

const AuthenticatedApp: React.FC = () => {
  const { view } = useNavigation();

  const renderContent = () => {
    if (view === 'cockpit') return <div className="flex-1 overflow-auto bg-[--notion-bg] p-8 lg:p-12 transition-all"><CockpitView /></div>;
    if (view === 'dept_cockpit') return <div className="flex-1 overflow-auto bg-[--notion-bg] p-8 lg:p-12 transition-all"><DepartmentSettings /></div>;
    return <Dashboard />;
  };

  return (
    <ProjectLayout>
      {renderContent()}
    </ProjectLayout>
  );
};

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <Routes>
      <Route path="/signup/:token" element={<SignupPage />} />
      <Route path="/register" element={<PublicSignup />} />
      <Route 
        path="/login" 
        element={user ? <Navigate to="/" /> : <Login />} 
      />
      <Route 
        path="/*" 
        element={user ? <AuthenticatedApp /> : <Navigate to="/login" />} 
      />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <NavigationProvider>
        <AppContent />
      </NavigationProvider>
    </AuthProvider>
  );
};

export default App;
