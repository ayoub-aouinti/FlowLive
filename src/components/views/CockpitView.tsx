import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Building2, Plus, Search } from 'lucide-react';
import type { Department } from '../../types';

const AVAILABLE_PAGES = [
  { id: 'table', label: 'Table' },
  { id: 'kanban', label: 'Pipeline' },
  { id: 'timeline', label: 'Planning' },
  { id: 'calendrier', label: 'Calendrier' },
  { id: 'reporting', label: 'Reporting' },
  { id: 'urgences', label: 'Urgences' },
  { id: 'stats', label: 'Stats' }
];

export function CockpitView() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newDept, setNewDept] = useState({ 
    name: '', 
    adminId: '', 
    activePages: ['table', 'kanban', 'timeline', 'calendrier', 'reporting', 'urgences', 'stats'] 
  });

  const fetchDepartments = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5001/api/departments', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDepartments(response.data);
    } catch (err) {
      console.error('Failed to fetch departments:', err);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const handleCreateDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5001/api/departments', newDept, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setShowAddForm(false);
      setNewDept({ 
        name: '', 
        adminId: '', 
        activePages: ['table', 'kanban', 'timeline', 'calendrier', 'reporting', 'urgences', 'stats'] 
      });
      fetchDepartments();
    } catch (err) {
      console.error('Failed to create department:', err);
    }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[--notion-text] mb-2 flex items-center gap-2">
            <Building2 className="w-8 h-8 text-neutral-400" />
            Cockpit Super Admin
          </h1>
          <p className="text-[--notion-text-light]">Gérez les départements et leurs administrateurs</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#1a4f8b] text-white rounded-lg hover:bg-[#154070] transition-colors font-medium shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Nouveau Département
        </button>
      </div>

      {showAddForm && (
        <div className="mb-8 p-6 border border-[--notion-border] rounded-xl bg-gray-50/50">
          <h2 className="text-lg font-semibold mb-4 text-[--notion-text]">Créer un nouveau département</h2>
          <form onSubmit={handleCreateDepartment} className="flex flex-col gap-4">
            <div className="flex gap-4 items-end">
              <div className="flex-1">
              <label className="block text-sm font-medium text-[--notion-text-light] mb-1">Nom du département</label>
              <input
                type="text"
                required
                className="w-full px-3 py-2 border border-[--notion-border] rounded-lg focus:ring-2 focus:ring-[--brand-blue]/20 focus:border-[--brand-blue] outline-none transition-all"
                value={newDept.name}
                onChange={(e) => setNewDept({ ...newDept, name: e.target.value })}
                placeholder="Ex: Direction Financière"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-[--notion-text-light] mb-1">Email de l'Administrateur</label>
              <input
                type="email"
                required
                className="w-full px-3 py-2 border border-[--notion-border] rounded-lg focus:ring-2 focus:ring-[--brand-blue]/20 focus:border-[--brand-blue] outline-none transition-all"
                value={newDept.adminId}
                onChange={(e) => setNewDept({ ...newDept, adminId: e.target.value })}
                placeholder="admin.finance@flow.com"
              />
            </div>
            </div>
            
            <div className="w-full pt-2 border-t border-[--notion-border]/50">
              <label className="block text-sm font-medium text-[--notion-text-light] mb-3">Pages Autorisées</label>
              <div className="flex flex-wrap gap-4">
                {AVAILABLE_PAGES.map(page => (
                  <label key={page.id} className="flex items-center gap-2 text-sm font-medium text-[--notion-text] cursor-pointer">
                    <input
                      type="checkbox"
                      className="rounded border-[--notion-border] text-[#1a4f8b] focus:ring-[#1a4f8b] w-4 h-4"
                      checked={newDept.activePages.includes(page.id)}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setNewDept(prev => ({
                          ...prev,
                          activePages: checked 
                            ? [...prev.activePages, page.id]
                            : prev.activePages.filter(p => p !== page.id)
                        }));
                      }}
                    />
                    {page.label}
                  </label>
                ))}
              </div>
            </div>

            <div className="flex gap-2 justify-end mt-4">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 text-neutral-500 hover:text-neutral-700 font-medium"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-[#1a4f8b] text-white rounded-lg hover:bg-[#154070] transition-colors font-medium shadow-sm"
              >
                Créer
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white border border-[--notion-border] rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[--notion-border] bg-neutral-50/50">
              <th className="px-6 py-4 text-sm font-medium text-[--notion-text-light]">ID</th>
              <th className="px-6 py-4 text-sm font-medium text-[--notion-text-light]">Département</th>
              <th className="px-6 py-4 text-sm font-medium text-[--notion-text-light]">Administrateur</th>
              <th className="px-6 py-4 text-sm font-medium text-[--notion-text-light]">Configuration</th>
            </tr>
          </thead>
          <tbody>
            {departments.map((dept) => (
              <tr key={dept.id} className="border-b border-[--notion-border] hover:bg-neutral-50/50 transition-colors group">
                <td className="px-6 py-4 text-sm text-[--notion-text-light] font-mono">{dept.id}</td>
                <td className="px-6 py-4 text-sm font-medium text-[--notion-text] flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-neutral-400 group-hover:text-[#1a4f8b] transition-colors" />
                  {dept.name}
                </td>
                <td className="px-6 py-4 text-sm text-[--notion-text-light]">{dept.adminId}</td>
                <td className="px-6 py-4">
                  <div className="flex gap-3">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#1a4f8b]/10 text-[#1a4f8b]">
                      {dept.products?.length || 0} Produits
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#8cc63f]/10 text-[#8cc63f]">
                      {dept.types?.length || 0} Types
                    </span>
                  </div>
                </td>
              </tr>
            ))}
            {departments.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-[--notion-text-light]">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center">
                      <Search className="w-6 h-6 text-neutral-400" />
                    </div>
                    <span>Aucun département configuré</span>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
