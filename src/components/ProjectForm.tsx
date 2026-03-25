import React, { useState, useEffect } from 'react';
import { socket } from '../services/socket';
import { X, AlertCircle, User as UserIcon, Calendar, Tag, Box, Flag } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import type { User } from '../types';



interface ProjectFormProps {
  onClose?: () => void;
}

const ProjectForm: React.FC<ProjectFormProps> = ({ onClose }) => {
  const { user, token } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'Marketing',
    product: 'Catalog Item A',
    deadline: '',
    priority: 'Moyenne',
    urgent: false,
    assignedTo: ''
  });

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get('http://localhost:5001/api/users', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUsers(response.data);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };
    fetchUsers();
  }, [token]);

  const today = new Date().toISOString().split('T')[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (user && formData.name && formData.description && formData.deadline) {
      const submissionData = {
        ...formData,
        initiatorName: user.name,
      };
      socket.emit('new_project', submissionData);
      setFormData({
        name: '',
        description: '',
        type: 'Marketing',
        product: 'Catalog Item A',
        deadline: '',
        priority: 'Moyenne',
        urgent: false,
        assignedTo: ''
      });
      if (onClose) onClose();
      alert('Projet soumis avec succès !');
    }
  };

  return (
    <div className="bg-white h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[#ececeb]">
        <h2 className="text-lg font-bold text-[#37352f]">Démarrer un nouveau projet</h2>
        {onClose && (
          <button onClick={onClose} className="p-1 hover:bg-[#efefed] rounded transition-colors text-[#9b9a97]">
            <X size={20} />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-8 max-w-2xl mx-auto w-full">
        {/* Title Block */}
        <div className="space-y-2">
          <input
            type="text"
            className="w-full text-4xl font-bold placeholder-[#dfdfde] border-none outline-none focus:ring-0 p-0 text-[#37352f]"
            placeholder="Nom du projet..."
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>

        {/* Properties Grid */}
        <div className="space-y-1">
          {/* Initiator */}
          <div className="grid grid-cols-[140px_1fr] items-center py-1 group/row">
            <div className="flex items-center gap-2 text-[#9b9a97] text-sm">
              <UserIcon size={14} />
              <span>Initiateur</span>
            </div>
            <div className="px-2 py-1 text-sm text-[#37352f] font-medium bg-[#efefed] rounded w-fit">
              {user?.name}
            </div>
          </div>

          {/* Assigned To (Responsible) */}
          <div className="grid grid-cols-[140px_1fr] items-center py-1 group/row">
            <div className="flex items-center gap-2 text-[#9b9a97] text-sm">
              <AlertCircle size={14} />
              <span>Responsable</span>
            </div>
            <select
              className="px-2 py-1 text-sm text-[#37352f] hover:bg-[#efefed] rounded border-none outline-none focus:ring-0 transition-colors bg-transparent appearance-none cursor-pointer font-medium"
              value={formData.assignedTo}
              onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
              required
            >
              <option value="">Sélectionner...</option>
              {users.map(u => (
                <option key={u._id} value={u._id}>{u.name} ({u.role})</option>
              ))}
            </select>
          </div>

          {/* Type */}
          <div className="grid grid-cols-[140px_1fr] items-center py-1 group/row">
            <div className="flex items-center gap-2 text-[#9b9a97] text-sm">
              <Tag size={14} />
              <span>Type de Projet</span>
            </div>
            <select
              className="px-2 py-1 text-sm text-[#37352f] hover:bg-[#efefed] rounded border-none outline-none focus:ring-0 transition-colors bg-transparent appearance-none cursor-pointer font-medium"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            >
              <option value="Marketing">Marketing</option>
              <option value="Développement">Développement</option>
              <option value="Design">Design</option>
              <option value="Interne">Interne</option>
            </select>
          </div>

          {/* Product */}
          <div className="grid grid-cols-[140px_1fr] items-center py-1 group/row">
            <div className="flex items-center gap-2 text-[#9b9a97] text-sm">
              <Box size={14} />
              <span>Produit</span>
            </div>
            <input
              type="text"
              className="px-2 py-1 text-sm text-[#37352f] hover:bg-[#efefed] rounded border-none outline-none focus:ring-0 transition-colors bg-transparent font-medium"
              placeholder="Ex: Piroxen, Deslor..."
              value={formData.product}
              onChange={(e) => setFormData({ ...formData, product: e.target.value })}
              required
            />
          </div>

          {/* Deadline */}
          <div className="grid grid-cols-[140px_1fr] items-center py-1 group/row">
            <div className="flex items-center gap-2 text-[#9b9a97] text-sm">
              <Calendar size={14} />
              <span>Deadline</span>
            </div>
            <input
              type="date"
              min={today}
              className="px-2 py-1 text-sm text-[#37352f] hover:bg-[#efefed] rounded border-none outline-none focus:ring-0 transition-colors bg-transparent cursor-pointer font-medium"
              value={formData.deadline}
              onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
              required
            />
          </div>

          {/* Priority */}
          <div className="grid grid-cols-[140px_1fr] items-center py-1 group/row">
            <div className="flex items-center gap-2 text-[#9b9a97] text-sm">
              <Flag size={14} />
              <span>Priorité</span>
            </div>
            <select
              className="px-2 py-1 text-sm text-[#37352f] hover:bg-[#efefed] rounded border-none outline-none focus:ring-0 transition-colors bg-transparent appearance-none cursor-pointer font-medium"
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
            >
              <option value="Basse">Basse</option>
              <option value="Moyenne">Moyenne</option>
              <option value="Haute">Haute</option>
            </select>
          </div>

          {/* Urgent */}
          <div className="grid grid-cols-[140px_1fr] items-center py-1 group/row">
            <div className="flex items-center gap-2 text-[#9b9a97] text-sm">
              <AlertCircle size={14} className="text-[#eb5757]" />
              <span>Urgent</span>
            </div>
            <div className="flex items-center px-2">
              <input
                type="checkbox"
                className="w-4 h-4 text-blue-600 border-[#ececeb] rounded focus:ring-0 cursor-pointer"
                checked={formData.urgent}
                onChange={(e) => setFormData({ ...formData, urgent: e.target.checked })}
              />
            </div>
          </div>
        </div>

        <div className="h-px bg-[#ececeb] my-4" />

        {/* Content Block */}
        <div className="space-y-4">
          <textarea
            className="w-full text-base placeholder-[#dfdfde] border-none outline-none focus:ring-0 p-0 text-[#37352f] min-h-[200px] resize-none"
            placeholder="Détails du projet et besoins métier..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            required
          />
        </div>

        {/* Action Button */}
        <div className="pt-8">
          <button
            type="submit"
            className="bg-[#2383e2] hover:bg-[#0070f3] text-white font-semibold py-1.5 px-4 rounded text-sm transition-all shadow-sm"
          >
            Créer la page du projet
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProjectForm;
