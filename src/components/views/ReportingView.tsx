import React from 'react';
import type { Project } from '../../types';
import { FileText, AlertCircle, User as UserIcon, Tag, Box, Calendar } from 'lucide-react';

interface ReportingViewProps {
  projects: Project[];
}

const getPriorityClasses = (priority: string) => {
  switch (priority) {
    case 'Haute':   return 'bg-rose-100 text-rose-700';
    case 'Moyenne': return 'bg-amber-100 text-amber-700';
    case 'Basse':   return 'bg-slate-100 text-slate-600';
    default:        return 'bg-slate-100 text-slate-600';
  }
};

const getStatusClasses = (status: string) => {
  switch (status) {
    case 'Terminé':    return 'bg-emerald-100 text-emerald-700';
    case 'En cours':   return 'bg-(--surface-high) text-(--brand-secondary)';
    case 'En révision':return 'bg-amber-100 text-amber-700';
    case 'Nouveau':    return 'bg-slate-100 text-slate-600';
    default:           return 'bg-slate-100 text-slate-600';
  }
};

const ReportingView: React.FC<ReportingViewProps> = ({ projects }) => {
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const formatDateTime = (dateStr: string) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return `${d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })} ${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col bg-(--notion-bg) animate-in fade-in duration-500 select-none p-4">
      <div
        className="bg-(--notion-sidebar) rounded-xl border border-(--notion-border) overflow-hidden"
        style={{ boxShadow: 'var(--shadow-card)' }}
      >
        <div className="overflow-x-auto overflow-y-auto scrollbar-thin max-h-[calc(100vh-220px)]">
        <table className="w-full border-collapse border-spacing-0 min-w-[2000px]">
          <thead className="sticky top-0 z-20 bg-(--surface-low) border-b border-(--notion-border)">
            <tr>
              <th className="px-4 py-3 text-left text-[11px] font-bold text-(--notion-text-light) uppercase tracking-wider border-r border-(--notion-border) w-80">
                <div className="flex items-center gap-2">
                  <FileText size={14} />
                  Nom du projet (Produit)
                </div>
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-bold text-(--notion-text-light) uppercase tracking-wider border-r border-(--notion-border) w-48">
                <div className="flex items-center gap-2">
                  <UserIcon size={14} />
                  Initiateur
                </div>
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-bold text-(--notion-text-light) uppercase tracking-wider border-r border-(--notion-border) w-48">
                <div className="flex items-center gap-2">
                  <UserIcon size={14} />
                  Affectation
                </div>
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-bold text-(--notion-text-light) uppercase tracking-wider border-r border-(--notion-border) w-48">
                <div className="flex items-center gap-2">
                  <Box size={14} />
                  Produit
                </div>
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-bold text-(--notion-text-light) uppercase tracking-wider border-r border-(--notion-border) w-40">
                <div className="flex items-center gap-2">
                  <Tag size={14} />
                  Type du Projet
                </div>
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-bold text-(--notion-text-light) uppercase tracking-wider border-r border-(--notion-border) w-40">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full border border-current" />
                  Statut
                </div>
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-bold text-(--notion-text-light) uppercase tracking-wider border-r border-(--notion-border) w-32">
                <div className="flex items-center gap-2">
                  <AlertCircle size={14} />
                  Priorité
                </div>
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-bold text-(--notion-text-light) uppercase tracking-wider border-r border-(--notion-border) w-24">
                Urgent
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-bold text-(--notion-text-light) uppercase tracking-wider border-r border-(--notion-border) w-48">
                <div className="flex items-center gap-2">
                  <Calendar size={14} />
                  Deadline
                </div>
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-bold text-(--notion-text-light) uppercase tracking-wider border-r border-(--notion-border) w-48">
                Date de la demande
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-bold text-(--notion-text-light) uppercase tracking-wider border-r border-(--notion-border) w-24">
                Jour / Hom.
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-(--notion-border)">
            {projects.map((p) => (
              <tr
                key={p._id}
                className="hover:bg-(--notion-hover) transition-colors cursor-pointer text-sm"
              >
                <td className="px-4 py-2.5 border-r border-(--notion-border) font-medium text-(--notion-text)">
                  <div className="flex items-center gap-2 truncate">
                    <FileText size={15} className="text-(--notion-text-light) shrink-0" />
                    <span className="truncate">{p.name}</span>
                  </div>
                </td>
                <td className="px-4 py-2.5 border-r border-(--notion-border) text-(--notion-text)">
                  {p.initiatorName}
                </td>
                <td className="px-4 py-2.5 border-r border-(--notion-border)">
                  {p.assignedTo ? (
                    <span className="bg-(--surface-high) text-(--brand-secondary) px-2 py-0.5 rounded text-xs font-medium w-fit block">
                      {typeof p.assignedTo === 'object' ? p.assignedTo.name : p.assignedTo}
                    </span>
                  ) : (
                    <span className="text-(--notion-text-light)">-</span>
                  )}
                </td>
                <td className="px-4 py-2.5 border-r border-(--notion-border)">
                  <span className="bg-(--surface-low) text-(--brand-primary) px-2 py-0.5 rounded text-xs font-medium truncate inline-block max-w-full">
                    {p.product}
                  </span>
                </td>
                <td className="px-4 py-2.5 border-r border-(--notion-border)">
                  <span className="px-2 py-0.5 rounded text-xs font-medium bg-(--surface-low) text-(--brand-primary)">
                    {p.type}
                  </span>
                </td>
                <td className="px-4 py-2.5 border-r border-(--notion-border)">
                  <div className={`px-2 py-0.5 rounded-full text-[11px] font-bold w-fit flex items-center gap-1.5 ${getStatusClasses(p.status)}`}>
                    <div className="w-1.5 h-1.5 rounded-full bg-current shrink-0" />
                    {p.status}
                  </div>
                </td>
                <td className="px-4 py-2.5 border-r border-(--notion-border)">
                  <div className={`px-2 py-0.5 rounded text-[11px] font-bold w-fit ${getPriorityClasses(p.priority)}`}>
                    {p.priority}
                  </div>
                </td>
                <td className="px-4 py-2.5 border-r border-(--notion-border) text-center">
                  <div className="flex justify-center">
                    <input
                      type="checkbox"
                      readOnly
                      checked={p.urgent}
                      className="w-4 h-4 rounded border-(--notion-border) accent-(--brand-secondary)"
                    />
                  </div>
                </td>
                <td className="px-4 py-2.5 border-r border-(--notion-border) text-(--notion-text-light)">
                  {formatDate(p.deadline)}
                </td>
                <td className="px-4 py-2.5 border-r border-(--notion-border) text-(--notion-text-light)">
                  {formatDateTime(p.createdAt)}
                </td>
                <td className="px-4 py-2.5 border-r border-(--notion-border) text-(--notion-text-light)">
                  5h
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
};

export default ReportingView;
