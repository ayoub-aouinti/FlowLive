import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { socket } from '../services/socket';
import { 
  Table as TableIcon, 
  Columns, 
  Calendar as CalendarIcon, 
  Search, 
  Filter, 
  ArrowUpDown, 
  Plus,
  BarChart2,
  PieChart,
  AlertCircle
} from 'lucide-react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '../context/useNavigation';
import { useTheme } from '../context/ThemeContext';
import type { Project, User, FormField } from '../types';
import ProjectForm from './ProjectForm';
import logo from '../assets/logo.png';
import CalendarView from './views/CalendarView';
import ReportingView from './views/ReportingView';
import StatsView from './views/StatsView';

const getPriorityColor = (priority: string, theme: string) => {
  if (theme === 'dark') {
    switch (priority) {
      case 'Haute': return 'bg-rose-500/10 text-rose-400 border border-rose-500/20';
      case 'Moyenne': return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
      default: return 'bg-slate-500/10 text-slate-400 border border-slate-500/20';
    }
  }
  switch (priority) {
    case 'Haute': return 'bg-[#ffe2dd] text-[#6e3630]';
    case 'Moyenne': return 'bg-[#fdecc8] text-[#89632a]';
    case 'Basse': return 'bg-[#e7e7e4] text-[#37352f]';
    default: return 'bg-[#e7e7e4] text-[#37352f]';
  }
};

const getStatusColor = (status: string, theme: string) => {
  if (theme === 'dark') {
    switch (status) {
      case 'Terminé': return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      case 'En cours': return 'bg-sky-500/10 text-sky-400 border border-sky-500/20';
      case 'En révision': return 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20';
      default: return 'bg-slate-500/10 text-slate-400 border border-slate-500/20';
    }
  }
  switch (status) {
    case 'Terminé': return 'bg-[#dbeddb] text-[#1c3829]';
    case 'En cours': return 'bg-[#d3e5ef] text-[#183347]';
    case 'En révision': return 'bg-[#f5e0e9] text-[#432936]';
    default: return 'bg-[#e7e7e4] text-[#37352f]';
  }
};

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const Dashboard: React.FC = () => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const { view, setView, selectedDepartmentId } = useNavigation();
  const [showAddModal, setShowAddModal] = useState(false);
  const [deptConfig, setDeptConfig] = useState<{
    departmentId: string;
    departmentName: string;
    products: string[];
    types: string[];
    activePages: string[];
    pageConfigs: Record<string, unknown>;
    formFields: FormField[] | null;
    coverUrl?: string | null;
    logoUrl?: string | null;
  } | null>(null);
  const { token } = useAuth();

  const fetchData = useCallback(async () => {
    if (!token) return;
    try {
      const queryString = selectedDepartmentId ? `?departmentId=${selectedDepartmentId}` : '';
      const [projectsRes, usersRes, configRes] = await Promise.all([
        axios.get(`${API_URL}/api/projects${queryString}`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/api/users`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/api/departments/my-config${queryString}`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: null }))
      ]);
      setProjects(projectsRes.data);
      setUsers(usersRes.data);
      if (configRes.data) setDeptConfig(configRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  }, [token, selectedDepartmentId]);

  useEffect(() => {
    fetchData();

    socket.on('project_added', (newProject: Project) => {
      setProjects((prev) => [...prev, newProject].sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime()));
    });

    const handleConfigUpdate = () => fetchData();
    window.addEventListener('dept_config_updated', handleConfigUpdate);

    return () => { 
      socket.off('project_added'); 
      window.removeEventListener('dept_config_updated', handleConfigUpdate);
    };
  }, [fetchData]);

  const handleUpdateStatus = (projectId: string, status: string) => {
    socket.emit('update_project_status', { projectId, status });
  };

  const userRole = token ? JSON.parse(atob(token.split('.')[1])).role : 'guest';

  const getUserName = (userIdOrObj: string | User | undefined) => {
    if (!userIdOrObj) return '-';
    if (typeof userIdOrObj === 'string') {
      return users.find(u => u._id === userIdOrObj)?.name || '-';
    }
    return userIdOrObj.name || '-';
  };

  const isPageActive = (pageId: string) => {
    if (!deptConfig || !deptConfig.activePages) return true;
    return deptConfig.activePages.includes(pageId);
  };

  return (
    <div className="space-y-1 transition-colors duration-300">
      <div className="flex items-center gap-4 mb-8 pt-4">
        {deptConfig?.logoUrl ? (
          <img src={deptConfig.logoUrl} alt={deptConfig.departmentName} className="w-14 h-14 rounded-2xl object-contain shadow-[0_4px_12px_rgba(30,41,59,0.1)] border border-[var(--notion-border)] p-1 bg-white dark:bg-slate-800" />
        ) : (
          <img src={logo} alt="WorkPlan" className="w-14 h-14 rounded-2xl object-contain shadow-[0_4px_12px_rgba(30,41,59,0.1)] border border-[var(--notion-border)] p-1 bg-white dark:bg-slate-800" />
        )}
        <div>
          <h1 className="text-[40px] font-bold text-[var(--notion-text)] leading-tight flex items-center gap-2">
            Work<span className="text-[var(--notion-text-light)] font-light italic">Plan</span>
          </h1>
          <p className="text-[var(--notion-text-light)] text-lg font-medium -mt-1 tracking-tight capitalize">
            {deptConfig?.departmentName || t('common.workspace')}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1 border-b border-[var(--notion-border)] mb-4 overflow-x-auto scrollbar-hide">
        {isPageActive('table') && (
          <button 
            onClick={() => setView('table')}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm transition-colors whitespace-nowrap border-b-2 ${view === 'table' ? 'border-[var(--brand-primary)] text-[var(--brand-primary)] font-bold shadow-[0_1px_0_0_var(--brand-primary)]' : 'border-transparent text-[var(--notion-text-light)] hover:bg-[var(--notion-hover)]'}`}
          >
            <TableIcon size={14} />
            {t('dashboard.table')}
          </button>
        )}
        
        {isPageActive('kanban') && (
          <button 
            onClick={() => setView('kanban')}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm transition-colors whitespace-nowrap border-b-2 ${view === 'kanban' ? 'border-[var(--brand-primary)] text-[var(--brand-primary)] font-bold shadow-[0_1px_0_0_var(--brand-primary)]' : 'border-transparent text-[var(--notion-text-light)] hover:bg-[var(--notion-hover)]'}`}
          >
            <Columns size={14} />
            {t('dashboard.kanban')}
          </button>
        )}

        {isPageActive('timeline') && (
          <button 
            onClick={() => setView('timeline')}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm transition-colors whitespace-nowrap border-b-2 ${view === 'timeline' ? 'border-[var(--brand-primary)] text-[var(--brand-primary)] font-bold shadow-[0_1px_0_0_var(--brand-primary)]' : 'border-transparent text-[var(--notion-text-light)] hover:bg-[var(--notion-hover)]'}`}
          >
            <CalendarIcon size={14} />
            {t('dashboard.timeline')}
          </button>
        )}

        {isPageActive('calendrier') && (
          <button 
            onClick={() => setView('calendrier')}
            className={`flex items-center gap-2 px-3 py-2 border-b-2 transition-all text-sm font-medium whitespace-nowrap ${
              view === 'calendrier' ? 'border-[var(--brand-primary)] text-[var(--brand-primary)] font-bold shadow-[0_1px_0_0_var(--brand-primary)]' : 'border-transparent text-[var(--notion-text-light)] hover:bg-[var(--notion-hover)]'
            }`}
          >
            <CalendarIcon size={14} />
            {t('dashboard.calendar')}
          </button>
        )}

        {isPageActive('reporting') && (
          <button 
            onClick={() => setView('reporting')}
            className={`flex items-center gap-2 px-3 py-2 border-b-2 transition-all text-sm font-medium whitespace-nowrap ${
              view === 'reporting' ? 'border-[var(--brand-primary)] text-[var(--brand-primary)] font-bold shadow-[0_1px_0_0_var(--brand-primary)]' : 'border-transparent text-[var(--notion-text-light)] hover:bg-[var(--notion-hover)]'
            }`}
          >
            <BarChart2 size={14} />
            {t('dashboard.reporting')}
          </button>
        )}

        {isPageActive('urgences') && (
          <button 
            onClick={() => setView('urgences')}
            className={`flex items-center gap-2 px-3 py-2 border-b-2 transition-all text-sm font-medium whitespace-nowrap ${
              view === 'urgences' ? 'border-[var(--brand-primary)] text-[var(--brand-primary)] font-bold shadow-[0_1px_0_0_var(--brand-primary)]' : 'border-transparent text-[var(--notion-text-light)] hover:bg-[var(--notion-hover)]'
            }`}
          >
            <AlertCircle size={14} className="text-[#e11d48]" />
            {t('dashboard.urgencies')}
          </button>
        )}

        {isPageActive('stats') && (
          <button 
            onClick={() => setView('stats')}
            className={`flex items-center gap-2 px-3 py-2 border-b-2 transition-all text-sm font-medium whitespace-nowrap ${
              view === 'stats' ? 'border-[var(--brand-primary)] text-[var(--brand-primary)] font-bold shadow-[0_1px_0_0_var(--brand-primary)]' : 'border-transparent text-[var(--notion-text-light)] hover:bg-[var(--notion-hover)]'
            }`}
          >
            <PieChart size={14} />
            {t('dashboard.stats')}
          </button>
        )}
        
        <div className="flex-1" />
        
        <div className="flex items-center gap-2 pr-2">
          <button className="p-1.5 hover:bg-[var(--notion-hover)] rounded transition-colors text-[var(--notion-text-light)]"><Search size={16} /></button>
          <button className="p-1.5 hover:bg-[var(--notion-hover)] rounded transition-colors text-[var(--notion-text-light)]"><Filter size={16} /></button>
          <button className="p-1.5 hover:bg-[var(--notion-hover)] rounded transition-colors text-[var(--notion-text-light)]"><ArrowUpDown size={16} /></button>
          
          {token && JSON.parse(atob(token.split('.')[1])).role === 'initiateur' && (
            <button 
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1 bg-[var(--brand-primary)] hover:bg-slate-700 text-white dark:text-slate-900 text-xs font-bold px-3 py-1.5 rounded transition-all shadow-md active:scale-95"
            >
              {t('common.new')}
              <Plus size={14} />
            </button>
          )}
        </div>
      </div>

      <div className="min-h-[500px]">
        {view === 'table' && <TableView projects={projects} getUserName={getUserName} userRole={userRole} onUpdateStatus={handleUpdateStatus} formFields={deptConfig?.formFields || undefined} theme={theme} t={t} />}
        {view === 'kanban' && <KanbanView projects={projects} theme={theme} />}
        {view === 'timeline' && <TimelineView projects={projects} getUserName={getUserName} theme={theme} />}
        {view === 'calendrier' && <CalendarView projects={projects} />}
        {view === 'reporting' && <ReportingView projects={projects} />}
        {view === 'urgences' && <ReportingView projects={projects.filter(p => p.urgent)} />}
        {view === 'stats' && <StatsView projects={projects} />}
        {view === 'demarrer' && (
          <div className="bg-[var(--notion-bg)] rounded-lg border border-[var(--notion-border)] shadow-sm animate-in slide-in-from-bottom-4 duration-500">
             <ProjectForm />
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-[var(--notion-bg)] w-[90%] max-w-4xl h-[90vh] rounded-lg shadow-2xl overflow-hidden relative translate-y-2 animate-in fade-in zoom-in duration-200">
            <ProjectForm onClose={() => setShowAddModal(false)} />
          </div>
        </div>
      )}
    </div>
  );
};

const TableView = ({ projects, getUserName, userRole, onUpdateStatus, formFields, theme, t }: {
  projects: Project[],
  getUserName: (u: string | User | undefined) => string,
  userRole: string,
  onUpdateStatus: (id: string, s: string) => void,
  formFields?: FormField[],
  theme: string,
  t: (key: string) => string
}) => {
  const fields = formFields && formFields.length > 0 ? formFields : [];

  return (
    <div className="overflow-x-auto -mx-12 px-12">
      <table className="w-full text-left border-collapse min-w-[900px]">
        <thead>
          <tr className="text-[var(--notion-text-light)] text-[12px] font-normal border-y border-[var(--notion-border)]">
            <th className="px-2 py-2 border-r border-[var(--notion-border)] font-normal w-[28%]">{t('project.name')}</th>
            {fields.map(f => (
              <th key={f.id} className="px-2 py-2 border-r border-[var(--notion-border)] font-normal">{f.label}</th>
            ))}
            <th className="px-2 py-2 font-normal w-[12%]">{t('project.status')}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--notion-border)]">
          {projects.map((p) => (
            <tr key={p._id} className="hover:bg-[var(--notion-hover)] transition-colors group text-sm">
              <td className="px-2 py-2 border-r border-[var(--notion-border)]">
                <div className="flex items-center gap-2">
                  <FileIcon />
                  <span className="text-[var(--notion-text)] truncate">{p.name}</span>
                </div>
              </td>
              {fields.map(f => {
                if (f.type === 'user') {
                  return (
                    <td key={f.id} className="px-2 py-2 border-r border-[var(--notion-border)]">
                      <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-100 px-1.5 py-0.5 rounded text-[12px] font-medium border border-blue-200 dark:border-blue-500/30">
                        {getUserName(p.assignedTo)}
                      </span>
                    </td>
                  );
                }
                if (f.type === 'checkbox') {
                  const val = f.id === 'f_urgent' ? p.urgent : !!(p._customFields?.[f.id]);
                  return (
                    <td key={f.id} className="px-2 py-2 border-r border-[var(--notion-border)] text-center">
                      <input type="checkbox" checked={!!val} readOnly className="rounded border-[var(--notion-border)] text-[var(--brand-accent)] focus:ring-0" />
                    </td>
                  );
                }
                if (f.type === 'select' && f.id === 'f_priority') {
                  return (
                    <td key={f.id} className="px-2 py-1 border-r border-[var(--notion-border)]">
                      <span className={`px-1.5 py-0.5 rounded text-[12px] font-medium ${getPriorityColor(p.priority, theme)}`}>{p.priority}</span>
                    </td>
                  );
                }
                return (
                  <td key={f.id} className="px-2 py-2 border-r border-[var(--notion-border)] text-[var(--notion-text)]">
                     {p._customFields?.[f.id] ? String(p._customFields[f.id]) : '-'}
                  </td>
                );
              })}
              <td className="px-2 py-2 border-r border-[var(--notion-border)]">
                {userRole === 'worker' ? (
                  <select
                    className={`inline-flex items-center gap-1.5 px-1.5 py-0.5 rounded text-[12px] font-medium outline-none border-none cursor-pointer ${getStatusColor(p.status, theme)}`}
                    value={p.status}
                    onChange={(e) => onUpdateStatus(p._id, e.target.value)}
                  >
                    <option value="Nouveau">Nouveau</option>
                    <option value="En cours">En cours</option>
                    <option value="En révision">En révision</option>
                    <option value="Terminé">Terminé</option>
                  </select>
                ) : (
                  <span className={`inline-flex items-center gap-1.5 px-1.5 py-0.5 rounded text-[12px] font-medium ${getStatusColor(p.status, theme)}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${p.status === 'Terminé' ? 'bg-current' : 'bg-current'}`} />
                    {p.status}
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const KanbanView = ({ projects, theme }: { projects: Project[], theme: string }) => {
  const columns = ['Nouveau', 'En cours', 'En révision', 'Terminé'];
  return (
    <div className="flex gap-4 overflow-x-auto pb-8 -mx-12 px-12 scrollbar-hide">
      {columns.map(col => {
        const pCol = projects.filter(p => p.status === col);
        return (
          <div key={col} className="min-w-[280px] flex-1">
            <div className="flex items-center gap-2 mb-2 px-2">
              <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wide ${getStatusColor(col, theme)}`}>
                {col}
              </span>
              <span className="text-[var(--notion-text-light)] text-xs font-medium">{pCol.length}</span>
            </div>
            <div className="space-y-2">
              {pCol.map(p => (
                <div key={p._id} className="bg-[var(--notion-bg)] border border-[var(--notion-border)] rounded-md shadow-sm p-3 hover:shadow-md transition-shadow cursor-pointer group">
                  <div className="flex items-center gap-2 mb-2 text-sm font-medium text-[var(--notion-text)]">
                    <FileIcon />
                    {p.name}
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-3 justify-between items-center">
                    <div className="flex flex-wrap gap-1.5">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${getPriorityColor(p.priority, theme)}`}>
                        {p.priority}
                      </span>
                      <span className="text-[10px] text-[var(--notion-text-light)] bg-[var(--notion-hover)] px-1.5 py-0.5 rounded">
                        {p.product}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const TimelineView = ({ projects, getUserName, theme }: { projects: Project[], getUserName: (u: string | User | undefined) => string, theme: string }) => {
  const userList = useMemo(() => {
    const unique = new Set<string>();
    projects.forEach(p => {
       const name = getUserName(p.assignedTo);
       if (name !== '-') unique.add(name);
    });
    return Array.from(unique);
  }, [projects, getUserName]);

  return (
    <div className="border border-[var(--notion-border)] rounded-lg overflow-hidden -mx-12">
      <div className="flex h-10 border-b border-[var(--notion-border)] bg-[var(--notion-sidebar)]">
         <div className="w-48 border-r border-[var(--notion-border)] flex items-center px-4 text-xs font-bold text-[var(--notion-text-light)] uppercase whitespace-nowrap">Equipe</div>
         <div className="flex-1 overflow-x-auto flex items-center px-4 gap-8 text-[11px] font-bold text-[var(--notion-text-light)] uppercase whitespace-nowrap">
           <span>18 Mar</span><span>19 Mar</span><span>20 Mar</span><span className="text-[#eb5757]">21 Mar</span><span>22 Mar</span><span>23 Mar</span><span>24 Mar</span>
         </div>
      </div>
      <div className="divide-y divide-[var(--notion-border)]">
        {userList.map(name => (
          <div key={name} className="flex">
            <div className="w-48 border-r border-[var(--notion-border)] py-3 px-4 flex items-center gap-2">
              <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${getStatusColor('En cours', theme)}`}>{name}</span>
            </div>
            <div className="flex-1 p-2 relative">
               {projects.filter(p => getUserName(p.assignedTo) === name).map((p) => (
                 <div key={p._id} className="bg-[var(--notion-bg)] border border-[var(--notion-border)] rounded px-3 py-1.5 text-xs shadow-sm mb-1 inline-block ml-4 text-[var(--notion-text)]">
                   {p.name}
                 </div>
               ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const FileIcon = ({ size = 18 }: { size?: number }) => (
  <div className="text-[var(--notion-text-light)]">
    <svg width={size} height={(size * 18) / 14} viewBox="0 0 14 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M1 1.6C1 1.26863 1.26863 1 1.6 1H9.4L13 4.6V16.4C13 16.7314 12.7314 17 12.4 17H1.6C1.26863 17 1 16.7314 1 16.4V1.6Z" stroke="currentColor" strokeWidth="1.5" />
      <path d="M9 1V5H13" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  </div>
);

export default Dashboard;
