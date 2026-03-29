import React, { useState, useEffect } from 'react';
import { socket } from '../services/socket';
import { X, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import type { User } from '../types';

interface FormField {
  id: string;
  label: string;
  type: 'text' | 'date' | 'select' | 'checkbox' | 'user' | 'product' | 'projectType';
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

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const ProjectForm: React.FC<ProjectFormProps> = ({ onClose }) => {
  const { user, token } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [config, setConfig] = useState<DeptConfig>({ products: [], types: [] });
  // Generic fieldValues keyed by formField.id
  const [fieldValues, setFieldValues] = useState<Record<string, string | boolean>>({});
  const [projectName, setProjectName] = useState('');

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

    // Build submission payload mapping known field IDs to historical keys for backend compatibility
    const payload: Record<string, unknown> = { 
      name: projectName, 
      initiatorName: user.name,
      initiatorId: user._id,
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
      else payload[f.id] = val; // custom fields stored as-is
    });

    // Store all field values for flexible table display
    payload['_customFields'] = Object.fromEntries(
      fields.map(f => [f.id, getFieldValue(f)])
    );

    socket.emit('new_project', payload);
    setProjectName('');
    setFieldValues({});
    if (onClose) onClose();
    alert('Projet soumis avec succès !');
  };

  const renderField = (field: FormField) => {
    const baseClass = "px-2 py-1 text-sm text-[#37352f] hover:bg-[#efefed] rounded border-none outline-none focus:ring-0 transition-colors bg-transparent appearance-none cursor-pointer font-medium w-full";

    if (field.type === 'text' && field.id === 'f_initiator') {
      return (
        <div className="px-2 py-1 text-sm text-[#37352f] font-medium bg-[#efefed] rounded w-fit">
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
        <div className="flex items-center px-2">
          <input
            type="checkbox"
            className="w-4 h-4 text-blue-600 border-[#ececeb] rounded focus:ring-0 cursor-pointer"
            checked={(getFieldValue(field) as boolean)}
            onChange={e => setFieldValue(field.id, e.target.checked)}
          />
        </div>
      );
    }

    if (field.type === 'user') {
      return (
        <select required={field.required} value={(getFieldValue(field) as string)} onChange={e => setFieldValue(field.id, e.target.value)} className={baseClass}>
          <option value="">Sélectionner...</option>
          {users.map(u => <option key={u._id} value={u._id}>{u.name} ({u.role})</option>)}
        </select>
      );
    }

    if (field.type === 'product') {
      return (
        <select value={(getFieldValue(field) as string)} onChange={e => setFieldValue(field.id, e.target.value)} className={baseClass}>
          {config.products?.map(p => <option key={p} value={p}>{p}</option>)}
          {(!config.products?.length) && <option value="">Aucun produit</option>}
        </select>
      );
    }

    if (field.type === 'projectType') {
      return (
        <select value={(getFieldValue(field) as string)} onChange={e => setFieldValue(field.id, e.target.value)} className={baseClass}>
          {config.types?.map(t => <option key={t} value={t}>{t}</option>)}
          {(!config.types?.length) && <option value="">Aucun type</option>}
        </select>
      );
    }

    if (field.type === 'select') {
      // Default select = Priorité
      return (
        <select value={(getFieldValue(field) as string)} onChange={e => setFieldValue(field.id, e.target.value)} className={baseClass}>
          <option value="Basse">Basse</option>
          <option value="Moyenne">Moyenne</option>
          <option value="Haute">Haute</option>
        </select>
      );
    }

    return null;
  };

  return (
    <div className="bg-white h-full flex flex-col overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-[#ececeb]">
        <h2 className="text-lg font-bold text-[#37352f]">Démarrer un nouveau projet</h2>
        {onClose && (
          <button onClick={onClose} className="p-1 hover:bg-[#efefed] rounded transition-colors text-[#9b9a97]">
            <X size={20} />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-8 max-w-2xl mx-auto w-full">
        <div className="space-y-2">
          <input
            type="text"
            className="w-full text-4xl font-bold placeholder-[#dfdfde] border-none outline-none focus:ring-0 p-0 text-[#37352f]"
            placeholder="Nom du projet..."
            value={projectName}
            onChange={e => setProjectName(e.target.value)}
            required
          />
        </div>

        <div className="space-y-1">
          {fields.map(field => (
            <div key={field.id} className="grid grid-cols-[160px_1fr] items-center py-1 group/row">
              <div className="flex items-center gap-2 text-[#9b9a97] text-sm">
                <AlertCircle size={14} className="opacity-60" />
                <span>{field.label}</span>
                {field.required && <span className="text-red-400 text-xs">*</span>}
              </div>
              {renderField(field)}
            </div>
          ))}
        </div>

        <div className="h-px bg-[#ececeb] my-4" />

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
