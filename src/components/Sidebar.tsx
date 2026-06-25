import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Inbox, 
  ChevronRight, 
  Settings, 
  LayoutGrid,
  Table as TableIcon,
  Columns,
  Calendar,
  LogOut,
  BarChart2,
  AlertCircle,
  PlusCircle,
  PieChart,
  Building2,
  Sun,
  Moon,
  Languages
} from 'lucide-react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '../context/useNavigation';
import { useTheme } from '../context/ThemeContext';
import type { ViewType, Department, FormField } from '../types';
import SearchModal from './SearchModal';
import InboxPanel from './InboxPanel';
import SettingsModal from './SettingsModal';
import type { Project, Notification } from '../types';
import { socket } from '../services/socket';
const logo = '/logo.png';

const API_URL = import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:5001' : window.location.origin);

const Sidebar: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const { user, logout, token } = useAuth();
  const { view, setView, selectedDepartmentId, setSelectedDepartmentId } = useNavigation();
  const [activeModal, setActiveModal] = useState<'search' | 'inbox' | 'settings' | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [deptConfig, setDeptConfig] = useState<{
    departmentId: string;
    departmentName: string;
    products: string[];
    types: string[];
    activePages: string[];
    pageConfigs: Record<string, unknown>;
    formFields: FormField[] | null;
    workspaceTitle?: string | null;
    workspaceSubtitle?: string | null;
    logoUrl?: string | null;
  } | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showLangMenu, setShowLangMenu] = useState(false);

  useEffect(() => {
    if (token) {
      axios.get(`${API_URL}/api/notifications`, { headers: { Authorization: `Bearer ${token}` } })
        .then(res => setNotifications(res.data))
        .catch(err => console.error(err));
    }
  }, [token]);

  useEffect(() => {
    socket.on('notification_added', (notif: Notification) => {
      if (notif.userId === user?._id) {
         setNotifications(prev => [notif, ...prev]);
      }
    });
    return () => { socket.off('notification_added'); };
  }, [user?._id]);

  useEffect(() => {
    if (token && user?.role === 'superadmin') {
      axios.get(`${API_URL}/api/departments`, { headers: { Authorization: `Bearer ${token}` } })
        .then(res => setDepartments(res.data))
        .catch(err => console.error(err));
    }
  }, [token, user?.role]);

  useEffect(() => {
    if (token && user?.role !== 'superadmin' && user?.role !== 'guest') {
      axios.get(`${API_URL}/api/departments/my-config`, { headers: { Authorization: `Bearer ${token}` } })
        .then(res => setDeptConfig(res.data))
        .catch(err => console.error(err));
    }
  }, [token, user?.role]);

  useEffect(() => {
    if (token) {
      axios.get(`${API_URL}/api/projects`, { headers: { Authorization: `Bearer ${token}` } })
        .then(res => setProjects(res.data))
        .catch(err => console.error(err));
    }
  }, [token]);

  const mainPages: { id: ViewType; label: string; icon: React.ElementType }[] = [
    { id: 'table', label: t('dashboard.table'), icon: TableIcon },
    { id: 'kanban', label: t('dashboard.kanban'), icon: Columns },
    { id: 'timeline', label: t('dashboard.timeline'), icon: Calendar },
    { id: 'calendrier', label: t('dashboard.calendar'), icon: Calendar },
    { id: 'reporting', label: t('dashboard.reporting'), icon: BarChart2 },
    { id: 'urgences', label: t('dashboard.urgencies'), icon: AlertCircle },
    { id: 'demarrer', label: t('common.new'), icon: PlusCircle },
    { id: 'stats', label: t('dashboard.stats'), icon: PieChart },
  ];

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    setShowLangMenu(false);
  };

  return (
    <>
      <aside className="w-64 bg-[var(--notion-sidebar)] border-r border-[var(--notion-border)] flex flex-col h-screen sticky top-0 select-none transition-colors duration-300">
        {/* Header / Workspace */}
        <div className="p-3 mb-2">
          <div className="flex items-center gap-2 px-2 py-2 hover:bg-[var(--notion-hover)] rounded-lg cursor-pointer transition-colors group">
            <img
              src={
                user?.role === 'superadmin'
                  ? (departments.find(d => d.id === selectedDepartmentId)?.logoUrl || logo)
                  : (deptConfig?.logoUrl || logo)
              }
              alt="Logo"
              className="w-8 h-8 rounded object-contain"
            />
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-bold leading-none text-[var(--notion-text)] truncate">
                {user?.role === 'superadmin'
                  ? (departments.find(d => d.id === selectedDepartmentId)?.workspaceTitle || departments.find(d => d.id === selectedDepartmentId)?.name || 'Badgi-WorkFlow')
                  : (deptConfig?.workspaceTitle || 'Badgi-WorkFlow')}
              </span>
              <span className="text-[10px] text-[var(--notion-text-light)] font-medium tracking-tight mt-0.5">
                {deptConfig?.workspaceSubtitle || 'Badgi-WorkFlow'}
              </span>
            </div>
            <div className="flex-1" />
            <ChevronRight size={14} className="text-[var(--notion-text-light)] group-hover:text-[var(--notion-text)]" />
          </div>
        </div>

        {/* Main Nav */}
        <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto scrollbar-hide">
          <div 
            onClick={() => setActiveModal('search')}
            className="flex items-center gap-2 px-2 py-1.5 hover:bg-[var(--notion-hover)] rounded-md cursor-pointer text-[var(--notion-text)] transition-colors group"
          >
            <Search size={16} className="text-[var(--notion-text-light)] group-hover:text-[var(--notion-text)]" />
            <span className="text-sm">{t('common.search')}</span>
          </div>
          <div 
            onClick={() => setActiveModal('inbox')}
            className="flex items-center gap-2 px-2 py-1.5 hover:bg-[var(--notion-hover)] rounded-md cursor-pointer text-[var(--notion-text)] transition-colors group"
          >
            <Inbox size={16} className="text-[var(--notion-text-light)] group-hover:text-[var(--notion-text)]" />
            <span className="text-sm">{t('common.inbox')}</span>
            <div className="flex-1" />
            {notifications.filter(n => !n.read).length > 0 && (
              <span className="bg-[#e11d48] text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                {notifications.filter(n => !n.read).length}
              </span>
            )}
          </div>
          <div 
            onClick={() => setActiveModal('settings')}
            className="flex items-center gap-2 px-2 py-1.5 hover:bg-[var(--notion-hover)] rounded-md cursor-pointer text-[var(--notion-text)] transition-colors group"
          >
            <Settings size={16} className="text-[var(--notion-text-light)] group-hover:text-[var(--notion-text)]" />
            <span className="text-sm">{t('common.settings')}</span>
          </div>
          
          {user?.role === 'superadmin' && (
            <div 
              onClick={() => setView('cockpit')}
              className={`flex items-center gap-2 px-2 py-1.5 hover:bg-[var(--notion-hover)] rounded-md cursor-pointer transition-colors group ${view === 'cockpit' ? 'bg-[var(--notion-active)] text-[var(--notion-text)] font-bold shadow-sm' : 'text-[var(--notion-text)]'}`}
            >
              <Building2 size={16} className={view === 'cockpit' ? 'text-[var(--brand-accent)]' : 'text-[var(--notion-text-light)] group-hover:text-[var(--notion-text)]'} />
              <span className="text-sm border-none">Cockpit Super Admin</span>
            </div>
          )}

          {user?.role === 'chef de projet' && (
            <div 
              onClick={() => setView('dept_cockpit')}
              className={`flex items-center gap-2 px-2 py-1.5 hover:bg-[var(--notion-hover)] rounded-md cursor-pointer transition-colors group ${view === 'dept_cockpit' ? 'bg-[var(--notion-active)] text-[var(--notion-text)] font-bold shadow-sm' : 'text-[var(--notion-text)]'}`}
            >
              <Building2 size={16} className={view === 'dept_cockpit' ? 'text-[var(--brand-accent)]' : 'text-[var(--notion-text-light)] group-hover:text-[var(--notion-text)]'} />
              <span className="text-sm">{t('common.cockpit')}</span>
            </div>
          )}

          <div className="pt-6 pb-2 px-2">
            <span className="text-[11px] font-bold text-[var(--notion-text-light)] uppercase tracking-wider">
              {user?.role === 'superadmin' ? 'Systèmes Départements' : (deptConfig?.workspaceTitle || deptConfig?.departmentName || t('common.workspace'))}
            </span>
          </div>

          <div className="space-y-0.5">
            {user?.role === 'superadmin' ? (
              departments.map((dept) => (
                <button
                  key={dept.id}
                  onClick={() => {
                    setSelectedDepartmentId(dept.id);
                    setView('table');
                  }}
                  className={`w-full flex items-center gap-2 px-2 py-1.5 hover:bg-[var(--notion-hover)] rounded-md cursor-pointer transition-colors group ${
                    selectedDepartmentId === dept.id && view !== 'cockpit' ? 'bg-[var(--notion-active)] text-[var(--notion-text)] font-bold shadow-sm' : 'text-[var(--notion-text)]'
                  }`}
                >
                  <LayoutGrid size={16} className={selectedDepartmentId === dept.id && view !== 'cockpit' ? 'text-[var(--brand-accent)]' : 'text-[var(--notion-text-light)]'} />
                  <span className="text-sm truncate">{dept.workspaceTitle || dept.name}</span>
                </button>
              ))
            ) : (
              <div className="space-y-0.5">
                <div className="pl-2 space-y-0.5">
                  {mainPages.filter(item => {
                    if (!deptConfig || !deptConfig.activePages) return true;
                    return deptConfig.activePages.includes(item.id);
                  }).map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setView(item.id)}
                      className={`w-full flex items-center gap-2 px-2 py-1.5 hover:bg-[var(--notion-hover)] rounded-md cursor-pointer transition-colors group ${
                        view === item.id ? 'bg-[var(--brand-accent)] text-white shadow-lg shadow-[var(--brand-accent)]/20' : 'text-[var(--notion-text-light)]'
                      }`}
                    >
                      <item.icon size={14} className={view === item.id ? 'text-white' : 'text-[var(--notion-text-light)] group-hover:text-[var(--notion-text)]'} />
                      <span className="text-sm text-left truncate">{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </nav>

        {/* Footer / User Profile & Preferences */}
        <div className="p-3 border-t border-[var(--notion-border)] space-y-2 bg-[var(--notion-sidebar)]">
          {/* Theme & Language Toggles */}
          <div className="flex items-center justify-between px-2 mb-4">
            <button 
              onClick={toggleTheme}
              className="p-2 hover:bg-[var(--notion-hover)] rounded-xl text-[var(--notion-text-light)] hover:text-[var(--notion-text)] transition-all active:scale-90"
              title={theme === 'dark' ? t('theme.light') : t('theme.dark')}
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            
            <div className="relative">
              <button 
                onClick={() => setShowLangMenu(!showLangMenu)}
                className="flex items-center gap-1.5 px-2 py-1 hover:bg-[var(--notion-hover)] rounded-lg text-[var(--notion-text-light)] hover:text-[var(--notion-text)] transition-all active:scale-95 text-xs font-bold"
              >
                <Languages size={16} />
                <span className="uppercase">{i18n.language.split('-')[0]}</span>
              </button>
              
              {showLangMenu && (
                <div className="absolute bottom-full mb-2 left-0 w-32 bg-white dark:bg-slate-800 border border-[var(--notion-border)] rounded-xl shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-bottom-2">
                  <button onClick={() => changeLanguage('fr')} className="w-full text-left px-3 py-2 text-xs hover:bg-[var(--notion-hover)] text-[var(--notion-text)]">Français</button>
                  <button onClick={() => changeLanguage('en')} className="w-full text-left px-3 py-2 text-xs hover:bg-[var(--notion-hover)] text-[var(--notion-text)]">English</button>
                  <button onClick={() => changeLanguage('ar')} className="w-full text-left px-3 py-2 text-xs hover:bg-[var(--notion-hover)] text-[var(--notion-text)]">العربية</button>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg transition-colors group">
            <div className="relative">
              <div className="w-8 h-8 rounded-lg bg-[var(--brand-accent)] flex items-center justify-center text-white font-bold text-xs shadow-lg shadow-[var(--brand-accent)]/20 animate-in zoom-in-50">
                {user?.name?.[0] || '?'}
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full" />
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-sm font-semibold text-[var(--notion-text)] truncate">{user?.name || 'Utilisateur'}</span>
              <span className="text-[10px] text-[var(--notion-text-light)] truncate uppercase tracking-widest font-bold font-mono">{user?.role || 'Guest'}</span>
            </div>
          </div>
          
          <button 
            onClick={() => logout()}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-[var(--notion-bg)] border border-[var(--notion-border)] hover:bg-[#ffe2dd] hover:text-[#6e3630] hover:border-[#6e3630]/20 rounded-md text-[var(--notion-text)] transition-all text-xs font-bold shadow-sm"
          >
            <LogOut size={14} />
            {t('common.logout')}
          </button>
        </div>
      </aside>

      {/* Modals */}
      {activeModal === 'search' && <SearchModal projects={projects} onClose={() => setActiveModal(null)} />}
      {activeModal === 'inbox' && <InboxPanel onClose={() => setActiveModal(null)} onNotificationRead={() => {
         if (token) {
           axios.get(`${API_URL}/api/notifications`, { headers: { Authorization: `Bearer ${token}` } })
             .then(res => setNotifications(res.data));
         }
      }} />}
      {activeModal === 'settings' && <SettingsModal onClose={() => setActiveModal(null)} />}
    </>
  );
};

export default Sidebar;
