import React, { useState, useEffect } from 'react';
import { 
  Search, // Restored Search icon for Sidebar
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
  Building2
} from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '../context/useNavigation';
import type { ViewType, Department, FormField } from '../types';
import SearchModal from './SearchModal';
import InboxPanel from './InboxPanel';
import SettingsModal from './SettingsModal';
import type { Project, Notification } from '../types';
import { socket } from '../services/socket';
import logo from '../assets/logo.png';

const Sidebar: React.FC = () => {
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
  } | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (token) {
      axios.get('http://localhost:5001/api/notifications', { headers: { Authorization: `Bearer ${token}` } })
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
      axios.get('http://localhost:5001/api/departments', { headers: { Authorization: `Bearer ${token}` } })
        .then(res => setDepartments(res.data))
        .catch(err => console.error(err));
    }
  }, [token, user?.role]);

  useEffect(() => {
    if (token && user?.role !== 'superadmin' && user?.role !== 'guest') {
      axios.get('http://localhost:5001/api/departments/my-config', { headers: { Authorization: `Bearer ${token}` } })
        .then(res => setDeptConfig(res.data))
        .catch(err => console.error(err));
    }
  }, [token, user?.role]);

  useEffect(() => {
    if (token) {
      axios.get('http://localhost:5001/api/projects', { headers: { Authorization: `Bearer ${token}` } })
        .then(res => setProjects(res.data))
        .catch(err => console.error(err));
    }
  }, [token]);

  const mainPages: { id: ViewType; label: string; icon: React.ElementType }[] = [
    { id: 'table', label: 'Table', icon: TableIcon },
    { id: 'kanban', label: 'Pipline - Demandes et pr...', icon: Columns },
    { id: 'timeline', label: 'Planning - Equipe digitale', icon: Calendar },
    { id: 'calendrier', label: 'Calendrier Livrables', icon: Calendar },
    { id: 'reporting', label: 'Reporting', icon: BarChart2 },
    { id: 'urgences', label: 'Urgences - à traiter imm...', icon: AlertCircle },
    { id: 'demarrer', label: 'Démarrer projet', icon: PlusCircle },
    { id: 'stats', label: 'Stats', icon: PieChart },
  ];

  return (
    <>
      <aside className="w-64 bg-[#fbfbfa] border-r border-[#ececeb] flex flex-col h-screen sticky top-0 select-none">
        {/* Header / Workspace */}
        <div className="p-3 mb-2">
          <div className="flex items-center gap-2 px-2 py-2 hover:bg-[#efefed] rounded-lg cursor-pointer transition-colors group">
            <img src={logo} alt="FlowLive" className="w-8 h-8 rounded object-contain" />
            <div className="flex flex-col">
              <span className="text-sm font-bold leading-none text-[#1a4f8b]">Flow<span className="text-[#8cc63f]">Live</span></span>
              <span className="text-[10px] text-[#9b9a97] font-medium tracking-tight mt-0.5">Workspace</span>
            </div>
            <div className="flex-1" />
            <ChevronRight size={14} className="text-[#9b9a97] group-hover:text-[#37352f]" />
          </div>
        </div>

        {/* Main Nav */}
        <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto scrollbar-hide">
          <div 
            onClick={() => setActiveModal('search')}
            className="flex items-center gap-2 px-2 py-1.5 hover:bg-[#efefed] rounded-md cursor-pointer text-[#37352f] transition-colors group"
          >
            <Search size={16} className="text-[#9b9a97] group-hover:text-[#37352f]" />
            <span className="text-sm">Chercher</span>
          </div>
          <div 
            onClick={() => setActiveModal('inbox')}
            className="flex items-center gap-2 px-2 py-1.5 hover:bg-[#efefed] rounded-md cursor-pointer text-[#37352f] transition-colors group"
          >
            <Inbox size={16} className="text-[#9b9a97] group-hover:text-[#37352f]" />
            <span className="text-sm">Boîte de réception</span>
            <div className="flex-1" />
            {notifications.filter(n => !n.read).length > 0 && (
              <span className="bg-[#eb5757] text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                {notifications.filter(n => !n.read).length}
              </span>
            )}
          </div>
          <div 
            onClick={() => setActiveModal('settings')}
            className="flex items-center gap-2 px-2 py-1.5 hover:bg-[#efefed] rounded-md cursor-pointer text-[#37352f] transition-colors group"
          >
            <Settings size={16} className="text-[#9b9a97] group-hover:text-[#37352f]" />
            <span className="text-sm">Paramètres</span>
          </div>
          
          {user?.role === 'superadmin' && (
            <div 
              onClick={() => setView('cockpit')}
              className={`flex items-center gap-2 px-2 py-1.5 hover:bg-[#efefed] rounded-md cursor-pointer transition-colors group ${view === 'cockpit' ? 'bg-[#efefed] text-[#1a4f8b] font-bold shadow-sm' : 'text-[#37352f]'}`}
            >
              <Building2 size={16} className={view === 'cockpit' ? 'text-[#1a4f8b]' : 'text-[#9b9a97] group-hover:text-[#37352f]'} />
              <span className="text-sm">Cockpit Super Admin</span>
            </div>
          )}

          {user?.role === 'admin' && (
            <div 
              onClick={() => setView('dept_cockpit')}
              className={`flex items-center gap-2 px-2 py-1.5 hover:bg-[#efefed] rounded-md cursor-pointer transition-colors group ${view === 'dept_cockpit' ? 'bg-[#efefed] text-[#1a4f8b] font-bold shadow-sm' : 'text-[#37352f]'}`}
            >
              <Building2 size={16} className={view === 'dept_cockpit' ? 'text-[#1a4f8b]' : 'text-[#9b9a97] group-hover:text-[#37352f]'} />
              <span className="text-sm">Cockpit Département</span>
            </div>
          )}

          <div className="pt-6 pb-2 px-2">
            <span className="text-[11px] font-bold text-[#91918e] uppercase tracking-wider">
              {user?.role === 'superadmin' ? 'Systèmes Départements' : (deptConfig?.departmentName || 'Mon Département')}
            </span>
          </div>

          <div className="space-y-0.5">
            {user?.role === 'superadmin' ? (
              // Super Admin view: List of all departments
              departments.map((dept) => (
                <button
                  key={dept.id}
                  onClick={() => {
                    setSelectedDepartmentId(dept.id);
                    setView('table');
                  }}
                  className={`w-full flex items-center gap-2 px-2 py-1.5 hover:bg-[#efefed] rounded-md cursor-pointer transition-colors group ${
                    selectedDepartmentId === dept.id && view !== 'cockpit' ? 'bg-[#efefed] text-[#1a4f8b] font-bold shadow-sm' : 'text-[#37352f]'
                  }`}
                >
                  <LayoutGrid size={16} className={selectedDepartmentId === dept.id && view !== 'cockpit' ? 'text-[#1a4f8b]' : 'text-[#9b9a97]'} />
                  <span className="text-sm truncate">{dept.name}</span>
                </button>
              ))
            ) : (
              // Admin/Other roles view: List of active pages for their department
              <div className="space-y-0.5">
                <div className="pl-2 space-y-0.5">
                  {mainPages.filter(item => {
                    if (!deptConfig || !deptConfig.activePages) return true;
                    return deptConfig.activePages.includes(item.id);
                  }).map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setView(item.id)}
                      className={`w-full flex items-center gap-2 px-2 py-1.5 hover:bg-[#efefed] rounded-md cursor-pointer transition-colors group ${
                        view === item.id ? 'bg-[#efefed] text-[#1a4f8b] font-bold shadow-sm' : 'text-[#5a5a57]'
                      }`}
                    >
                      <item.icon size={14} className={view === item.id ? 'text-[#1a4f8b]' : 'text-[#9b9a97] group-hover:text-[#37352f]'} />
                      <span className="text-sm text-left truncate">{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </nav>

        {/* Footer / User Profile */}
        <div className="p-3 border-t border-[#ececeb] space-y-2 bg-[#f7f7f5]">
          <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg transition-colors group">
            <div className="relative">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white shadow-sm">
                {user?.name?.[0] || '?'}
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full" />
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-sm font-semibold text-[#37352f] truncate">{user?.name || 'Utilisateur'}</span>
              <span className="text-[10px] text-[#9b9a97] truncate uppercase tracking-widest font-bold font-mono">{user?.role || 'Guest'}</span>
            </div>
          </div>
          
          <button 
            onClick={() => logout()}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-white border border-[#ececeb] hover:bg-[#ffe2dd] hover:text-[#6e3630] hover:border-[#6e3630]/20 rounded-md text-[#37352f] transition-all text-xs font-bold shadow-sm"
          >
            <LogOut size={14} />
            Se déconnecter
          </button>
        </div>
      </aside>

      {/* Modals */}
      {activeModal === 'search' && <SearchModal projects={projects} onClose={() => setActiveModal(null)} />}
      {activeModal === 'inbox' && <InboxPanel onClose={() => setActiveModal(null)} onNotificationRead={() => {
         // Refresh notifications when panel closes or a notification is read
         if (token) {
           axios.get('http://localhost:5001/api/notifications', { headers: { Authorization: `Bearer ${token}` } })
             .then(res => setNotifications(res.data));
         }
      }} />}
      {activeModal === 'settings' && <SettingsModal onClose={() => setActiveModal(null)} />}
    </>
  );
};

export default Sidebar;
