import React from 'react';
import Dashboard from './components/Dashboard';
import Login from './components/Login';
import ProjectLayout from './components/ProjectLayout';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NavigationProvider } from './context/NavigationProvider';

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!user) return <Login />;

  return (
    <ProjectLayout>
      <Dashboard />
    </ProjectLayout>
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
