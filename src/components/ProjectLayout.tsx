import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '../context/useNavigation';
import Sidebar from './Sidebar';
import { Camera, Image as ImageIcon, Loader2 } from 'lucide-react';

interface ProjectLayoutProps {
  children: React.ReactNode;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const ProjectLayout: React.FC<ProjectLayoutProps> = ({ children }) => {
  const { t, i18n } = useTranslation();
  const { token } = useAuth();
  const { selectedDepartmentId } = useNavigation();
  const [config, setConfig] = useState<{
    departmentId: string;
    coverUrl: string | null;
    logoUrl: string | null;
  } | null>(null);
  const [isUpdatingCover, setIsUpdatingCover] = useState(false);
  const [isUpdatingLogo, setIsUpdatingLogo] = useState(false);
  
  const coverInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const fetchConfig = React.useCallback(async () => {
    if (!token) return;
    try {
      const queryString = selectedDepartmentId ? `?departmentId=${selectedDepartmentId}` : '';
      const response = await axios.get(`${API_URL}/api/departments/my-config${queryString}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setConfig(response.data);
    } catch (err) {
      console.error('Failed to fetch project layout config:', err);
    }
  }, [token, selectedDepartmentId]);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const handleUpload = async (file: File, type: 'cover' | 'logo') => {
    if (!config?.departmentId) return;
    
    if (type === 'cover') setIsUpdatingCover(true);
    else setIsUpdatingLogo(true);

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        await axios.put(`${API_URL}/api/departments/${config.departmentId}/config`, 
          { [type === 'cover' ? 'coverUrl' : 'logoUrl']: base64 },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        fetchConfig();
        window.dispatchEvent(new CustomEvent('dept_config_updated'));
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(`Failed to update ${type}:`, err);
      alert(t('common.upload_error') || `Erreur lors du chargement de l'image`);
    } finally {
      if (type === 'cover') setIsUpdatingCover(false);
      else setIsUpdatingLogo(false);
    }
  };

  const user = token ? JSON.parse(atob(token.split('.')[1])) : null;
  const canEdit = user?.role === 'admin' || user?.role === 'superadmin';

  const isRtl = i18n.language === 'ar';

  return (
    <div className={`flex min-h-screen bg-[var(--notion-bg)] transition-colors duration-300 ${isRtl ? 'flex-row-reverse' : ''}`}>
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0">
        {/* Cover Image Area */}
        <div className="h-48 w-full relative group bg-slate-100">
          {config?.coverUrl ? (
            <img src={config.coverUrl} className="w-full h-full object-cover" alt="Cover" />
          ) : (
            <div 
              className="w-full h-full bg-gradient-to-r from-[#1e293b] to-[#475569]"
            />
          )}
          
          <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity" />
          
          {canEdit && (
            <div className={`absolute bottom-4 ${isRtl ? 'left-8' : 'right-8'} flex gap-2`}>
              <input 
                type="file" 
                ref={coverInputRef} 
                className="hidden" 
                accept="image/*"
                onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0], 'cover')}
              />
              <button 
                onClick={() => coverInputRef.current?.click()}
                disabled={isUpdatingCover}
                className="bg-white/90 hover:bg-white dark:bg-slate-800 dark:text-white dark:border-slate-700 text-slate-700 text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
              >
                {isUpdatingCover ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
                {t('common.edit')}
              </button>
            </div>
          )}
        </div>

        {/* Content Area */}
        <div className="max-w-7xl mx-auto w-full px-12 pb-20 relative">
          {/* Logo Area */}
          <div className={`absolute -top-16 ${isRtl ? 'right-12' : 'left-12'} group/logo`}>
            <div className="relative">
              <div className="w-32 h-32 rounded-3xl bg-white dark:bg-slate-800 p-2 shadow-xl border-4 border-white dark:border-slate-800 overflow-hidden flex items-center justify-center text-8xl transition-transform group-hover/logo:scale-[1.02]">
                {config?.logoUrl ? (
                  <img src={config.logoUrl} className="w-full h-full object-contain rounded-xl" alt="Logo" />
                ) : (
                  <span className="select-none filter drop-shadow-sm">📅</span>
                )}
              </div>
              
              {canEdit && (
                <>
                  <input 
                    type="file" 
                    ref={logoInputRef} 
                    className="hidden" 
                    accept="image/*"
                    onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0], 'logo')}
                  />
                  <button 
                    onClick={() => logoInputRef.current?.click()}
                    disabled={isUpdatingLogo}
                    className={`absolute -bottom-2 ${isRtl ? '-left-2' : '-right-2'} p-2 bg-white dark:bg-slate-700 rounded-full shadow-lg border border-slate-100 dark:border-slate-600 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all opacity-0 group-hover/logo:opacity-100 active:scale-90 disabled:opacity-50`}
                  >
                    {isUpdatingLogo ? <Loader2 size={16} className="animate-spin" /> : <ImageIcon size={16} />}
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="pt-24">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProjectLayout;
