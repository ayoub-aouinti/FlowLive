import React, { useEffect, useState } from 'react';
import { socket } from '../services/socket';
import { Clock, Tag, User } from 'lucide-react';
import axios from 'axios';

interface Project {
  _id: string;
  name: string;
  description: string;
  type: string;
  product: string;
  deadline: string;
}

const Dashboard: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    // Initial load
    const fetchProjects = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/projects');
        setProjects(response.data);
      } catch (error) {
        console.error('Error fetching projects:', error);
      }
    };

    fetchProjects();

    // Listen for real-time updates
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
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-gray-800">Live Projects Dashboard</h2>
        <div className="flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
          </span>
          <span className="text-sm font-medium text-gray-500">Live Now</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {projects.map((project) => (
          <div
            key={project._id}
            className="bg-white p-6 rounded-2xl shadow-md border-l-4 border-blue-500 hover:shadow-lg transition-shadow"
          >
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold text-gray-800">{project.product}</h3>
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold uppercase tracking-wider">
                {project.type}
              </span>
            </div>
            <p className="text-gray-600 mb-6 line-clamp-2">{project.description}</p>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2 text-gray-500">
                <User size={16} />
                <span>{project.name}</span>
              </div>
              <div className="flex items-center gap-2 text-red-500 font-medium">
                <Clock size={16} />
                <span>{new Date(project.deadline).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {projects.length === 0 && (
        <div className="text-center py-20 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
          <p className="text-gray-400">No projects yet. Start pushing data from the left!</p>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
