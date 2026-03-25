import React from 'react';
import Sidebar from './Sidebar';

interface ProjectLayoutProps {
  children: React.ReactNode;
}

const ProjectLayout: React.FC<ProjectLayoutProps> = ({ children }) => {
  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0">
        {/* Cover Image */}
        <div className="h-48 w-full relative group">
          <div 
            className="w-full h-full bg-gradient-to-r from-[#2e4c6d] to-[#ad3b3b]"
            style={{ backgroundImage: 'linear-gradient(to right, #2e4c6d, #ad3b3b)' }}
          />
          <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          <button className="absolute bottom-4 right-8 bg-white/90 hover:bg-white text-[#37352f] text-xs px-2 py-1 rounded border border-[#ececeb] shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
            Changer la couverture
          </button>
        </div>

        {/* Content Area */}
        <div className="max-w-7xl mx-auto w-full px-12 pb-20 relative">
          {/* Icon Positioned Absolute */}
          <div className="absolute -top-12 left-12">
            <div className="text-8xl filter drop-shadow-sm select-none">📅</div>
          </div>

          <div className="pt-24">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProjectLayout;
