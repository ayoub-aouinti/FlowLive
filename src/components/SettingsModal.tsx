import React, { useState } from 'react';
import { X, User, Settings, Bell, Monitor, Languages, Download, Trash2, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface SettingsModalProps {
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState('préférences');
  const { user } = useAuth();

  const sections = [
    { id: 'compte', label: 'Mon compte', icon: User },
    { id: 'préférences', label: 'Préférences', icon: Settings },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'langue', label: 'Langue et heure', icon: Languages },
  ];

  const workspaceSections = [
    { id: 'général', label: 'Général', icon: Monitor },
    { id: 'importer', label: 'Importer', icon: Download },
  ];

  const NavBtn = ({ id, label, icon: Icon }: { id: string; label: string; icon: React.ElementType }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
        activeTab === id
          ? 'bg-[var(--surface-high)] text-[var(--brand-secondary)] font-semibold'
          : 'text-[var(--notion-text-light)] hover:bg-[var(--notion-hover)] hover:text-[var(--notion-text)]'
      }`}
    >
      <Icon size={15} className={activeTab === id ? 'text-[var(--brand-secondary)]' : 'text-[var(--notion-text-light)]'} />
      {label}
    </button>
  );

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-[var(--notion-sidebar)] w-[95%] max-w-5xl h-[85vh] rounded-2xl border border-[var(--notion-border)] flex overflow-hidden animate-in zoom-in-95 duration-200"
        style={{ boxShadow: 'var(--shadow-elevated)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Sidebar */}
        <div className="w-60 border-r border-[var(--notion-border)] bg-[var(--notion-bg)] p-3 flex flex-col shrink-0">
          {/* User identity */}
          <div className="flex items-center gap-2.5 px-3 py-2 mb-5">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-bold text-white shrink-0"
              style={{ background: 'var(--brand-primary)', boxShadow: 'var(--shadow-btn)' }}
            >
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-semibold text-[var(--notion-text)] truncate">{user?.name}</span>
              <span className="text-[10px] text-[var(--notion-text-light)] uppercase tracking-wide">Compte personnel</span>
            </div>
          </div>

          {/* Compte section */}
          <div className="space-y-0.5 mb-5">
            <div className="px-3 py-1 text-[10px] font-bold text-[var(--notion-text-light)] uppercase tracking-widest mb-1">
              Compte
            </div>
            {sections.map(s => <NavBtn key={s.id} id={s.id} label={s.label} icon={s.icon} />)}
          </div>

          {/* Workspace section */}
          <div className="space-y-0.5">
            <div className="px-3 py-1 text-[10px] font-bold text-[var(--notion-text-light)] uppercase tracking-widest mb-1">
              Espace de travail
            </div>
            {workspaceSections.map(s => <NavBtn key={s.id} id={s.id} label={s.label} icon={s.icon} />)}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex items-center justify-end px-6 py-3 border-b border-[var(--notion-border)]">
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-[var(--notion-hover)] rounded-lg text-[var(--notion-text-light)] hover:text-[var(--notion-text)] transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-10 py-8 scrollbar-thin">
            <h1 className="text-xl font-bold text-[var(--notion-text)] mb-7 capitalize">{activeTab}</h1>

            <div className="space-y-10 max-w-2xl">
              <section>
                <h3 className="text-[10px] font-bold text-[var(--notion-text-light)] uppercase tracking-widest mb-1">
                  Apparence
                </h3>
                <p className="text-xs text-[var(--notion-text-light)] mb-3">
                  Personnalisez l'apparence de l'application sur votre appareil.
                </p>
                <button
                  className="w-full flex items-center justify-between px-4 py-2.5 bg-[var(--notion-bg)] border border-[var(--notion-border)] rounded-xl text-sm text-[var(--notion-text)] hover:bg-[var(--notion-hover)] transition-colors"
                  style={{ boxShadow: 'var(--shadow-card)' }}
                >
                  Paramètres du système
                  <ChevronRight size={14} className="rotate-90 text-[var(--notion-text-light)]" />
                </button>
              </section>

              <section>
                <h3 className="text-[10px] font-bold text-[var(--notion-text-light)] uppercase tracking-widest mb-1">
                  Langue et heure
                </h3>
                <p className="text-xs text-[var(--notion-text-light)] mb-3">
                  Modifiez la langue utilisée dans l'interface.
                </p>
                <div
                  className="flex items-center justify-between px-4 py-2.5 bg-[var(--notion-bg)] border border-[var(--notion-border)] rounded-xl hover:bg-[var(--notion-hover)] transition-colors cursor-pointer"
                  style={{ boxShadow: 'var(--shadow-card)' }}
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-[var(--notion-text)]">Langue</span>
                    <span className="text-[10px] text-[var(--notion-text-light)]">Français (France)</span>
                  </div>
                  <ChevronRight size={14} className="text-[var(--notion-text-light)]" />
                </div>
              </section>

              <section className="pt-8 border-t border-[var(--notion-border)]">
                <h3 className="text-[10px] font-bold text-red-500 uppercase tracking-widest mb-1">Zone de danger</h3>
                <p className="text-xs text-[var(--notion-text-light)] mb-3">Actions irréversibles sur votre compte.</p>
                <button className="flex items-center gap-2 text-xs font-bold text-red-600 hover:bg-red-50 px-3 py-2 rounded-xl border border-red-100 transition-colors">
                  <Trash2 size={13} /> Supprimer le compte
                </button>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
