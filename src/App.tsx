import React from 'react';
import Dashboard from './components/Dashboard';
import Login from './components/Login';
import ProjectLayout from './components/ProjectLayout';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NavigationProvider } from './context/NavigationProvider';
import { useNavigation } from './context/useNavigation';
import { CockpitView } from './components/views/CockpitView';
import { DepartmentSettings } from './components/views/DepartmentSettings';

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();
  const { view } = useNavigation();

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!user) return <Login />;

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
