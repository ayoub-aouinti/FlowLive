import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Plus, Users, LayoutList, Trash2, Building2, FileText, GripVertical, ChevronDown, Edit2, Check, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import type { User } from '../../types';

interface FormField {
  id: string;
  label: string;
  type: 'text' | 'date' | 'select' | 'checkbox' | 'user' | 'product' | 'projectType';
  required: boolean;
}

const FIELD_TYPE_OPTIONS: { value: FormField['type']; label: string }[] = [
  { value: 'text', label: 'Texte libre' },
  { value: 'date', label: 'Date' },
  { value: 'select', label: 'Sélection (liste)' },
  { value: 'checkbox', label: 'Case à cocher' },
  { value: 'user', label: 'Utilisateur (Responsable)' },
  { value: 'product', label: 'Produit (liste dept.)' },
  { value: 'projectType', label: 'Type de projet (liste dept.)' },
  { value: 'attachment', label: 'Pièce jointe (fichier)' },
];

const DEFAULT_FORM_FIELDS: FormField[] = [
  { id: 'f_initiator', label: 'Initiateur', type: 'text', required: true },
  { id: 'f_assignedTo', label: 'Affectation', type: 'user', required: true },
  { id: 'f_product', label: 'Produit', type: 'product', required: false },
  { id: 'f_type', label: 'Type de projet', type: 'projectType', required: false },
  { id: 'f_deadline', label: 'Deadline', type: 'date', required: true },
  { id: 'f_priority', label: 'Priorité', type: 'select', required: false },
  { id: 'f_urgent', label: 'Urgent', type: 'checkbox', required: false },
];

export function DepartmentSettings() {
  const { user, token } = useAuth();
  const [config, setConfig] = useState<{
    products: string[];
    types: string[];
    activePages?: string[];
    pageConfigs?: Record<string, unknown>;
    formFields?: FormField[];
    departmentId?: string;
    departmentName?: string;
    workspaceTitle?: string;
    workspaceSubtitle?: string;
  }>({ products: [], types: [], activePages: [], pageConfigs: {}, formFields: [] });
  const [departmentMembers, setDepartmentMembers] = useState<(User & { status: string; isInvitation?: boolean })[]>([]);
  const [newItem, setNewItem] = useState({ type: 'product', value: '' });
  const [bulkEmails, setBulkEmails] = useState('');
  const [inviteRole, setInviteRole] = useState('worker');
  const [isInviting, setIsInviting] = useState(false);
  const [isLoadingMembers, setIsLoadingMembers] = useState(true);
  const [editingItem, setEditingItem] = useState<{ type: 'product' | 'type', original: string, current: string } | null>(null);

  const parseCSV = (text: string) => {
    return text.split(/[,\n]/).map(item => item.trim()).filter(Boolean);
  };

  const fetchData = useCallback(async () => {
    setIsLoadingMembers(true);
    try {
      const auth = { headers: { Authorization: `Bearer ${token}` } };
      const [configRes, membersRes] = await Promise.all([
        axios.get('http://localhost:5001/api/departments/my-config', auth),
        axios.get('http://localhost:5001/api/departments/members-status', auth)
      ]);
      setConfig(configRes.data);
      setDepartmentMembers(membersRes.data);
    } catch (err) {
      console.error('Failed to fetch department data', err);
    } finally {
      setIsLoadingMembers(false);
    }
  }, [token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleUpdateConfig = async (newConfig: typeof config) => {
    try {
      const deptId = newConfig.departmentId || user?.departmentId;
      if (!deptId) {
        console.error('No departmentId found — cannot save config');
        return;
      }
      setConfig(newConfig);
      await axios.put(`http://localhost:5001/api/departments/${deptId}/config`, newConfig, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {
      console.error('Failed to update config', err);
    }
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.value.trim()) return;
    const newConfig = { ...config };
    if (newItem.type === 'product') newConfig.products = [...newConfig.products, newItem.value];
    else newConfig.types = [...newConfig.types, newItem.value];
    handleUpdateConfig(newConfig);
    setNewItem({ ...newItem, value: '' });
  };

  const handleRemoveItem = (type: 'product' | 'type', value: string) => {
    const newConfig = { ...config };
    if (type === 'product') newConfig.products = newConfig.products.filter(p => p !== value);
    else newConfig.types = newConfig.types.filter(t => t !== value);
    handleUpdateConfig(newConfig);
  };

  const handleSaveEdit = () => {
    if (!editingItem || !editingItem.current.trim()) {
      setEditingItem(null);
      return;
    }
    const newConfig = { ...config };
    if (editingItem.type === 'product') {
      newConfig.products = newConfig.products.map(p => p === editingItem.original ? editingItem.current.trim() : p);
    } else {
      newConfig.types = newConfig.types.map(t => t === editingItem.original ? editingItem.current.trim() : t);
    }
    handleUpdateConfig(newConfig);
    setEditingItem(null);
  };

  const handleBulkInvite = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const emails = parseCSV(bulkEmails);
    if (emails.length === 0) return;

    setIsInviting(true);
    try {
      const res = await axios.post('http://localhost:5001/api/users/invite-bulk', { emails, role: inviteRole }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBulkEmails('');
      const { invited = [], assigned = [], skipped = [] } = res.data as {
        invited: string[];
        assigned: { email: string; name: string }[];
        skipped: { email: string; reason: string }[];
      };
      const parts: string[] = [];
      if (invited.length > 0) parts.push(`✅ ${invited.length} invitation(s) envoyée(s) par email.`);
      if (assigned.length > 0) {
        parts.push(`✅ ${assigned.length} utilisateur(s) ajouté(s) directement au département :`);
        assigned.forEach(a => parts.push(`  • ${a.name} (${a.email})`));
      }
      if (skipped.length > 0) {
        parts.push(`⚠️ ${skipped.length} ignoré(s) :`);
        skipped.forEach(s => parts.push(`  • ${s.email} — ${s.reason}`));
      }
      alert(parts.join('\n'));
      fetchData();
    } catch (err) {
      console.error('Failed to invite users', err);
      alert('Erreur lors de l\'envoi des invitations.');
    } finally {
      setIsInviting(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'members' | 'products' | 'types') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      const items = parseCSV(text);
      
      if (type === 'members') {
        setBulkEmails(items.join(', '));
      } else {
        try {
          const deptId = config.departmentId || user?.departmentId;
          const payload = type === 'products' ? { products: items } : { types: items };
          const res = await axios.post(`http://localhost:5001/api/departments/${deptId}/import-resources`, payload, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setConfig(res.data);
          alert(`${items.length} ${type === 'products' ? 'produits' : 'types'} importés !`);
        } catch (err) {
          console.error('Import failed', err);
        }
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset
  };

  const handleUpdateMemberRole = async (memberId: string, newRole: string) => {
    try {
      await axios.put(`http://localhost:5001/api/users/${memberId}`, { role: newRole }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchData();
    } catch (err) {
      console.error('Failed to update role', err);
    }
  };

  const handleDeleteMember = async (memberId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce membre/invitation ?')) return;
    try {
      await axios.delete(`http://localhost:5001/api/users/${memberId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchData();
    } catch (err) {
      console.error('Failed to delete member', err);
    }
  };

  const currentFields: FormField[] = config.formFields && config.formFields.length > 0
    ? config.formFields
    : DEFAULT_FORM_FIELDS;

  const [newFieldLabel, setNewFieldLabel] = useState('');
  const [newFieldType, setNewFieldType] = useState<FormField['type']>('text');

  const handleAddField = () => {
    if (!newFieldLabel.trim()) return;
    const updated = [
      ...currentFields,
      { id: 'f_' + Date.now(), label: newFieldLabel.trim(), type: newFieldType, required: false }
    ];
    setNewFieldLabel('');
    setNewFieldType('text');
    handleUpdateConfig({ ...config, formFields: updated });
  };

  const handleRemoveField = (id: string) => {
    const fixed = ['f_initiator'];
    if (fixed.includes(id)) return;
    const updated = currentFields.filter(f => f.id !== id);
    handleUpdateConfig({ ...config, formFields: updated });
  };

  const handleToggleRequired = (id: string) => {
    const updated = currentFields.map(f => f.id === id ? { ...f, required: !f.required } : f);
    handleUpdateConfig({ ...config, formFields: updated });
  };

  const handleFieldLabelChange = (id: string, label: string) => {
    const updated = currentFields.map(f => f.id === id ? { ...f, label } : f);
    setConfig(prev => ({ ...prev, formFields: updated }));
  };

  const handleFieldLabelBlur = (id: string, label: string) => {
    const updated = currentFields.map(f => f.id === id ? { ...f, label } : f);
    handleUpdateConfig({ ...config, formFields: updated });
  };

  return (
    <div className="space-y-12 max-w-4xl py-6 animate-in fade-in duration-300 transition-colors duration-300">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-black text-[var(--notion-text)] flex items-center gap-3 tracking-tight">
          <Building2 className="w-8 h-8 text-[var(--brand-accent)]" />
          Cockpit Département
        </h1>
        <p className="text-[var(--notion-text-light)] font-medium">Gérez la configuration et les membres de votre équipe locale.</p>
      </div>

      {/* ── Titre du workspace ──────────────────────────────────────── */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <FileText className="w-5 h-5 text-[var(--brand-accent)]" />
          <h3 className="text-lg font-bold text-[var(--notion-text)]">Titre de l'espace de travail</h3>
        </div>
        <div className="bg-[var(--notion-sidebar)] p-5 border border-[var(--notion-border)] rounded-2xl mb-2">
          <p className="text-sm text-[var(--notion-text-light)] mb-3">Ce titre s'affiche en grand dans le tableau de bord à la place du nom de l'application.</p>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-[var(--notion-text-light)] uppercase tracking-wider mb-1.5">Titre principal</label>
              <div className="flex gap-2 items-center">
                <input
                  type="text"
                  className="flex-1 px-4 py-2.5 bg-white dark:bg-slate-900 border border-[var(--notion-border)] rounded-xl text-[var(--notion-text)] text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[var(--brand-accent)]/30 focus:border-[var(--brand-accent)] transition-all"
                  placeholder={config.departmentName || 'Ex: Département Marketing Médis'}
                  value={config.workspaceTitle || ''}
                  onChange={(e) => setConfig(prev => ({ ...prev, workspaceTitle: e.target.value }))}
                  onBlur={(e) => handleUpdateConfig({ ...config, workspaceTitle: e.target.value })}
                />
                {config.workspaceTitle && (
                  <button type="button" onClick={() => handleUpdateConfig({ ...config, workspaceTitle: '' })} className="p-2 text-[var(--notion-text-light)] hover:text-red-500 transition-colors" title="Réinitialiser">
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-[var(--notion-text-light)] uppercase tracking-wider mb-1.5">Sous-titre</label>
              <div className="flex gap-2 items-center">
                <input
                  type="text"
                  className="flex-1 px-4 py-2.5 bg-white dark:bg-slate-900 border border-[var(--notion-border)] rounded-xl text-[var(--notion-text)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-accent)]/30 focus:border-[var(--brand-accent)] transition-all"
                  placeholder="Badgi-WorkFlow"
                  value={config.workspaceSubtitle || ''}
                  onChange={(e) => setConfig(prev => ({ ...prev, workspaceSubtitle: e.target.value }))}
                  onBlur={(e) => handleUpdateConfig({ ...config, workspaceSubtitle: e.target.value })}
                />
                {config.workspaceSubtitle && (
                  <button type="button" onClick={() => handleUpdateConfig({ ...config, workspaceSubtitle: '' })} className="p-2 text-[var(--notion-text-light)] hover:text-red-500 transition-colors" title="Réinitialiser">
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>
            {(config.workspaceTitle || config.workspaceSubtitle) && (
              <p className="text-xs text-[var(--notion-text-light)] pt-1">
                Aperçu :&nbsp;
                <span className="font-bold text-[var(--notion-text)]">{config.workspaceTitle || config.departmentName || 'Badgi-WorkFlow'}</span>
                {' '}<span className="opacity-60">{config.workspaceSubtitle || 'Badgi-WorkFlow'}</span>
              </p>
            )}
          </div>
        </div>
      </section>

      {/* ── Pages autorisées & Column config ─────────────────────────── */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <LayoutList className="w-5 h-5 text-[var(--brand-accent)]" />
          <h3 className="text-lg font-bold text-[var(--notion-text)]">Configuration des Vues (Pages)</h3>
        </div>

        <div className="bg-[var(--notion-sidebar)] p-5 border border-[var(--notion-border)] rounded-2xl mb-8">
          <h4 className="font-bold text-sm text-[var(--notion-text)] mb-3 opacity-80 uppercase tracking-widest">Pages Autorisées par le Super Admin</h4>
          <div className="flex flex-wrap gap-2 mb-6">
            {config.activePages?.map(p => (
              <span key={p} className="px-3 py-1 bg-[var(--brand-accent)]/10 text-[var(--brand-accent)] font-bold text-[10px] rounded-lg uppercase tracking-wider border border-[var(--brand-accent)]/20 shadow-sm">
                {p}
              </span>
            ))}
            {(!config.activePages || config.activePages.length === 0) && (
              <span className="text-sm text-[var(--notion-text-light)] italic">Aucune page attribuée à votre département.</span>
            )}
          </div>

          {config.activePages?.includes('table') && (
            <div className="pt-5 border-t border-[var(--notion-border)]">
              <h4 className="font-bold text-sm text-[var(--notion-text)] mb-2 uppercase tracking-widest opacity-80">Colonnes visibles (Vue Table)</h4>
              <p className="text-xs text-[var(--notion-text-light)] mb-4 font-medium italic">Les colonnes sont auto-générées depuis votre Générateur de Formulaire ci-dessous.</p>
            </div>
          )}
        </div>
      </section>

      {/* ── FORM BUILDER ───────────────────────────────────────────────── */}
      <section>
        <div className="flex items-center gap-2 mb-2">
          <FileText className="w-5 h-5 text-[var(--brand-accent)]" />
          <h3 className="text-lg font-bold text-[var(--notion-text)]">Générateur de Formulaire</h3>
        </div>
        <p className="text-sm text-[var(--notion-text-light)] mb-8 font-medium max-w-2xl leading-relaxed">
          Définissez les champs du formulaire de création de projet. Le champ <strong>Nom du projet</strong> est toujours présent. Les colonnes de
          la vue Table seront générées depuis ces champs.
        </p>

        <div className="bg-[var(--notion-sidebar)] border border-[var(--notion-border)] rounded-2xl overflow-hidden mb-6" style={{ boxShadow: 'var(--shadow-card)' }}>
          {/* Fixed header row */}
          <div className="flex items-center gap-3 px-6 py-4 bg-[var(--surface-low)] text-[var(--notion-text-light)] text-[10px] font-semibold uppercase tracking-widest border-b border-[var(--notion-border)] relative z-10">
            <GripVertical size={14} className="opacity-40 shrink-0" />
            <span className="w-[30%]">Nom du champ</span>
            <span className="flex-1 opacity-70">Type de donnée</span>
            <span className="w-24 text-center">Obligatoire</span>
            <span className="w-8" />
          </div>

          {/* Dynamic fields */}
          <div className="divide-y divide-[var(--notion-border)]">
            {currentFields.map(field => (
              <div key={field.id} className="flex items-center gap-3 px-6 py-4 transition-all group hover:bg-[var(--notion-hover)]">
                <GripVertical size={14} className="text-[var(--notion-text-light)] shrink-0 opacity-40 group-hover:opacity-100 transition-opacity" />
                <input
                  type="text"
                  value={field.label}
                  readOnly={field.id === 'f_initiator'}
                  onChange={e => handleFieldLabelChange(field.id, e.target.value)}
                  onBlur={e => handleFieldLabelBlur(field.id, e.target.value)}
                  className={`w-[30%] text-sm font-bold text-[var(--notion-text)] bg-transparent border-b-2 border-transparent focus:border-[var(--brand-accent)] outline-none py-1 transition-all ${field.id === 'f_initiator' ? 'opacity-60 cursor-default' : 'cursor-text'}`}
                />
                <div className="flex-1 flex items-center gap-1 text-xs text-[var(--notion-text-light)]">
                  <div className="relative">
                    <select
                      value={field.type}
                      disabled={field.id === 'f_initiator'}
                      onChange={e => {
                        const updated = currentFields.map(f => f.id === field.id ? { ...f, type: e.target.value as FormField['type'] } : f);
                        handleUpdateConfig({ ...config, formFields: updated });
                      }}
                      className="text-[11px] font-bold uppercase tracking-tighter bg-[var(--notion-sidebar)] border border-[var(--notion-border)] rounded-lg px-3 py-1.5 outline-none cursor-pointer appearance-none pr-8 disabled:opacity-40 disabled:cursor-not-allowed hover:border-[var(--brand-accent)] transition-colors shadow-sm"
                    >
                      {FIELD_TYPE_OPTIONS.map(o => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                    <ChevronDown size={10} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--notion-text-light)]" />
                  </div>
                </div>
                <label className="flex items-center gap-2 w-24 justify-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={field.required}
                    onChange={() => handleToggleRequired(field.id)}
                    disabled={field.id === 'f_initiator'}
                    className="rounded-md border-[var(--notion-border)] text-[var(--brand-accent)] cursor-pointer disabled:opacity-30 w-4 h-4 focus:ring-0"
                  />
                  <span className={`text-[10px] font-black uppercase tracking-tighter ${field.required ? 'text-[var(--brand-accent)]' : 'text-[var(--notion-text-light)]'}`}>
                    {field.required ? 'Oui' : 'Non'}
                  </span>
                </label>
                <button
                  onClick={() => handleRemoveField(field.id)}
                  disabled={field.id === 'f_initiator'}
                  className="w-8 h-8 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all rounded-lg hover:bg-red-500/10 text-red-500 hover:text-red-600 disabled:opacity-0"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Add new field row */}
        <div className="flex gap-4 items-end bg-[var(--notion-sidebar)] p-6 rounded-2xl border border-[var(--notion-border)] border-dashed">
          <div className="flex-1">
            <label className="block text-xs font-bold text-[var(--notion-text-light)] mb-2 uppercase tracking-widest pl-1">Ajouter un champ</label>
            <input
              type="text"
              placeholder="Ex : Référence client"
              value={newFieldLabel}
              onChange={e => setNewFieldLabel(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddField()}
              className="w-full text-sm px-4 py-3 bg-[var(--notion-bg)] border border-[var(--notion-border)] rounded-xl outline-none focus:border-[var(--brand-accent)] focus:ring-2 focus:ring-[var(--brand-accent)]/10 transition-all font-medium placeholder:text-[var(--notion-text-light)]/50 shadow-sm"
            />
          </div>
          <div className="w-52">
            <label className="block text-xs font-bold text-[var(--notion-text-light)] mb-2 uppercase tracking-widest pl-1">Type de donnée</label>
            <div className="relative">
              <select
                value={newFieldType}
                onChange={e => setNewFieldType(e.target.value as FormField['type'])}
                className="w-full text-sm px-4 py-3 bg-[var(--notion-bg)] border border-[var(--notion-border)] rounded-xl outline-none focus:border-[var(--brand-accent)] appearance-none cursor-pointer font-bold uppercase tracking-tighter shadow-sm"
              >
                {FIELD_TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--notion-text-light)]" />
            </div>
          </div>
          <button
            onClick={handleAddField}
            className="flex items-center gap-2 px-6 py-3 bg-[var(--brand-primary)] hover:bg-[var(--brand-secondary)] text-white rounded-xl font-semibold text-sm transition-all active:scale-[0.98]" style={{ boxShadow: 'var(--shadow-btn)' }}
          >
            <Plus size={18} strokeWidth={3} />
            Ajouter
          </button>
        </div>
      </section>

      {/* ── LISTE PRODUITS / TYPES ─────────────────────────────────────── */}
      <section>
        <div className="flex items-center gap-2 mb-6">
          <LayoutList className="w-5 h-5 text-[var(--brand-accent)]" />
          <h3 className="text-lg font-bold text-[var(--notion-text)]">Configuration Listes</h3>
        </div>

        <div className="grid grid-cols-2 gap-8">
          <div className="bg-[var(--notion-sidebar)] p-6 border border-[var(--notion-border)] rounded-2xl shadow-sm relative group overflow-hidden">
             <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <label className="cursor-pointer p-1.5 bg-[var(--notion-bg)] border border-[var(--notion-border)] rounded-lg hover:border-[var(--brand-accent)] transition-all flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-[var(--notion-text-light)]">
                  <Plus className="w-3 h-3" />
                  Import CSV
                  <input type="file" accept=".csv,.txt" className="hidden" onChange={e => handleFileUpload(e, 'products')} />
                </label>
             </div>
            <h4 className="font-bold text-xs text-[var(--notion-text-light)] mb-4 uppercase tracking-widest pl-1">Produits du département</h4>
            <ul className="space-y-2 mb-6 max-h-48 overflow-y-auto scrollbar-hide pr-1">
              {config.products?.map(p => (
                <li key={p} className="flex items-center justify-between text-sm bg-[var(--notion-bg)] px-4 py-2.5 rounded-xl border border-[var(--notion-border)] font-bold text-[var(--notion-text)] group shadow-sm hover:border-[var(--brand-accent)] transition-all animate-in slide-in-from-left-2">
                  {editingItem?.type === 'product' && editingItem.original === p ? (
                    <div className="flex-1 flex items-center gap-2">
                      <input
                        autoFocus
                        className="flex-1 bg-white dark:bg-slate-900 border border-[var(--brand-accent)] rounded-lg px-2 py-1 outline-none text-[var(--brand-accent)] shadow-[0_0_0_2px_var(--brand-accent)/10]"
                        value={editingItem.current}
                        onChange={e => setEditingItem({ ...editingItem, current: e.target.value })}
                        onKeyDown={e => {
                          if (e.key === 'Enter') handleSaveEdit();
                          if (e.key === 'Escape') setEditingItem(null);
                        }}
                      />
                      <button onClick={handleSaveEdit} className="text-emerald-500 p-1 hover:bg-emerald-500/10 rounded-md">
                        <Check size={14} />
                      </button>
                      <button onClick={() => setEditingItem(null)} className="text-red-500 p-1 hover:bg-red-500/10 rounded-md">
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className="flex-1 truncate mr-2">{p}</span>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                        <button 
                          onClick={() => setEditingItem({ type: 'product', original: p, current: p })}
                          className="text-slate-400 hover:text-[var(--brand-accent)] p-1 rounded-md hover:bg-[var(--brand-accent)]/10"
                          title="Modifier"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button onClick={() => handleRemoveItem('product', p)} className="text-red-400 hover:text-red-500 p-1 rounded-md hover:bg-red-500/10" title="Supprimer">
                          <Trash2 size={16}/>
                        </button>
                      </div>
                    </>
                  )}
                </li>
              ))}
            </ul>
            <form onSubmit={e => { setNewItem({ ...newItem, type: 'product' }); handleAddItem(e); }} className="flex gap-2">
              <input type="text" placeholder="Ajouter un produit" className="flex-1 text-sm px-4 py-2.5 bg-[var(--notion-bg)] border border-[var(--notion-border)] rounded-xl outline-none focus:border-[var(--brand-accent)] transition-all font-medium"
                value={newItem.type === 'product' ? newItem.value : ''}
                onChange={e => setNewItem({ type: 'product', value: e.target.value })}
              />
              <button type="submit" className="p-2.5 bg-[var(--brand-secondary)] hover:bg-[var(--brand-primary)] text-white rounded-xl transition-all active:scale-95">
                <Plus size={20} strokeWidth={3}/>
              </button>
            </form>
          </div>

          <div className="bg-[var(--notion-sidebar)] p-6 border border-[var(--notion-border)] rounded-2xl shadow-sm relative group overflow-hidden">
             <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <label className="cursor-pointer p-1.5 bg-[var(--notion-bg)] border border-[var(--notion-border)] rounded-lg hover:border-[var(--brand-accent)] transition-all flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-[var(--notion-text-light)]">
                  <Plus className="w-3 h-3" />
                  Import CSV
                  <input type="file" accept=".csv,.txt" className="hidden" onChange={e => handleFileUpload(e, 'types')} />
                </label>
             </div>
            <h4 className="font-bold text-xs text-[var(--notion-text-light)] mb-4 uppercase tracking-widest pl-1">Types de projets</h4>
            <ul className="space-y-2 mb-6 max-h-48 overflow-y-auto scrollbar-hide pr-1">
              {config.types?.map(t => (
                <li key={t} className="flex items-center justify-between text-sm bg-[var(--notion-bg)] px-4 py-2.5 rounded-xl border border-[var(--notion-border)] font-bold text-[var(--notion-text)] group shadow-sm hover:border-[var(--brand-accent)] transition-all animate-in slide-in-from-left-2">
                  {editingItem?.type === 'type' && editingItem.original === t ? (
                    <div className="flex-1 flex items-center gap-2">
                      <input
                        autoFocus
                        className="flex-1 bg-white dark:bg-slate-900 border border-[var(--brand-accent)] rounded-lg px-2 py-1 outline-none text-[var(--brand-accent)] shadow-[0_0_0_2px_var(--brand-accent)/10]"
                        value={editingItem.current}
                        onChange={e => setEditingItem({ ...editingItem, current: e.target.value })}
                        onKeyDown={e => {
                          if (e.key === 'Enter') handleSaveEdit();
                          if (e.key === 'Escape') setEditingItem(null);
                        }}
                      />
                      <button onClick={handleSaveEdit} className="text-emerald-500 p-1 hover:bg-emerald-500/10 rounded-md">
                        <Check size={14} />
                      </button>
                      <button onClick={() => setEditingItem(null)} className="text-red-500 p-1 hover:bg-red-500/10 rounded-md">
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className="flex-1 truncate mr-2">{t}</span>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                        <button 
                          onClick={() => setEditingItem({ type: 'type', original: t, current: t })}
                          className="text-slate-400 hover:text-[var(--brand-accent)] p-1 rounded-md hover:bg-[var(--brand-accent)]/10"
                          title="Modifier"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button onClick={() => handleRemoveItem('type', t)} className="text-red-400 hover:text-red-500 p-1 rounded-md hover:bg-red-500/10" title="Supprimer">
                          <Trash2 size={16}/>
                        </button>
                      </div>
                    </>
                  )}
                </li>
              ))}
            </ul>
            <form onSubmit={e => { setNewItem({ ...newItem, type: 'type' }); handleAddItem(e); }} className="flex gap-2">
              <input type="text" placeholder="Ajouter un type" className="flex-1 text-sm px-4 py-2.5 bg-[var(--notion-bg)] border border-[var(--notion-border)] rounded-xl outline-none focus:border-[var(--brand-accent)] transition-all font-medium"
                value={newItem.type === 'type' ? newItem.value : ''}
                onChange={e => setNewItem({ type: 'type', value: e.target.value })}
              />
              <button type="submit" className="p-2.5 bg-[var(--brand-secondary)] hover:bg-[var(--brand-primary)] text-white rounded-xl transition-all active:scale-95">
                <Plus size={20} strokeWidth={3}/>
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* ── MEMBRES ──────────────────────────────────────────────────── */}
      <section className="pb-10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-[var(--brand-accent)]" />
            <h3 className="text-lg font-bold text-[var(--notion-text)]">Membres de l'équipe</h3>
          </div>
        </div>

        <div className="bg-[var(--notion-sidebar)] border border-[var(--notion-border)] rounded-2xl overflow-hidden mb-8" style={{ boxShadow: 'var(--shadow-card)' }}>
          <table className="w-full text-left text-sm">
            <thead className="bg-[var(--surface-low)] border-b border-[var(--notion-border)]">
              <tr>
                <th className="px-6 py-4 font-black text-[10px] text-[var(--notion-text-light)] uppercase tracking-widest">Nom</th>
                <th className="px-6 py-4 font-black text-[10px] text-[var(--notion-text-light)] uppercase tracking-widest text-center">État</th>
                <th className="px-6 py-4 font-black text-[10px] text-[var(--notion-text-light)] uppercase tracking-widest text-center">Rôle</th>
                <th className="px-6 py-4 font-black text-[10px] text-[var(--notion-text-light)] uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--notion-border)]">
              {departmentMembers.map(m => (
                <tr key={m._id} className="hover:bg-[var(--notion-hover)] transition-all group">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-[var(--notion-text)] font-bold">{m.name || m.email?.split('@')[0]}</span>
                      <span className="text-[10px] text-[var(--notion-text-light)] font-medium">{m.email || '-'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border shadow-sm ${
                      m.status === 'Inscrit' 
                        ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' 
                        : 'bg-amber-500/10 text-amber-500 border-amber-500/20 animate-pulse'
                    }`}>
                      {m.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="relative inline-block mx-auto">
                      <select
                        value={m.role}
                        onChange={(e) => handleUpdateMemberRole(m._id, e.target.value)}
                        className="bg-[var(--notion-bg)] text-[var(--notion-text)] border border-[var(--notion-border)] rounded-lg px-2 py-1 text-[10px] font-bold uppercase tracking-tighter outline-none focus:border-[var(--brand-accent)] appearance-none pr-6 cursor-pointer shadow-sm hover:shadow-md transition-all"
                      >
                        <option value="worker">Worker</option>
                        <option value="chef de produit">Chef de produit</option>
                        <option value="chef de projet">Chef de projet</option>
                      </select>
                      <ChevronDown size={10} className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-40" />
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleDeleteMember(m._id)}
                      className="p-2 text-red-400 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                      title={m.status === 'Inscrit' ? 'Supprimer utilisateur' : 'Annuler invitation'}
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {departmentMembers.length === 0 && !isLoadingMembers && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-[var(--notion-text-light)] italic font-medium">
                    Aucun membre trouvé dans ce département.
                  </td>
                </tr>
              )}
              {isLoadingMembers && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <div className="flex items-center justify-center gap-3 text-[var(--notion-text-light)] font-bold animate-pulse">
                      <div className="w-2 h-2 bg-[var(--brand-accent)] rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-[var(--brand-accent)] rounded-full animate-bounce [animation-delay:0.2s]" />
                      <div className="w-2 h-2 bg-[var(--brand-accent)] rounded-full animate-bounce [animation-delay:0.4s]" />
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="bg-[var(--notion-sidebar)] p-8 border border-[var(--notion-border)] rounded-2xl shadow-sm border-dashed relative">
          <div className="flex items-center justify-between mb-6">
            <h4 className="font-bold text-sm text-[var(--notion-text)] uppercase tracking-widest pl-1">Inviter de nouveaux membres</h4>
            <label className="cursor-pointer px-4 py-2 bg-[var(--notion-bg)] border border-[var(--notion-border)] rounded-xl hover:border-[var(--brand-accent)] transition-all flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[var(--notion-text-light)] shadow-sm">
              <Plus className="w-4 h-4" />
              Importer CSV
              <input type="file" accept=".csv,.txt" className="hidden" onChange={e => handleFileUpload(e, 'members')} />
            </label>
          </div>

          <form onSubmit={handleBulkInvite} className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-[var(--notion-text-light)] mb-2 uppercase tracking-widest pl-1">Emails (séparés par une virgule ou une ligne)</label>
              <textarea 
                placeholder="email1@exemple.com, email2@exemple.com..." 
                value={bulkEmails}
                onChange={e => setBulkEmails(e.target.value)}
                className="w-full text-sm px-4 py-3 bg-[var(--notion-bg)] border border-[var(--notion-border)] rounded-xl outline-none focus:border-[var(--brand-accent)] transition-all font-medium min-h-[100px] resize-none"
              />
            </div>
            
            <div className="flex items-end gap-6">
              <div className="w-48">
                <label className="block text-xs font-bold text-[var(--notion-text-light)] mb-2 uppercase tracking-widest pl-1">Rôle</label>
                <div className="relative">
                  <select 
                    value={inviteRole} 
                    onChange={e => setInviteRole(e.target.value)} 
                    className="w-full text-sm px-4 py-3 bg-[var(--notion-bg)] border border-[var(--notion-border)] rounded-xl outline-none focus:border-[var(--brand-accent)] appearance-none cursor-pointer font-bold uppercase tracking-tighter"
                  >
                    <option value="worker">Worker</option>
                    <option value="chef de produit">Chef de produit</option>
                  </select>
                  <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--notion-text-light)]" />
                </div>
              </div>
              <button 
                type="submit" 
                disabled={isInviting || !bulkEmails.trim()}
                className="flex-1 py-3 bg-[var(--brand-primary)] hover:bg-[var(--brand-secondary)] text-white rounded-xl font-semibold transition-all active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed" style={{ boxShadow: 'var(--shadow-btn)' }}
              >
                {isInviting ? 'Envoi en cours...' : 'Envoyer les invitations'}
              </button>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}
