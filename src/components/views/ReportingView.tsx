import React from 'react';
import type { Project } from '../../types';
import { FileText, AlertCircle, User as UserIcon, Tag, Box, Calendar } from 'lucide-react';

interface ReportingViewProps {
  projects: Project[];
}

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'Haute': return 'bg-[#ffe2dd] text-[#6e3630]';
    case 'Moyenne': return 'bg-[#fdecc8] text-[#89632a]';
    case 'Basse': return 'bg-[#e7e7e4] text-[#37352f]';
    default: return 'bg-[#e7e7e4] text-[#37352f]';
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Terminé': return 'bg-[#dbeddb] text-[#1c3829]';
    case 'En cours': return 'bg-[#d3e5ef] text-[#183347]';
    case 'En révision': return 'bg-[#f5e0e9] text-[#432936]';
    default: return 'bg-[#e7e7e4] text-[#37352f]';
  }
};

const ReportingView: React.FC<ReportingViewProps> = ({ projects }) => {
  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const formatDateTime = (dateStr: string) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    return `${d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })} ${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col h-full bg-white animate-in fade-in duration-500 overflow-hidden select-none">
      <div className="flex-1 overflow-x-auto scrollbar-hide">
        <table className="w-full border-collapse border-spacing-0 min-w-[2000px]">
          <thead className="sticky top-0 z-20 bg-white shadow-[0_1px_0_0_#ececeb]">
            <tr>
              <th className="px-3 py-2 text-left text-[11px] font-bold text-[#9b9a97] uppercase tracking-wider border-r border-[#ececeb] w-80">
                <div className="flex items-center gap-2">
                  <FileText size={14} />
                  Nom du projet (Produit)
                </div>
              </th>
              <th className="px-3 py-2 text-left text-[11px] font-bold text-[#9b9a97] uppercase tracking-wider border-r border-[#ececeb] w-48">
                <div className="flex items-center gap-2">
                  <UserIcon size={14} />
                  Initiateur
                </div>
              </th>
              <th className="px-3 py-2 text-left text-[11px] font-bold text-[#9b9a97] uppercase tracking-wider border-r border-[#ececeb] w-48">
                <div className="flex items-center gap-2">
                  <UserIcon size={14} />
                  Affectation
                </div>
              </th>
              <th className="px-3 py-2 text-left text-[11px] font-bold text-[#9b9a97] uppercase tracking-wider border-r border-[#ececeb] w-48">
                <div className="flex items-center gap-2">
                  <Box size={14} />
                  Produit
                </div>
              </th>
              <th className="px-3 py-2 text-left text-[11px] font-bold text-[#9b9a97] uppercase tracking-wider border-r border-[#ececeb] w-40">
                <div className="flex items-center gap-2">
                   <Tag size={14} />
                   Type du Projet
                </div>
              </th>
              <th className="px-3 py-2 text-left text-[11px] font-bold text-[#9b9a97] uppercase tracking-wider border-r border-[#ececeb] w-40">
                <div className="flex items-center gap-2">
                   <div className="w-3 h-3 rounded-full border border-current" />
                   Statu
                </div>
              </th>
              <th className="px-3 py-2 text-left text-[11px] font-bold text-[#9b9a97] uppercase tracking-wider border-r border-[#ececeb] w-32">
                 <div className="flex items-center gap-2">
                   <AlertCircle size={14} />
                   Priorité
                </div>
              </th>
              <th className="px-3 py-2 text-left text-[11px] font-bold text-[#9b9a97] uppercase tracking-wider border-r border-[#ececeb] w-24">
                Urgent
              </th>
              <th className="px-3 py-2 text-left text-[11px] font-bold text-[#9b9a97] uppercase tracking-wider border-r border-[#ececeb] w-48">
                <div className="flex items-center gap-2">
                  <Calendar size={14} />
                  Deadline
                </div>
              </th>
              <th className="px-3 py-2 text-left text-[11px] font-bold text-[#9b9a97] uppercase tracking-wider border-r border-[#ececeb] w-48">
                Date de la demande
              </th>
              <th className="px-3 py-2 text-left text-[11px] font-bold text-[#9b9a97] uppercase tracking-wider border-r border-[#ececeb] w-24">
                Jour / Homn
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#ececeb]">
            {projects.map((p) => (
              <tr key={p._id} className="hover:bg-[#f7f7f5] transition-colors group cursor-pointer text-sm">
                <td className="px-3 py-2 border-r border-[#ececeb] font-medium text-[#37352f]">
                  <div className="flex items-center gap-2 truncate">
                    <FileText size={16} className="text-[#9b9a97]" />
                    {p.name}
                  </div>
                </td>
                <td className="px-3 py-2 border-r border-[#ececeb] text-[#5a5a57]">
                  {p.initiatorName}
                </td>
                <td className="px-3 py-2 border-r border-[#ececeb]">
                  {p.assignedTo ? (
                    <div className="bg-[#d3e5ef] text-[#183347] px-2 py-0.5 rounded text-xs font-medium w-fit">
                      {typeof p.assignedTo === 'object' ? p.assignedTo.name : p.assignedTo}
                    </div>
                  ) : (
                    <span className="text-[#91918e]">-</span>
                  )}
                </td>
                <td className="px-3 py-2 border-r border-[#ececeb]">
                  <span className="bg-[#f5e0e9] text-[#432936] px-2 py-0.5 rounded text-xs font-medium truncate inline-block max-w-full">
                    {p.product}
                  </span>
                </td>
                <td className="px-3 py-2 border-r border-[#ececeb]">
                   <span className="px-2 py-0.5 rounded text-xs font-medium bg-[#efefed] text-[#37352f]">
                      {p.type}
                   </span>
                </td>
                <td className="px-3 py-2 border-r border-[#ececeb]">
                  <div className={`px-2 py-0.5 rounded-full text-[11px] font-bold w-fit flex items-center gap-1.5 ${getStatusColor(p.status)}`}>
                    <div className="w-1.5 h-1.5 rounded-full bg-current" />
                    {p.status}
                  </div>
                </td>
                <td className="px-3 py-2 border-r border-[#ececeb]">
                  <div className={`px-2 py-0.5 rounded text-[11px] font-bold w-fit ${getPriorityColor(p.priority)}`}>
                    {p.priority}
                  </div>
                </td>
                <td className="px-3 py-2 border-r border-[#ececeb] text-center">
                  <div className="flex justify-center">
                    <input 
                      type="checkbox" 
                      readOnly 
                      checked={p.urgent} 
                      className={`w-4 h-4 rounded border-[#ececeb] ${p.urgent ? 'text-[#2383e2]' : 'text-[#ececeb]'}`} 
                    />
                  </div>
                </td>
                <td className="px-3 py-2 border-r border-[#ececeb] text-[#5a5a57]">
                   {formatDate(p.deadline)}
                </td>
                <td className="px-3 py-2 border-r border-[#ececeb] text-[#91918e]">
                   {formatDateTime(p.createdAt)}
                </td>
                <td className="px-3 py-2 border-r border-[#ececeb] text-[#91918e]">
                   5h
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ReportingView;
