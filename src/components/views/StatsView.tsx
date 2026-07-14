import React, { useState } from 'react';
import type { Project, User } from '../../types';
import { BarChart2, CheckCircle2, Clock, AlertTriangle, Layers, TrendingUp, Star, Zap, Target, Users, X } from 'lucide-react';

interface StatsViewProps {
  projects: Project[];
  users: User[];
}

const StatsView: React.FC<StatsViewProps> = ({ projects, users }) => {
  const [selectedCollaboratorId, setSelectedCollaboratorId] = useState<string | null>(null);
  const [hoursPerDay, setHoursPerDay] = useState(7);

  // ── Helpers ──────────────────────────────────────────────────────────────────
  const getAssignedId = (assignedTo: Project['assignedTo']): string | undefined => {
    if (!assignedTo) return undefined;
    if (typeof assignedTo === 'string') return assignedTo;
    return assignedTo._id || assignedTo.id;
  };

  // Users who appear in at least one project (for the filter bar)
  const usersWithProjects = users.filter(u => {
    const uid = u._id || u.id || '';
    return uid && projects.some(p => getAssignedId(p.assignedTo) === uid);
  });

  // The slice of projects that drives ALL stats
  const filteredProjects = selectedCollaboratorId
    ? projects.filter(p => getAssignedId(p.assignedTo) === selectedCollaboratorId)
    : projects;

  const selectedUser = selectedCollaboratorId
    ? users.find(u => (u._id || u.id) === selectedCollaboratorId)
    : null;

  // ── Core metrics (all based on filteredProjects) ──────────────────────────
  const total      = filteredProjects.length;
  const completed  = filteredProjects.filter(p => p.status === 'Terminé').length;
  const inProgress = filteredProjects.filter(p => p.status === 'En cours').length;
  const delivered  = filteredProjects.filter(p => p.status === 'Livrée').length;
  const inReview   = filteredProjects.filter(p => p.status === 'Retour').length;
  const urgent     = filteredProjects.filter(p => p.urgent).length;
  const nouveau    = filteredProjects.filter(p => p.status === 'Nouveau').length;

  const completionRate = Math.round((completed / total) * 100 || 0);
  const activeRate     = Math.round(((inProgress + delivered + inReview) / total) * 100 || 0);

  const typeCounts = filteredProjects.reduce((acc, p) => {
    if (p.type) acc[p.type] = (acc[p.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const types = Object.entries(typeCounts).sort((a, b) => b[1] - a[1]);

  const statusBreakdown = [
    { label: 'Terminé',  count: completed,  color: 'bg-emerald-500', textColor: 'text-emerald-700', bg: 'bg-emerald-50' },
    { label: 'En cours', count: inProgress, color: 'bg-[var(--brand-secondary)]', textColor: 'text-[var(--brand-secondary)]', bg: 'bg-[var(--surface-high)]' },
    { label: 'Livrée',   count: delivered,  color: 'bg-purple-500',  textColor: 'text-purple-700',   bg: 'bg-purple-50' },
    { label: 'Retour',   count: inReview,   color: 'bg-amber-400',  textColor: 'text-amber-700',   bg: 'bg-amber-50' },
    { label: 'Nouveau',  count: nouveau,    color: 'bg-[var(--notion-text-light)]', textColor: 'text-[var(--notion-text-light)]', bg: 'bg-[var(--surface-low)]' },
  ];

  const highPriority = filteredProjects.filter(p => p.priority === 'Haute').length;
  const medPriority  = filteredProjects.filter(p => p.priority === 'Moyenne').length;
  const lowPriority  = filteredProjects.filter(p => p.priority === 'Basse').length;
  const overdue      = filteredProjects.filter(p =>
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

  // ── Productivité ─────────────────────────────────────────────────────────────
  const totalActive = total - completed;
  const deadlineRespectRate = totalActive > 0
    ? Math.round(((totalActive - overdue) / totalActive) * 100)
    : 100;

  const now = new Date();
  const inSevenDays = new Date(now); inSevenDays.setDate(now.getDate() + 7);
  const dueSoon = filteredProjects.filter(p =>
    p.status !== 'Terminé' && p.deadline &&
    new Date(p.deadline) >= now && new Date(p.deadline) <= inSevenDays
  ).length;

  const activeProjects = filteredProjects.filter(p => p.status !== 'Terminé');
  const workloadData = users
    .map(user => {
      const uid = user._id || user.id || '';
      const assigned = activeProjects.filter(p => getAssignedId(p.assignedTo) === uid);
      const totalHours = assigned.reduce((s, p) => s + (p.estimatedHours || 0), 0);
      return { user, totalHours, count: assigned.length };
    })
    .filter(w => w.count > 0)
    .sort((a, b) => b.totalHours - a.totalHours);

  const maxWorkloadHours = workloadData.length > 0
    ? Math.max(...workloadData.map(w => w.totalHours), hoursPerDay)
    : hoursPerDay;
  const activeWithHours = activeProjects.filter(p => p.estimatedHours && p.estimatedHours > 0).length;

  // ── Retour qualité (ratings) ──────────────────────────────────────────────
  const ratedProjects = filteredProjects.filter(p => p.status === 'Terminé' && p.rating != null);
  const avgRating = ratedProjects.length > 0
    ? ratedProjects.reduce((s, p) => s + (p.rating || 0), 0) / ratedProjects.length
    : 0;
  const ratingDist = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: ratedProjects.filter(p => p.rating === star).length,
  }));
  const unratedCompleted = filteredProjects.filter(p => p.status === 'Terminé' && !p.rating).length;

  return (
    <div className="p-6 max-w-6xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-y-auto scrollbar-thin">

      {/* Page header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--surface-mid)] flex items-center justify-center">
            <BarChart2 size={20} className="text-[var(--brand-primary)]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--notion-text)]">Statistiques de l'équipe</h1>
            <p className="text-sm text-[var(--notion-text-light)]">
              {selectedUser ? `Vue filtrée — ${selectedUser.name}` : 'Analyse approfondie des performances'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-[var(--notion-text-light)]">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Temps réel
        </div>
      </div>

      {/* ── Collaborator filter bar ── */}
      {usersWithProjects.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap mb-6 p-3 bg-[var(--surface-low)] rounded-xl border border-[var(--notion-border)]">
          <span className="text-[10px] font-bold text-[var(--notion-text-light)] uppercase tracking-widest shrink-0">
            Collaborateur
          </span>

          {/* "Tous" pill */}
          <button
            onClick={() => setSelectedCollaboratorId(null)}
            className={`flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-semibold transition-all ${
              !selectedCollaboratorId
                ? 'bg-[var(--brand-secondary)] text-white shadow-sm'
                : 'bg-[var(--notion-sidebar)] text-[var(--notion-text-light)] border border-[var(--notion-border)] hover:bg-[var(--notion-hover)]'
            }`}
          >
            <Users size={10} />
            Tous
          </button>

          {/* One pill per collaborator */}
          {usersWithProjects.map(user => {
            const uid = user._id || user.id || '';
            const isActive = selectedCollaboratorId === uid;
            const userProjects = projects.filter(p => getAssignedId(p.assignedTo) === uid);
            const userDone = userProjects.filter(p => p.status === 'Terminé').length;
            return (
              <button
                key={uid}
                onClick={() => setSelectedCollaboratorId(isActive ? null : uid)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold transition-all ${
                  isActive
                    ? 'bg-[var(--brand-secondary)] text-white shadow-sm'
                    : 'bg-[var(--notion-sidebar)] text-[var(--notion-text)] border border-[var(--notion-border)] hover:bg-[var(--notion-hover)]'
                }`}
              >
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black uppercase shrink-0 ${isActive ? 'bg-white/25 text-white' : 'bg-[var(--surface-high)] text-[var(--brand-secondary)]'}`}>
                  {user.name.charAt(0)}
                </span>
                <span>{user.name}</span>
                <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ml-0.5 ${isActive ? 'bg-white/20 text-white' : 'bg-[var(--surface-low)] text-[var(--notion-text-light)]'}`}>
                  {userDone}/{userProjects.length}
                </span>
                {isActive && <X size={10} className="ml-0.5 opacity-80" />}
              </button>
            );
          })}
        </div>
      )}

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="p-5 bg-[var(--notion-sidebar)] border border-[var(--notion-border)] rounded-xl transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-elevated)] cursor-default" style={{ boxShadow: 'var(--shadow-card)' }}>
          <div className="flex items-start justify-between mb-3">
            <div className="w-9 h-9 rounded-lg bg-[var(--surface-mid)] flex items-center justify-center">
              <Layers size={16} className="text-[var(--brand-primary)]" />
            </div>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">+{total}</span>
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

        {/* Completion gauge — 1/3 */}
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
              ? "Excellente dynamique — continuez ainsi."
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

      {/* Retour qualité */}
      {completed > 0 && (
        <div className="p-6 bg-[var(--notion-sidebar)] border border-[var(--notion-border)] rounded-xl mb-4" style={{ boxShadow: 'var(--shadow-card)' }}>
          <div className="flex items-center gap-2 mb-5">
            <Star size={14} className="text-amber-400" fill="currentColor" />
            <h3 className="text-[10px] font-bold text-[var(--notion-text-light)] uppercase tracking-widest">Retour qualité — Appréciation des tâches terminées</h3>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="flex flex-col items-center justify-center text-center p-4 bg-[var(--surface-low)] rounded-xl border border-[var(--notion-border)]">
              <div className="flex items-center gap-1 mb-2">
                {[1, 2, 3, 4, 5].map(s => (
                  <Star
                    key={s}
                    size={20}
                    className={s <= Math.round(avgRating) ? 'text-amber-400' : 'text-[var(--notion-border)]'}
                    fill={s <= Math.round(avgRating) ? 'currentColor' : 'none'}
                  />
                ))}
              </div>
              <div className="text-3xl font-black text-[var(--notion-text)] leading-none mb-1">
                {ratedProjects.length > 0 ? avgRating.toFixed(1) : '—'}
              </div>
              <div className="text-[10px] font-bold text-[var(--notion-text-light)] uppercase tracking-widest mb-3">Note moyenne</div>
              <div className="flex gap-3 text-[10px]">
                <span className="text-emerald-600 font-bold">{ratedProjects.length} noté{ratedProjects.length > 1 ? 's' : ''}</span>
                {unratedCompleted > 0 && (
                  <span className="text-[var(--notion-text-light)]">{unratedCompleted} sans note</span>
                )}
              </div>
            </div>

            <div className="lg:col-span-2 space-y-2.5">
              {ratingDist.map(({ star, count }) => {
                const pct = ratedProjects.length > 0 ? Math.round((count / ratedProjects.length) * 100) : 0;
                return (
                  <div key={star} className="flex items-center gap-3">
                    <div className="flex items-center gap-0.5 w-20 shrink-0">
                      {[1, 2, 3, 4, 5].map(s => (
                        <Star key={s} size={10} className={s <= star ? 'text-amber-400' : 'text-[var(--notion-border)]'} fill={s <= star ? 'currentColor' : 'none'} />
                      ))}
                    </div>
                    <div className="flex-1 bg-[var(--surface-low)] h-2 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-400 rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-[10px] font-bold text-[var(--notion-text-light)] w-14 text-right">{count} ({pct}%)</span>
                  </div>
                );
              })}
              {ratedProjects.length === 0 && (
                <p className="text-sm text-[var(--notion-text-light)] text-center py-4">
                  Aucune appréciation donnée — les chefs de produit peuvent noter les tâches terminées depuis la vue Pipeline.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Productivité */}
      {total > 0 && (
        <div className="p-6 bg-[var(--notion-sidebar)] border border-[var(--notion-border)] rounded-xl mb-4" style={{ boxShadow: 'var(--shadow-card)' }}>
          <div className="flex items-center gap-2 mb-5">
            <Zap size={14} className="text-[var(--brand-secondary)]" />
            <h3 className="text-[10px] font-bold text-[var(--notion-text-light)] uppercase tracking-widest">Productivité</h3>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Left: Réalisation + Respect Deadline */}
            <div className="space-y-4">

              {/* Réalisation */}
              <div className="p-4 bg-[var(--surface-low)] rounded-xl border border-[var(--notion-border)]">
                <div className="flex items-center gap-1.5 mb-3">
                  <Target size={11} className="text-emerald-600" />
                  <span className="text-[9px] font-bold text-[var(--notion-text-light)] uppercase tracking-widest">Réalisation</span>
                </div>
                <div className="flex items-end gap-2 mb-2">
                  <span className="text-3xl font-black text-[var(--notion-text)] leading-none">{completed}</span>
                  <span className="text-sm text-[var(--notion-text-light)] pb-0.5">/ {total} projets</span>
                </div>
                <div className="w-full h-2 bg-[var(--notion-border)] rounded-full overflow-hidden mb-1.5">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${completionRate}%`, transition: 'width 1s ease-out' }} />
                </div>
                <div className="flex justify-between text-[10px] font-bold">
                  <span className="text-emerald-600">{completionRate}% terminés</span>
                  <span className="text-[var(--notion-text-light)]">{totalActive} en cours</span>
                </div>
              </div>

              {/* Respect Deadline */}
              <div className="p-4 bg-[var(--surface-low)] rounded-xl border border-[var(--notion-border)]">
                <div className="flex items-center gap-1.5 mb-3">
                  <Clock size={11} className={overdue > 0 ? 'text-rose-500' : 'text-emerald-600'} />
                  <span className="text-[9px] font-bold text-[var(--notion-text-light)] uppercase tracking-widest">Respect Deadline</span>
                </div>
                {totalActive === 0 ? (
                  <p className="text-[11px] text-[var(--notion-text-light)]">Aucun projet actif</p>
                ) : (
                  <>
                    <div className="flex items-end gap-2 mb-2">
                      <span className={`text-3xl font-black leading-none ${
                        deadlineRespectRate >= 80 ? 'text-emerald-600' :
                        deadlineRespectRate >= 60 ? 'text-amber-500' : 'text-rose-500'
                      }`}>
                        {deadlineRespectRate}%
                      </span>
                      <span className="text-[10px] text-[var(--notion-text-light)] pb-0.5">on-track</span>
                    </div>
                    <div className="w-full h-2 bg-[var(--notion-border)] rounded-full overflow-hidden mb-2">
                      <div
                        className={`h-full rounded-full ${
                          deadlineRespectRate >= 80 ? 'bg-emerald-500' :
                          deadlineRespectRate >= 60 ? 'bg-amber-400' : 'bg-rose-500'
                        }`}
                        style={{ width: `${deadlineRespectRate}%`, transition: 'width 1s ease-out' }}
                      />
                    </div>
                    <div className="flex gap-3 flex-wrap text-[10px] font-semibold">
                      {overdue > 0 && <span className="text-rose-500">{overdue} en retard</span>}
                      {dueSoon > 0 && <span className="text-amber-500">{dueSoon} échéance &lt;7j</span>}
                      {overdue === 0 && dueSoon === 0 && <span className="text-emerald-600">Tout est on-track ✓</span>}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Right: Charge de travail équipe */}
            <div className="lg:col-span-2 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-1.5">
                  <Users size={11} className="text-[var(--brand-secondary)]" />
                  <span className="text-[9px] font-bold text-[var(--notion-text-light)] uppercase tracking-widest">Charge de travail équipe</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-[var(--notion-text-light)]">Capacité</span>
                  <input
                    type="number"
                    min={1}
                    max={24}
                    value={hoursPerDay}
                    onChange={e => setHoursPerDay(Math.max(1, Math.min(24, Number(e.target.value))))}
                    className="w-12 text-center text-[11px] font-bold text-[var(--notion-text)] bg-[var(--surface-low)] border border-[var(--notion-border)] rounded-md px-1 py-0.5 outline-none focus:border-[var(--brand-secondary)] [appearance:textfield]"
                  />
                  <span className="text-[10px] text-[var(--notion-text-light)]">h / jour</span>
                </div>
              </div>

              {workloadData.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center py-8 text-[var(--notion-text-light)]">
                  <Users size={28} className="mb-2 opacity-30" />
                  <p className="text-sm font-medium">Aucune assignation active</p>
                  <p className="text-xs mt-1 opacity-70">Assignez des collaborateurs aux projets pour voir leur charge.</p>
                </div>
              ) : (
                <div className="flex-1 space-y-3">
                  {workloadData.map(({ user, totalHours, count }) => {
                    const days = hoursPerDay > 0 ? totalHours / hoursPerDay : 0;
                    const pct = maxWorkloadHours > 0 ? Math.min((totalHours / maxWorkloadHours) * 100, 100) : 0;
                    const level = days <= 5 ? 'green' : days <= 10 ? 'amber' : 'red';
                    return (
                      <div key={user._id || user.id} className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-full bg-[var(--surface-high)] text-[var(--brand-secondary)] flex items-center justify-center text-[10px] font-black uppercase shrink-0">
                          {user.name.charAt(0)}
                        </div>
                        <span className="text-xs font-semibold text-[var(--notion-text)] w-28 truncate shrink-0">{user.name}</span>
                        <div className="flex-1 h-3 bg-[var(--surface-low)] rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-700 ${
                              level === 'green' ? 'bg-emerald-500' :
                              level === 'amber' ? 'bg-amber-400' : 'bg-rose-500'
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <div className="shrink-0 text-right min-w-[72px]">
                          <span className="text-[11px] font-bold text-[var(--notion-text)]">
                            {totalHours > 0 ? `${totalHours}h` : `${count} proj.`}
                          </span>
                          {totalHours > 0 && (
                            <span className="text-[10px] text-[var(--notion-text-light)] ml-1">
                              · {days % 1 === 0 ? days : days.toFixed(1)}j
                            </span>
                          )}
                        </div>
                        <span className={`text-xs font-black shrink-0 w-4 text-center ${
                          level === 'green' ? 'text-emerald-500' :
                          level === 'amber' ? 'text-amber-500' : 'text-rose-500'
                        }`}>
                          {level === 'green' ? '✓' : level === 'amber' ? '~' : '!'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="flex items-center gap-4 mt-4 pt-3 border-t border-[var(--notion-border)]">
                {[
                  { cls: 'bg-emerald-500', label: '≤ 5 jours' },
                  { cls: 'bg-amber-400',   label: '5 – 10 jours' },
                  { cls: 'bg-rose-500',    label: '> 10 jours' },
                ].map(({ cls, label }) => (
                  <div key={label} className="flex items-center gap-1.5 text-[10px]">
                    <span className={`w-2.5 h-2.5 rounded-full inline-block ${cls}`} />
                    <span className="text-[var(--notion-text-light)]">{label}</span>
                  </div>
                ))}
                <span className="ml-auto text-[10px] text-[var(--notion-text-light)]">
                  {activeWithHours}/{activeProjects.length} projets avec heures estimées
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

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
                <div key={type} className="flex items-center justify-between px-4 py-3 rounded-xl bg-[var(--surface-low)] border border-[var(--notion-border)] hover:bg-[var(--notion-hover)] transition-colors">
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
          <p className="text-sm font-medium">
            {selectedCollaboratorId ? 'Aucun projet assigné à ce collaborateur' : 'Aucun projet à analyser'}
          </p>
          <p className="text-xs mt-1">
            {selectedCollaboratorId
              ? <button onClick={() => setSelectedCollaboratorId(null)} className="underline hover:text-[var(--notion-text)] transition-colors">Voir tous les projets</button>
              : 'Les statistiques apparaîtront ici une fois des projets créés.'}
          </p>
        </div>
      )}
    </div>
  );
};

export default StatsView;
