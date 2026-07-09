import React, { useState, useEffect } from 'react';
import {
  Search,
  Inbox,
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
  Languages,
  ChevronDown,
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
    rolePages?: Record<string, string[]>;
  } | null>(null);

  const DEFAULT_ROLE_PAGES: Record<string, string[]> = {
    'worker':          ['table', 'kanban', 'timeline', 'calendrier'],
    'chef de produit': ['table', 'kanban', 'timeline', 'calendrier', 'reporting', 'urgences', 'stats'],
  };

  const isSidebarPageVisible = (pageId: string): boolean => {
    if (user?.role === 'superadmin' || user?.role === 'chef de projet') return true;
    if (deptConfig?.activePages && !deptConfig.activePages.includes(pageId)) return false;
    const role = user?.role ?? '';
    const allowed = deptConfig?.rolePages?.[role] ?? DEFAULT_ROLE_PAGES[role];
    if (allowed && !allowed.includes(pageId)) return false;
    return true;
  };
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

  const unreadCount = notifications.filter(n => !n.read).length;

  const workspaceName =
    user?.role === 'superadmin'
      ? (departments.find(d => d.id === selectedDepartmentId)?.workspaceTitle ||
         departments.find(d => d.id === selectedDepartmentId)?.name ||
         'Badgi-WorkFlow')
      : (deptConfig?.workspaceTitle || 'Badgi-WorkFlow');

  const workspaceLogo =
    user?.role === 'superadmin'
      ? (departments.find(d => d.id === selectedDepartmentId)?.logoUrl || logo)
      : (deptConfig?.logoUrl || logo);

  return (
    <>
      <aside className="w-64 flex flex-col h-screen sticky top-0 select-none bg-[var(--notion-sidebar)] border-r border-[var(--notion-border)]" style={{ transition: 'background-color 0.25s ease' }}>

        {/* ── Workspace header ── */}
        <div className="px-4 pt-4 pb-3 border-b border-[var(--notion-border)]">
          <div className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-[var(--notion-hover)] cursor-pointer transition-colors group">
            <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 bg-[var(--surface-low)] flex items-center justify-center">
              <img src={workspaceLogo} alt="Logo" className="w-full h-full object-contain p-0.5" />
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-[13px] font-semibold text-[var(--notion-text)] truncate leading-tight">
                {workspaceName}
              </span>
              <span className="text-[11px] text-[var(--notion-text-light)] truncate mt-0.5">
                {deptConfig?.workspaceSubtitle || 'Badgi-WorkFlow'}
              </span>
            </div>
            <ChevronDown size={14} className="text-[var(--notion-text-light)] shrink-0" />
          </div>
        </div>

        {/* ── Utility nav ── */}
        <nav className="flex-1 flex flex-col overflow-y-auto scrollbar-hide px-3 pt-3">

          {/* Quick actions */}
          <div className="space-y-0.5 mb-3">
            <NavItem icon={Search} label={t('common.search')} onClick={() => setActiveModal('search')} />
            <NavItem
              icon={Inbox}
              label={t('common.inbox')}
              onClick={() => setActiveModal('inbox')}
              badge={unreadCount > 0 ? unreadCount : undefined}
            />
            <NavItem icon={Settings} label={t('common.settings')} onClick={() => setActiveModal('settings')} />
          </div>

          {/* Role-based cockpit links */}
          {user?.role === 'superadmin' && (
            <div className="mb-3">
              <NavItem
                icon={Building2}
                label="Cockpit Super Admin"
                active={view === 'cockpit'}
                onClick={() => setView('cockpit')}
              />
            </div>
          )}
          {user?.role === 'chef de projet' && (
            <div className="mb-3">
              <NavItem
                icon={Building2}
                label={t('common.cockpit')}
                active={view === 'dept_cockpit'}
                onClick={() => setView('dept_cockpit')}
              />
            </div>
          )}

          {/* Section label */}
          <div className="px-2 mb-2 mt-1">
            <span className="text-[10px] font-bold text-[var(--notion-text-light)] uppercase tracking-widest">
              {user?.role === 'superadmin'
                ? 'Départements'
                : (deptConfig?.workspaceTitle || deptConfig?.departmentName || t('common.workspace'))}
            </span>
          </div>

          {/* Views */}
          <div className="space-y-0.5 flex-1">
            {user?.role === 'superadmin' ? (
              departments.map((dept) => (
                <button
                  key={dept.id}
                  onClick={() => { setSelectedDepartmentId(dept.id); setView('table'); }}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition-colors ${
                    selectedDepartmentId === dept.id && view !== 'cockpit'
                      ? 'bg-[var(--surface-high)] text-[var(--brand-secondary)] font-semibold'
                      : 'text-[var(--notion-text-light)] hover:bg-[var(--notion-hover)] hover:text-[var(--notion-text)]'
                  }`}
                >
                  <LayoutGrid
                    size={15}
                    className={selectedDepartmentId === dept.id && view !== 'cockpit'
                      ? 'text-[var(--brand-secondary)] shrink-0'
                      : 'text-[var(--notion-text-light)] shrink-0'}
                  />
                  <span className="text-sm truncate">{dept.workspaceTitle || dept.name}</span>
                </button>
              ))
            ) : (
              mainPages
                .filter(item => isSidebarPageVisible(item.id))
                .map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setView(item.id)}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition-colors ${
                      view === item.id
                        ? 'bg-[var(--surface-high)] text-[var(--brand-secondary)] font-semibold'
                        : 'text-[var(--notion-text-light)] hover:bg-[var(--notion-hover)] hover:text-[var(--notion-text)]'
                    }`}
                  >
                    <item.icon
                      size={15}
                      className={`shrink-0 ${view === item.id ? 'text-[var(--brand-secondary)]' : 'text-[var(--notion-text-light)]'}`}
                    />
                    <span className="text-sm truncate">{item.label}</span>
                  </button>
                ))
            )}
          </div>
        </nav>

        {/* ── Footer ── */}
        <div className="px-3 pb-3 pt-2 border-t border-[var(--notion-border)]">
          {/* Theme + Language row */}
          <div className="flex items-center justify-between px-1 mb-3">
            <button
              onClick={toggleTheme}
              title={theme === 'dark' ? t('theme.light') : t('theme.dark')}
              className="p-2 rounded-lg text-[var(--notion-text-light)] hover:text-[var(--notion-text)] hover:bg-[var(--notion-hover)] transition-all"
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            <div className="relative">
              <button
                onClick={() => setShowLangMenu(!showLangMenu)}
                className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-[var(--notion-text-light)] hover:text-[var(--notion-text)] hover:bg-[var(--notion-hover)] transition-all text-xs font-bold"
              >
                <Languages size={14} />
                <span className="uppercase">{i18n.language.split('-')[0]}</span>
              </button>
              {showLangMenu && (
                <div className="absolute bottom-full mb-2 left-0 w-32 bg-[var(--notion-sidebar)] border border-[var(--notion-border)] rounded-xl overflow-hidden z-50" style={{ boxShadow: 'var(--shadow-elevated)' }}>
                  {['fr', 'en', 'ar'].map((lng) => (
                    <button
                      key={lng}
                      onClick={() => changeLanguage(lng)}
                      className="w-full text-left px-3 py-2 text-xs text-[var(--notion-text)] hover:bg-[var(--notion-hover)] transition-colors"
                    >
                      {lng === 'fr' ? 'Français' : lng === 'en' ? 'English' : 'العربية'}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* User profile */}
          <div className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-[var(--notion-hover)] cursor-default transition-colors">
            <div className="relative shrink-0">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                style={{ background: 'var(--brand-secondary)', boxShadow: '0 2px 8px rgba(0,88,190,0.3)' }}
              >
                {user?.name?.[0]?.toUpperCase() || '?'}
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-[var(--notion-sidebar)] rounded-full" />
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-[13px] font-semibold text-[var(--notion-text)] truncate leading-tight">
                {user?.name || 'Utilisateur'}
              </span>
              <span className="text-[10px] text-[var(--notion-text-light)] truncate uppercase tracking-wider font-medium">
                {user?.role || 'Guest'}
              </span>
            </div>
            <button
              onClick={() => logout()}
              title={t('common.logout')}
              className="p-1.5 rounded-lg text-[var(--notion-text-light)] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all shrink-0"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </aside>

      {/* Modals */}
      {activeModal === 'search' && <SearchModal projects={projects} onClose={() => setActiveModal(null)} />}
      {activeModal === 'inbox' && (
        <InboxPanel
          onClose={() => setActiveModal(null)}
          onNotificationRead={() => {
            if (token) {
              axios.get(`${API_URL}/api/notifications`, { headers: { Authorization: `Bearer ${token}` } })
                .then(res => setNotifications(res.data));
            }
          }}
        />
      )}
      {activeModal === 'settings' && <SettingsModal onClose={() => setActiveModal(null)} />}
    </>
  );
};

/* Small helper to reduce repetition in utility nav items */
interface NavItemProps {
  icon: React.ElementType;
  label: string;
  onClick?: () => void;
  active?: boolean;
  badge?: number;
}
const NavItem: React.FC<NavItemProps> = ({ icon: Icon, label, onClick, active, badge }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition-colors ${
      active
        ? 'bg-[var(--surface-high)] text-[var(--brand-secondary)] font-semibold'
        : 'text-[var(--notion-text-light)] hover:bg-[var(--notion-hover)] hover:text-[var(--notion-text)]'
    }`}
  >
    <Icon size={15} className={`shrink-0 ${active ? 'text-[var(--brand-secondary)]' : ''}`} />
    <span className="text-sm flex-1 truncate">{label}</span>
    {badge !== undefined && (
      <span className="shrink-0 bg-[#e11d48] text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold leading-none">
        {badge}
      </span>
    )}
  </button>
);

export default Sidebar;
