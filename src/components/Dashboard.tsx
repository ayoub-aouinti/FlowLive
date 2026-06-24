import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
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
  AlertCircle,
  X,
  ChevronUp,
  ChevronDown as ChevronDownIcon,
  Paperclip
} from 'lucide-react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '../context/useNavigation';
import { useTheme } from '../context/ThemeContext';
import type { Project, User, FormField } from '../types';
import ProjectForm from './ProjectForm';
const logo = '/logo.png';
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
    workspaceTitle?: string | null;
    workspaceSubtitle?: string | null;
  } | null>(null);
  const { token } = useAuth();

  // Search / Filter / Sort state
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string[]>([]);
  const [filterPriority, setFilterPriority] = useState<string[]>([]);
  const [filterUrgent, setFilterUrgent] = useState<boolean | null>(null);
  const [showSortPanel, setShowSortPanel] = useState(false);
  const [sortField, setSortField] = useState<string>('deadline');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const filterRef = useRef<HTMLDivElement>(null);
  const sortRef = useRef<HTMLDivElement>(null);

  const activeFilterCount = filterStatus.length + filterPriority.length + (filterUrgent !== null ? 1 : 0);

  const displayedProjects = useMemo(() => {
    let result = [...projects];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p =>
        p.name.toLowerCase().includes(q) ||
        (p.product || '').toLowerCase().includes(q) ||
        (p.type || '').toLowerCase().includes(q) ||
        (p.initiatorName || '').toLowerCase().includes(q)
      );
    }
    if (filterStatus.length > 0) result = result.filter(p => filterStatus.includes(p.status));
    if (filterPriority.length > 0) result = result.filter(p => filterPriority.includes(p.priority));
    if (filterUrgent !== null) result = result.filter(p => p.urgent === filterUrgent);
    const priorityOrder: Record<string, number> = { 'Haute': 3, 'Moyenne': 2, 'Basse': 1 };
    result.sort((a, b) => {
      let va: string | number | Date, vb: string | number | Date;
      if (sortField === 'name') { va = a.name; vb = b.name; }
      else if (sortField === 'priority') { va = priorityOrder[a.priority] || 0; vb = priorityOrder[b.priority] || 0; }
      else if (sortField === 'status') { va = a.status; vb = b.status; }
      else if (sortField === 'createdAt') { va = new Date(a.createdAt); vb = new Date(b.createdAt); }
      else { va = new Date(a.deadline); vb = new Date(b.deadline); }
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return result;
  }, [projects, searchQuery, filterStatus, filterPriority, filterUrgent, sortField, sortDir]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) setShowFilterPanel(false);
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) setShowSortPanel(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

    socket.on('project_updated', (updatedProject: Project) => {
      setProjects((prev) => prev.map(p => p._id === updatedProject._id ? updatedProject : p));
    });

    const handleConfigUpdate = () => fetchData();
    window.addEventListener('dept_config_updated', handleConfigUpdate);

    return () => {
      socket.off('project_added');
      socket.off('project_updated');
      window.removeEventListener('dept_config_updated', handleConfigUpdate);
    };
  }, [fetchData]);

  const userRole = token ? JSON.parse(atob(token.split('.')[1])).role : 'guest';
  const currentUserName = token ? JSON.parse(atob(token.split('.')[1])).name : '';

  const handleUpdateStatus = (projectId: string, status: string) => {
    socket.emit('update_project_status', { projectId, status, workerName: currentUserName });
  };

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
        <div>
          <h1 className="text-[40px] font-black text-[var(--notion-text)] leading-tight">
            {deptConfig?.workspaceTitle || deptConfig?.departmentName || 'Badgi-WorkFlow'}
          </h1>
          <p className="text-[var(--notion-text-light)] text-sm font-medium -mt-1 tracking-tight">
            {deptConfig?.workspaceSubtitle || 'Badgi-WorkFlow'}
          </p>
        </div>
      </div>

      {/* Tab bar: tabs scroll independently, action buttons stay outside overflow so dropdowns aren't clipped */}
      <div className="flex items-center border-b border-[var(--notion-border)] mb-4">
        {/* Scrollable tabs */}
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide flex-1 min-w-0">
          {isPageActive('table') && (
            <button
              onClick={() => setView('table')}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm transition-colors whitespace-nowrap border-b-2 ${view === 'table' ? 'border-[var(--brand-primary)] text-[var(--brand-primary)] font-bold' : 'border-transparent text-[var(--notion-text-light)] hover:bg-[var(--notion-hover)]'}`}
            >
              <TableIcon size={14} />
              {t('dashboard.table')}
            </button>
          )}
          {isPageActive('kanban') && (
            <button
              onClick={() => setView('kanban')}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm transition-colors whitespace-nowrap border-b-2 ${view === 'kanban' ? 'border-[var(--brand-primary)] text-[var(--brand-primary)] font-bold' : 'border-transparent text-[var(--notion-text-light)] hover:bg-[var(--notion-hover)]'}`}
            >
              <Columns size={14} />
              {t('dashboard.kanban')}
            </button>
          )}
          {isPageActive('timeline') && (
            <button
              onClick={() => setView('timeline')}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm transition-colors whitespace-nowrap border-b-2 ${view === 'timeline' ? 'border-[var(--brand-primary)] text-[var(--brand-primary)] font-bold' : 'border-transparent text-[var(--notion-text-light)] hover:bg-[var(--notion-hover)]'}`}
            >
              <CalendarIcon size={14} />
              {t('dashboard.timeline')}
            </button>
          )}
          {isPageActive('calendrier') && (
            <button
              onClick={() => setView('calendrier')}
              className={`flex items-center gap-2 px-3 py-2 border-b-2 transition-all text-sm font-medium whitespace-nowrap ${view === 'calendrier' ? 'border-[var(--brand-primary)] text-[var(--brand-primary)] font-bold' : 'border-transparent text-[var(--notion-text-light)] hover:bg-[var(--notion-hover)]'}`}
            >
              <CalendarIcon size={14} />
              {t('dashboard.calendar')}
            </button>
          )}
          {isPageActive('reporting') && (
            <button
              onClick={() => setView('reporting')}
              className={`flex items-center gap-2 px-3 py-2 border-b-2 transition-all text-sm font-medium whitespace-nowrap ${view === 'reporting' ? 'border-[var(--brand-primary)] text-[var(--brand-primary)] font-bold' : 'border-transparent text-[var(--notion-text-light)] hover:bg-[var(--notion-hover)]'}`}
            >
              <BarChart2 size={14} />
              {t('dashboard.reporting')}
            </button>
          )}
          {isPageActive('urgences') && (
            <button
              onClick={() => setView('urgences')}
              className={`flex items-center gap-2 px-3 py-2 border-b-2 transition-all text-sm font-medium whitespace-nowrap ${view === 'urgences' ? 'border-[var(--brand-primary)] text-[var(--brand-primary)] font-bold' : 'border-transparent text-[var(--notion-text-light)] hover:bg-[var(--notion-hover)]'}`}
            >
              <AlertCircle size={14} className="text-[#e11d48]" />
              {t('dashboard.urgencies')}
            </button>
          )}
          {isPageActive('stats') && (
            <button
              onClick={() => setView('stats')}
              className={`flex items-center gap-2 px-3 py-2 border-b-2 transition-all text-sm font-medium whitespace-nowrap ${view === 'stats' ? 'border-[var(--brand-primary)] text-[var(--brand-primary)] font-bold' : 'border-transparent text-[var(--notion-text-light)] hover:bg-[var(--notion-hover)]'}`}
            >
              <PieChart size={14} />
              {t('dashboard.stats')}
            </button>
          )}
        </div>

        {/* Action buttons — outside the overflow container so dropdowns are not clipped */}
        <div className="flex items-center gap-1 pl-2 pr-2 flex-shrink-0">
          {/* Search */}
          <button
            onClick={() => { setShowSearch(v => !v); if (showSearch) setSearchQuery(''); }}
            className={`p-1.5 rounded transition-colors ${showSearch ? 'bg-[var(--brand-primary)] text-white' : 'hover:bg-[var(--notion-hover)] text-[var(--notion-text-light)]'}`}
            title="Rechercher"
          ><Search size={16} /></button>

          {/* Filter */}
          <div className="relative" ref={filterRef}>
            <button
              onClick={() => { setShowFilterPanel(v => !v); setShowSortPanel(false); }}
              className={`p-1.5 rounded transition-colors relative ${showFilterPanel || activeFilterCount > 0 ? 'bg-[var(--brand-primary)] text-white' : 'hover:bg-[var(--notion-hover)] text-[var(--notion-text-light)]'}`}
              title="Filtrer"
            >
              <Filter size={16} />
              {activeFilterCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">{activeFilterCount}</span>
              )}
            </button>
            {showFilterPanel && (
              <div className="absolute right-0 top-full mt-2 z-50 w-72 bg-[var(--notion-bg)] border border-[var(--notion-border)] rounded-xl shadow-2xl p-4 space-y-4">
                <div>
                  <div className="text-[10px] font-bold text-[var(--notion-text-light)] uppercase tracking-widest mb-2">Statut</div>
                  <div className="flex flex-wrap gap-1.5">
                    {['Nouveau', 'En cours', 'En révision', 'Terminé'].map(s => (
                      <button key={s}
                        onClick={() => setFilterStatus(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])}
                        className={`px-2 py-1 rounded text-[11px] font-semibold border transition-all ${filterStatus.includes(s) ? 'bg-[var(--brand-primary)] text-white border-[var(--brand-primary)]' : 'border-[var(--notion-border)] text-[var(--notion-text-light)] hover:border-[var(--brand-primary)]'}`}
                      >{s}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-[var(--notion-text-light)] uppercase tracking-widest mb-2">Priorité</div>
                  <div className="flex flex-wrap gap-1.5">
                    {['Haute', 'Moyenne', 'Basse'].map(p => (
                      <button key={p}
                        onClick={() => setFilterPriority(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p])}
                        className={`px-2 py-1 rounded text-[11px] font-semibold border transition-all ${filterPriority.includes(p) ? 'bg-[var(--brand-primary)] text-white border-[var(--brand-primary)]' : 'border-[var(--notion-border)] text-[var(--notion-text-light)] hover:border-[var(--brand-primary)]'}`}
                      >{p}</button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-[10px] font-bold text-[var(--notion-text-light)] uppercase tracking-widest">Urgent</div>
                  <button
                    onClick={() => setFilterUrgent(prev => prev === true ? null : true)}
                    className={`px-2 py-1 rounded text-[11px] font-semibold border transition-all ${filterUrgent === true ? 'bg-rose-500 text-white border-rose-500' : 'border-[var(--notion-border)] text-[var(--notion-text-light)] hover:border-rose-400'}`}
                  >Urgents seulement</button>
                </div>
                {activeFilterCount > 0 && (
                  <button
                    onClick={() => { setFilterStatus([]); setFilterPriority([]); setFilterUrgent(null); }}
                    className="w-full text-[11px] font-bold text-[var(--notion-text-light)] hover:text-[var(--notion-text)] border border-[var(--notion-border)] rounded-lg py-1.5 transition-colors"
                  >Réinitialiser les filtres</button>
                )}
              </div>
            )}
          </div>

          {/* Sort */}
          <div className="relative" ref={sortRef}>
            <button
              onClick={() => { setShowSortPanel(v => !v); setShowFilterPanel(false); }}
              className={`p-1.5 rounded transition-colors ${showSortPanel ? 'bg-[var(--brand-primary)] text-white' : 'hover:bg-[var(--notion-hover)] text-[var(--notion-text-light)]'}`}
              title="Trier"
            ><ArrowUpDown size={16} /></button>
            {showSortPanel && (
              <div className="absolute right-0 top-full mt-2 z-50 w-56 bg-[var(--notion-bg)] border border-[var(--notion-border)] rounded-xl shadow-2xl p-2">
                {[
                  { field: 'deadline', label: 'Deadline' },
                  { field: 'name', label: 'Nom' },
                  { field: 'priority', label: 'Priorité' },
                  { field: 'status', label: 'Statut' },
                  { field: 'createdAt', label: 'Date de création' },
                ].map(opt => (
                  <button key={opt.field}
                    onClick={() => { if (sortField === opt.field) setSortDir(d => d === 'asc' ? 'desc' : 'asc'); else { setSortField(opt.field); setSortDir('asc'); } }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all ${sortField === opt.field ? 'bg-[var(--notion-hover)] font-semibold text-[var(--notion-text)]' : 'text-[var(--notion-text-light)] hover:bg-[var(--notion-hover)]'}`}
                  >
                    <span>{opt.label}</span>
                    {sortField === opt.field && (
                      sortDir === 'asc'
                        ? <ChevronUp size={14} className="text-[var(--brand-primary)]" />
                        : <ChevronDownIcon size={14} className="text-[var(--brand-primary)]" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
          
          {token && JSON.parse(atob(token.split('.')[1])).role === 'chef de produit' && (
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

      {/* Inline search bar */}
      {showSearch && (
        <div className="mb-3 relative flex items-center animate-in slide-in-from-top-2 duration-200">
          <Search size={14} className="absolute left-3 text-[var(--notion-text-light)] pointer-events-none" />
          <input
            autoFocus
            type="text"
            placeholder="Rechercher par nom, produit, type, initiateur..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={e => e.key === 'Escape' && (setShowSearch(false), setSearchQuery(''))}
            className="w-full pl-8 pr-8 py-2 text-sm bg-[var(--notion-hover)] border border-[var(--notion-border)] rounded-lg outline-none focus:border-[var(--brand-primary)] text-[var(--notion-text)] placeholder:text-[var(--notion-text-light)] transition-all"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-3 text-[var(--notion-text-light)] hover:text-[var(--notion-text)] transition-colors">
              <X size={14} />
            </button>
          )}
        </div>
      )}

      {/* Active filter summary */}
      {(activeFilterCount > 0 || (searchQuery && !showSearch)) && (
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          {searchQuery && !showSearch && (
            <span className="flex items-center gap-1 text-[11px] font-semibold bg-[var(--notion-hover)] border border-[var(--notion-border)] px-2 py-1 rounded-full text-[var(--notion-text)]">
              Recherche: "{searchQuery}"
              <button onClick={() => setSearchQuery('')}><X size={10} /></button>
            </span>
          )}
          {filterStatus.map(s => (
            <span key={s} className="flex items-center gap-1 text-[11px] font-semibold bg-[var(--brand-primary)] text-white px-2 py-1 rounded-full">
              {s} <button onClick={() => setFilterStatus(prev => prev.filter(x => x !== s))}><X size={10} /></button>
            </span>
          ))}
          {filterPriority.map(p => (
            <span key={p} className="flex items-center gap-1 text-[11px] font-semibold bg-amber-500 text-white px-2 py-1 rounded-full">
              {p} <button onClick={() => setFilterPriority(prev => prev.filter(x => x !== p))}><X size={10} /></button>
            </span>
          ))}
          {filterUrgent && (
            <span className="flex items-center gap-1 text-[11px] font-semibold bg-rose-500 text-white px-2 py-1 rounded-full">
              Urgent <button onClick={() => setFilterUrgent(null)}><X size={10} /></button>
            </span>
          )}
          <span className="text-[11px] text-[var(--notion-text-light)]">{displayedProjects.length} résultat{displayedProjects.length !== 1 ? 's' : ''}</span>
        </div>
      )}

      <div className="min-h-[500px]">
        {view === 'table' && <TableView projects={displayedProjects} getUserName={getUserName} userRole={userRole} onUpdateStatus={handleUpdateStatus} formFields={deptConfig?.formFields || undefined} theme={theme} t={t} />}
        {view === 'kanban' && <KanbanView projects={displayedProjects} theme={theme} getUserName={getUserName} userRole={userRole} onUpdateStatus={handleUpdateStatus} />}
        {view === 'timeline' && <TimelineView projects={displayedProjects} getUserName={getUserName} theme={theme} />}
        {view === 'calendrier' && <CalendarView projects={displayedProjects} />}
        {view === 'reporting' && <ReportingView projects={displayedProjects} />}
        {view === 'urgences' && <ReportingView projects={displayedProjects.filter(p => p.urgent)} />}
        {view === 'stats' && <StatsView projects={displayedProjects} />}
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
                if (f.id === 'f_initiator') {
                  return (
                    <td key={f.id} className="px-2 py-2 border-r border-[var(--notion-border)]">
                      <span className="bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-100 px-1.5 py-0.5 rounded text-[12px] font-medium border border-purple-200 dark:border-purple-500/30">
                        {p.initiatorName || '-'}
                      </span>
                    </td>
                  );
                }
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
                if (f.type === 'attachment') {
                  const raw = p._customFields?.[f.id];
                  if (!raw) return (
                    <td key={f.id} className="px-2 py-2 border-r border-[var(--notion-border)] text-[var(--notion-text-light)] text-[12px]">—</td>
                  );
                  try {
                    const att = JSON.parse(raw as string) as { name: string; data: string; mimeType: string; size: number };
                    return (
                      <td key={f.id} className="px-2 py-2 border-r border-[var(--notion-border)]">
                        <a
                          href={att.data}
                          download={att.name}
                          title={`${att.name} (${(att.size / 1024).toFixed(0)} Ko)`}
                          className="flex items-center gap-1.5 text-[var(--brand-primary)] hover:underline text-[11px] font-medium max-w-[140px] truncate"
                          onClick={e => e.stopPropagation()}
                        >
                          <Paperclip size={11} className="flex-shrink-0" />
                          <span className="truncate">{att.name}</span>
                        </a>
                      </td>
                    );
                  } catch {
                    return (
                      <td key={f.id} className="px-2 py-2 border-r border-[var(--notion-border)] text-[var(--notion-text-light)] text-[12px]">—</td>
                    );
                  }
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

const KanbanView = ({ projects, theme, getUserName, userRole, onUpdateStatus }: {
  projects: Project[],
  theme: string,
  getUserName: (u: string | User | undefined) => string,
  userRole: string,
  onUpdateStatus: (id: string, status: string) => void
}) => {
  const columns = ['Nouveau', 'En cours', 'En révision', 'Terminé'];
  const showAssignee = userRole === 'chef de produit' || userRole === 'chef de projet';
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);

  const isOverdue = (p: Project) => {
    if (p.status === 'Terminé') return false;
    return new Date(p.deadline) < new Date(new Date().toDateString());
  };

  const handleDragStart = (e: React.DragEvent, projectId: string) => {
    setDraggedId(projectId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, col: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverCol(col);
  };

  const handleDrop = (e: React.DragEvent, col: string) => {
    e.preventDefault();
    if (draggedId) {
      const project = projects.find(p => p._id === draggedId);
      if (project && project.status !== col) {
        onUpdateStatus(draggedId, col);
      }
    }
    setDraggedId(null);
    setDragOverCol(null);
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-8 -mx-12 px-12 scrollbar-hide">
      {columns.map(col => {
        const pCol = projects.filter(p => (p.status || 'Nouveau') === col);
        const isOver = dragOverCol === col && draggedId !== null;
        const draggedProject = projects.find(p => p._id === draggedId);
        const isDroppingHere = isOver && draggedProject?.status !== col;

        return (
          <div
            key={col}
            className="min-w-[280px] flex-1 flex flex-col"
            onDragOver={(e) => handleDragOver(e, col)}
            onDragLeave={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOverCol(null);
            }}
            onDrop={(e) => handleDrop(e, col)}
          >
            {/* Column header */}
            <div className="flex items-center gap-2 mb-2 px-2">
              <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wide ${getStatusColor(col, theme)}`}>
                {col}
              </span>
              <span className="text-[var(--notion-text-light)] text-xs font-medium">{pCol.length}</span>
            </div>

            {/* Drop zone */}
            <div className={`space-y-2 flex-1 rounded-xl p-1 min-h-[80px] transition-all duration-150 ${isDroppingHere ? 'bg-[var(--brand-primary)]/5 ring-2 ring-[var(--brand-primary)] ring-dashed' : ''}`}>
              {pCol.map(p => {
                const isDragging = draggedId === p._id;
                const overdue = isOverdue(p);
                return (
                  <div
                    key={p._id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, p._id)}
                    onDragEnd={() => { setDraggedId(null); setDragOverCol(null); }}
                    className={`rounded-md shadow-sm p-3 transition-all duration-150 group select-none border
                      ${overdue
                        ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-400 dark:border-rose-700 shadow-rose-100 dark:shadow-rose-900/20'
                        : 'bg-[var(--notion-bg)] border-[var(--notion-border)]'}
                      ${isDragging ? 'opacity-40 scale-[0.97] shadow-none' : 'hover:shadow-md cursor-grab active:cursor-grabbing active:scale-[0.98]'}`}
                  >
                    {/* Overdue banner */}
                    {overdue && (
                      <div className="flex items-center gap-1 mb-2 text-[10px] font-bold text-rose-600 dark:text-rose-400">
                        <AlertCircle size={11} />
                        En retard — {new Date(p.deadline).toLocaleDateString('fr-FR')}
                      </div>
                    )}

                    <div className="flex items-center gap-2 mb-2 text-sm font-medium text-[var(--notion-text)]">
                      <FileIcon />
                      <span className="truncate">{p.name}</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-3 justify-between items-center">
                      <div className="flex flex-wrap gap-1.5">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${getPriorityColor(p.priority, theme)}`}>
                          {p.priority}
                        </span>
                        {p.product && (
                          <span className="text-[10px] text-[var(--notion-text-light)] bg-[var(--notion-hover)] px-1.5 py-0.5 rounded">
                            {p.product}
                          </span>
                        )}
                        {p.urgent && (
                          <span className="text-[10px] font-bold text-rose-500 bg-rose-50 dark:bg-rose-900/20 px-1.5 py-0.5 rounded border border-rose-200 dark:border-rose-800">
                            Urgent
                          </span>
                        )}
                      </div>
                      {showAssignee && p.assignedTo && (
                        <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-100 px-1.5 py-0.5 rounded text-[10px] font-medium border border-blue-200 dark:border-blue-500/30">
                          {getUserName(p.assignedTo)}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Empty column drop hint */}
              {pCol.length === 0 && (
                <div className={`h-16 rounded-lg border-2 border-dashed flex items-center justify-center text-[11px] font-medium transition-all ${isDroppingHere ? 'border-[var(--brand-primary)] text-[var(--brand-primary)]' : 'border-[var(--notion-border)] text-[var(--notion-text-light)]'}`}>
                  {isDroppingHere ? 'Déposer ici' : 'Aucune carte'}
                </div>
              )}
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
