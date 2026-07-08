import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Building2, Plus, Search, Trash2, AlertTriangle, Pencil, X, Save, Loader2, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import type { Department } from '../../types';

const AVAILABLE_PAGES = [
  { id: 'table', label: 'Table' },
  { id: 'kanban', label: 'Pipeline' },
  { id: 'timeline', label: 'Planning' },
  { id: 'calendrier', label: 'Calendrier' },
  { id: 'reporting', label: 'Reporting' },
  { id: 'urgences', label: 'Urgences' },
  { id: 'stats', label: 'Stats' },
];

const API_URL = import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:5001' : window.location.origin);

const inputClass =
  'w-full px-3 py-2.5 bg-[var(--surface-low)] border border-[var(--notion-border)] rounded-xl text-[var(--notion-text)] text-sm outline-none transition-all focus:ring-2 focus:ring-[var(--brand-primary)]/10 focus:border-[var(--brand-primary)] placeholder:text-[var(--notion-text-light)]/60';
const labelClass =
  'block text-[10px] font-bold uppercase tracking-widest text-[var(--notion-text-light)] mb-1.5';

const PageCheckboxes = ({
  pages,
  onChange,
}: {
  pages: string[];
  onChange: (p: string[]) => void;
}) => (
  <div className="flex flex-wrap gap-x-5 gap-y-2.5">
    {AVAILABLE_PAGES.map(page => (
      <label
        key={page.id}
        className="flex items-center gap-2 text-sm font-medium text-[var(--notion-text-light)] cursor-pointer hover:text-[var(--notion-text)] transition-colors"
      >
        <input
          type="checkbox"
          className="rounded border-[var(--notion-border)] w-3.5 h-3.5 cursor-pointer accent-[var(--brand-primary)]"
          checked={pages.includes(page.id)}
          onChange={e =>
            onChange(
              e.target.checked
                ? [...pages, page.id]
                : pages.filter(p => p !== page.id)
            )
          }
        />
        {page.label}
      </label>
    ))}
  </div>
);

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
    activePages: ['table', 'kanban', 'timeline', 'calendrier', 'reporting', 'urgences', 'stats'],
  });
  const [editData, setEditData] = useState({
    name: '',
    adminId: '',
    activePages: [] as string[],
  });

  const fetchDepartments = React.useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/api/departments`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDepartments(res.data);
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
        headers: { Authorization: `Bearer ${token}` },
      });
      setShowAddForm(false);
      setNewDept({
        name: '',
        adminId: '',
        activePages: ['table', 'kanban', 'timeline', 'calendrier', 'reporting', 'urgences', 'stats'],
      });
      fetchDepartments();
    } catch (err) {
      console.error('Failed to create department:', err);
    }
  };

  const handleStartEdit = (dept: Department) => {
    setEditingDept(dept);
    setEditData({ name: dept.name, adminId: dept.adminId, activePages: dept.activePages || [] });
  };

  const handleUpdateDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDept) return;
    setIsSaving(true);
    try {
      await axios.put(`${API_URL}/api/departments/${editingDept.id}`, editData, {
        headers: { Authorization: `Bearer ${token}` },
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
        headers: { Authorization: `Bearer ${token}` },
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
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--notion-text)] flex items-center gap-2.5">
            <Building2 className="w-6 h-6 text-[var(--brand-secondary)]" />
            Cockpit Super Admin
          </h1>
          <p className="text-sm text-[var(--notion-text-light)] mt-0.5">
            Gérez les départements et leurs administrateurs
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[var(--brand-primary)] hover:bg-[var(--brand-secondary)] text-white rounded-xl text-sm font-semibold transition-all active:scale-[0.98]"
          style={{ boxShadow: 'var(--shadow-btn)' }}
        >
          <Plus size={15} />
          Nouveau département
        </button>
      </div>

      {/* Create form */}
      {showAddForm && (
        <div
          className="bg-[var(--notion-sidebar)] border border-[var(--notion-border)] rounded-2xl overflow-hidden animate-in slide-in-from-top-2 duration-200"
          style={{ boxShadow: 'var(--shadow-card)' }}
        >
          <div className="h-0.5 bg-gradient-to-r from-[var(--brand-primary)] via-[var(--brand-secondary)] to-[#38bdf8]" />
          <div className="p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-[var(--notion-text)]">
                Créer un nouveau département
              </h2>
              <button
                onClick={() => setShowAddForm(false)}
                className="p-1.5 hover:bg-[var(--notion-hover)] rounded-lg text-[var(--notion-text-light)] transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleCreateDepartment} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Nom du département</label>
                  <input
                    type="text"
                    required
                    className={inputClass}
                    value={newDept.name}
                    onChange={e => setNewDept({ ...newDept, name: e.target.value })}
                    placeholder="Ex: Direction Financière"
                  />
                </div>
                <div>
                  <label className={labelClass}>Email de l'administrateur</label>
                  <input
                    type="email"
                    required
                    className={inputClass}
                    value={newDept.adminId}
                    onChange={e => setNewDept({ ...newDept, adminId: e.target.value })}
                    placeholder="admin@workplan.com"
                  />
                </div>
              </div>
              <div>
                <label className={labelClass}>Pages autorisées</label>
                <PageCheckboxes
                  pages={newDept.activePages}
                  onChange={pages => setNewDept({ ...newDept, activePages: pages })}
                />
              </div>
              <div className="flex gap-3 justify-end pt-3 border-t border-[var(--notion-border)]">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 text-sm text-[var(--notion-text-light)] hover:text-[var(--notion-text)] font-medium transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-[var(--brand-primary)] hover:bg-[var(--brand-secondary)] text-white rounded-xl text-sm font-semibold transition-all flex items-center gap-2"
                  style={{ boxShadow: 'var(--shadow-btn)' }}
                >
                  Créer <ArrowRight size={14} />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit form */}
      {editingDept && (
        <div
          className="bg-[var(--notion-sidebar)] border-2 border-[var(--brand-secondary)]/20 rounded-2xl overflow-hidden animate-in slide-in-from-top-2 duration-200"
          style={{ boxShadow: 'var(--shadow-elevated)' }}
        >
          <div className="h-0.5 bg-gradient-to-r from-[var(--brand-primary)] via-[var(--brand-secondary)] to-[#38bdf8]" />
          <div className="p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-[var(--notion-text)] flex items-center gap-2">
                <Pencil size={15} className="text-[var(--brand-secondary)]" />
                Modifier :{' '}
                <span className="text-[var(--notion-text-light)]">{editingDept.name}</span>
              </h2>
              <button
                onClick={() => setEditingDept(null)}
                className="p-1.5 hover:bg-[var(--notion-hover)] rounded-lg text-[var(--notion-text-light)] transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleUpdateDepartment} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Nom du département</label>
                  <input
                    type="text"
                    required
                    className={inputClass}
                    value={editData.name}
                    onChange={e => setEditData({ ...editData, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className={labelClass}>Email de l'administrateur</label>
                  <input
                    type="email"
                    required
                    className={inputClass}
                    value={editData.adminId}
                    onChange={e => setEditData({ ...editData, adminId: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className={labelClass}>Pages autorisées</label>
                <PageCheckboxes
                  pages={editData.activePages}
                  onChange={pages => setEditData({ ...editData, activePages: pages })}
                />
              </div>
              <div className="flex gap-3 justify-end pt-3 border-t border-[var(--notion-border)]">
                <button
                  type="button"
                  onClick={() => setEditingDept(null)}
                  className="px-4 py-2 text-sm text-[var(--notion-text-light)] hover:text-[var(--notion-text)] font-medium transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2 bg-[var(--brand-primary)] hover:bg-[var(--brand-secondary)] text-white rounded-xl text-sm font-semibold transition-all flex items-center gap-2 disabled:opacity-50"
                  style={{ boxShadow: 'var(--shadow-btn)' }}
                >
                  {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Departments table */}
      <div
        className="bg-[var(--notion-sidebar)] border border-[var(--notion-border)] rounded-2xl overflow-hidden"
        style={{ boxShadow: 'var(--shadow-card)' }}
      >
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[var(--surface-low)] border-b border-[var(--notion-border)]">
              <th className="px-5 py-3 text-[10px] font-bold text-[var(--notion-text-light)] uppercase tracking-wider">
                ID
              </th>
              <th className="px-5 py-3 text-[10px] font-bold text-[var(--notion-text-light)] uppercase tracking-wider">
                Département
              </th>
              <th className="px-5 py-3 text-[10px] font-bold text-[var(--notion-text-light)] uppercase tracking-wider">
                Administrateur
              </th>
              <th className="px-5 py-3 text-[10px] font-bold text-[var(--notion-text-light)] uppercase tracking-wider">
                Configuration
              </th>
              <th className="px-5 py-3 text-[10px] font-bold text-[var(--notion-text-light)] uppercase tracking-wider text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--notion-border)]">
            {departments.map(dept => (
              <tr
                key={dept.id}
                className="hover:bg-[var(--notion-hover)] transition-colors group"
              >
                <td className="px-5 py-3.5 text-[11px] text-[var(--notion-text-light)] font-mono">
                  {dept.id}
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-[var(--surface-low)] flex items-center justify-center text-[var(--notion-text-light)] group-hover:bg-[var(--brand-primary)] group-hover:text-white transition-all">
                      <Building2 size={15} />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-[var(--notion-text)]">
                        {dept.workspaceTitle || dept.name}
                      </div>
                      {dept.workspaceTitle && (
                        <div className="text-[11px] text-[var(--notion-text-light)]">
                          {dept.name}
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3.5 text-sm text-[var(--notion-text-light)]">
                  {dept.adminId}
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex gap-1.5">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-[var(--surface-low)] text-[var(--notion-text-light)]">
                      {dept.products?.length || 0} Produits
                    </span>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-[var(--notion-hover)] text-[var(--notion-text-light)]">
                      {dept.types?.length || 0} Types
                    </span>
                  </div>
                </td>
                <td className="px-5 py-3.5 text-right">
                  <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleStartEdit(dept)}
                      title="Modifier"
                      className="p-1.5 rounded-lg text-[var(--notion-text-light)] hover:text-[var(--notion-text)] hover:bg-[var(--notion-hover)] transition-all"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => setDeptToDelete(dept)}
                      title="Supprimer"
                      className="p-1.5 rounded-lg text-[var(--notion-text-light)] hover:text-red-500 hover:bg-red-50 transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {departments.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-16 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-[var(--surface-low)] flex items-center justify-center">
                      <Search size={20} className="text-[var(--notion-text-light)]" />
                    </div>
                    <span className="text-sm font-medium text-[var(--notion-text-light)]">
                      Aucun département configuré
                    </span>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Delete confirmation modal */}
      {deptToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div
            className="bg-[var(--notion-sidebar)] rounded-2xl max-w-md w-full border border-[var(--notion-border)] overflow-hidden animate-in fade-in zoom-in-95 duration-200"
            style={{ boxShadow: 'var(--shadow-elevated)' }}
          >
            <div className="h-0.5 bg-gradient-to-r from-red-500 via-red-400 to-rose-300" />
            <div className="p-7">
              <div className="flex items-center gap-4 mb-5">
                <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center shrink-0">
                  <AlertTriangle size={22} className="text-red-500" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[var(--notion-text)] leading-tight">
                    Supprimer le département ?
                  </h3>
                  <p className="text-xs text-[var(--notion-text-light)] mt-0.5">
                    Cette action est irréversible.
                  </p>
                </div>
              </div>

              <div className="bg-red-50 border border-red-100 rounded-xl p-4 mb-6">
                <p className="text-sm text-red-700 leading-relaxed">
                  Êtes-vous sûr de vouloir supprimer{' '}
                  <strong>{deptToDelete.name}</strong> ? Toute la configuration et les accès
                  associés seront définitivement effacés.
                </p>
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setDeptToDelete(null)}
                  disabled={isDeleting}
                  className="px-5 py-2 text-sm text-[var(--notion-text-light)] hover:text-[var(--notion-text)] font-medium transition-colors disabled:opacity-50"
                >
                  Annuler
                </button>
                <button
                  onClick={handleDeleteDepartment}
                  disabled={isDeleting}
                  className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {isDeleting ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Trash2 size={14} />
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
