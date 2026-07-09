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
  Paperclip,
  Star
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

const API_URL = import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:5001' : window.location.origin);

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
    rolePages?: Record<string, string[]>;
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

  const DEFAULT_ROLE_PAGES: Record<string, string[]> = {
    'worker':          ['table', 'kanban', 'timeline', 'calendrier'],
    'chef de produit': ['table', 'kanban', 'timeline', 'calendrier', 'reporting', 'urgences', 'stats'],
  };

  const isPageActive = (pageId: string) => {
    if (userRole === 'superadmin') return true;
    if (deptConfig?.activePages && !deptConfig.activePages.includes(pageId)) return false;
    if (userRole === 'chef de projet') return true;
    const allowed = deptConfig?.rolePages?.[userRole] ?? DEFAULT_ROLE_PAGES[userRole];
    if (allowed && !allowed.includes(pageId)) return false;
    return true;
  };

  const rateProject = useCallback(async (projectId: string, rating: number) => {
    try {
      await axios.patch(`${API_URL}/api/projects/${projectId}/rating`, { rating }, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) { console.error(err); }
  }, [token]);

  return (
    <div className="space-y-1 transition-colors duration-300">
      {/* Page header */}
      <div className="flex items-center gap-4 mb-6 pt-5">
        <div>
          <h1 className="text-3xl font-bold text-[var(--notion-text)] leading-tight tracking-tight">
            {deptConfig?.workspaceTitle || deptConfig?.departmentName || 'Badgi-WorkFlow'}
          </h1>
          <p className="text-[var(--notion-text-light)] text-sm mt-1">
            {deptConfig?.workspaceSubtitle || 'Badgi-WorkFlow'}
          </p>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex items-center border-b border-[var(--notion-border)] mb-4">
        {/* Scrollable tabs */}
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide flex-1 min-w-0">
          {isPageActive('table') && (
            <button
              onClick={() => setView('table')}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm transition-colors whitespace-nowrap border-b-2 ${view === 'table' ? 'border-[var(--brand-secondary)] text-[var(--brand-secondary)] font-semibold' : 'border-transparent text-[var(--notion-text-light)] hover:bg-[var(--notion-hover)] hover:text-[var(--notion-text)]'}`}
            >
              <TableIcon size={14} />
              {t('dashboard.table')}
            </button>
          )}
          {isPageActive('kanban') && (
            <button
              onClick={() => setView('kanban')}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm transition-colors whitespace-nowrap border-b-2 ${view === 'kanban' ? 'border-[var(--brand-secondary)] text-[var(--brand-secondary)] font-semibold' : 'border-transparent text-[var(--notion-text-light)] hover:bg-[var(--notion-hover)] hover:text-[var(--notion-text)]'}`}
            >
              <Columns size={14} />
              {t('dashboard.kanban')}
            </button>
          )}
          {isPageActive('timeline') && (
            <button
              onClick={() => setView('timeline')}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm transition-colors whitespace-nowrap border-b-2 ${view === 'timeline' ? 'border-[var(--brand-secondary)] text-[var(--brand-secondary)] font-semibold' : 'border-transparent text-[var(--notion-text-light)] hover:bg-[var(--notion-hover)] hover:text-[var(--notion-text)]'}`}
            >
              <CalendarIcon size={14} />
              {t('dashboard.timeline')}
            </button>
          )}
          {isPageActive('calendrier') && (
            <button
              onClick={() => setView('calendrier')}
              className={`flex items-center gap-2 px-3 py-2 border-b-2 transition-all text-sm font-medium whitespace-nowrap ${view === 'calendrier' ? 'border-[var(--brand-secondary)] text-[var(--brand-secondary)] font-semibold' : 'border-transparent text-[var(--notion-text-light)] hover:bg-[var(--notion-hover)] hover:text-[var(--notion-text)]'}`}
            >
              <CalendarIcon size={14} />
              {t('dashboard.calendar')}
            </button>
          )}
          {isPageActive('reporting') && (
            <button
              onClick={() => setView('reporting')}
              className={`flex items-center gap-2 px-3 py-2 border-b-2 transition-all text-sm font-medium whitespace-nowrap ${view === 'reporting' ? 'border-[var(--brand-secondary)] text-[var(--brand-secondary)] font-semibold' : 'border-transparent text-[var(--notion-text-light)] hover:bg-[var(--notion-hover)] hover:text-[var(--notion-text)]'}`}
            >
              <BarChart2 size={14} />
              {t('dashboard.reporting')}
            </button>
          )}
          {isPageActive('urgences') && (
            <button
              onClick={() => setView('urgences')}
              className={`flex items-center gap-2 px-3 py-2 border-b-2 transition-all text-sm font-medium whitespace-nowrap ${view === 'urgences' ? 'border-[var(--brand-secondary)] text-[var(--brand-secondary)] font-semibold' : 'border-transparent text-[var(--notion-text-light)] hover:bg-[var(--notion-hover)] hover:text-[var(--notion-text)]'}`}
            >
              <AlertCircle size={14} className="text-[#e11d48]" />
              {t('dashboard.urgencies')}
            </button>
          )}
          {isPageActive('stats') && (
            <button
              onClick={() => setView('stats')}
              className={`flex items-center gap-2 px-3 py-2 border-b-2 transition-all text-sm font-medium whitespace-nowrap ${view === 'stats' ? 'border-[var(--brand-secondary)] text-[var(--brand-secondary)] font-semibold' : 'border-transparent text-[var(--notion-text-light)] hover:bg-[var(--notion-hover)] hover:text-[var(--notion-text)]'}`}
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
            className={`p-1.5 rounded transition-colors ${showSearch ? 'bg-[var(--brand-secondary)] text-white' : 'hover:bg-[var(--notion-hover)] text-[var(--notion-text-light)]'}`}
            title="Rechercher"
          ><Search size={16} /></button>

          {/* Filter */}
          <div className="relative" ref={filterRef}>
            <button
              onClick={() => { setShowFilterPanel(v => !v); setShowSortPanel(false); }}
              className={`p-1.5 rounded transition-colors relative ${showFilterPanel || activeFilterCount > 0 ? 'bg-[var(--brand-secondary)] text-white' : 'hover:bg-[var(--notion-hover)] text-[var(--notion-text-light)]'}`}
              title="Filtrer"
            >
              <Filter size={16} />
              {activeFilterCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">{activeFilterCount}</span>
              )}
            </button>
            {showFilterPanel && (
              <div className="absolute right-0 top-full mt-2 z-50 w-72 bg-[var(--notion-sidebar)] border border-[var(--notion-border)] rounded-xl shadow-[var(--shadow-elevated)] p-4 space-y-4">
                <div>
                  <div className="text-[10px] font-bold text-[var(--notion-text-light)] uppercase tracking-widest mb-2">Statut</div>
                  <div className="flex flex-wrap gap-1.5">
                    {['Nouveau', 'En cours', 'En révision', 'Terminé'].map(s => (
                      <button key={s}
                        onClick={() => setFilterStatus(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])}
                        className={`px-2 py-1 rounded text-[11px] font-semibold border transition-all ${filterStatus.includes(s) ? 'bg-[var(--brand-secondary)] text-white border-[var(--brand-secondary)]' : 'border-[var(--notion-border)] text-[var(--notion-text-light)] hover:border-[var(--brand-secondary)]'}`}
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
                        className={`px-2 py-1 rounded text-[11px] font-semibold border transition-all ${filterPriority.includes(p) ? 'bg-[var(--brand-secondary)] text-white border-[var(--brand-secondary)]' : 'border-[var(--notion-border)] text-[var(--notion-text-light)] hover:border-[var(--brand-secondary)]'}`}
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
              className={`p-1.5 rounded transition-colors ${showSortPanel ? 'bg-[var(--brand-secondary)] text-white' : 'hover:bg-[var(--notion-hover)] text-[var(--notion-text-light)]'}`}
              title="Trier"
            ><ArrowUpDown size={16} /></button>
            {showSortPanel && (
              <div className="absolute right-0 top-full mt-2 z-50 w-56 bg-[var(--notion-sidebar)] border border-[var(--notion-border)] rounded-xl shadow-[var(--shadow-elevated)] p-2">
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
                        ? <ChevronUp size={14} className="text-[var(--brand-secondary)]" />
                        : <ChevronDownIcon size={14} className="text-[var(--brand-secondary)]" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
          
          {token && JSON.parse(atob(token.split('.')[1])).role === 'chef de produit' && (
            <button 
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1 bg-[var(--brand-secondary)] hover:bg-[var(--brand-primary)] text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-all active:scale-95" style={{ boxShadow: 'var(--shadow-btn)' }}
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
            className="w-full pl-8 pr-8 py-2 text-sm bg-[var(--notion-hover)] border border-[var(--notion-border)] rounded-lg outline-none focus:border-[var(--brand-secondary)] text-[var(--notion-text)] placeholder:text-[var(--notion-text-light)] transition-all"
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
            <span key={s} className="flex items-center gap-1 text-[11px] font-semibold bg-[var(--brand-secondary)] text-white px-2 py-1 rounded-full">
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
        {view === 'kanban' && <KanbanView projects={displayedProjects} theme={theme} getUserName={getUserName} userRole={userRole} onUpdateStatus={handleUpdateStatus} onRateProject={rateProject} />}
        {view === 'timeline' && <TimelineView projects={displayedProjects} getUserName={getUserName} theme={theme} />}
        {view === 'calendrier' && <CalendarView projects={displayedProjects} />}
        {view === 'reporting' && <ReportingView projects={displayedProjects} />}
        {view === 'urgences' && <ReportingView projects={displayedProjects.filter(p => p.urgent)} />}
        {view === 'stats' && <StatsView projects={displayedProjects} users={users} />}
        {view === 'demarrer' && (
          <div className="bg-[var(--notion-sidebar)] rounded-2xl border border-[var(--notion-border)] shadow-[var(--shadow-card)] animate-in slide-in-from-bottom-4 duration-500">
             <ProjectForm />
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-[var(--notion-sidebar)] w-[90%] max-w-4xl h-[90vh] rounded-2xl shadow-[var(--shadow-elevated)] overflow-hidden relative translate-y-2 animate-in fade-in zoom-in duration-200">
            <ProjectForm onClose={() => setShowAddModal(false)} />
          </div>
        </div>
      )}
    </div>
  );
};

const statusPill = (status: string) => {
  switch (status) {
    case 'Terminé':    return 'bg-emerald-100 text-emerald-700';
    case 'En cours':   return 'bg-[var(--surface-high)] text-[var(--brand-secondary)]';
    case 'En révision':return 'bg-amber-100 text-amber-700';
    default:           return 'bg-[var(--surface-low)] text-[var(--notion-text-light)]';
  }
};
const priorityPill = (priority: string) => {
  switch (priority) {
    case 'Haute':   return 'bg-rose-100 text-rose-700';
    case 'Moyenne': return 'bg-amber-100 text-amber-700';
    default:        return 'bg-[var(--surface-low)] text-[var(--notion-text-light)]';
  }
};

const TableView = ({ projects, getUserName, userRole, onUpdateStatus, formFields, t }: {
  projects: Project[],
  getUserName: (u: string | User | undefined) => string,
  userRole: string,
  onUpdateStatus: (id: string, s: string) => void,
  formFields?: FormField[],
  theme: string,
  t: (key: string) => string
}) => {
  const fields = formFields && formFields.length > 0 ? formFields : [];

  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-[var(--notion-text-light)]">
        <FileIcon size={40} />
        <p className="mt-4 text-sm font-medium">Aucun projet à afficher</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto -mx-12 px-12">
      <div
        className="min-w-[900px] bg-[var(--notion-sidebar)] rounded-xl border border-[var(--notion-border)] overflow-hidden"
        style={{ boxShadow: 'var(--shadow-card)' }}
      >
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[var(--surface-low)] text-[var(--notion-text-light)] text-[11px] font-semibold uppercase tracking-wide border-b border-[var(--notion-border)]">
              <th className="px-4 py-3 border-r border-[var(--notion-border)] w-[28%]">{t('project.name')}</th>
              {fields.map(f => (
                <th key={f.id} className="px-4 py-3 border-r border-[var(--notion-border)]">{f.label}</th>
              ))}
              <th className="px-4 py-3 w-[12%]">{t('project.status')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--notion-border)]">
            {projects.map((p) => (
              <tr key={p._id} className="hover:bg-[var(--notion-hover)] transition-colors group text-sm">
                <td className="px-4 py-3 border-r border-[var(--notion-border)]">
                  <div className="flex items-center gap-2.5">
                    <FileIcon />
                    <span className="text-[var(--notion-text)] font-medium truncate">{p.name}</span>
                  </div>
                </td>
                {fields.map(f => {
                  if (f.id === 'f_initiator') {
                    return (
                      <td key={f.id} className="px-4 py-3 border-r border-[var(--notion-border)]">
                        <span className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-200 px-2 py-0.5 rounded-md text-[11px] font-semibold">
                          {p.initiatorName || '-'}
                        </span>
                      </td>
                    );
                  }
                  if (f.type === 'user') {
                    return (
                      <td key={f.id} className="px-4 py-3 border-r border-[var(--notion-border)]">
                        <span className="bg-[var(--surface-high)] text-[var(--brand-secondary)] px-2 py-0.5 rounded-md text-[11px] font-semibold">
                          {getUserName(p.assignedTo)}
                        </span>
                      </td>
                    );
                  }
                  if (f.type === 'checkbox') {
                    const val = f.id === 'f_urgent' ? p.urgent : !!(p._customFields?.[f.id]);
                    return (
                      <td key={f.id} className="px-4 py-3 border-r border-[var(--notion-border)] text-center">
                        <input type="checkbox" checked={!!val} readOnly className="rounded border-[var(--notion-border)] text-[var(--brand-accent)] focus:ring-0 cursor-default" />
                      </td>
                    );
                  }
                  if (f.type === 'select' && f.id === 'f_priority') {
                    return (
                      <td key={f.id} className="px-4 py-3 border-r border-[var(--notion-border)]">
                        <span className={`px-2 py-0.5 rounded-md text-[11px] font-semibold ${priorityPill(p.priority)}`}>{p.priority}</span>
                      </td>
                    );
                  }
                  if (f.type === 'attachment') {
                    const raw = p._customFields?.[f.id];
                    if (!raw) return (
                      <td key={f.id} className="px-4 py-3 border-r border-[var(--notion-border)] text-[var(--notion-text-light)] text-[12px]">—</td>
                    );
                    try {
                      const att = JSON.parse(raw as string) as { name: string; data: string; mimeType: string; size: number };
                      return (
                        <td key={f.id} className="px-4 py-3 border-r border-[var(--notion-border)]">
                          <a
                            href={att.data}
                            download={att.name}
                            title={`${att.name} (${(att.size / 1024).toFixed(0)} Ko)`}
                            className="flex items-center gap-1.5 text-[var(--brand-secondary)] hover:underline text-[11px] font-medium max-w-[140px] truncate"
                            onClick={e => e.stopPropagation()}
                          >
                            <Paperclip size={11} className="flex-shrink-0" />
                            <span className="truncate">{att.name}</span>
                          </a>
                        </td>
                      );
                    } catch {
                      return (
                        <td key={f.id} className="px-4 py-3 border-r border-[var(--notion-border)] text-[var(--notion-text-light)] text-[12px]">—</td>
                      );
                    }
                  }
                  return (
                    <td key={f.id} className="px-4 py-3 border-r border-[var(--notion-border)] text-[var(--notion-text)]">
                      {p._customFields?.[f.id] ? String(p._customFields[f.id]) : <span className="text-[var(--notion-text-light)]">—</span>}
                    </td>
                  );
                })}
                <td className="px-4 py-3">
                  {userRole === 'worker' ? (
                    <select
                      className={`px-2 py-0.5 rounded-md text-[11px] font-semibold outline-none border-none cursor-pointer ${statusPill(p.status)}`}
                      value={p.status}
                      onChange={(e) => onUpdateStatus(p._id, e.target.value)}
                    >
                      <option value="Nouveau">Nouveau</option>
                      <option value="En cours">En cours</option>
                      <option value="En révision">En révision</option>
                      <option value="Terminé">Terminé</option>
                    </select>
                  ) : (
                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold ${statusPill(p.status)}`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-current" />
                      {p.status}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const KanbanView = ({ projects, theme, getUserName, userRole, onUpdateStatus, onRateProject }: {
  projects: Project[],
  theme: string,
  getUserName: (u: string | User | undefined) => string,
  userRole: string,
  onUpdateStatus: (id: string, status: string) => void,
  onRateProject: (projectId: string, rating: number) => void,
}) => {
  const columns = ['Nouveau', 'En cours', 'En révision', 'Terminé'];
  const showAssignee = userRole === 'chef de produit' || userRole === 'chef de projet';
  const canRate = userRole === 'chef de produit' || userRole === 'chef de projet' || userRole === 'superadmin';
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);
  const [starHover, setStarHover] = useState<{ id: string; star: number } | null>(null);

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

  const colAccentClass = (col: string) => {
    switch (col) {
      case 'Terminé':    return 'bg-emerald-500';
      case 'En cours':   return 'bg-[var(--brand-secondary)]';
      case 'En révision':return 'bg-amber-400';
      default:           return 'bg-slate-300';
    }
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
            className="min-w-[300px] flex-1 flex flex-col"
            onDragOver={(e) => handleDragOver(e, col)}
            onDragLeave={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOverCol(null);
            }}
            onDrop={(e) => handleDrop(e, col)}
          >
            {/* Column header */}
            <div className="flex items-center gap-2.5 mb-3 px-1">
              <div className={`h-2.5 w-2.5 rounded-full shrink-0 ${colAccentClass(col)}`} />
              <span className="text-sm font-bold text-[var(--notion-text)] tracking-tight">{col}</span>
              <span className={`ml-auto text-[10px] font-black px-2 py-0.5 rounded-full ${pCol.length > 0 ? 'bg-[var(--surface-mid)] text-[var(--brand-secondary)]' : 'bg-[var(--surface-low)] text-[var(--notion-text-light)]'}`}>{pCol.length}</span>
            </div>

            {/* Drop zone */}
            <div className={`space-y-2.5 flex-1 rounded-xl p-1.5 min-h-[80px] transition-all duration-150 ${isDroppingHere ? 'bg-[var(--surface-low)] ring-2 ring-[var(--brand-secondary)] ring-dashed' : 'bg-[var(--notion-bg)]'}`}>
              {pCol.map(p => {
                const isDragging = draggedId === p._id;
                const overdue = isOverdue(p);
                return (
                  <div
                    key={p._id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, p._id)}
                    onDragEnd={() => { setDraggedId(null); setDragOverCol(null); }}
                    className={`rounded-xl p-4 transition-all duration-150 select-none border group
                      ${overdue
                        ? 'bg-rose-50 border-rose-200'
                        : 'bg-[var(--notion-sidebar)] border-[var(--notion-border)]'}
                      ${isDragging ? 'opacity-40 scale-[0.97] shadow-none' : 'cursor-grab active:cursor-grabbing hover:-translate-y-0.5 hover:shadow-[var(--shadow-elevated)]'}`}
                    style={!isDragging && !overdue ? { boxShadow: 'var(--shadow-card)' } : undefined}
                  >
                    {/* Header row: priority + urgent/overdue badges */}
                    <div className="flex items-center gap-1.5 mb-3 flex-wrap">
                      <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${priorityPill(p.priority)}`}>
                        {p.priority}
                      </span>
                      {p.urgent && (
                        <span className="text-[9px] font-black uppercase tracking-widest text-rose-600 bg-rose-100 px-2 py-0.5 rounded-full border border-rose-200">
                          Urgent
                        </span>
                      )}
                      {overdue && (
                        <span className="flex items-center gap-0.5 text-[9px] font-black text-rose-600 ml-auto">
                          <AlertCircle size={9} />
                          En retard
                        </span>
                      )}
                    </div>

                    {/* Project name */}
                    <h4 className="text-sm font-bold text-[var(--notion-text)] mb-2 leading-snug line-clamp-2">
                      {p.name}
                    </h4>

                    {/* Deadline */}
                    {p.deadline && (
                      <div className="flex items-center gap-1.5 text-[10px] text-[var(--notion-text-light)] mb-3">
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--notion-border)] shrink-0" />
                        {new Date(p.deadline).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                    )}

                    {/* Product + type chips */}
                    {(p.product || p.type) && (
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {p.product && (
                          <span className="text-[10px] text-[var(--brand-secondary)] bg-[var(--surface-high)] px-2 py-0.5 rounded-md font-semibold">
                            {p.product}
                          </span>
                        )}
                        {p.type && (
                          <span className="text-[10px] text-[var(--notion-text-light)] bg-[var(--surface-low)] px-2 py-0.5 rounded-md font-medium">
                            {p.type}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Footer: assignee avatar */}
                    {showAssignee && p.assignedTo && (
                      <div className="flex items-center justify-between pt-3 border-t border-[var(--notion-border)] mt-1">
                        <span className="text-[10px] text-[var(--notion-text-light)] font-medium">Assigné à</span>
                        <div className="flex items-center gap-1.5">
                          <div className="w-6 h-6 rounded-full bg-[var(--surface-high)] text-[var(--brand-secondary)] flex items-center justify-center text-[9px] font-black uppercase shrink-0">
                            {getUserName(p.assignedTo).charAt(0)}
                          </div>
                          <span className="text-[10px] text-[var(--notion-text)] font-semibold max-w-[90px] truncate">
                            {getUserName(p.assignedTo)}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Star rating — Terminé column only */}
                    {col === 'Terminé' && (
                      <div className="flex items-center gap-0.5 pt-2 mt-2 border-t border-[var(--notion-border)]">
                        <span className="text-[9px] text-[var(--notion-text-light)] mr-1 font-medium">Appréciation</span>
                        <div className="flex items-center gap-0.5 ml-auto">
                          {[1, 2, 3, 4, 5].map(star => {
                            const active = starHover?.id === p._id
                              ? star <= starHover.star
                              : star <= (p.rating || 0);
                            return (
                              <button
                                key={star}
                                type="button"
                                disabled={!canRate}
                                onMouseEnter={() => canRate && setStarHover({ id: p._id, star })}
                                onMouseLeave={() => setStarHover(null)}
                                onClick={e => { e.stopPropagation(); if (canRate) onRateProject(p._id, star); }}
                                className={`transition-transform ${canRate ? 'cursor-pointer hover:scale-125' : 'cursor-default'} ${active ? 'text-amber-400' : 'text-[var(--notion-border)]'}`}
                                title={canRate ? `Donner ${star}/5` : `${p.rating || 0}/5`}
                              >
                                <Star size={13} fill={active ? 'currentColor' : 'none'} />
                              </button>
                            );
                          })}
                          {p.rating && (
                            <span className="text-[9px] text-amber-600 font-bold ml-1">{p.rating}/5</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Empty column drop hint */}
              {pCol.length === 0 && (
                <div className={`h-20 rounded-xl border-2 border-dashed flex items-center justify-center text-[11px] font-medium transition-all ${isDroppingHere ? 'border-[var(--brand-secondary)] text-[var(--brand-secondary)]' : 'border-[var(--notion-border)] text-[var(--notion-text-light)]'}`}>
                  {isDroppingHere ? '↓ Déposer ici' : 'Aucune carte'}
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

  const today = new Date();
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i - 3);
    return d;
  });

  return (
    <div
      className="rounded-xl border border-[var(--notion-border)] overflow-hidden -mx-12 bg-[var(--notion-sidebar)]"
      style={{ boxShadow: 'var(--shadow-card)' }}
    >
      {/* Header */}
      <div className="flex h-11 border-b border-[var(--notion-border)] bg-[var(--surface-low)]">
        <div className="w-52 shrink-0 border-r border-[var(--notion-border)] flex items-center px-4 text-[11px] font-semibold text-[var(--notion-text-light)] uppercase tracking-wide">
          Équipe
        </div>
        <div className="flex-1 overflow-x-auto flex">
          {weekDays.map((d, i) => {
            const isToday = d.toDateString() === today.toDateString();
            return (
              <div
                key={i}
                className={`flex-1 min-w-[100px] flex items-center justify-center text-[11px] font-semibold uppercase tracking-wide border-r border-[var(--notion-border)] last:border-r-0 ${isToday ? 'text-[var(--brand-secondary)] bg-[var(--surface-mid)]' : 'text-[var(--notion-text-light)]'}`}
              >
                {d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}
              </div>
            );
          })}
        </div>
      </div>

      {/* Rows */}
      <div className="divide-y divide-[var(--notion-border)]">
        {userList.length === 0 ? (
          <div className="flex items-center justify-center py-16 text-[var(--notion-text-light)] text-sm">
            Aucun membre assigné
          </div>
        ) : userList.map(name => (
          <div key={name} className="flex hover:bg-[var(--notion-hover)] transition-colors">
            <div className="w-52 shrink-0 border-r border-[var(--notion-border)] py-4 px-4 flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-[var(--brand-secondary)] flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                {name[0]?.toUpperCase()}
              </div>
              <span className="text-sm font-medium text-[var(--notion-text)] truncate">{name}</span>
            </div>
            <div className="flex-1 flex relative overflow-x-auto">
              {weekDays.map((_, i) => (
                <div key={i} className="flex-1 min-w-[100px] border-r border-[var(--notion-border)] last:border-r-0 relative py-2 px-1.5">
                  {projects
                    .filter(p => getUserName(p.assignedTo) === name)
                    .filter(p => {
                      const dl = new Date(p.deadline);
                      return dl.toDateString() === weekDays[i].toDateString();
                    })
                    .map(p => (
                      <div
                        key={p._id}
                        className="bg-[var(--surface-high)] text-[var(--brand-secondary)] rounded-lg px-2 py-1 text-[10px] font-semibold mb-1 truncate border border-[var(--surface-mid)]"
                        title={p.name}
                      >
                        {p.name}
                      </div>
                    ))}
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
