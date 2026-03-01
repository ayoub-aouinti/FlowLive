import React, { useEffect, useState } from 'react';
import { socket } from '../services/socket';
import { LayoutGrid, List, AlertCircle, CheckCircle2, Timer } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

interface Project {
  _id: string;
  name: string;
  initiatorName: string;
  description: string;
  type: 'Marketing' | 'Développement' | 'Design' | 'Interne';
  product: string;
  status: 'Nouveau' | 'En cours' | 'En révision' | 'Terminé';
  deadline: string;
  createdAt: string;
}

const calculatePriority = (deadline: string) => {
  const daysLeft = Math.ceil((new Date(deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
  if (daysLeft < 2) return { label: 'Urgent', color: 'bg-red-100 text-red-700 border-red-200' };
  if (daysLeft < 7) return { label: 'Medium', color: 'bg-orange-100 text-orange-700 border-orange-200' };
  return { label: 'Low', color: 'bg-green-100 text-green-700 border-green-200' };
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'Nouveau': return <AlertCircle size={14} className="text-blue-500" />;
    case 'En cours': return <Timer size={14} className="text-orange-500" />;
    case 'En révision': return <LayoutGrid size={14} className="text-purple-500" />;
    case 'Terminé': return <CheckCircle2 size={14} className="text-green-500" />;
    default: return null;
  }
};

const ProjectCard = ({ project }: { project: Project }) => {
  const priority = calculatePriority(project.deadline);
  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all group">
      <div className="flex justify-between items-start mb-2">
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${priority.color}`}>
          {priority.label}
        </span>
        <span className="text-[10px] font-medium text-gray-400">
          {new Date(project.deadline).toLocaleDateString()}
        </span>
      </div>
      <h4 className="font-bold text-gray-800 text-sm mb-1 group-hover:text-blue-600 transition-colors">{project.name}</h4>
      <p className="text-xs text-gray-500 line-clamp-2 mb-3">{project.description}</p>
      <div className="flex items-center justify-between pt-2 border-t border-gray-50">
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-600">
            {project.initiatorName[0]}
          </div>
          <span className="text-[10px] text-gray-400">{project.initiatorName}</span>
        </div>
        <span className="text-[10px] bg-slate-50 px-2 py-0.5 rounded text-slate-500">{project.type}</span>
      </div>
    </div>
  );
};

const KanbanColumn = ({ title, type, projects }: { title: string, type: string, projects: Project[] }) => {
  const filtered = projects.filter(p => p.type === type);
  return (
    <div className="flex flex-col gap-3 min-w-[280px]">
      <div className="flex items-center justify-between px-2">
        <h3 className="font-bold text-gray-600 text-sm uppercase tracking-wider">{title}</h3>
        <span className="bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full text-[10px] font-bold">
          {filtered.length}
        </span>
      </div>
      <div className="flex flex-col gap-3 bg-gray-50/50 p-2 rounded-2xl min-h-[400px]">
        {filtered.map(p => <ProjectCard key={p._id} project={p} />)}
      </div>
    </div>
  );
};

const Dashboard: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [view, setView] = useState<'table' | 'kanban'>('kanban');
  const { token } = useAuth();

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/projects', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setProjects(response.data);
      } catch (error) {
        console.error('Error fetching projects:', error);
      }
    };

    fetchProjects();

    socket.on('project_added', (newProject: Project) => {
      setProjects((prev) => {
        const updated = [...prev, newProject];
        return updated.sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());
      });
    });

    return () => {
      socket.off('project_added');
    };
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <h2 className="text-2xl font-black text-gray-900">Workflow Live</h2>
          <div className="flex items-center gap-2 mt-1">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Real-time sync active</span>
          </div>
        </div>
        
        <div className="flex bg-slate-100 p-1 rounded-xl">
          <button 
            onClick={() => setView('kanban')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${view === 'kanban' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <LayoutGrid size={18} />
            Kanban
          </button>
          <button 
            onClick={() => setView('table')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${view === 'table' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <List size={18} />
            Table
          </button>
        </div>
      </div>

      {view === 'kanban' ? (
        <div className="flex gap-6 overflow-x-auto pb-6 scrollbar-hide">
          <KanbanColumn title="Marketing" type="Marketing" projects={projects} />
          <KanbanColumn title="Développement" type="Développement" projects={projects} />
          <KanbanColumn title="Design" type="Design" projects={projects} />
          <KanbanColumn title="Interne" type="Interne" projects={projects} />
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-gray-100">
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Project</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Type</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Initiator</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Priority</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Deadline</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {projects.map((project) => {
                const priority = calculatePriority(project.deadline);
                return (
                  <tr key={project._id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-800">{project.name}</div>
                      <div className="text-xs text-gray-400">{project.product}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded font-medium">{project.type}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center text-[10px] font-bold text-blue-600">
                          {project.initiatorName[0]}
                        </div>
                        <span className="text-sm text-gray-600">{project.initiatorName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        {getStatusIcon(project.status)}
                        <span className="text-xs font-medium text-gray-600">{project.status}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${priority.color}`}>
                        {priority.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 font-medium">
                      {new Date(project.deadline).toLocaleDateString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {projects.length === 0 && (
            <div className="text-center py-20">
              <p className="text-gray-400">No projects data available.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
