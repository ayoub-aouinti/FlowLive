import React from 'react';
import ProjectForm from './components/ProjectForm';
import Dashboard from './components/Dashboard';
import Login from './components/Login';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Layout, LogOut, User as UserIcon } from 'lucide-react';

const AppContent: React.FC = () => {
  const { user, logout, loading } = useAuth();

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!user) return <Login />;

  const canAddProjects = user.role === 'admin' || user.role === 'superadmin';

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-lg text-white">
                <Layout size={24} />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">FlowLive</h1>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-full">
                <UserIcon size={16} className="text-slate-500" />
                <span className="text-sm font-bold text-slate-700">{user.name}</span>
                <span className="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded-full uppercase">{user.role}</span>
              </div>
              <button 
                onClick={logout}
                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                title="Déconnexion"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className={`grid grid-cols-1 ${canAddProjects ? 'lg:grid-cols-3' : ''} gap-8`}>
          {/* Left Side: Form (Restricted) */}
          {canAddProjects && (
            <div className="lg:col-span-1">
              <div className="sticky top-24">
                <ProjectForm />
                <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
                  <p className="text-sm text-blue-700 leading-relaxed">
                    <strong>Mode {user.role}:</strong> En tant qu'admin, vous pouvez assigner des instances aux utilisateurs.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Right Side: Dashboard */}
          <div className={canAddProjects ? 'lg:col-span-2' : 'col-span-1'}>
            <Dashboard />
          </div>
        </div>
      </main>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
