import React from 'react';
import ProjectForm from './components/ProjectForm';
import Dashboard from './components/Dashboard';
import { Layout } from 'lucide-react';

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg text-white">
              <Layout size={24} />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">FlowLive</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Side: Form */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <ProjectForm />
              <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
                <p className="text-sm text-blue-700 leading-relaxed">
                  <strong>How it works:</strong> Fill out the form to submit a project. It will appear instantly on the live dashboard for everyone to see.
                </p>
              </div>
            </div>
          </div>

          {/* Right Side: Dashboard */}
          <div className="lg:col-span-2">
            <Dashboard />
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
