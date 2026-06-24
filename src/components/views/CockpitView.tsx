import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Building2, Plus, Search, Trash2, AlertTriangle, Pencil, X, Save, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
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

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

export function CockpitView() {
  const { token } = useAuth();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [deptToDelete, setDeptToDelete] = useState<Department | null>(null);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [newDept, setNewDept] = useState({ 
    name: '', 
    adminId: '', 
    activePages: ['table', 'kanban', 'timeline', 'calendrier', 'reporting', 'urgences', 'stats'] 
  });

  const [editData, setEditData] = useState({
    name: '',
    adminId: '',
    activePages: [] as string[]
  });

  const fetchDepartments = React.useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/api/departments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDepartments(response.data);
    } catch (err) {
      console.error('Failed to fetch departments:', err);
    }
  }, [token]);

  useEffect(() => {
    if (token) fetchDepartments();
  }, [fetchDepartments, token]);

  const handleCreateDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/api/departments`, newDept, {
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

  const handleStartEdit = (dept: Department) => {
    setEditingDept(dept);
    setEditData({
      name: dept.name,
      adminId: dept.adminId,
      activePages: dept.activePages || []
    });
  };

  const handleUpdateDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDept) return;
    setIsSaving(true);
    try {
      await axios.put(`${API_URL}/api/departments/${editingDept.id}`, editData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEditingDept(null);
      fetchDepartments();
    } catch (err) {
      console.error('Failed to update department:', err);
      alert('Erreur lors de la mise à jour');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteDepartment = async () => {
    if (!deptToDelete) return;
    setIsDeleting(true);
    try {
      await axios.delete(`${API_URL}/api/departments/${deptToDelete.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDeptToDelete(null);
      fetchDepartments();
    } catch (err) {
      console.error('Failed to delete department:', err);
      alert('Erreur lors de la suppression');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 mb-2 flex items-center gap-2">
            <Building2 className="w-8 h-8 text-slate-400" />
            Cockpit Super Admin
          </h1>
          <p className="text-slate-500">Gerez les departements et leurs administrateurs</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#1e293b] text-white rounded-lg hover:bg-[#334155] transition-colors font-medium shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Nouveau Departement
        </button>
      </div>

      {showAddForm && (
        <div className="mb-8 p-6 border border-slate-200 rounded-xl bg-slate-50/50 animate-in slide-in-from-top duration-300">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-slate-800">Creer un nouveau departement</h2>
            <button onClick={() => setShowAddForm(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
          </div>
          <form onSubmit={handleCreateDepartment} className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1">Nom du departement</label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 outline-none transition-all font-medium"
                  value={newDept.name}
                  onChange={(e) => setNewDept({ ...newDept, name: e.target.value })}
                  placeholder="Ex: Direction Financiere"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1">Email de l'Administrateur</label>
                <input
                  type="email"
                  required
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 outline-none transition-all font-medium"
                  value={newDept.adminId}
                  onChange={(e) => setNewDept({ ...newDept, adminId: e.target.value })}
                  placeholder="admin.finance@workplan.com"
                />
              </div>
            </div>
            
            <div className="pt-2">
              <label className="block text-sm font-semibold text-slate-600 mb-3">Pages Autorisees</label>
              <div className="flex flex-wrap gap-x-6 gap-y-3">
                {AVAILABLE_PAGES.map(page => (
                  <label key={page.id} className="flex items-center gap-2.5 text-sm font-medium text-slate-700 cursor-pointer group">
                    <input
                      type="checkbox"
                      className="rounded border-slate-300 text-slate-900 focus:ring-slate-900 w-4 h-4 cursor-pointer"
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
                    <span className="group-hover:text-slate-900 transition-colors">{page.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex gap-3 justify-end mt-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 text-slate-500 hover:text-slate-700 font-bold transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-8 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all font-bold shadow-lg shadow-slate-200"
              >
                Creer le département
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Form */}
      {editingDept && (
        <div className="mb-8 p-6 border border-slate-200 rounded-xl bg-slate-50/50 animate-in slide-in-from-top duration-300 ring-2 ring-slate-900/10">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Pencil size={18} className="text-slate-400" />
              Modifier le département: <span className="text-slate-500">{editingDept.name}</span>
            </h2>
            <button onClick={() => setEditingDept(null)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
          </div>
          <form onSubmit={handleUpdateDepartment} className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1">Nom du departement</label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 outline-none transition-all font-medium"
                  value={editData.name}
                  onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1">Email de l'Administrateur</label>
                <input
                  type="email"
                  required
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 outline-none transition-all font-medium"
                  value={editData.adminId}
                  onChange={(e) => setEditData({ ...editData, adminId: e.target.value })}
                />
              </div>
            </div>
            
            <div className="pt-2">
              <label className="block text-sm font-semibold text-slate-600 mb-3">Pages Autorisees</label>
              <div className="flex flex-wrap gap-x-6 gap-y-3">
                {AVAILABLE_PAGES.map(page => (
                  <label key={page.id} className="flex items-center gap-2.5 text-sm font-medium text-slate-700 cursor-pointer group">
                    <input
                      type="checkbox"
                      className="rounded border-slate-300 text-slate-900 focus:ring-slate-900 w-4 h-4 cursor-pointer"
                      checked={editData.activePages.includes(page.id)}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setEditData(prev => ({
                          ...prev,
                          activePages: checked 
                            ? [...prev.activePages, page.id]
                            : prev.activePages.filter(p => p !== page.id)
                        }));
                      }}
                    />
                    <span className="group-hover:text-slate-900 transition-colors">{page.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex gap-3 justify-end mt-2">
              <button
                type="button"
                onClick={() => setEditingDept(null)}
                className="px-4 py-2 text-slate-500 hover:text-slate-700 font-bold transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-8 py-2.5 bg-[#1e293b] text-white rounded-xl hover:bg-[#334155] transition-all font-bold shadow-lg shadow-slate-100 flex items-center gap-2 disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save size={16} />}
                Enregistrer les modifications
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/50">
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">ID</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Departement</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Administrateur</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Configuration</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {departments.map((dept) => (
              <tr key={dept.id} className="hover:bg-slate-50/80 transition-colors group">
                <td className="px-6 py-4 text-xs text-slate-400 font-mono">{dept.id}</td>
                <td className="px-6 py-4 text-sm font-bold text-slate-700 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-all">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <div>{dept.workspaceTitle || dept.name}</div>
                    {dept.workspaceTitle && <div className="text-xs text-slate-400 font-normal">{dept.name}</div>}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-slate-500 font-medium">{dept.adminId}</td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600 uppercase tracking-tight">
                      {dept.products?.length || 0} Produits
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold bg-slate-50 text-slate-400 uppercase tracking-tight">
                      {dept.types?.length || 0} Types
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-1 items-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => handleStartEdit(dept)}
                      className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all"
                      title="Modifier le departement"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => setDeptToDelete(dept)}
                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                      title="Supprimer le departement"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {departments.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center">
                      <Search className="w-6 h-6 text-slate-200" />
                    </div>
                    <span className="font-medium">Aucun departement configure</span>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Danger Modal */}
      {deptToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-red-50 animate-in fade-in zoom-in duration-200">
            <div className="p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-7 h-7 text-red-600" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 leading-tight">Supprimer le département ?</h3>
                  <p className="text-sm text-slate-500 font-medium">Cette action est irréversible.</p>
                </div>
              </div>

              <div className="bg-red-50/50 border border-red-100 rounded-2xl p-5 mb-8">
                <p className="text-sm text-red-800 leading-relaxed font-medium">
                  Êtes-vous sûr de vouloir supprimer <strong>{deptToDelete.name}</strong> ? 
                  Toute la configuration et les accès associés seront définitivement effacés.
                </p>
              </div>

              <div className="flex gap-3 justify-end font-bold text-sm">
                <button
                  onClick={() => setDeptToDelete(null)}
                  disabled={isDeleting}
                  className="px-6 py-3 text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-50"
                >
                  Annuler
                </button>
                <button
                  onClick={handleDeleteDepartment}
                  disabled={isDeleting}
                  className="px-8 py-3 bg-red-600 text-white rounded-2xl hover:bg-red-700 transition-all shadow-xl shadow-red-100 disabled:opacity-50 flex items-center gap-2"
                >
                  {isDeleting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
