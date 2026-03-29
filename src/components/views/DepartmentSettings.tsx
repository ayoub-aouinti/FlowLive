import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Plus, Users, LayoutList, Trash2, Building2, FileText, GripVertical, ChevronDown } from 'lucide-react';
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
  }>({ products: [], types: [], activePages: [], pageConfigs: {}, formFields: [] });
  const [departmentUsers, setDepartmentUsers] = useState<User[]>([]);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'worker' });
  const [newItem, setNewItem] = useState({ type: 'product', value: '' });

  const fetchData = useCallback(async () => {
    try {
      const auth = { headers: { Authorization: `Bearer ${token}` } };
      const [configRes, usersRes] = await Promise.all([
        axios.get('http://localhost:5001/api/departments/my-config', auth),
        axios.get('http://localhost:5001/api/users', auth)
      ]);
      setConfig(configRes.data);
      setDepartmentUsers(usersRes.data);
    } catch (err) {
      console.error('Failed to fetch department data', err);
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

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5001/api/users', newUser, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNewUser({ name: '', email: '', password: '', role: 'worker' });
      fetchData();
    } catch (err) {
      console.error('Failed to create user', err);
    }
  };

  // ── FORM BUILDER ──────────────────────────────────────────────────────────
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
    <div className="space-y-12 max-w-4xl py-6 animate-in fade-in duration-300">
      <div>
        <h1 className="text-3xl font-bold text-[#37352f] flex items-center gap-3">
          <Building2 className="w-8 h-8 text-[#1a4f8b]" />
          Cockpit Département
        </h1>
        <p className="text-[#9b9a97] mt-2">Gérez la configuration et les membres de votre équipe locale.</p>
      </div>

      {/* ── Pages autorisées & Column config ─────────────────────────── */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <LayoutList className="w-5 h-5 text-[#1a4f8b]" />
          <h3 className="text-lg font-bold text-[#37352f]">Configuration des Vues (Pages)</h3>
        </div>

        <div className="bg-neutral-50 p-4 border border-[#ececeb] rounded-lg mb-8">
          <h4 className="font-semibold text-sm mb-3">Pages Autorisées par le Super Admin</h4>
          <div className="flex flex-wrap gap-2 mb-6">
            {config.activePages?.map(p => (
              <span key={p} className="px-2 py-1 bg-[#1a4f8b]/10 text-[#1a4f8b] font-medium text-xs rounded uppercase tracking-wider">
                {p}
              </span>
            ))}
            {(!config.activePages || config.activePages.length === 0) && (
              <span className="text-sm text-[#9b9a97] italic">Aucune page attribuée à votre département.</span>
            )}
          </div>

          {config.activePages?.includes('table') && (
            <div className="pt-4 border-t border-[#ececeb]">
              <h4 className="font-semibold text-sm mb-2">Colonnes visibles (Vue Table)</h4>
              <p className="text-xs text-[#9b9a97] mb-3">Les colonnes sont auto-générées depuis votre Générateur de Formulaire ci-dessous.</p>
            </div>
          )}
        </div>
      </section>

      {/* ── FORM BUILDER ───────────────────────────────────────────────── */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <FileText className="w-5 h-5 text-[#1a4f8b]" />
          <h3 className="text-lg font-bold text-[#37352f]">Générateur de Formulaire</h3>
        </div>
        <p className="text-sm text-[#9b9a97] mb-6">
          Définissez les champs du formulaire de création de projet. Le champ <strong>Nom du projet</strong> est toujours présent. Les colonnes de
          la vue Table seront générées depuis ces champs.
        </p>

        <div className="bg-white border border-[#ececeb] rounded-lg shadow-sm overflow-hidden mb-4">
          {/* Fixed header row */}
          <div className="flex items-center gap-3 px-4 py-3 bg-[#1a4f8b] text-white text-sm font-semibold">
            <GripVertical size={14} className="opacity-40 shrink-0" />
            <span className="w-[30%]">Nom du projet</span>
            <span className="flex-1 text-xs opacity-70">Texte principal</span>
            <span className="text-xs opacity-70 w-20 text-center">Obligatoire</span>
            <span className="w-6" />
          </div>

          {/* Dynamic fields */}
          {currentFields.map(field => (
            <div key={field.id} className="flex items-center gap-3 px-4 py-2.5 border-b border-[#ececeb] hover:bg-neutral-50 transition-all group">
              <GripVertical size={14} className="text-[#9b9a97] shrink-0" />
              <input
                type="text"
                value={field.label}
                onChange={e => handleFieldLabelChange(field.id, e.target.value)}
                onBlur={e => handleFieldLabelBlur(field.id, e.target.value)}
                className="w-[30%] text-sm font-medium text-[#37352f] bg-transparent border-b border-transparent focus:border-[#1a4f8b] outline-none py-0.5 transition-all"
              />
              <div className="flex-1 flex items-center gap-1 text-xs text-[#9b9a97]">
                <div className="relative">
                  <select
                    value={field.type}
                    disabled={field.id === 'f_initiator'}
                    onChange={e => {
                      const updated = currentFields.map(f => f.id === field.id ? { ...f, type: e.target.value as FormField['type'] } : f);
                      handleUpdateConfig({ ...config, formFields: updated });
                    }}
                    className="text-xs bg-[#f3f4f6] border border-[#ececeb] rounded px-2 py-1 outline-none cursor-pointer appearance-none pr-6 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {FIELD_TYPE_OPTIONS.map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                  <ChevronDown size={10} className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none text-[#9b9a97]" />
                </div>
              </div>
              <label className="flex items-center gap-1.5 w-20 justify-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={field.required}
                  onChange={() => handleToggleRequired(field.id)}
                  disabled={field.id === 'f_initiator'}
                  className="rounded border-[#ececeb] text-[#1a4f8b] cursor-pointer disabled:opacity-40"
                />
                <span className="text-xs text-[#9b9a97]">{field.required ? 'Oui' : 'Non'}</span>
              </label>
              <button
                onClick={() => handleRemoveField(field.id)}
                disabled={field.id === 'f_initiator'}
                className="w-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700 disabled:opacity-0"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>

        {/* Add new field row */}
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <label className="block text-xs font-medium text-[#9b9a97] mb-1">Nom du champ</label>
            <input
              type="text"
              placeholder="Ex : Référence client"
              value={newFieldLabel}
              onChange={e => setNewFieldLabel(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddField()}
              className="w-full text-sm px-3 py-2 border border-[#ececeb] rounded outline-none focus:border-[#1a4f8b] transition-colors"
            />
          </div>
          <div className="w-44">
            <label className="block text-xs font-medium text-[#9b9a97] mb-1">Type</label>
            <select
              value={newFieldType}
              onChange={e => setNewFieldType(e.target.value as FormField['type'])}
              className="w-full text-sm px-3 py-2 border border-[#ececeb] rounded bg-white outline-none"
            >
              {FIELD_TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <button
            onClick={handleAddField}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#1a4f8b] text-white rounded font-medium hover:bg-[#154070] transition-colors text-sm"
          >
            <Plus size={16} />
            Ajouter
          </button>
        </div>
      </section>

      {/* ── LISTE PRODUITS / TYPES ─────────────────────────────────────── */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <LayoutList className="w-5 h-5 text-[#1a4f8b]" />
          <h3 className="text-lg font-bold text-[#37352f]">Configuration Listes</h3>
        </div>

        <div className="grid grid-cols-2 gap-8">
          <div className="bg-neutral-50 p-4 border border-[#ececeb] rounded-lg">
            <h4 className="font-semibold text-sm mb-3">Produits du département</h4>
            <ul className="space-y-2 mb-4 max-h-40 overflow-y-auto">
              {config.products?.map(p => (
                <li key={p} className="flex items-center justify-between text-sm bg-white px-2 py-1 rounded border border-[#ececeb]">
                  {p}
                  <button onClick={() => handleRemoveItem('product', p)} className="text-red-500 hover:text-red-700"><Trash2 size={14}/></button>
                </li>
              ))}
            </ul>
            <form onSubmit={e => { setNewItem({ ...newItem, type: 'product' }); handleAddItem(e); }} className="flex gap-2">
              <input type="text" placeholder="Ajouter un produit" className="flex-1 text-sm px-2 py-1.5 border rounded outline-none"
                value={newItem.type === 'product' ? newItem.value : ''}
                onChange={e => setNewItem({ type: 'product', value: e.target.value })}
              />
              <button type="submit" className="px-3 bg-[#1a4f8b] text-white rounded text-sm hover:bg-[#154070]"><Plus size={16}/></button>
            </form>
          </div>

          <div className="bg-neutral-50 p-4 border border-[#ececeb] rounded-lg">
            <h4 className="font-semibold text-sm mb-3">Types de projets</h4>
            <ul className="space-y-2 mb-4 max-h-40 overflow-y-auto">
              {config.types?.map(t => (
                <li key={t} className="flex items-center justify-between text-sm bg-white px-2 py-1 rounded border border-[#ececeb]">
                  {t}
                  <button onClick={() => handleRemoveItem('type', t)} className="text-red-500 hover:text-red-700"><Trash2 size={14}/></button>
                </li>
              ))}
            </ul>
            <form onSubmit={e => { setNewItem({ ...newItem, type: 'type' }); handleAddItem(e); }} className="flex gap-2">
              <input type="text" placeholder="Ajouter un type" className="flex-1 text-sm px-2 py-1.5 border rounded outline-none"
                value={newItem.type === 'type' ? newItem.value : ''}
                onChange={e => setNewItem({ type: 'type', value: e.target.value })}
              />
              <button type="submit" className="px-3 bg-[#1a4f8b] text-white rounded text-sm hover:bg-[#154070]"><Plus size={16}/></button>
            </form>
          </div>
        </div>
      </section>

      {/* ── MEMBRES ──────────────────────────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-[#1a4f8b]" />
            <h3 className="text-lg font-bold text-[#37352f]">Membres de l'équipe</h3>
          </div>
        </div>

        <div className="bg-white border border-[#ececeb] rounded-lg shadow-sm mb-6">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-50 border-b border-[#ececeb]">
              <tr>
                <th className="px-4 py-2 font-medium">Nom</th>
                <th className="px-4 py-2 font-medium">Email</th>
                <th className="px-4 py-2 font-medium">Rôle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ececeb]">
              {departmentUsers.map(u => (
                <tr key={u._id} className="hover:bg-neutral-50">
                  <td className="px-4 py-2 text-[#37352f]">{u.name}</td>
                  <td className="px-4 py-2 text-[#9b9a97]">{u.email}</td>
                  <td className="px-4 py-2 uppercase tracking-tighter text-[10px] font-bold"><span className="bg-[#efefed] px-2 py-1 rounded">{u.role}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h4 className="font-semibold text-sm mb-3">Ajouter un nouveau membre</h4>
        <form onSubmit={handleCreateUser} className="flex gap-4 items-end bg-neutral-50 p-4 border border-[#ececeb] rounded-lg">
          <div className="flex-1">
            <label className="block text-xs font-medium text-[#9b9a97] mb-1">Nom complet</label>
            <input type="text" required value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} className="w-full text-sm px-3 py-2 border rounded" />
          </div>
          <div className="flex-1">
            <label className="block text-xs font-medium text-[#9b9a97] mb-1">Email</label>
            <input type="email" required value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} className="w-full text-sm px-3 py-2 border rounded" />
          </div>
          <div className="w-32">
            <label className="block text-xs font-medium text-[#9b9a97] mb-1">Mot de passe</label>
            <input type="text" required value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} className="w-full text-sm px-3 py-2 border rounded" />
          </div>
          <div className="w-32">
            <label className="block text-xs font-medium text-[#9b9a97] mb-1">Rôle</label>
            <select value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})} className="w-full text-sm px-3 py-2 border rounded bg-white">
              <option value="worker">Worker</option>
              <option value="initiateur">Initiateur</option>
            </select>
          </div>
          <button type="submit" className="px-4 py-2 bg-[#1a4f8b] text-white rounded font-medium hover:bg-[#154070]">Ajouter</button>
        </form>
      </section>
    </div>
  );
}
