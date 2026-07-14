import React, { useState, useEffect, useRef } from 'react';
import { socket } from '../services/socket';
import { X, AlertCircle, ChevronDown, Paperclip, Clock, Bold, Italic, Underline, Strikethrough, List, ListOrdered, AlignLeft, AlignCenter, AlignRight, Palette, Highlighter, Quote } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import type { User } from '../types';

interface FormField {
  id: string;
  label: string;
  type: 'text' | 'date' | 'select' | 'checkbox' | 'user' | 'product' | 'projectType' | 'attachment';
  required: boolean;
}

interface DeptConfig {
  products: string[];
  types: string[];
  formFields?: FormField[];
}

const DEFAULT_FORM_FIELDS: FormField[] = [
  { id: 'f_initiator', label: 'Initiateur', type: 'text', required: true },
  { id: 'f_assignedTo', label: 'Affectation', type: 'user', required: true },
  { id: 'f_product', label: 'Produit', type: 'product', required: false },
  { id: 'f_type', label: 'Type de projet', type: 'projectType', required: false },
  { id: 'f_deadline', label: 'Deadline', type: 'date', required: true },
  { id: 'f_priority', label: 'Priorité', type: 'select', required: false },
  { id: 'f_urgent', label: 'Urgent', type: 'checkbox', required: false },
];

interface ProjectFormProps {
  onClose?: () => void;
}

const isDescriptionField = (field: FormField): boolean =>
  field.type === 'text' && (field.id === 'f_description' || field.label.trim().toLowerCase() === 'description');

const RichTextField: React.FC<{ field: FormField; value: string; onChange: (v: string) => void }> = ({ field, value, onChange }) => {
  const ref = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);
  const savedRange = useRef<Range | null>(null);

  useEffect(() => {
    if (!initialized.current && ref.current) {
      ref.current.innerHTML = value || '';
      initialized.current = true;
    }
  }, [value]);

  const saveSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && ref.current?.contains(sel.anchorNode)) {
      savedRange.current = sel.getRangeAt(0);
    }
  };

  const restoreSelection = () => {
    const sel = window.getSelection();
    if (sel && savedRange.current) {
      sel.removeAllRanges();
      sel.addRange(savedRange.current);
    }
  };

  const exec = (command: string, arg?: string) => {
    ref.current?.focus();
    restoreSelection();
    document.execCommand(command, false, arg);
    saveSelection();
    if (ref.current) onChange(ref.current.innerHTML);
  };

  const toolbarBtn = "p-1.5 rounded-lg hover:bg-[var(--notion-hover)] text-[var(--notion-text-light)] hover:text-[var(--notion-text)] transition-all active:scale-90";
  const toolbarSelect = "text-xs font-semibold bg-transparent outline-none px-1.5 py-1 rounded-lg hover:bg-[var(--notion-hover)] text-[var(--notion-text-light)] hover:text-[var(--notion-text)] transition-all cursor-pointer border-none";
  const divider = <div className="w-px h-4 bg-[var(--notion-border)] mx-1" />;

  return (
    <div className="border border-[var(--notion-border)] rounded-xl overflow-hidden focus-within:border-[var(--brand-accent)]/40 transition-colors">
      <div className="flex items-center flex-wrap gap-0.5 px-2 py-1.5 border-b border-[var(--notion-border)] bg-[var(--notion-hover)]/30">
        <select
          defaultValue=""
          onMouseDown={saveSelection}
          onChange={e => { exec('formatBlock', e.target.value); e.target.value = ''; }}
          className={toolbarSelect}
          title="Style de titre"
        >
          <option value="" disabled>Style</option>
          <option value="<p>">Normal</option>
          <option value="<h1>">Titre 1</option>
          <option value="<h2>">Titre 2</option>
          <option value="<h3>">Titre 3</option>
          <option value="<blockquote>">Citation</option>
        </select>
        {divider}
        <select
          defaultValue=""
          onMouseDown={saveSelection}
          onChange={e => { exec('fontName', e.target.value); e.target.value = ''; }}
          className={toolbarSelect}
          title="Police"
        >
          <option value="" disabled>Police</option>
          <option value="Inter, sans-serif">Défaut</option>
          <option value="Georgia, serif">Georgia</option>
          <option value="'Times New Roman', serif">Times New Roman</option>
          <option value="Arial, sans-serif">Arial</option>
          <option value="'Courier New', monospace">Courier New</option>
          <option value="'Comic Sans MS', cursive">Comic Sans</option>
        </select>
        <select
          defaultValue=""
          onMouseDown={saveSelection}
          onChange={e => { exec('fontSize', e.target.value); e.target.value = ''; }}
          className={toolbarSelect}
          title="Taille"
        >
          <option value="" disabled>Taille</option>
          <option value="1">Petite</option>
          <option value="3">Normale</option>
          <option value="5">Grande</option>
          <option value="7">Très grande</option>
        </select>
        {divider}
        <button type="button" onMouseDown={e => e.preventDefault()} onClick={() => exec('bold')} className={toolbarBtn} title="Gras"><Bold size={14} /></button>
        <button type="button" onMouseDown={e => e.preventDefault()} onClick={() => exec('italic')} className={toolbarBtn} title="Italique"><Italic size={14} /></button>
        <button type="button" onMouseDown={e => e.preventDefault()} onClick={() => exec('underline')} className={toolbarBtn} title="Souligné"><Underline size={14} /></button>
        <button type="button" onMouseDown={e => e.preventDefault()} onClick={() => exec('strikeThrough')} className={toolbarBtn} title="Barré"><Strikethrough size={14} /></button>
        {divider}
        <label className={`${toolbarBtn} relative`} title="Couleur du texte" onMouseDown={saveSelection}>
          <Palette size={14} />
          <input
            type="color"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            onChange={e => exec('foreColor', e.target.value)}
          />
        </label>
        <label className={`${toolbarBtn} relative`} title="Surlignage" onMouseDown={saveSelection}>
          <Highlighter size={14} />
          <input
            type="color"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            onChange={e => exec('hiliteColor', e.target.value)}
          />
        </label>
        {divider}
        <button type="button" onMouseDown={e => e.preventDefault()} onClick={() => exec('justifyLeft')} className={toolbarBtn} title="Aligner à gauche"><AlignLeft size={14} /></button>
        <button type="button" onMouseDown={e => e.preventDefault()} onClick={() => exec('justifyCenter')} className={toolbarBtn} title="Centrer"><AlignCenter size={14} /></button>
        <button type="button" onMouseDown={e => e.preventDefault()} onClick={() => exec('justifyRight')} className={toolbarBtn} title="Aligner à droite"><AlignRight size={14} /></button>
        {divider}
        <button type="button" onMouseDown={e => e.preventDefault()} onClick={() => exec('insertUnorderedList')} className={toolbarBtn} title="Liste à puces"><List size={14} /></button>
        <button type="button" onMouseDown={e => e.preventDefault()} onClick={() => exec('insertOrderedList')} className={toolbarBtn} title="Liste numérotée"><ListOrdered size={14} /></button>
        <button type="button" onMouseDown={e => e.preventDefault()} onClick={() => exec('formatBlock', '<blockquote>')} className={toolbarBtn} title="Citation"><Quote size={14} /></button>
      </div>
      <div
        ref={ref}
        contentEditable
        onInput={() => ref.current && onChange(ref.current.innerHTML)}
        onMouseUp={saveSelection}
        onKeyUp={saveSelection}
        data-placeholder={field.label}
        className="min-h-[220px] max-h-[480px] overflow-y-auto px-3.5 py-3 text-sm leading-relaxed text-[var(--notion-text)] outline-none [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_h1]:text-2xl [&_h1]:font-black [&_h2]:text-xl [&_h2]:font-bold [&_h3]:text-lg [&_h3]:font-bold [&_blockquote]:border-l-2 [&_blockquote]:border-[var(--brand-accent)] [&_blockquote]:pl-3 [&_blockquote]:opacity-70 [&_blockquote]:italic empty:before:content-[attr(data-placeholder)] empty:before:text-[var(--notion-text-light)] empty:before:opacity-50"
      />
    </div>
  );
};

const API_URL = import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:5001' : window.location.origin);

const ProjectForm: React.FC<ProjectFormProps> = ({ onClose }) => {
  const { user, token } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [config, setConfig] = useState<DeptConfig>({ products: [], types: [] });
  const [fieldValues, setFieldValues] = useState<Record<string, string | boolean>>({});
  const [projectName, setProjectName] = useState('');
  const [estimatedHours, setEstimatedHours] = useState<string>('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersRes, configRes] = await Promise.all([
          axios.get(`${API_URL}/api/users`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${API_URL}/api/departments/my-config`, { headers: { Authorization: `Bearer ${token}` } })
        ]);
        setUsers(usersRes.data);
        setConfig(configRes.data);
      } catch (error) {
        console.error('Error fetching form data:', error);
      }
    };
    fetchData();
  }, [token]);

  const fields: FormField[] = config.formFields && config.formFields.length > 0
    ? config.formFields
    : DEFAULT_FORM_FIELDS;

  const getFieldValue = (field: FormField): string | boolean => {
    if (field.id in fieldValues) return fieldValues[field.id];
    if (field.type === 'checkbox') return false;
    if (field.type === 'select') return 'Moyenne';
    if (field.type === 'product') return config.products?.[0] || '';
    if (field.type === 'projectType') return config.types?.[0] || '';
    return '';
  };

  const setFieldValue = (id: string, value: string | boolean) => {
    setFieldValues(prev => ({ ...prev, [id]: value }));
  };

  const today = new Date().toISOString().split('T')[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !projectName) return;

    const payload: Record<string, unknown> = { 
      name: projectName, 
      initiatorName: user.name,
      initiatorId: user._id || user.id,
      departmentId: user.departmentId
    };
    fields.forEach(f => {
      const val = getFieldValue(f);
      if (f.type === 'user') payload['assignedTo'] = val;
      else if (f.type === 'product') payload['product'] = val;
      else if (f.type === 'projectType') payload['type'] = val;
      else if (f.type === 'date') payload['deadline'] = val;
      else if (f.type === 'select' && f.id === 'f_priority') payload['priority'] = val;
      else if (f.type === 'checkbox' && f.id === 'f_urgent') payload['urgent'] = val;
      else payload[f.id] = val;
    });

    payload['estimatedHours'] = parseFloat(estimatedHours);

    payload['_customFields'] = Object.fromEntries(
      fields.map(f => [f.id, getFieldValue(f)])
    );

    payload['token'] = token;

    socket.emit('new_project', payload);
    setProjectName('');
    setEstimatedHours('');
    setFieldValues({});
    if (onClose) onClose();
    // Use a custom event or toast instead of alert for premium feel
    window.dispatchEvent(new CustomEvent('project_submitted'));
  };

  const renderField = (field: FormField) => {
    const baseClass = "px-2.5 py-1.5 text-sm text-[var(--notion-text)] hover:bg-[var(--notion-hover)] rounded-lg transition-all bg-transparent outline-none focus:bg-[var(--notion-hover)] appearance-none cursor-pointer font-bold w-full border border-transparent focus:border-[var(--brand-accent)]/20";

    if (field.type === 'text' && field.id === 'f_initiator') {
      return (
        <div className="px-3 py-1 text-xs text-[var(--brand-accent)] font-black bg-[var(--brand-accent)]/10 rounded-lg w-fit border border-[var(--brand-accent)]/20 uppercase tracking-widest">
          {user?.name}
        </div>
      );
    }

    if (field.type === 'text') {
      return (
        <input
          type="text"
          required={field.required}
          value={(getFieldValue(field) as string)}
          onChange={e => setFieldValue(field.id, e.target.value)}
          placeholder={field.label}
          className={baseClass}
        />
      );
    }

    if (field.type === 'date') {
      return (
        <input
          type="date"
          min={today}
          required={field.required}
          value={(getFieldValue(field) as string)}
          onChange={e => setFieldValue(field.id, e.target.value)}
          className={baseClass}
        />
      );
    }

    if (field.type === 'checkbox') {
      return (
        <div className="flex items-center px-2.5">
          <input
            type="checkbox"
            className="w-4 h-4 text-[var(--brand-accent)] border-[var(--notion-border)] rounded-md focus:ring-0 cursor-pointer bg-[var(--notion-sidebar)]"
            checked={(getFieldValue(field) as boolean)}
            onChange={e => setFieldValue(field.id, e.target.checked)}
          />
        </div>
      );
    }

    if (field.type === 'user' || field.type === 'product' || field.type === 'projectType' || field.type === 'select') {
      return (
        <div className="relative w-full group">
          <select 
            required={field.required} 
            value={(getFieldValue(field) as string)} 
            onChange={e => setFieldValue(field.id, e.target.value)} 
            className={baseClass}
          >
            {field.type === 'user' && (
              <>
                <option value="">Sélectionner...</option>
                {users.map(u => <option key={u._id} value={u._id}>{u.name} ({u.role})</option>)}
              </>
            )}
            {field.type === 'product' && (
              <>
                {config.products?.map(p => <option key={p} value={p}>{p}</option>)}
                {(!config.products?.length) && <option value="">Aucun produit</option>}
              </>
            )}
            {field.type === 'projectType' && (
              <>
                {config.types?.map(t => <option key={t} value={t}>{t}</option>)}
                {(!config.types?.length) && <option value="">Aucun type</option>}
              </>
            )}
            {field.type === 'select' && (
              <>
                <option value="Basse">Basse</option>
                <option value="Moyenne">Moyenne</option>
                <option value="Haute">Haute</option>
              </>
            )}
          </select>
          <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--notion-text-light)] opacity-40 group-hover:opacity-100 transition-opacity" />
        </div>
      );
    }

    if (field.type === 'attachment') {
      const raw = getFieldValue(field) as string;
      let att: { name: string; size: number } | null = null;
      try { if (raw) att = JSON.parse(raw); } catch { /* ignore */ }

      return (
        <div className="flex items-center gap-2 flex-wrap">
          <label className="flex items-center gap-2 cursor-pointer px-3 py-1.5 rounded-lg border border-dashed border-[var(--notion-border)] hover:border-[var(--brand-accent)] transition-all text-sm text-[var(--notion-text-light)] hover:text-[var(--notion-text)]">
            <Paperclip size={14} />
            <span className="truncate max-w-[180px]">{att ? att.name : 'Choisir un fichier'}</span>
            <input
              type="file"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                if (file.size > 8 * 1024 * 1024) {
                  alert('Fichier trop volumineux (max 8 Mo)');
                  return;
                }
                const reader = new FileReader();
                reader.onloadend = () => {
                  setFieldValue(field.id, JSON.stringify({
                    name: file.name,
                    size: file.size,
                    mimeType: file.type,
                    data: reader.result as string
                  }));
                };
                reader.readAsDataURL(file);
              }}
            />
          </label>
          {att && (
            <span className="text-[11px] text-[var(--notion-text-light)]">
              {(att.size / 1024).toFixed(0)} Ko
            </span>
          )}
          {att && (
            <button type="button" onClick={() => setFieldValue(field.id, '')} className="text-[var(--notion-text-light)] hover:text-rose-500 transition-colors">
              <X size={13} />
            </button>
          )}
        </div>
      );
    }

    return null;
  };

  return (
    <div className="bg-[var(--notion-sidebar)] h-full flex flex-col overflow-hidden transition-colors duration-300">
      <div className="flex items-center justify-between p-6 border-b border-[var(--notion-border)]">
        <h2 className="text-xl font-black text-[var(--notion-text)] tracking-tight">Démarrer un nouveau projet</h2>
        {onClose && (
          <button onClick={onClose} className="p-2 hover:bg-[var(--notion-hover)] rounded-xl transition-all text-[var(--notion-text-light)] active:scale-90">
            <X size={20} />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 lg:p-12 space-y-10 max-w-2xl mx-auto w-full scrollbar-hide">
        <div className="space-y-4">
          <input
            type="text"
            className="w-full text-5xl font-black placeholder-[var(--notion-text-light)]/20 border-none outline-none focus:ring-0 p-0 text-[var(--notion-text)] bg-transparent tracking-tight"
            placeholder="Nom du projet..."
            value={projectName}
            onChange={e => setProjectName(e.target.value)}
            required
            autoFocus
          />
          <div className="h-1 w-20 bg-[var(--brand-accent)] rounded-full opacity-50" />
        </div>

        {/* Fixed required field: estimated hours */}
        <div className="grid grid-cols-[180px_1fr] items-center py-2 group/row hover:bg-[var(--notion-hover)]/30 rounded-xl px-2 -mx-2 transition-colors">
          <div className="flex items-center gap-2.5 text-[var(--notion-text-light)] text-sm font-bold opacity-60 group-hover/row:opacity-100 transition-all">
            <Clock size={14} />
            <span>Estimation</span>
            <span className="text-[var(--brand-accent)] text-xs">*</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="0.5"
              max="99"
              step="0.5"
              required
              value={estimatedHours}
              onChange={e => setEstimatedHours(e.target.value)}
              placeholder="ex: 4"
              className="px-2.5 py-1.5 text-sm text-[var(--notion-text)] hover:bg-[var(--notion-hover)] rounded-lg transition-all bg-transparent outline-none focus:bg-[var(--notion-hover)] font-bold w-28 border border-transparent focus:border-[var(--brand-accent)]/20"
            />
            <span className="text-xs text-[var(--notion-text-light)] font-medium">heures</span>
          </div>
        </div>

        <div className="space-y-2">
          {fields.map(field => (
            isDescriptionField(field) ? (
              <div key={field.id} className="py-3 space-y-2">
                <div className="flex items-center gap-2.5 text-[var(--notion-text-light)] text-sm font-bold opacity-60">
                  <AlertCircle size={14} />
                  <span>{field.label}</span>
                  {field.required && <span className="text-[var(--brand-accent)] text-xs">*</span>}
                </div>
                <RichTextField
                  field={field}
                  value={(getFieldValue(field) as string)}
                  onChange={v => setFieldValue(field.id, v)}
                />
              </div>
            ) : (
              <div key={field.id} className="grid grid-cols-[180px_1fr] items-center py-2 group/row hover:bg-[var(--notion-hover)]/30 rounded-xl px-2 -mx-2 transition-colors">
                <div className="flex items-center gap-2.5 text-[var(--notion-text-light)] text-sm font-bold opacity-60 group-hover/row:opacity-100 transition-all">
                  <AlertCircle size={14} />
                  <span>{field.label}</span>
                  {field.required && <span className="text-[var(--brand-accent)] text-xs">*</span>}
                </div>
                <div className="flex-1">
                  {renderField(field)}
                </div>
              </div>
            )
          ))}
        </div>

        <div className="pt-10 border-t border-[var(--notion-border)] border-dashed">
          <button
            type="submit"
            className="w-full bg-[var(--brand-primary)] hover:bg-[var(--brand-secondary)] text-white font-black py-4 px-8 rounded-2xl transition-all shadow-[var(--shadow-btn)] active:scale-95 uppercase tracking-widest text-sm flex items-center justify-center gap-3"
          >
            Créer la tâche
            <X className="rotate-45" size={18} />
          </button>
          <p className="text-center text-[var(--notion-text-light)] text-[10px] mt-6 font-bold uppercase tracking-widest opacity-40">
            Appuyez sur entrée pour valider rapidement
          </p>
        </div>
      </form>
    </div>
  );
};

export default ProjectForm;
