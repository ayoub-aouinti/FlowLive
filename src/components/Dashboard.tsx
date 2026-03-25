import React, { useEffect, useState, useMemo } from 'react';
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
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '../context/useNavigation';
import type { Project, User } from '../types';
import ProjectForm from './ProjectForm';
import logo from '../assets/logo.png';
import CalendarView from './views/CalendarView';
import ReportingView from './views/ReportingView';
import StatsView from './views/StatsView';



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

const Dashboard: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const { view, setView } = useNavigation();
  const [showAddModal, setShowAddModal] = useState(false);
  const { token } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [projectsRes, usersRes] = await Promise.all([
          axios.get('http://localhost:5001/api/projects', { headers: { Authorization: `Bearer ${token}` } }),
          axios.get('http://localhost:5001/api/users', { headers: { Authorization: `Bearer ${token}` } })
        ]);
        setProjects(projectsRes.data);
        setUsers(usersRes.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();

    socket.on('project_added', (newProject: Project) => {
      setProjects((prev) => [...prev, newProject].sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime()));
    });

    return () => { socket.off('project_added'); };
  }, [token]);

  const getUserName = (userIdOrObj: string | User | undefined) => {
    if (!userIdOrObj) return '-';
    if (typeof userIdOrObj === 'string') {
      return users.find(u => u._id === userIdOrObj)?.name || '-';
    }
    return userIdOrObj.name || '-';
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-4 mb-8 pt-4">
        <img src={logo} alt="FlowLive" className="w-14 h-14 rounded-2xl object-contain shadow-sm border border-[#ececeb] p-1 bg-white" />
        <div>
          <h1 className="text-[40px] font-bold text-[#1a4f8b] leading-tight flex items-center gap-2">
            Flow<span className="text-[#8cc63f]">Live</span>
          </h1>
          <p className="text-[#9b9a97] text-lg font-medium -mt-1 tracking-tight">Planning Département Digital</p>
        </div>
      </div>

      <div className="flex items-center gap-1 border-b border-[#ececeb] mb-4 overflow-x-auto scrollbar-hide">
        <button 
          onClick={() => setView('table')}
          className={`flex items-center gap-1.5 px-3 py-2 text-sm transition-colors whitespace-nowrap border-b-2 ${view === 'table' ? 'border-[#1a4f8b] text-[#1a4f8b] font-medium' : 'border-transparent text-[#9b9a97] hover:bg-[#efefed]'}`}
        >
          <TableIcon size={14} />
          Table
        </button>
        <button 
          onClick={() => setView('kanban')}
          className={`flex items-center gap-1.5 px-3 py-2 text-sm transition-colors whitespace-nowrap border-b-2 ${view === 'kanban' ? 'border-[#1a4f8b] text-[#1a4f8b] font-medium' : 'border-transparent text-[#9b9a97] hover:bg-[#efefed]'}`}
        >
          <Columns size={14} />
          Pipeline - Demandes et pr...
        </button>
        <button 
          onClick={() => setView('timeline')}
          className={`flex items-center gap-1.5 px-3 py-2 text-sm transition-colors whitespace-nowrap border-b-2 ${view === 'timeline' ? 'border-[#1a4f8b] text-[#1a4f8b] font-medium' : 'border-transparent text-[#9b9a97] hover:bg-[#efefed]'}`}
        >
          <CalendarIcon size={14} />
          Planning - Equipe digitale
        </button>

        <button 
          onClick={() => setView('calendrier')}
          className={`flex items-center gap-2 px-3 py-2 border-b-2 transition-all text-sm font-medium whitespace-nowrap ${
            view === 'calendrier' ? 'border-[#1a4f8b] text-[#1a4f8b]' : 'border-transparent text-[#9b9a97] hover:bg-[#efefed]'
          }`}
        >
          <CalendarIcon size={14} />
          Calendrier Livrables
        </button>

        <button 
          onClick={() => setView('reporting')}
          className={`flex items-center gap-2 px-3 py-2 border-b-2 transition-all text-sm font-medium whitespace-nowrap ${
            view === 'reporting' ? 'border-[#1a4f8b] text-[#1a4f8b]' : 'border-transparent text-[#9b9a97] hover:bg-[#efefed]'
          }`}
        >
          <BarChart2 size={14} />
          Reporting
        </button>

        <button 
          onClick={() => setView('urgences')}
          className={`flex items-center gap-2 px-3 py-2 border-b-2 transition-all text-sm font-medium whitespace-nowrap ${
            view === 'urgences' ? 'border-[#1a4f8b] text-[#1a4f8b]' : 'border-transparent text-[#9b9a97] hover:bg-[#efefed]'
          }`}
        >
          <AlertCircle size={14} className="text-[#eb5757]" />
          Urgences
        </button>

        <button 
          onClick={() => setView('stats')}
          className={`flex items-center gap-2 px-3 py-2 border-b-2 transition-all text-sm font-medium whitespace-nowrap ${
            view === 'stats' ? 'border-[#1a4f8b] text-[#1a4f8b]' : 'border-transparent text-[#9b9a97] hover:bg-[#efefed]'
          }`}
        >
          <PieChart size={14} />
          Stats
        </button>
        
        <div className="flex-1" />
        
        <div className="flex items-center gap-2 pr-2">
          <button className="p-1.5 hover:bg-[#efefed] rounded transition-colors text-[#9b9a97]"><Search size={16} /></button>
          <button className="p-1.5 hover:bg-[#efefed] rounded transition-colors text-[#9b9a97]"><Filter size={16} /></button>
          <button className="p-1.5 hover:bg-[#efefed] rounded transition-colors text-[#9b9a97]"><ArrowUpDown size={16} /></button>
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1 bg-[#1a4f8b] hover:bg-[#154070] text-white text-xs font-bold px-3 py-1.5 rounded transition-all shadow-md active:scale-95"
          >
            Nouveau
            <Plus size={14} />
          </button>
        </div>
      </div>

      <div className="min-h-[500px]">
        {view === 'table' && <TableView projects={projects} getUserName={getUserName} />}
        {view === 'kanban' && <KanbanView projects={projects} />}
        {view === 'timeline' && <TimelineView projects={projects} getUserName={getUserName} />}
        {view === 'calendrier' && <CalendarView projects={projects} />}
        {view === 'reporting' && <ReportingView projects={projects} />}
        {view === 'urgences' && <ReportingView projects={projects.filter(p => p.urgent)} />}
        {view === 'stats' && <StatsView projects={projects} />}
        {view === 'demarrer' && (
          <div className="bg-white rounded-lg border border-[#ececeb] shadow-sm animate-in slide-in-from-bottom-4 duration-500">
             <ProjectForm />
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white w-[90%] max-w-4xl h-[90vh] rounded-lg shadow-2xl overflow-hidden relative translate-y-2 animate-in fade-in zoom-in duration-200">
            <ProjectForm onClose={() => setShowAddModal(false)} />
          </div>
        </div>
      )}
    </div>
  );
};

const TableView = ({ projects, getUserName }: { projects: Project[], getUserName: (u: string | User | undefined) => string }) => (
  <div className="overflow-x-auto -mx-12 px-12">
    <table className="w-full text-left border-collapse table-fixed min-w-[1000px]">
      <thead>
        <tr className="text-[#9b9a97] text-[12px] font-normal border-y border-[#ececeb]">
          <th className="px-2 py-2 w-[30%] border-r border-[#ececeb] font-normal">Nom du projet (Produit)</th>
          <th className="px-2 py-2 w-[15%] border-r border-[#ececeb] font-normal">Initiateur</th>
          <th className="px-2 py-2 w-[15%] border-r border-[#ececeb] font-normal">Affectation</th>
          <th className="px-2 py-2 w-[12%] border-r border-[#ececeb] font-normal">Produit</th>
          <th className="px-2 py-2 w-[12%] border-r border-[#ececeb] font-normal">Statut</th>
          <th className="px-2 py-2 w-[8%] border-r border-[#ececeb] font-normal">Urgent</th>
          <th className="px-2 py-2 w-[10%] font-normal">Priorité</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-[#ececeb]">
        {projects.map((p) => (
          <tr key={p._id} className="hover:bg-[#f7f7f5] transition-colors group text-sm">
            <td className="px-2 py-2 border-r border-[#ececeb]">
              <div className="flex items-center gap-2">
                <FileIcon />
                <span className="text-[#37352f] truncate">{p.name}</span>
              </div>
            </td>
            <td className="px-2 py-2 border-r border-[#ececeb] text-[#37352f]">{p.initiatorName}</td>
            <td className="px-2 py-2 border-r border-[#ececeb]">
              <span className="bg-[#d3e5ef] text-[#183347] px-1.5 py-0.5 rounded text-[12px] font-medium">
                {getUserName(p.assignedTo)}
              </span>
            </td>
            <td className="px-2 py-2 border-r border-[#ececeb] text-[#37352f]">{p.product}</td>
            <td className="px-2 py-2 border-r border-[#ececeb]">
              <span className={`inline-flex items-center gap-1.5 px-1.5 py-0.5 rounded text-[12px] font-medium ${getStatusColor(p.status)}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${p.status === 'Terminé' ? 'bg-[#1c3829]' : 'bg-current'}`} />
                {p.status}
              </span>
            </td>
            <td className="px-2 py-2 border-r border-[#ececeb] text-center">
              <input type="checkbox" checked={p.urgent} readOnly className="rounded border-[#ececeb] text-[#2383e2] focus:ring-0 shadow-none outline-none" />
            </td>
            <td className="px-2 py-1 flex items-center">
              <span className={`px-1.5 py-0.5 rounded text-[12px] font-medium ${getPriorityColor(p.priority)}`}>
                {p.priority}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const KanbanView = ({ projects }: { projects: Project[] }) => {
  const columns = ['Nouveau', 'En cours', 'En révision', 'Terminé'];
  return (
    <div className="flex gap-4 overflow-x-auto pb-8 -mx-12 px-12 scrollbar-hide">
      {columns.map(col => {
        const pCol = projects.filter(p => p.status === col);
        return (
          <div key={col} className="min-w-[280px] flex-1">
            <div className="flex items-center gap-2 mb-2 px-2">
              <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wide ${getStatusColor(col)}`}>
                {col}
              </span>
              <span className="text-[#9b9a97] text-xs font-medium">{pCol.length}</span>
            </div>
            <div className="space-y-2">
              {pCol.map(p => (
                <div key={p._id} className="bg-white border border-[#ececeb] rounded-md shadow-[0_1px_2px_rgba(0,0,0,0.1)] p-3 hover:shadow-md transition-shadow cursor-pointer group">
                  <div className="flex items-center gap-2 mb-2 text-sm font-medium text-[#37352f]">
                    <FileIcon />
                    {p.name}
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${getPriorityColor(p.priority)}`}>
                      {p.priority}
                    </span>
                    <span className="text-[10px] text-[#9b9a97] bg-[#f7f7f5] px-1.5 py-0.5 rounded">
                      {p.product}
                    </span>
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

const TimelineView = ({ projects, getUserName }: { projects: Project[], getUserName: (u: string | User | undefined) => string }) => {
  const users = useMemo(() => {
    const unique = new Set<string>();
    projects.forEach(p => {
       const name = getUserName(p.assignedTo);
       if (name !== '-') unique.add(name);
    });
    return Array.from(unique);
  }, [projects, getUserName]);

  return (
    <div className="border border-[#ececeb] rounded-lg overflow-hidden -mx-12">
      <div className="flex h-10 border-b border-[#ececeb] bg-[#f7f7f5]">
         <div className="w-48 border-r border-[#ececeb] flex items-center px-4 text-xs font-bold text-[#9b9a97] uppercase whitespace-nowrap">Equipe</div>
         <div className="flex-1 overflow-x-auto flex items-center px-4 gap-8 text-[11px] font-bold text-[#9b9a97] uppercase whitespace-nowrap">
           <span>18 Mar</span><span>19 Mar</span><span>20 Mar</span><span className="text-[#eb5757]">21 Mar</span><span>22 Mar</span><span>23 Mar</span><span>24 Mar</span>
         </div>
      </div>
      <div className="divide-y divide-[#ececeb]">
        {users.map(name => (
          <div key={name} className="flex">
            <div className="w-48 border-r border-[#ececeb] py-3 px-4 flex items-center gap-2">
              <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${getStatusColor('En cours')}`}>{name}</span>
            </div>
            <div className="flex-1 p-2 relative">
               {projects.filter(p => getUserName(p.assignedTo) === name).map((p) => (
                 <div key={p._id} className="bg-white border border-[#ececeb] rounded px-3 py-1.5 text-xs shadow-sm mb-1 inline-block ml-4">
                   {p.name}
                 </div>
               ))}
            </div>
          </div>
        ))}
        {users.length === 0 && <div className="p-8 text-center text-[#9b9a97] text-sm italic">Aucun projet assigné pour l'instant.</div>}
      </div>
    </div>
  );
};

const FileIcon = ({ size = 18 }: { size?: number }) => (
  <div className="text-[#9b9a97]">
    <svg width={size} height={(size * 18) / 14} viewBox="0 0 14 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M1 1.6C1 1.26863 1.26863 1 1.6 1H9.4L13 4.6V16.4C13 16.7314 12.7314 17 12.4 17H1.6C1.26863 17 1 16.7314 1 16.4V1.6Z" stroke="currentColor" strokeWidth="1.5" />
      <path d="M9 1V5H13" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  </div>
);

export default Dashboard;
