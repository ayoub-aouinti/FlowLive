import React from 'react';
import type { Project } from '../../types';
import { BarChart2, CheckCircle2, Clock, AlertTriangle, PieChart } from 'lucide-react';

interface StatsViewProps {
  projects: Project[];
}

const StatsView: React.FC<StatsViewProps> = ({ projects }) => {
  const total = projects.length;
  const completed = projects.filter(p => p.status === 'Terminé').length;
  const inProgress = projects.filter(p => p.status === 'En cours' || p.status === 'En révision').length;
  const urgent = projects.filter(p => p.urgent).length;

  const typeCounts = projects.reduce((acc, p) => {
    acc[p.type] = (acc[p.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const types = Object.entries(typeCounts);

  return (
    <div className="p-8 max-w-6xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-y-auto h-full scrollbar-hide">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 bg-[#efefed] rounded-lg">
          <BarChart2 size={24} className="text-[#37352f]" />
        </div>
        <h1 className="text-3xl font-bold text-[#37352f]">Statistiques de l'équipe</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
        <div className="p-6 bg-white border border-[#ececeb] rounded-xl shadow-sm group hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-[#9b9a97] uppercase tracking-widest">Total Projets</span>
            <PieChart size={18} className="text-[#37352f]" />
          </div>
          <div className="text-4xl font-bold text-[#37352f]">{total}</div>
          <div className="mt-2 text-xs text-[#9b9a97]">Tous les projets actifs</div>
        </div>

        <div className="p-6 bg-white border border-[#ececeb] rounded-xl shadow-sm group hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-[#27ae60] uppercase tracking-widest">Terminés</span>
            <CheckCircle2 size={18} className="text-[#27ae60]" />
          </div>
          <div className="text-4xl font-bold text-[#37352f]">{completed}</div>
          <div className="mt-2 text-xs text-[#9b9a97]">{Math.round((completed / total) * 100 || 0)}% de réussite</div>
        </div>

        <div className="p-6 bg-white border border-[#ececeb] rounded-xl shadow-sm group hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-[#2383e2] uppercase tracking-widest">En cours</span>
            <Clock size={18} className="text-[#2383e2]" />
          </div>
          <div className="text-4xl font-bold text-[#37352f]">{inProgress}</div>
          <div className="mt-2 text-xs text-[#9b9a97]">Action requise immédiate</div>
        </div>

        <div className="p-6 bg-white border border-[#ececeb] rounded-xl shadow-sm group hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-[#eb5757] uppercase tracking-widest">Urgences</span>
            <AlertTriangle size={18} className="text-[#eb5757]" />
          </div>
          <div className="text-4xl font-bold text-[#37352f]">{urgent}</div>
          <div className="mt-2 text-xs text-[#9b9a97]">Priorité critique</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="p-6 bg-white border border-[#ececeb] rounded-xl shadow-sm">
          <h3 className="text-sm font-bold text-[#37352f] mb-6 uppercase tracking-wider">Répartition par Type</h3>
          <div className="space-y-4">
            {types.map(([type, count]) => (
              <div key={type} className="space-y-1.5">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-[#37352f]">{type}</span>
                  <span className="text-[#9b9a97]">{count}</span>
                </div>
                <div className="w-full h-2 bg-[#f7f7f5] rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[#37352f] rounded-full transition-all duration-1000"
                    style={{ width: `${(count / total) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 bg-white border border-[#ececeb] rounded-xl shadow-sm flex flex-col items-center justify-center text-center">
            <div className="w-32 h-32 rounded-full border-8 border-[#efefed] border-t-[#37352f] rotate-45 mb-4" />
            <p className="text-sm font-bold text-[#37352f]">Productivité de l'équipe</p>
            <p className="text-xs text-[#9b9a97] mt-1">Calculée sur les 30 derniers jours</p>
        </div>
      </div>
    </div>
  );
};

export default StatsView;
