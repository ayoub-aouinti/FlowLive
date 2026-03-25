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

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="bg-white w-[95%] max-w-5xl h-[85vh] rounded-xl shadow-2xl flex border border-[#ececeb] animate-in zoom-in duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Sidebar */}
        <div className="w-64 border-r border-[#ececeb] bg-[#f7f7f5] p-3 flex flex-col rounded-l-xl">
          <div className="flex items-center gap-2 px-3 py-2 mb-4">
             <div className="w-6 h-6 rounded bg-blue-600 flex items-center justify-center text-[10px] font-bold text-white shadow-sm">
               {user?.name?.[0]}
             </div>
             <div className="flex flex-col min-w-0">
               <span className="text-xs font-bold text-[#37352f] truncate">{user?.name}</span>
               <span className="text-[10px] text-[#9b9a97] truncate uppercase tracking-tighter">Compte personnel</span>
             </div>
          </div>

          <div className="space-y-0.5">
            <div className="px-3 py-1 text-[10px] font-bold text-[#91918e] uppercase tracking-widest mb-1">Compte</div>
            {sections.map(s => (
              <button 
                key={s.id}
                onClick={() => setActiveTab(s.id)}
                className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors ${activeTab === s.id ? 'bg-[#efefed] text-[#37352f] font-bold' : 'text-[#5a5a57] hover:bg-[#efefed]'}`}
              >
                <s.icon size={16} className={activeTab === s.id ? 'text-[#37352f]' : 'text-[#9b9a97]'} />
                {s.label}
              </button>
            ))}
          </div>

          <div className="space-y-0.5 mt-6">
            <div className="px-3 py-1 text-[10px] font-bold text-[#91918e] uppercase tracking-widest mb-1">Espace de travail</div>
            {workspaceSections.map(s => (
              <button 
                key={s.id}
                onClick={() => setActiveTab(s.id)}
                className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors ${activeTab === s.id ? 'bg-[#efefed] text-[#37352f] font-bold' : 'text-[#5a5a57] hover:bg-[#efefed]'}`}
              >
                <s.icon size={16} className={activeTab === s.id ? 'text-[#37352f]' : 'text-[#9b9a97]'} />
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col">
          <div className="flex items-center justify-end p-4">
            <button onClick={onClose} className="p-1 hover:bg-[#efefed] rounded text-[#9b9a97] transition-colors"><X size={20} /></button>
          </div>

          <div className="flex-1 overflow-y-auto px-12 pb-12">
            <h1 className="text-2xl font-bold text-[#37352f] mb-8 capitalize">{activeTab}</h1>

            <div className="space-y-12 max-w-2xl">
              <section>
                <h3 className="text-sm font-bold text-[#37352f] mb-1">Apparence</h3>
                <p className="text-xs text-[#9b9a97] mb-4">Personnalisez l'apparence de Notion sur votre appareil.</p>
                <div className="relative inline-block w-full">
                  <button className="w-full flex items-center justify-between px-3 py-2 bg-white border border-[#ececeb] rounded-md text-sm text-[#37352f] shadow-sm hover:bg-[#f7f7f5] transition-colors">
                    Paramètres du système
                    <ChevronRight size={14} className="rotate-90 text-[#9b9a97]" />
                  </button>
                </div>
              </section>

              <section>
                <h3 className="text-sm font-bold text-[#37352f] mb-1">Langue et heure</h3>
                <p className="text-xs text-[#9b9a97] mb-4">Modifiez la langue utilisée dans l'interface utilisateur.</p>
                <div className="flex items-center justify-between p-3 bg-white border border-[#ececeb] rounded-md hover:bg-[#f7f7f5] transition-colors cursor-pointer">
                   <div className="flex flex-col">
                      <span className="text-sm font-medium text-[#37352f]">Langue</span>
                      <span className="text-[10px] text-[#9b9a97]">Français (France)</span>
                   </div>
                   <ChevronRight size={14} className="text-[#9b9a97]" />
                </div>
              </section>

              <section className="pt-8 border-t border-[#ececeb]">
                <h3 className="text-sm font-bold text-red-600 mb-1">Zone de danger</h3>
                <p className="text-xs text-[#9b9a97] mb-4">Actions irréversibles sur votre compte.</p>
                <button className="flex items-center gap-2 text-xs font-bold text-red-600 hover:bg-red-50 px-3 py-2 rounded-md border border-red-100 transition-colors">
                   <Trash2 size={14} /> Supprimer le compte
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
