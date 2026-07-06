import React from 'react';
import type { Project } from '../../types';
import { BarChart2, CheckCircle2, Clock, AlertTriangle, Layers, TrendingUp } from 'lucide-react';

interface StatsViewProps {
  projects: Project[];
}

const StatsView: React.FC<StatsViewProps> = ({ projects }) => {
  const total = projects.length;
  const completed = projects.filter(p => p.status === 'Terminé').length;
  const inProgress = projects.filter(p => p.status === 'En cours').length;
  const inReview = projects.filter(p => p.status === 'En révision').length;
  const urgent = projects.filter(p => p.urgent).length;
  const nouveau = projects.filter(p => p.status === 'Nouveau').length;

  const completionRate = Math.round((completed / total) * 100 || 0);
  const activeRate = Math.round(((inProgress + inReview) / total) * 100 || 0);

  const typeCounts = projects.reduce((acc, p) => {
    if (p.type) acc[p.type] = (acc[p.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const types = Object.entries(typeCounts).sort((a, b) => b[1] - a[1]);

  const statusBreakdown = [
    { label: 'Terminé',     count: completed,  color: 'bg-emerald-500', textColor: 'text-emerald-700', bg: 'bg-emerald-50' },
    { label: 'En cours',    count: inProgress,  color: 'bg-[var(--brand-secondary)]', textColor: 'text-[var(--brand-secondary)]', bg: 'bg-[var(--surface-high)]' },
    { label: 'En révision', count: inReview,    color: 'bg-amber-400',  textColor: 'text-amber-700',   bg: 'bg-amber-50' },
    { label: 'Nouveau',     count: nouveau,     color: 'bg-[var(--notion-text-light)]', textColor: 'text-[var(--notion-text-light)]', bg: 'bg-[var(--surface-low)]' },
  ];

  const highPriority = projects.filter(p => p.priority === 'Haute').length;
  const medPriority  = projects.filter(p => p.priority === 'Moyenne').length;
  const lowPriority  = projects.filter(p => p.priority === 'Basse').length;
  const overdue = projects.filter(p =>
    p.status !== 'Terminé' && p.deadline && new Date(p.deadline) < new Date()
  ).length;

  // SVG circular gauge
  const r = 54;
  const circumference = 2 * Math.PI * r;
  const dashoffset = circumference * (1 - completionRate / 100);

  const typeColors = [
    'bg-[var(--brand-primary)] text-white',
    'bg-[var(--brand-secondary)] text-white',
    'bg-emerald-500 text-white',
    'bg-amber-400 text-white',
    'bg-purple-500 text-white',
    'bg-rose-500 text-white',
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-y-auto scrollbar-thin">

      {/* Page header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--surface-mid)] flex items-center justify-center">
            <BarChart2 size={20} className="text-[var(--brand-primary)]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--notion-text)]">Statistiques de l'équipe</h1>
            <p className="text-sm text-[var(--notion-text-light)]">Analyse approfondie des performances</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-[var(--notion-text-light)]">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Temps réel
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="p-5 bg-[var(--notion-sidebar)] border border-[var(--notion-border)] rounded-xl transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-elevated)] cursor-default" style={{ boxShadow: 'var(--shadow-card)' }}>
          <div className="flex items-start justify-between mb-3">
            <div className="w-9 h-9 rounded-lg bg-[var(--surface-mid)] flex items-center justify-center">
              <Layers size={16} className="text-[var(--brand-primary)]" />
            </div>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">+{total > 0 ? total : 0}</span>
          </div>
          <div className="text-4xl font-black text-[var(--notion-text)] mb-0.5 leading-none">{total}</div>
          <div className="text-[10px] font-bold text-[var(--notion-text-light)] uppercase tracking-widest mt-1">Total Projets</div>
        </div>

        <div className="p-5 bg-[var(--notion-sidebar)] border border-[var(--notion-border)] rounded-xl transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-elevated)] cursor-default" style={{ boxShadow: 'var(--shadow-card)' }}>
          <div className="flex items-start justify-between mb-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center">
              <CheckCircle2 size={16} className="text-emerald-600" />
            </div>
            <span className="text-[10px] font-bold text-[var(--notion-text-light)] bg-[var(--surface-low)] px-2 py-0.5 rounded-full">Stable</span>
          </div>
          <div className="text-4xl font-black text-[var(--notion-text)] mb-0.5 leading-none">{completed}</div>
          <div className="text-[10px] font-bold text-[var(--notion-text-light)] uppercase tracking-widest mt-1">Terminés</div>
        </div>

        <div className="p-5 bg-[var(--notion-sidebar)] border border-[var(--notion-border)] rounded-xl transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-elevated)] cursor-default" style={{ boxShadow: 'var(--shadow-card)' }}>
          <div className="flex items-start justify-between mb-3">
            <div className="w-9 h-9 rounded-lg bg-[var(--surface-high)] flex items-center justify-center">
              <Clock size={16} className="text-[var(--brand-secondary)]" />
            </div>
            <span className="text-[10px] font-bold text-[var(--brand-primary)] bg-[var(--surface-mid)] px-2 py-0.5 rounded-full">{inProgress + inReview} actifs</span>
          </div>
          <div className="text-4xl font-black text-[var(--notion-text)] mb-0.5 leading-none">{inProgress}</div>
          <div className="text-[10px] font-bold text-[var(--notion-text-light)] uppercase tracking-widest mt-1">En Cours</div>
        </div>

        <div className={`p-5 bg-[var(--notion-sidebar)] border rounded-xl transition-all hover:-translate-y-0.5 cursor-default ${urgent > 0 ? 'border-rose-200 ring-1 ring-rose-100' : 'border-[var(--notion-border)]'}`} style={{ boxShadow: 'var(--shadow-card)' }}>
          <div className="flex items-start justify-between mb-3">
            <div className="w-9 h-9 rounded-lg bg-rose-50 flex items-center justify-center">
              <AlertTriangle size={16} className="text-rose-600" />
            </div>
            {urgent > 0 && <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">Action requise</span>}
          </div>
          <div className={`text-4xl font-black mb-0.5 leading-none ${urgent > 0 ? 'text-rose-600' : 'text-[var(--notion-text)]'}`}>{urgent}</div>
          <div className={`text-[10px] font-bold uppercase tracking-widest mt-1 ${urgent > 0 ? 'text-rose-500' : 'text-[var(--notion-text-light)]'}`}>Urgences</div>
        </div>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">

        {/* Status breakdown — 2/3 */}
        <div className="lg:col-span-2 p-6 bg-[var(--notion-sidebar)] border border-[var(--notion-border)] rounded-xl" style={{ boxShadow: 'var(--shadow-card)' }}>
          <h3 className="text-[10px] font-bold text-[var(--notion-text-light)] uppercase tracking-widest mb-5">Répartition par Statut</h3>
          <div className="space-y-4">
            {statusBreakdown.map(({ label, count, color, textColor, bg }) => (
              <div key={label} className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-[var(--notion-text)]">{label}</span>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold ${textColor} ${bg} px-2 py-0.5 rounded-full`}>{count}</span>
                    <span className="text-[var(--notion-text-light)] w-8 text-right">{Math.round((count / total) * 100 || 0)}%</span>
                  </div>
                </div>
                <div className="w-full h-2 bg-[var(--surface-low)] rounded-full overflow-hidden">
                  <div className={`h-full ${color} rounded-full`} style={{ width: `${(count / total) * 100}%`, transition: 'width 1s ease-out' }} />
                </div>
              </div>
            ))}
          </div>

          {/* Priority row */}
          <div className="mt-6 pt-5 border-t border-[var(--notion-border)]">
            <h3 className="text-[10px] font-bold text-[var(--notion-text-light)] uppercase tracking-widest mb-3">Par Priorité</h3>
            <div className="flex gap-3">
              {[
                { label: 'Haute',   count: highPriority, cls: 'bg-rose-50 text-rose-700 border-rose-200' },
                { label: 'Moyenne', count: medPriority,  cls: 'bg-amber-50 text-amber-700 border-amber-200' },
                { label: 'Basse',   count: lowPriority,  cls: 'bg-[var(--surface-low)] text-[var(--notion-text-light)] border-[var(--notion-border)]' },
                ...(overdue > 0 ? [{ label: 'En retard', count: overdue, cls: 'bg-rose-50 text-rose-600 border-rose-200' }] : []),
              ].map(({ label, count, cls }) => (
                <div key={label} className={`flex-1 text-center py-3 rounded-xl border ${cls}`}>
                  <div className="text-2xl font-black leading-none">{count}</div>
                  <div className="text-[9px] font-bold uppercase tracking-wider mt-1 opacity-70">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Productivity gauge — 1/3 */}
        <div className="p-6 bg-[var(--notion-sidebar)] border border-[var(--notion-border)] rounded-xl flex flex-col items-center justify-center text-center" style={{ boxShadow: 'var(--shadow-card)' }}>
          <h3 className="text-[10px] font-bold text-[var(--notion-text-light)] uppercase tracking-widest mb-5">Taux de complétion</h3>

          <div className="relative w-36 h-36 mb-5">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r={r} fill="transparent" stroke="var(--surface-low)" strokeWidth="10" />
              <circle
                cx="60" cy="60" r={r}
                fill="transparent"
                stroke="var(--brand-primary)"
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={dashoffset}
                style={{ transition: 'stroke-dashoffset 1.5s ease-out' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-black text-[var(--brand-primary)] leading-none">{completionRate}%</span>
              <span className="text-[9px] font-bold text-[var(--notion-text-light)] uppercase tracking-wider mt-1">
                {completionRate >= 70 ? 'OPTIMAL' : completionRate >= 40 ? 'CORRECT' : 'À AMÉLIORER'}
              </span>
            </div>
          </div>

          <p className="text-xs text-[var(--notion-text-light)] leading-relaxed mb-5 px-1">
            {completionRate >= 70
              ? 'Excellente dynamique d\'équipe — continuez ainsi.'
              : completionRate >= 40
              ? 'Progression dans la bonne direction.'
              : 'Focus requis sur les projets en cours.'}
          </p>

          <div className="w-full space-y-2 text-left">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-[var(--notion-text-light)] uppercase tracking-wider">Actifs</span>
              <span className="text-xs font-bold text-[var(--notion-text)]">{activeRate}%</span>
            </div>
            <div className="w-full bg-[var(--surface-low)] h-1.5 rounded-full overflow-hidden">
              <div className="bg-[var(--brand-secondary)] h-full rounded-full" style={{ width: `${activeRate}%`, transition: 'width 1s ease-out' }} />
            </div>

            <div className="flex justify-between items-center mt-3">
              <span className="text-[10px] font-bold text-[var(--notion-text-light)] uppercase tracking-wider">Urgent</span>
              <span className={`text-xs font-bold ${urgent > 0 ? 'text-rose-600' : 'text-[var(--notion-text)]'}`}>
                {total > 0 ? Math.round((urgent / total) * 100) : 0}%
              </span>
            </div>
            <div className="w-full bg-[var(--surface-low)] h-1.5 rounded-full overflow-hidden">
              <div className="bg-rose-500 h-full rounded-full" style={{ width: `${total > 0 ? (urgent / total) * 100 : 0}%`, transition: 'width 1s ease-out' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Type breakdown */}
      {types.length > 0 && (
        <div className="p-6 bg-[var(--notion-sidebar)] border border-[var(--notion-border)] rounded-xl" style={{ boxShadow: 'var(--shadow-card)' }}>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={14} className="text-[var(--brand-secondary)]" />
            <h3 className="text-[10px] font-bold text-[var(--notion-text-light)] uppercase tracking-widest">Répartition par Type</h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {types.map(([type, count], i) => {
              const percent = Math.round((count / total) * 100);
              return (
                <div key={type} className="flex items-center justify-between px-4 py-3 rounded-xl bg-[var(--surface-low)] border border-[var(--notion-border)] hover:bg-[var(--notion-hover)] transition-colors group">
                  <span className="text-sm font-semibold text-[var(--notion-text)] truncate">{type}</span>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${typeColors[i % typeColors.length]}`}>{percent}%</span>
                    <span className="text-xs text-[var(--notion-text-light)] font-bold">{count}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty state */}
      {total === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-[var(--notion-text-light)]">
          <BarChart2 size={40} className="mb-4 opacity-30" />
          <p className="text-sm font-medium">Aucun projet à analyser</p>
          <p className="text-xs mt-1">Les statistiques apparaîtront ici une fois des projets créés.</p>
        </div>
      )}
    </div>
  );
};

export default StatsView;
