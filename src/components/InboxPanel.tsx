import React from 'react';
import { Inbox as InboxIcon, X, CheckCircle2, Archive, MoreHorizontal, MessageSquare } from 'lucide-react';

interface InboxPanelProps {
  onClose: () => void;
}

const InboxPanel: React.FC<InboxPanelProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-[100] flex justify-end bg-black/5 backdrop-blur-[1px]" onClick={onClose}>
      <div 
        className="bg-white w-full max-w-md h-screen shadow-2xl border-l border-[#ececeb] flex flex-col animate-in slide-in-from-right duration-300"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-[#ececeb]">
          <div className="flex items-center gap-2">
            <h2 className="font-bold text-[#37352f]">Boîte de réception</h2>
          </div>
          <div className="flex items-center gap-1">
             <button className="p-1.5 hover:bg-[#efefed] rounded text-[#9b9a97] transition-colors"><CheckCircle2 size={16} /></button>
             <button className="p-1.5 hover:bg-[#efefed] rounded text-[#9b9a97] transition-colors"><Archive size={16} /></button>
             <button className="p-1.5 hover:bg-[#efefed] rounded text-[#9b9a97] transition-colors"><MoreHorizontal size={16} /></button>
             <button onClick={onClose} className="p-1.5 hover:bg-[#efefed] rounded text-[#9b9a97] transition-colors ml-2"><X size={18} /></button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="p-4 border-b border-[#ececeb] hover:bg-[#f7f7f5] cursor-pointer transition-colors group">
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-[#efefed] flex items-center justify-center flex-shrink-0 text-[#9b9a97] font-bold text-xs border border-[#ececeb]">
                L
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start mb-1">
                  <p className="text-sm text-[#37352f]">
                    <span className="font-bold">Les Laboratoires MédiS</span> vous a invité-e sur <span className="font-bold">Planning Département Digital MédiS</span>
                  </p>
                  <span className="text-[11px] text-[#9b9a97] whitespace-nowrap">8 mar</span>
                </div>
                <div className="bg-white border border-[#ececeb] rounded p-2 mt-2 shadow-sm text-xs text-[#5a5a57]">
                  Nouvelle source de données ajoutée
                </div>
                <div className="flex gap-4 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="text-[11px] font-bold text-[#2383e2] hover:underline flex items-center gap-1">
                    <MessageSquare size={12} /> Répondre
                  </button>
                  <button className="text-[11px] font-bold text-[#9b9a97] hover:underline">Marquer comme lu</button>
                </div>
              </div>
            </div>
          </div>

          <div className="p-12 text-center flex flex-col items-center">
            <InboxIcon size={48} className="text-[#ececeb] mb-4" />
            <p className="text-sm font-medium text-[#37352f]">Aucune nouvelle notification</p>
            <p className="text-xs text-[#9b9a97] mt-1">Vous êtes à jour ! Toutes les modifications récentes apparaîtront ici.</p>
          </div>
        </div>

        <div className="p-4 border-t border-[#ececeb] bg-[#f7f7f5] flex justify-center">
           <button className="text-xs font-bold text-[#9b9a97] hover:text-[#37352f] transition-colors">Afficher les notifications archivées</button>
        </div>
      </div>
    </div>
  );
};

export default InboxPanel;
