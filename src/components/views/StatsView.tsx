import React from 'react';
import type { Project } from '../../types';
import { BarChart2, CheckCircle2, Clock, AlertTriangle, Layers } from 'lucide-react';

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

  const statusBreakdown = [
    { label: 'Terminé',    count: projects.filter(p => p.status === 'Terminé').length,    color: 'bg-emerald-500' },
    { label: 'En cours',   count: projects.filter(p => p.status === 'En cours').length,   color: 'bg-(--brand-secondary)' },
    { label: 'En révision',count: projects.filter(p => p.status === 'En révision').length, color: 'bg-amber-400' },
    { label: 'Nouveau',    count: projects.filter(p => p.status === 'Nouveau').length,    color: 'bg-slate-400' },
  ];

  return (
    <div className="p-8 max-w-6xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-y-auto h-full scrollbar-hide">

      {/* Page header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-(--surface-mid) flex items-center justify-center">
          <BarChart2 size={20} className="text-(--brand-primary)" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-(--notion-text)">Statistiques de l'équipe</h1>
          <p className="text-sm text-(--notion-text-light)">Vue d'ensemble des performances</p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">

        {/* Total */}
        <div
          className="p-6 bg-(--notion-sidebar) border border-(--notion-border) rounded-xl transition-all duration-200 hover:shadow-(--shadow-elevated) cursor-default"
          style={{ boxShadow: 'var(--shadow-card)' }}
        >
          <div className="flex items-start justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-(--surface-mid) flex items-center justify-center">
              <Layers size={18} className="text-(--brand-primary)" />
            </div>
          </div>
          <div className="text-3xl font-bold text-(--notion-text) mb-1">{total}</div>
          <div className="text-sm font-semibold text-(--notion-text)">Total Projets</div>
          <div className="mt-1 text-xs text-(--notion-text-light)">Tous les projets actifs</div>
        </div>

        {/* Terminés */}
        <div
          className="p-6 bg-(--notion-sidebar) border border-(--notion-border) rounded-xl transition-all duration-200 hover:shadow-(--shadow-elevated) cursor-default"
          style={{ boxShadow: 'var(--shadow-card)' }}
        >
          <div className="flex items-start justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
              <CheckCircle2 size={18} className="text-emerald-600" />
            </div>
          </div>
          <div className="text-3xl font-bold text-(--notion-text) mb-1">{completed}</div>
          <div className="text-sm font-semibold text-(--notion-text)">Terminés</div>
          <div className="mt-1 text-xs text-(--notion-text-light)">
            {Math.round((completed / total) * 100 || 0)}% de réussite
          </div>
        </div>

        {/* En cours */}
        <div
          className="p-6 bg-(--notion-sidebar) border border-(--notion-border) rounded-xl transition-all duration-200 hover:shadow-(--shadow-elevated) cursor-default"
          style={{ boxShadow: 'var(--shadow-card)' }}
        >
          <div className="flex items-start justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-(--surface-high) flex items-center justify-center">
              <Clock size={18} className="text-(--brand-secondary)" />
            </div>
          </div>
          <div className="text-3xl font-bold text-(--notion-text) mb-1">{inProgress}</div>
          <div className="text-sm font-semibold text-(--notion-text)">En cours</div>
          <div className="mt-1 text-xs text-(--notion-text-light)">Action requise immédiate</div>
        </div>

        {/* Urgences */}
        <div
          className="p-6 bg-(--notion-sidebar) border border-(--notion-border) rounded-xl transition-all duration-200 hover:shadow-(--shadow-elevated) cursor-default"
          style={{ boxShadow: 'var(--shadow-card)' }}
        >
          <div className="flex items-start justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center">
              <AlertTriangle size={18} className="text-rose-600" />
            </div>
          </div>
          <div className="text-3xl font-bold text-(--notion-text) mb-1">{urgent}</div>
          <div className="text-sm font-semibold text-(--notion-text)">Urgences</div>
          <div className="mt-1 text-xs text-(--notion-text-light)">Priorité critique</div>
        </div>
      </div>

      {/* Bottom section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Status breakdown */}
        <div
          className="p-6 bg-(--notion-sidebar) border border-(--notion-border) rounded-xl"
          style={{ boxShadow: 'var(--shadow-card)' }}
        >
          <h3 className="text-sm font-bold text-(--notion-text) mb-6 uppercase tracking-wider">
            Répartition par Statut
          </h3>
          <div className="space-y-4">
            {statusBreakdown.map(({ label, count, color }) => (
              <div key={label} className="space-y-1.5">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-(--notion-text)">{label}</span>
                  <span className="text-(--notion-text-light)">
                    {count} ({Math.round((count / total) * 100 || 0)}%)
                  </span>
                </div>
                <div className="w-full h-2 bg-(--surface-low) rounded-full overflow-hidden">
                  <div
                    className={`h-full ${color} rounded-full transition-all duration-700`}
                    style={{ width: `${(count / total) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Type breakdown */}
        <div
          className="p-6 bg-(--notion-sidebar) border border-(--notion-border) rounded-xl"
          style={{ boxShadow: 'var(--shadow-card)' }}
        >
          <h3 className="text-sm font-bold text-(--notion-text) mb-6 uppercase tracking-wider">
            Répartition par Type
          </h3>
          {types.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-(--notion-text-light) text-sm">
              Aucun projet disponible
            </div>
          ) : (
            <div className="space-y-3">
              {types.map(([type, count]) => (
                <div
                  key={type}
                  className="flex items-center justify-between px-4 py-3 rounded-lg bg-(--surface-low) border border-(--notion-border) hover:bg-(--notion-hover) transition-colors"
                >
                  <span className="text-sm font-medium text-(--notion-text)">{type}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-(--brand-secondary) bg-(--surface-high) px-2 py-0.5 rounded-full">
                      {Math.round((count / total) * 100 || 0)}%
                    </span>
                    <span className="text-xs text-(--notion-text-light) w-5 text-right">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StatsView;
